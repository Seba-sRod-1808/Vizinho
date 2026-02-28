import requests
import sys
import json
from datetime import datetime, date

class VizinhoAPITester:
    def __init__(self, base_url="https://7b1fcc70-2cd9-4cd4-9da8-4f8cb9538d62.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.vecino_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.headers.get('content-type', '').startswith('application/json'):
                    return True, response.json()
                return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200,
            description="Basic health endpoint"
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "admin123"},
            description="Login as admin user"
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin user: {response['user']['username']} (rol: {response['user']['rol']})")
            return True
        return False

    def test_vecino_login(self):
        """Test vecino login"""
        success, response = self.run_test(
            "Vecino Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "vecino1", "password": "vecino123"},
            description="Login as vecino user"
        )
        if success and 'token' in response:
            self.vecino_token = response['token']
            print(f"   Vecino user: {response['user']['username']} (rol: {response['user']['rol']})")
            return True
        return False

    def test_invalid_login(self):
        """Test invalid login"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"username": "invalid", "password": "wrong"},
            description="Should fail with wrong credentials"
        )
        return success

    def test_auth_me(self):
        """Test /me endpoint with valid token"""
        success, response = self.run_test(
            "Auth Me - Admin",
            "GET",
            "api/auth/me",
            200,
            token=self.admin_token,
            description="Get current user info"
        )
        return success

    def test_auth_me_vecino(self):
        """Test /me endpoint with vecino token"""
        success, response = self.run_test(
            "Auth Me - Vecino",
            "GET",
            "api/auth/me",
            200,
            token=self.vecino_token,
            description="Get vecino user info"
        )
        return success

    def test_create_post(self):
        """Test creating a post"""
        post_data = {
            "titulo": "Test Post from API",
            "contenido": "This is a test post created via API testing to validate the feed functionality."
        }
        success, response = self.run_test(
            "Create Post",
            "POST",
            "api/publicaciones",
            200,
            data=post_data,
            token=self.vecino_token,
            description="Create a new feed post"
        )
        if success:
            print(f"   Created post: {response.get('titulo')}")
            return True, response.get('id')
        return False, None

    def test_get_posts(self):
        """Test getting posts"""
        success, response = self.run_test(
            "Get Posts",
            "GET",
            "api/publicaciones",
            200,
            token=self.vecino_token,
            description="Get feed posts"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} posts")
        return success

    def test_create_report(self):
        """Test creating a report"""
        report_data = {
            "titulo": "Test Report from API",
            "descripcion": "This is a test incident report created via API to validate the reporting functionality.",
            "ubicacion": "Building A, Floor 2"
        }
        success, response = self.run_test(
            "Create Report",
            "POST",
            "api/reportes",
            200,
            data=report_data,
            token=self.vecino_token,
            description="Create incident report"
        )
        if success:
            print(f"   Created report: {response.get('titulo')}")
            return True, response.get('id')
        return False, None

    def test_get_reports(self):
        """Test getting reports"""
        success, response = self.run_test(
            "Get Reports",
            "GET",
            "api/reportes",
            200,
            token=self.vecino_token,
            description="Get incident reports"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} reports")
        return success

    def test_update_report_status(self, report_id):
        """Test updating report status (admin only)"""
        if not report_id:
            print("❌ No report ID to update")
            return False
        
        success, response = self.run_test(
            "Update Report Status",
            "PUT",
            f"api/reportes/{report_id}/estado",
            200,
            data={"estado": "EnProceso"},
            token=self.admin_token,
            description="Admin updates report status"
        )
        return success

    def test_create_multa(self):
        """Test creating a multa (admin only)"""
        # First get vecino user ID
        success, user_response = self.run_test(
            "Get Vecino Info for Multa",
            "GET",
            "api/auth/me",
            200,
            token=self.vecino_token,
            description="Get vecino ID for multa creation"
        )
        
        if not success:
            return False, None
        
        vecino_id = user_response.get('id')
        multa_data = {
            "vecino_id": vecino_id,
            "monto": 50.00,
            "motivo": "Test multa created via API testing to validate fine management functionality."
        }
        
        success, response = self.run_test(
            "Create Multa",
            "POST",
            "api/multas",
            200,
            data=multa_data,
            token=self.admin_token,
            description="Admin creates a fine"
        )
        if success:
            print(f"   Created multa: ${response.get('monto')} - {response.get('motivo')[:50]}...")
            return True, response.get('id')
        return False, None

    def test_get_multas(self):
        """Test getting multas"""
        success, response = self.run_test(
            "Get Multas",
            "GET",
            "api/multas",
            200,
            token=self.vecino_token,
            description="Get user's fines"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} multas")
        return success

    def test_pay_multa(self, multa_id):
        """Test paying a multa"""
        if not multa_id:
            print("❌ No multa ID to pay")
            return False
            
        success, response = self.run_test(
            "Pay Multa",
            "PUT",
            f"api/multas/{multa_id}/pagar",
            200,
            token=self.vecino_token,
            description="Vecino pays a fine"
        )
        return success

    def test_create_lost_item(self):
        """Test creating a lost item"""
        item_data = {
            "titulo": "Test Lost Keys",
            "descripcion": "Lost my house keys somewhere in the building. They have a red keychain with building logo."
        }
        success, response = self.run_test(
            "Create Lost Item",
            "POST",
            "api/objetos-perdidos",
            201,
            data=item_data,
            token=self.vecino_token,
            description="Report a lost item"
        )
        if success:
            print(f"   Created lost item: {response.get('titulo')}")
            return True, response.get('id')
        return False, None

    def test_get_lost_items(self):
        """Test getting lost items"""
        success, response = self.run_test(
            "Get Lost Items",
            "GET",
            "api/objetos-perdidos",
            200,
            token=self.vecino_token,
            description="Get lost items"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} lost items")
        return success

    def test_mark_item_found(self, item_id):
        """Test marking item as found"""
        if not item_id:
            print("❌ No item ID to mark as found")
            return False
            
        success, response = self.run_test(
            "Mark Item Found",
            "PUT",
            f"api/objetos-perdidos/{item_id}/encontrado",
            200,
            token=self.vecino_token,
            description="Mark lost item as found"
        )
        return success

    def test_panic_button(self):
        """Test panic button activation"""
        success, response = self.run_test(
            "Activate Panic Button",
            "POST",
            "api/panico",
            201,
            token=self.vecino_token,
            description="Activate emergency alert"
        )
        if success:
            print(f"   Panic alert activated: {response.get('mensaje')}")
            return True, response.get('id')
        return False, None

    def test_get_areas(self):
        """Test getting common areas"""
        success, response = self.run_test(
            "Get Common Areas",
            "GET",
            "api/areas-comunes",
            200,
            token=self.vecino_token,
            description="Get common areas"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} areas")
        return success

    def test_profile_update(self):
        """Test profile update"""
        profile_data = {
            "nombre_completo": "Test User Updated",
            "telefono": "12345678",
            "bio": "Updated bio from API test"
        }
        success, response = self.run_test(
            "Update Profile",
            "PUT",
            "api/profile",
            200,
            data=profile_data,
            token=self.vecino_token,
            description="Update user profile"
        )
        return success

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        success, response = self.run_test(
            "Admin Dashboard",
            "GET",
            "api/admin/dashboard",
            200,
            token=self.admin_token,
            description="Get admin dashboard stats"
        )
        if success:
            print(f"   Dashboard stats: {list(response.keys())}")
        return success

    def test_admin_users(self):
        """Test admin users endpoint"""
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "api/admin/usuarios",
            200,
            token=self.admin_token,
            description="Get users list (admin)"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} users")
        return success

    def test_admin_create_user(self):
        """Test admin creating a user"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "username": f"testuser{timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "testpass123",
            "rol": "vecino",
            "nombre_completo": "Test User API"
        }
        success, response = self.run_test(
            "Admin Create User",
            "POST",
            "api/admin/usuarios",
            201,
            data=user_data,
            token=self.admin_token,
            description="Admin creates new user"
        )
        if success:
            print(f"   Created user: {response.get('username')}")
        return success

    def test_notifications(self):
        """Test notifications endpoint"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "api/notificaciones",
            200,
            token=self.admin_token,
            description="Get user notifications"
        )
        if success:
            print(f"   Found {len(response.get('items', []))} notifications")
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "api/admin/dashboard",
            401,
            description="Should fail without token"
        )
        return success

    def test_vecino_admin_access(self):
        """Test vecino trying to access admin endpoint"""
        success, response = self.run_test(
            "Vecino Admin Access",
            "GET",
            "api/admin/dashboard",
            403,
            token=self.vecino_token,
            description="Should fail - vecino accessing admin endpoint"
        )
        return success

def main():
    print("🚀 Starting Vizinho API Tests...")
    print("=" * 60)
    
    tester = VizinhoAPITester()
    
    # Core functionality tests
    print("\n📋 BASIC TESTS")
    tester.test_health()
    
    # Authentication tests
    print("\n🔐 AUTHENTICATION TESTS")
    if not tester.test_admin_login():
        print("❌ Admin login failed - stopping critical tests")
        return 1
    
    if not tester.test_vecino_login():
        print("❌ Vecino login failed - stopping critical tests")
        return 1
        
    tester.test_invalid_login()
    tester.test_auth_me()
    tester.test_auth_me_vecino()
    tester.test_unauthorized_access()
    tester.test_vecino_admin_access()
    
    # Core features
    print("\n📰 FEED TESTS")
    post_success, post_id = tester.test_create_post()
    tester.test_get_posts()
    
    print("\n📋 REPORTS TESTS")
    report_success, report_id = tester.test_create_report()
    tester.test_get_reports()
    if report_success:
        tester.test_update_report_status(report_id)
    
    print("\n💰 MULTAS TESTS")
    multa_success, multa_id = tester.test_create_multa()
    tester.test_get_multas()
    if multa_success:
        tester.test_pay_multa(multa_id)
    
    print("\n🔍 LOST ITEMS TESTS")
    item_success, item_id = tester.test_create_lost_item()
    tester.test_get_lost_items()
    if item_success:
        tester.test_mark_item_found(item_id)
    
    print("\n🚨 PANIC & AREAS TESTS")
    panic_success, panic_id = tester.test_panic_button()
    tester.test_get_areas()
    
    print("\n👤 PROFILE TESTS")
    tester.test_profile_update()
    
    print("\n🛡️ ADMIN TESTS")
    tester.test_admin_dashboard()
    tester.test_admin_users()
    tester.test_admin_create_user()
    
    print("\n🔔 NOTIFICATIONS TESTS")
    tester.test_notifications()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS:")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for i, test in enumerate(tester.failed_tests, 1):
            print(f"{i}. {test['test']} - {test.get('endpoint', '')}")
            if 'error' in test:
                print(f"   Error: {test['error']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())