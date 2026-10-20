import React, { useState, useRef, useEffect } from 'react';
import './FileDropzone.css';

/**
 * FileDropzone - Componente institucional de carga de archivos con animación 3D Flip Card.
 * Cuando se carga un archivo, muestra una confirmación con borde giratorio y al pasar
 * el cursor se voltea en 3D para revelar la previsualización del documento o imagen.
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isImage, setIsImage] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef(null);

  // Generar URL de previsualización para imágenes y documentos
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsImage(false);
      setIsFlipped(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const isImg = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name || '');
    setIsImage(isImg);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

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

  const handleOpenPreview = (e) => {
    e.stopPropagation();
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileExtension = (name) => {
    if (!name) return 'DOC';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
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

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {file ? (
        /* TARJETA 3D FLIP: CONFIRMACIÓN Y PREVISUALIZACIÓN AL PASAR EL CURSOR */
        <div className="w-full flex justify-center py-1">
          <div 
            className={`dropzone-card group cursor-pointer ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(f => !f)}
            title="Haz clic o pasa el cursor para voltear y previsualizar"
          >
            <div className="dropzone-content">
              
              {/* 1. CARA FRONTAL: CONFIRMACIÓN DE SUBIDA CON BORDE GIRATORIO LUMINOSO */}
              <div className="dropzone-front">
                <div className="dropzone-front-content">
                  {/* Top Bar Status */}
                  <div className="w-full flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-label-code text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ✓ ARCHIVO CARGADO CON ÉXITO
                    </span>
                    <span className="font-label-code text-[11px] text-[#c5a059] bg-white/10 px-2 py-0.5 rounded border border-[#c5a059]/30">
                      .{getFileExtension(file.name)}
                    </span>
                  </div>

                  {/* Middle: Icon & File Details */}
                  <div className="flex flex-col items-center text-center my-auto gap-2">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0b2545] to-[#15418c] border border-[#c5a059]/50 flex items-center justify-center text-[#c5a059] shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-3xl">
                          {isImage ? 'image' : 'picture_as_pdf'}
                        </span>
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#07162b] flex items-center justify-center text-white text-xs">
                        ✓
                      </span>
                    </div>

                    <div className="max-w-[320px]">
                      <p className="font-label-code text-sm font-bold text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="font-caption text-xs text-slate-300 mt-0.5">
                        {formatFileSize(file.size)} · Listo para custodia institucional
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Hover Prompt with Flip Icon */}
                  <div className="w-full flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg bg-white/10 border border-white/15 text-slate-200 font-caption text-xs">
                    <span className="material-symbols-outlined text-sm text-[#c5a059] animate-spin" style={{ animationDuration: '6s' }}>
                      sync
                    </span>
                    <span>Pasa el cursor o haz clic para ver la <strong>previsualización</strong></span>
                    <span className="material-symbols-outlined text-sm text-emerald-400">touch_app</span>
                  </div>
                </div>
              </div>

              {/* 2. CARA TRASERA: PREVISUALIZACIÓN REAL Y BOTONES DE ACCIÓN */}
              <div className="dropzone-back">
                {/* Visual Background for Image or PDF */}
                {isImage && previewUrl ? (
                  <>
                    <img src={previewUrl} alt={file.name} className="preview-bg-image" />
                    <div className="preview-overlay"></div>
                  </>
                ) : (
                  <>
                    <div className="dropzone-circle dropzone-circle-top"></div>
                    <div className="dropzone-circle dropzone-circle-bottom"></div>
                    <div className="dropzone-circle dropzone-circle-right"></div>
                  </>
                )}

                <div className="dropzone-back-content">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-white font-label-code text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs text-[#c5a059]">visibility</span>
                      VISTA PREVIA
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[10px] text-white font-mono">
                      {isImage ? 'IMAGEN' : 'DOCUMENTO PDF'}
                    </span>
                  </div>

                  {/* Central Preview Content */}
                  <div className="flex flex-col items-center justify-center text-center my-auto p-2">
                    {!isImage && (
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white mb-2 shadow-md">
                        <span className="material-symbols-outlined text-3xl text-red-400">picture_as_pdf</span>
                      </div>
                    )}
                    <p className="font-institutional-serif text-sm font-bold text-white drop-shadow-md truncate max-w-[320px]">
                      {file.name}
                    </p>
                    <p className="font-label-code text-xs text-slate-300 drop-shadow">
                      {formatFileSize(file.size)} · Respaldo digital
                    </p>
                  </div>

                  {/* Action Toolbar on the Back Side */}
                  <div className="flex items-center justify-between gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
                    <button
                      type="button"
                      onClick={handleOpenPreview}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#0b2545] to-[#15418c] hover:opacity-95 text-white text-xs font-bold transition-all border border-[#c5a059]/40 cursor-pointer shadow-sm"
                      title="Abrir en pestaña nueva"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>Ver completo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                      title="Seleccionar otro archivo"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      <span>Cambiar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemove}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/40 text-red-300 hover:text-white transition-all border border-red-500/30 cursor-pointer"
                      title="Quitar archivo"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* ÁREA DE CARGA VACÍA: ELEGANTE, CENTRADA Y SIN DESPLAZAMIENTOS BUGUEADOS */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-5 sm:p-6 flex flex-col items-center justify-center text-center group ${
            isDragging
              ? 'border-[#0b2545] bg-blue-50/60 shadow-lg scale-[1.01]'
              : 'border-slate-300 bg-gradient-to-b from-slate-50/80 to-slate-100/50 hover:bg-white hover:border-[#c5a059] shadow-2xs hover:shadow-md'
          }`}
        >
          {/* Icono de Carga Nítido y Centrado */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0b2545] to-[#15418c] text-white flex items-center justify-center shadow-md border border-[#c5a059]/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-2.5">
            <span className="material-symbols-outlined text-2xl text-[#c5a059]">
              cloud_upload
            </span>
          </div>

          <p className="font-institutional-serif text-sm font-bold text-[#0b2545] group-hover:text-[#c1121f] transition-colors">
            Arrastre el archivo aquí o <span className="underline decoration-[#c5a059] underline-offset-2">haga clic para explorar</span>
          </p>

          <p className="font-caption text-caption text-on-surface-variant mt-1 max-w-sm">
            Suba el documento oficial firmado o escaneado ({accept.replace(/\./g, '').toUpperCase()})
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 font-label-code text-[11px] font-semibold border border-slate-300/80">
            <span className="material-symbols-outlined text-xs text-[#0b2545]">verified</span>
            <span>PDF/A, JPG o PNG · Máx {maxSizeMB} MB</span>
          </div>
        </div>
      )}
    </div>
  );
}
