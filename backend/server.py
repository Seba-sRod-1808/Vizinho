import os
import time
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import cloudinary
import cloudinary.utils
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
JWT_SECRET = os.environ.get("JWT_SECRET", "vizinho_jwt_secret")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION = int(os.environ.get("JWT_EXPIRATION_MINUTES", "1440"))

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", ""),
    secure=True
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


# ========================
# WebSocket Manager
# ========================
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_admins(self, message: dict, db):
        admins = await db.users.find({"rol": "admin"}, {"_id": 1}).to_list(100)
        for admin in admins:
            await self.send_to_user(str(admin["_id"]), message)

    async def broadcast_all(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)

manager = ConnectionManager()


# ========================
# Lifespan
# ========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = AsyncIOMotorClient(MONGO_URL)
    app.state.db = app.state.mongo_client[DB_NAME]
    db = app.state.db
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.publicaciones.create_index([("fecha", -1)])
    await db.reportes.create_index([("fecha", -1)])
    await db.reportes.create_index("estado")
    await db.reportes.create_index("vecino_id")
    await db.multas.create_index([("fecha", -1)])
    await db.multas.create_index("vecino_id")
    await db.multas.create_index("estado")
    await db.objetos_perdidos.create_index([("fecha", -1)])
    await db.alertas_panico.create_index([("fecha", -1)])
    await db.areas_comunes.create_index("nombre", unique=True)
    await db.reservas.create_index([("area_id", 1), ("fecha", 1)])
    await db.notificaciones.create_index([("usuario_id", 1), ("fecha", -1)])
    # Seed admin if not exists
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        await db.users.insert_one({
            "username": "admin",
            "email": "admin@vizinho.com",
            "password_hash": pwd_context.hash("admin123"),
            "rol": "admin",
            "telefono": "12345678",
            "nombre_completo": "Administrador General",
            "bio": "Administrador del condominio",
            "foto_url": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    # Seed vecino
    vecino = await db.users.find_one({"username": "vecino1"})
    if not vecino:
        await db.users.insert_one({
            "username": "vecino1",
            "email": "vecino1@vizinho.com",
            "password_hash": pwd_context.hash("vecino123"),
            "rol": "vecino",
            "telefono": "87654321",
            "nombre_completo": "Juan Perez",
            "bio": "",
            "foto_url": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    yield
    app.state.mongo_client.close()

app = FastAPI(title="Vizinho API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    return app.state.db


# ========================
# Helpers
# ========================
def str_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def create_token(user_id: str, username: str, rol: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION)
    return jwt.encode(
        {"sub": user_id, "username": username, "rol": rol, "exp": expire},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalido")
        db = get_db()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return str_id(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o invalido")

async def require_admin(user=Depends(get_current_user)):
    if user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return user

async def create_notification(db, usuario_id: str, tipo: str, titulo: str, mensaje: str):
    notif = {
        "usuario_id": usuario_id,
        "tipo": tipo,
        "titulo": titulo,
        "mensaje": mensaje,
        "leida": False,
        "fecha": datetime.now(timezone.utc).isoformat()
    }
    await db.notificaciones.insert_one(notif)
    await manager.send_to_user(usuario_id, {
        "type": "notification",
        "data": {"tipo": tipo, "titulo": titulo, "mensaje": mensaje}
    })


# ========================
# Pydantic Models
# ========================
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    telefono: Optional[str] = ""
    nombre_completo: Optional[str] = ""

class ProfileUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    bio: Optional[str] = None
    foto_url: Optional[str] = None

class PublicacionCreate(BaseModel):
    titulo: str
    contenido: str
    imagen_url: Optional[str] = ""

class ReporteCreate(BaseModel):
    titulo: str
    descripcion: str
    ubicacion: str
    imagen_url: Optional[str] = ""

class ReporteEstadoUpdate(BaseModel):
    estado: str

class MultaCreate(BaseModel):
    vecino_id: str
    monto: float
    motivo: str

class ObjetoPerdidoCreate(BaseModel):
    titulo: str
    descripcion: str
    imagen_url: Optional[str] = ""

class AreaComunCreate(BaseModel):
    nombre: str
    descripcion: str
    capacidad: int = 1
    disponible: bool = True
    imagen_url: Optional[str] = ""

class ReservaCreate(BaseModel):
    area_id: str
    fecha: str
    hora_inicio: str
    hora_fin: str
    motivo: str

class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    rol: str = "vecino"
    telefono: Optional[str] = ""
    nombre_completo: Optional[str] = ""

class EncuestaCreate(BaseModel):
    pregunta: str
    descripcion: Optional[str] = ""
    opciones: List[str]
    multiple: bool = False
    fecha_cierre: Optional[str] = None

class VotoCreate(BaseModel):
    opcion_index: int


# ========================
# AUTH
# ========================
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"username": req.username})
    if not user or not pwd_context.verify(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Usuario o contrasena incorrectos")
    user_id = str(user["_id"])
    token = create_token(user_id, user["username"], user["rol"])
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "rol": user["rol"],
            "nombre_completo": user.get("nombre_completo", ""),
            "foto_url": user.get("foto_url", ""),
            "telefono": user.get("telefono", ""),
        }
    }

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    db = get_db()
    if len(req.username) < 4:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 4 caracteres")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="La contrasena debe tener al menos 8 caracteres")
    existing = await db.users.find_one({"$or": [{"username": req.username}, {"email": req.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="El usuario o correo ya existe")
    user_doc = {
        "username": req.username,
        "email": req.email,
        "password_hash": pwd_context.hash(req.password),
        "rol": "vecino",
        "telefono": req.telefono or "",
        "nombre_completo": req.nombre_completo or req.username,
        "bio": "",
        "foto_url": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id, req.username, "vecino")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "username": req.username,
            "email": req.email,
            "rol": "vecino",
            "nombre_completo": user_doc["nombre_completo"],
            "foto_url": "",
            "telefono": user_doc["telefono"],
        }
    }

@app.get("/api/auth/me")
async def me(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "rol": user["rol"],
        "nombre_completo": user.get("nombre_completo", ""),
        "bio": user.get("bio", ""),
        "foto_url": user.get("foto_url", ""),
        "telefono": user.get("telefono", ""),
    }


# ========================
# PROFILE
# ========================
@app.put("/api/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    db = get_db()
    update = {}
    if data.nombre_completo is not None:
        update["nombre_completo"] = data.nombre_completo
    if data.telefono is not None:
        if data.telefono and len(data.telefono) < 8:
            raise HTTPException(status_code=400, detail="El telefono debe tener al menos 8 digitos")
        update["telefono"] = data.telefono
    if data.bio is not None:
        if data.bio and len(data.bio) > 500:
            raise HTTPException(status_code=400, detail="La biografia no puede exceder 500 caracteres")
        update["bio"] = data.bio
    if data.foto_url is not None:
        update["foto_url"] = data.foto_url
    if update:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])})
    return str_id(updated) if updated else {}


# ========================
# PUBLICACIONES
# ========================
@app.get("/api/publicaciones")
async def list_publicaciones(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    db = get_db()
    skip = (page - 1) * limit
    total = await db.publicaciones.count_documents({})
    cursor = db.publicaciones.find({}).sort("fecha", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        # Get author info
        author = await db.users.find_one({"_id": ObjectId(doc["vecino_id"])}, {"_id": 0, "username": 1, "nombre_completo": 1, "foto_url": 1})
        doc["autor"] = author or {}
        items.append(doc)
    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@app.post("/api/publicaciones")
async def create_publicacion(data: PublicacionCreate, user=Depends(get_current_user)):
    db = get_db()
    if len(data.titulo.strip()) < 5:
        raise HTTPException(status_code=400, detail="El titulo debe tener al menos 5 caracteres")
    if len(data.contenido.strip()) < 10:
        raise HTTPException(status_code=400, detail="El contenido debe tener al menos 10 caracteres")
    doc = {
        "titulo": data.titulo.strip(),
        "contenido": data.contenido.strip(),
        "imagen_url": data.imagen_url or "",
        "vecino_id": user["id"],
        "fecha": datetime.now(timezone.utc).isoformat()
    }
    result = await db.publicaciones.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    await manager.broadcast_all({"type": "new_post", "data": {"titulo": data.titulo}})
    return doc

@app.delete("/api/publicaciones/{pub_id}")
async def delete_publicacion(pub_id: str, user=Depends(get_current_user)):
    db = get_db()
    pub = await db.publicaciones.find_one({"_id": ObjectId(pub_id)})
    if not pub:
        raise HTTPException(status_code=404, detail="Publicacion no encontrada")
    if pub["vecino_id"] != user["id"] and user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    await db.publicaciones.delete_one({"_id": ObjectId(pub_id)})
    return {"message": "Publicacion eliminada"}


# ========================
# REPORTES
# ========================
@app.get("/api/reportes")
async def list_reportes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    estado: Optional[str] = None,
    user=Depends(get_current_user)
):
    db = get_db()
    query = {}
    if user["rol"] != "admin":
        query["vecino_id"] = user["id"]
    if estado:
        query["estado"] = estado
    skip = (page - 1) * limit
    total = await db.reportes.count_documents(query)
    cursor = db.reportes.find(query).sort("fecha", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        author = await db.users.find_one({"_id": ObjectId(doc["vecino_id"])}, {"_id": 0, "username": 1, "nombre_completo": 1})
        doc["autor"] = author or {}
        items.append(doc)
    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@app.post("/api/reportes")
async def create_reporte(data: ReporteCreate, user=Depends(get_current_user)):
    db = get_db()
    if len(data.titulo.strip()) < 5:
        raise HTTPException(status_code=400, detail="El titulo debe tener al menos 5 caracteres")
    if len(data.descripcion.strip()) < 10:
        raise HTTPException(status_code=400, detail="La descripcion debe tener al menos 10 caracteres")
    doc = {
        "titulo": data.titulo.strip(),
        "descripcion": data.descripcion.strip(),
        "ubicacion": data.ubicacion.strip(),
        "imagen_url": data.imagen_url or "",
        "estado": "Recibido",
        "vecino_id": user["id"],
        "fecha": datetime.now(timezone.utc).isoformat()
    }
    result = await db.reportes.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    await manager.broadcast_to_admins({"type": "new_report", "data": {"titulo": data.titulo}}, db)
    return doc

@app.put("/api/reportes/{reporte_id}/estado")
async def update_reporte_estado(reporte_id: str, data: ReporteEstadoUpdate, user=Depends(require_admin)):
    db = get_db()
    valid_states = ["Recibido", "EnProceso", "Resuelto"]
    if data.estado not in valid_states:
        raise HTTPException(status_code=400, detail=f"Estado invalido. Opciones: {valid_states}")
    reporte = await db.reportes.find_one({"_id": ObjectId(reporte_id)})
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    await db.reportes.update_one({"_id": ObjectId(reporte_id)}, {"$set": {"estado": data.estado}})
    # Notify the report owner
    estado_label = {"Recibido": "Recibido", "EnProceso": "En Proceso", "Resuelto": "Resuelto"}.get(data.estado, data.estado)
    await create_notification(db, reporte["vecino_id"], "reporte", "Reporte actualizado", f"Tu reporte '{reporte['titulo']}' cambio a: {estado_label}")
    return {"message": "Estado actualizado"}

@app.delete("/api/reportes/{reporte_id}")
async def delete_reporte(reporte_id: str, user=Depends(get_current_user)):
    db = get_db()
    reporte = await db.reportes.find_one({"_id": ObjectId(reporte_id)})
    if not reporte:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if reporte["vecino_id"] != user["id"] and user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    await db.reportes.delete_one({"_id": ObjectId(reporte_id)})
    return {"message": "Reporte eliminado"}


# ========================
# MULTAS
# ========================
@app.get("/api/multas")
async def list_multas(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    estado: Optional[str] = None,
    user=Depends(get_current_user)
):
    db = get_db()
    query = {}
    if user["rol"] != "admin":
        query["vecino_id"] = user["id"]
    if estado:
        query["estado"] = estado
    skip = (page - 1) * limit
    total = await db.multas.count_documents(query)
    cursor = db.multas.find(query).sort("fecha", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        vecino = await db.users.find_one({"_id": ObjectId(doc["vecino_id"])}, {"_id": 0, "username": 1, "nombre_completo": 1})
        doc["vecino"] = vecino or {}
        items.append(doc)
    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@app.post("/api/multas")
async def create_multa(data: MultaCreate, user=Depends(require_admin)):
    db = get_db()
    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    if data.monto > 10000:
        raise HTTPException(status_code=400, detail="El monto parece muy alto")
    if len(data.motivo.strip()) < 10:
        raise HTTPException(status_code=400, detail="El motivo debe tener al menos 10 caracteres")
    vecino = await db.users.find_one({"_id": ObjectId(data.vecino_id)})
    if not vecino:
        raise HTTPException(status_code=404, detail="Vecino no encontrado")
    doc = {
        "vecino_id": data.vecino_id,
        "monto": data.monto,
        "motivo": data.motivo.strip(),
        "estado": "Pendiente",
        "fecha": datetime.now(timezone.utc).isoformat(),
        "fecha_pago": None
    }
    result = await db.multas.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    await create_notification(db, data.vecino_id, "multa", "Nueva multa", f"Se te ha asignado una multa de ${data.monto:.2f} por: {data.motivo}")
    return doc

@app.put("/api/multas/{multa_id}/pagar")
async def pagar_multa(multa_id: str, user=Depends(get_current_user)):
    db = get_db()
    multa = await db.multas.find_one({"_id": ObjectId(multa_id)})
    if not multa:
        raise HTTPException(status_code=404, detail="Multa no encontrada")
    if multa["vecino_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No puedes pagar esta multa")
    if multa["estado"] == "Pagada":
        raise HTTPException(status_code=400, detail="Esta multa ya fue pagada")
    await db.multas.update_one(
        {"_id": ObjectId(multa_id)},
        {"$set": {"estado": "Pagada", "fecha_pago": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Pago procesado exitosamente"}


# ========================
# OBJETOS PERDIDOS
# ========================
@app.get("/api/objetos-perdidos")
async def list_objetos_perdidos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    db = get_db()
    skip = (page - 1) * limit
    total = await db.objetos_perdidos.count_documents({})
    cursor = db.objetos_perdidos.find({}).sort([("encontrado", 1), ("fecha", -1)]).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        author = await db.users.find_one({"_id": ObjectId(doc["usuario_id"])}, {"_id": 0, "username": 1, "nombre_completo": 1})
        doc["autor"] = author or {}
        items.append(doc)
    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@app.post("/api/objetos-perdidos")
async def create_objeto_perdido(data: ObjetoPerdidoCreate, user=Depends(get_current_user)):
    db = get_db()
    if len(data.titulo.strip()) < 3:
        raise HTTPException(status_code=400, detail="El titulo debe tener al menos 3 caracteres")
    if len(data.descripcion.strip()) < 10:
        raise HTTPException(status_code=400, detail="La descripcion debe tener al menos 10 caracteres")
    doc = {
        "titulo": data.titulo.strip(),
        "descripcion": data.descripcion.strip(),
        "imagen_url": data.imagen_url or "",
        "usuario_id": user["id"],
        "encontrado": False,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "fecha_encuentro": None
    }
    result = await db.objetos_perdidos.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@app.put("/api/objetos-perdidos/{obj_id}/encontrado")
async def marcar_encontrado(obj_id: str, user=Depends(get_current_user)):
    db = get_db()
    obj = await db.objetos_perdidos.find_one({"_id": ObjectId(obj_id)})
    if not obj:
        raise HTTPException(status_code=404, detail="Objeto no encontrado")
    if obj["usuario_id"] != user["id"] and user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    if obj["encontrado"]:
        raise HTTPException(status_code=400, detail="Este objeto ya fue marcado como encontrado")
    await db.objetos_perdidos.update_one(
        {"_id": ObjectId(obj_id)},
        {"$set": {"encontrado": True, "fecha_encuentro": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Objeto marcado como encontrado"}


# ========================
# BOTON DE PANICO
# ========================
@app.post("/api/panico")
async def activar_panico(user=Depends(get_current_user)):
    db = get_db()
    doc = {
        "usuario_id": user["id"],
        "mensaje": "Alerta de panico activada",
        "activo": True,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "fecha_desactivacion": None,
        "desactivado_por": None
    }
    result = await db.alertas_panico.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    # Notify all admins
    await manager.broadcast_to_admins({
        "type": "panic_alert",
        "data": {"usuario": user.get("nombre_completo", user["username"]), "mensaje": doc["mensaje"]}
    }, db)
    # Create notifications for all admins
    admins = await db.users.find({"rol": "admin"}, {"_id": 1}).to_list(100)
    for admin in admins:
        await create_notification(
            db, str(admin["_id"]), "panico",
            "ALERTA DE PANICO",
            f"{user.get('nombre_completo', user['username'])} ha activado el boton de panico"
        )
    return doc

@app.get("/api/panico/historial")
async def historial_panico(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    db = get_db()
    query = {} if user["rol"] == "admin" else {"usuario_id": user["id"]}
    skip = (page - 1) * limit
    total = await db.alertas_panico.count_documents(query)
    cursor = db.alertas_panico.find(query).sort("fecha", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        author = await db.users.find_one({"_id": ObjectId(doc["usuario_id"])}, {"_id": 0, "username": 1, "nombre_completo": 1})
        doc["autor"] = author or {}
        items.append(doc)
    return {"items": items, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@app.put("/api/panico/{alerta_id}/desactivar")
async def desactivar_panico(alerta_id: str, user=Depends(require_admin)):
    db = get_db()
    alerta = await db.alertas_panico.find_one({"_id": ObjectId(alerta_id)})
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if not alerta["activo"]:
        raise HTTPException(status_code=400, detail="Esta alerta ya esta desactivada")
    await db.alertas_panico.update_one(
        {"_id": ObjectId(alerta_id)},
        {"$set": {"activo": False, "fecha_desactivacion": datetime.now(timezone.utc).isoformat(), "desactivado_por": user["id"]}}
    )
    await create_notification(db, alerta["usuario_id"], "panico", "Alerta desactivada", "Tu alerta de panico ha sido atendida por un administrador")
    return {"message": "Alerta desactivada"}


# ========================
# AREAS COMUNES
# ========================
@app.get("/api/areas-comunes")
async def list_areas(user=Depends(get_current_user)):
    db = get_db()
    cursor = db.areas_comunes.find({}).sort("nombre", 1)
    items = []
    async for doc in cursor:
        items.append(str_id(doc))
    return {"items": items}

@app.post("/api/areas-comunes")
async def create_area(data: AreaComunCreate, user=Depends(require_admin)):
    db = get_db()
    if data.capacidad < 1:
        raise HTTPException(status_code=400, detail="La capacidad debe ser al menos 1")
    existing = await db.areas_comunes.find_one({"nombre": data.nombre})
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un area con ese nombre")
    doc = {
        "nombre": data.nombre.strip(),
        "descripcion": data.descripcion.strip(),
        "capacidad": data.capacidad,
        "disponible": data.disponible,
        "imagen_url": data.imagen_url or "",
    }
    result = await db.areas_comunes.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


# ========================
# RESERVAS
# ========================
@app.get("/api/reservas")
async def list_reservas(
    area_id: Optional[str] = None,
    user=Depends(get_current_user)
):
    db = get_db()
    query = {}
    if area_id:
        query["area_id"] = area_id
    if user["rol"] != "admin":
        query["usuario_id"] = user["id"]
    cursor = db.reservas.find(query).sort("fecha", -1)
    items = []
    async for doc in cursor:
        doc = str_id(doc)
        area = await db.areas_comunes.find_one({"_id": ObjectId(doc["area_id"])}, {"_id": 0, "nombre": 1})
        doc["area_nombre"] = area["nombre"] if area else "Desconocida"
        items.append(doc)
    return {"items": items}

@app.post("/api/reservas")
async def create_reserva(data: ReservaCreate, user=Depends(get_current_user)):
    db = get_db()
    area = await db.areas_comunes.find_one({"_id": ObjectId(data.area_id)})
    if not area:
        raise HTTPException(status_code=404, detail="Area no encontrada")
    if not area.get("disponible", True):
        raise HTTPException(status_code=400, detail="Esta area no esta disponible")
    if data.hora_inicio >= data.hora_fin:
        raise HTTPException(status_code=400, detail="La hora de inicio debe ser anterior a la de fin")
    # Check overlapping
    existing = await db.reservas.find_one({
        "area_id": data.area_id,
        "fecha": data.fecha,
        "$or": [
            {"hora_inicio": {"$lt": data.hora_fin}, "hora_fin": {"$gt": data.hora_inicio}}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una reserva en ese horario")
    doc = {
        "area_id": data.area_id,
        "usuario_id": user["id"],
        "fecha": data.fecha,
        "hora_inicio": data.hora_inicio,
        "hora_fin": data.hora_fin,
        "motivo": data.motivo.strip(),
        "creado": datetime.now(timezone.utc).isoformat()
    }
    result = await db.reservas.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


# ========================
# ADMIN
# ========================
@app.get("/api/admin/dashboard")
async def admin_dashboard(user=Depends(require_admin)):
    db = get_db()
    reportes_pendientes = await db.reportes.count_documents({"estado": "Recibido"})
    reportes_en_proceso = await db.reportes.count_documents({"estado": "EnProceso"})
    reportes_resueltos = await db.reportes.count_documents({"estado": "Resuelto"})
    multas_pendientes = await db.multas.count_documents({"estado": "Pendiente"})
    pipeline = [{"$match": {"estado": "Pendiente"}}, {"$group": {"_id": None, "total": {"$sum": "$monto"}}}]
    monto_result = await db.multas.aggregate(pipeline).to_list(1)
    monto_total = monto_result[0]["total"] if monto_result else 0
    alertas_activas = await db.alertas_panico.count_documents({"activo": True})
    objetos_perdidos = await db.objetos_perdidos.count_documents({"encontrado": False})
    total_usuarios = await db.users.count_documents({})
    total_vecinos = await db.users.count_documents({"rol": "vecino"})
    return {
        "reportes_pendientes": reportes_pendientes,
        "reportes_en_proceso": reportes_en_proceso,
        "reportes_resueltos": reportes_resueltos,
        "multas_pendientes": multas_pendientes,
        "monto_multas_pendientes": monto_total,
        "alertas_activas": alertas_activas,
        "objetos_perdidos_activos": objetos_perdidos,
        "total_usuarios": total_usuarios,
        "total_vecinos": total_vecinos,
    }

@app.get("/api/admin/usuarios")
async def list_usuarios(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user=Depends(require_admin)
):
    db = get_db()
    skip = (page - 1) * limit
    total = await db.users.count_documents({})
    cursor = db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        items.append(str_id(doc))
    return {"items": items, "total": total, "page": page}

@app.post("/api/admin/usuarios")
async def admin_create_user(data: CreateUserRequest, user=Depends(require_admin)):
    db = get_db()
    if len(data.username) < 4:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 4 caracteres")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="La contrasena debe tener al menos 8 caracteres")
    if data.rol not in ["vecino", "admin"]:
        raise HTTPException(status_code=400, detail="Rol invalido")
    existing = await db.users.find_one({"$or": [{"username": data.username}, {"email": data.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="El usuario o correo ya existe")
    user_doc = {
        "username": data.username,
        "email": data.email,
        "password_hash": pwd_context.hash(data.password),
        "rol": data.rol,
        "telefono": data.telefono or "",
        "nombre_completo": data.nombre_completo or data.username,
        "bio": "",
        "foto_url": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    return {"id": str(result.inserted_id), "username": data.username, "rol": data.rol}


# ========================
# NOTIFICACIONES
# ========================
@app.get("/api/notificaciones")
async def list_notificaciones(user=Depends(get_current_user)):
    db = get_db()
    cursor = db.notificaciones.find({"usuario_id": user["id"]}).sort("fecha", -1).limit(50)
    items = []
    async for doc in cursor:
        items.append(str_id(doc))
    unread = await db.notificaciones.count_documents({"usuario_id": user["id"], "leida": False})
    return {"items": items, "unread_count": unread}

@app.put("/api/notificaciones/leer-todas")
async def mark_all_read(user=Depends(get_current_user)):
    db = get_db()
    await db.notificaciones.update_many(
        {"usuario_id": user["id"], "leida": False},
        {"$set": {"leida": True}}
    )
    return {"message": "Todas las notificaciones marcadas como leidas"}


# ========================
# CLOUDINARY SIGNATURE
# ========================
@app.get("/api/cloudinary/signature")
async def cloudinary_signature(
    folder: str = Query("uploads"),
    user=Depends(get_current_user)
):
    allowed_folders = ("perfiles", "objetos_perdidos", "publicaciones", "areas_comunes", "reportes", "uploads")
    if folder not in allowed_folders:
        raise HTTPException(status_code=400, detail="Carpeta no permitida")
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": f"vizinho/{folder}"}
    secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    if not secret:
        raise HTTPException(status_code=500, detail="Cloudinary no configurado")
    signature = cloudinary.utils.api_sign_request(params, secret)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
        "api_key": os.environ.get("CLOUDINARY_API_KEY", ""),
        "folder": f"vizinho/{folder}",
    }


# ========================
# WEBSOCKET
# ========================
@app.websocket("/api/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Keep-alive ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ========================
# HEALTH
# ========================
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Vizinho API", "version": "1.0.0"}
