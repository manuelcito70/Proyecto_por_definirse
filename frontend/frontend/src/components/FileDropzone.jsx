import React, { useState, useRef } from 'react';
import LordIcon from './LordIcon';

/**
 * FileDropzone - Componente animado de carga de archivos con soporte Drag-and-Drop y Lordicon.
 */
export default function FileDropzone({
  file = null,
  onFileChange,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxSizeMB = 25,
  label = "Archivo digital adjunto",
  hint = "Formatos admitidos: PDF, JPG, PNG / Máx 25 MB"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      alert(`El archivo supera el límite de ${maxSizeMB} MB. Tamaño actual: ${sizeInMB.toFixed(1)} MB.`);
      return;
    }

    if (onFileChange) {
      onFileChange(selectedFile);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileChange) {
      onFileChange(null);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-[#c5a059]">attach_file</span>
            <span>{label}</span>
          </label>
          {hint && (
            <span className="font-caption text-caption text-on-surface-variant hidden sm:inline">
              {hint}
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {file ? (
        /* Selected File Card */
        <div className="bg-gradient-to-r from-slate-50 via-white to-amber-50/20 p-3.5 sm:p-4 rounded-xl border border-slate-300 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#0b2545]/5 text-[#c1121f] flex items-center justify-center border border-slate-200 shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {file.type?.includes('pdf') || file.name?.endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-code text-body-sm font-bold text-[#0b2545] truncate max-w-xs sm:max-w-md">
                {file.name}
              </span>
              <div className="flex items-center gap-2 text-caption text-on-surface-variant font-caption">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Listo para indexar
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0b2545] border border-slate-200 text-caption font-semibold transition-colors cursor-pointer"
              title="Previsualizar archivo seleccionado"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Ver</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-caption font-semibold transition-colors cursor-pointer"
              title="Cambiar por otro archivo"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#c1121f] border border-red-200 text-caption font-semibold transition-colors cursor-pointer"
              title="Quitar archivo"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone with Animated Lordicon */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-5 sm:p-6 flex flex-col items-center justify-center text-center group ${
            isDragging
              ? 'border-[#0b2545] bg-blue-50/50 shadow-md scale-[1.005]'
              : 'border-slate-300 bg-surface-container-low hover:bg-surface-container hover:border-[#c5a059]'
          }`}
        >
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform mb-2">
            <LordIcon
              src="https://cdn.lordicon.com/wzwygmng.json"
              trigger="hover"
              colors="primary:#0b2545,secondary:#c5a059"
              size={48}
              fallback={<span className="material-symbols-outlined text-3xl text-[#0b2545]">cloud_upload</span>}
            />
          </div>

          <p className="font-institutional-serif text-sm font-bold text-[#0b2545] group-hover:text-[#c1121f] transition-colors">
            Arrastre el archivo aquí o <span className="underline decoration-[#c5a059] underline-offset-2">haga clic para explorar</span>
          </p>

          <p className="font-caption text-caption text-on-surface-variant mt-1">
            Sube el oficio o documento oficial escaneado ({accept.replace(/\./g, '').toUpperCase()})
          </p>
        </div>
      )}
    </div>
  );
}
