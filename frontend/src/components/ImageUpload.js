import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function ImageUpload({ folder = 'uploads', onUpload, currentUrl, className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imagenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      return;
    }

    setError('');
    setUploading(true);

    // Show local preview
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      // Get signed upload params
      const sig = await api.get(`/api/cloudinary/signature?folder=${folder}`);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error('Error al subir imagen');

      const result = await res.json();
      const url = result.secure_url;
      setPreview(url);
      onUpload?.(url);
    } catch (err) {
      setError(err.message || 'Error al subir imagen');
      setPreview(currentUrl || '');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onUpload?.('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        data-testid="image-upload-input"
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              data-testid="remove-image-btn"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button
          data-testid="upload-image-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-primary-400 hover:text-primary-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Camera size={24} />
              <span className="text-xs font-medium">Agregar imagen</span>
            </>
          )}
        </button>
      )}
      {error && <p className="text-danger-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
