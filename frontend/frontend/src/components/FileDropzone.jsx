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
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  // Generar URL de previsualización para imágenes y documentos
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setIsImage(false);
      setIsExpanded(false);
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
    if (e) e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileChange) {
      onFileChange(null);
    }
  };

  const handleOpenPreview = (e) => {
    if (e) e.stopPropagation();
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
        /* TARJETA GLASSMORPHISM CON SKEW Y EXPANSIÓN AL HOVER (Uiverse Fcodingx) */
        <div className="file-card-wrapper">
          <div
            className={`file-preview-card ${isExpanded ? 'is-expanded' : ''}`}
            onClick={() => setIsExpanded(prev => !prev)}
            title="Pasa el cursor o haz clic para ver la vista previa"
          >
            {/* Barra superior estilo MacOS: 3 puntos (Red, Yellow, Green) + Insignia */}
            <div className="file-card-align">
              <div className="file-card-dots">
                <span 
                  className="file-card-dot red cursor-pointer hover:scale-125 transition-transform" 
                  title="Eliminar archivo" 
                  onClick={handleRemove}
                />
                <span 
                  className="file-card-dot yellow cursor-pointer hover:scale-125 transition-transform" 
                  title="Cambiar archivo" 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                />
                <span 
                  className="file-card-dot green cursor-pointer hover:scale-125 transition-transform" 
                  title="Ver completo" 
                  onClick={handleOpenPreview}
                />
              </div>
              <span className="file-card-badge">
                <span className="material-symbols-outlined text-[11px] text-emerald-400">check_circle</span>
                .{getFileExtension(file.name)} · {formatFileSize(file.size)}
              </span>
            </div>

            {/* Encabezado compacto: siempre visible */}
            <div className="file-card-compact">
              <div className="file-card-icon-badge">
                <span className="material-symbols-outlined text-2xl">
                  {isImage ? 'image' : 'picture_as_pdf'}
                </span>
              </div>
              <div className="file-card-meta">
                <p className="file-card-title" title={file.name}>
                  {file.name}
                </p>
                <div className="file-card-subtitle">
                  <span>{isImage ? 'Imagen digital' : 'Documento PDF'} oficial</span>
                  <span className="file-card-hint ml-auto">
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>Pasa el cursor</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sección expandida: Vista previa del documento/imagen y Botones de Acción */}
            <div className="file-card-expanded-body">
              {/* Área de Previsualización */}
              <div className="file-preview-display">
                {isImage && previewUrl ? (
                  <img src={previewUrl} alt={file.name} />
                ) : (
                  <div className="pdf-preview-canvas">
                    <div className="pdf-preview-icon">
                      <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                    </div>
                    <div className="pdf-preview-text">
                      <span className="pdf-preview-text-name">{file.name}</span>
                      <span className="pdf-preview-text-desc">Respaldo digital verificado para expediente</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción interactivos */}
              <div className="file-card-actions">
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="file-btn file-btn-primary"
                  title="Abrir vista completa en nueva pestaña"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Ver completo</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="file-btn file-btn-secondary"
                  title="Seleccionar otro archivo"
                >
                  <span className="material-symbols-outlined text-sm">sync</span>
                  <span>Cambiar</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="file-btn file-btn-danger"
                  title="Eliminar archivo"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
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
