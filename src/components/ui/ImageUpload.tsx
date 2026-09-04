import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateImageFile, uploadImage } from '../../services/storageService';

export interface ImageUploadProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File | null, previewUrl: string) => void;
  storagePath?: string; // If provided, automatically compresses and uploads to this path on selection
  aspectRatio?: 'square' | 'banner' | 'video' | 'auto';
  className?: string;
  helperText?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  id = 'image-upload',
  label,
  value,
  onChange,
  onFileSelect,
  storagePath,
  aspectRatio = 'square',
  className = '',
  helperText,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setPreview(value);
    }
  }, [value]);

  const processSelectedFile = async (file: File) => {
    setError(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Ficheiro de imagem inválido.');
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    if (onFileSelect) {
      onFileSelect(file, localPreviewUrl);
    }

    // If storagePath is defined, trigger immediate upload
    if (storagePath) {
      try {
        setIsUploading(true);
        setUploadProgress(10);

        const downloadUrl = await uploadImage(file, storagePath, {
          onProgress: (percent) => setUploadProgress(percent),
        });

        setPreview(downloadUrl);
        onChange?.(downloadUrl);
      } catch (err: any) {
        console.error('Image upload error:', err);
        setError(err.message || 'Erro ao carregar a imagem para o servidor.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange?.('');
    onFileSelect?.(null, '');
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square max-w-[200px] sm:max-w-[240px]';
      case 'banner':
        return 'aspect-[3/1] w-full min-h-[120px] sm:min-h-[140px]';
      case 'video':
        return 'aspect-video w-full';
      default:
        return 'min-h-[140px] w-full';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-bone-300">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${getAspectClass()} ${
          isDragging
            ? 'border-cobalt-500 bg-cobalt-500/10 ring-2 ring-cobalt-500/20'
            : preview
            ? 'border-ink-700 bg-ink-950'
            : 'border-ink-700/80 bg-ink-950/60 hover:border-cobalt-500/60 hover:bg-ink-900/60'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {/* Image Preview */}
        {preview && !error ? (
          <>
            <img
              src={preview}
              alt="Pré-visualização"
              className="h-full w-full object-cover transition-opacity group-hover:opacity-85"
            />

            {/* Hover overlay with Change & Remove */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-cobalt-500 px-3 py-1.5 text-xs font-medium text-ink-950 shadow-md transition-transform active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={13} />
                Substituir
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/90 text-bone-100 shadow-md transition-transform active:scale-95 hover:bg-rose-600"
                title="Remover imagem"
              >
                <X size={15} />
              </button>
            </div>
          </>
        ) : (
          /* Empty / Dropzone State */
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-850 text-bone-400 group-hover:bg-cobalt-500/10 group-hover:text-cobalt-400 transition-colors">
              <ImageIcon size={20} />
            </div>
            <p className="text-xs font-medium text-bone-200">
              {isDragging ? 'Larga a imagem aqui' : 'Clica ou arrasta a imagem'}
            </p>
            <p className="mt-0.5 text-[11px] text-bone-400">JPG, PNG ou WEBP (máx. 5MB)</p>
          </div>
        )}

        {/* Uploading Spinner & Progress State */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/85 backdrop-blur-sm">
            <Loader2 size={24} className="animate-spin text-cobalt-400" />
            <p className="mt-2 text-xs font-medium text-bone-100">A carregar imagem...</p>
            {uploadProgress > 0 && (
              <p className="font-mono-data text-[11px] text-cobalt-400">{uploadProgress}%</p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-[11px] text-bone-400">{helperText}</p>
      )}
    </div>
  );
}
