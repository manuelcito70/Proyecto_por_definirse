import React, { useState, useEffect } from 'react';
import { useGestion } from '../context/GestionContext';
import { 
  getRecibidos, 
  createRecibido, 
  updateRecibido, 
  deleteRecibido, 
  downloadFile,
  getFileBlob
} from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import FileDropzone from './FileDropzone';
import LordIcon from './LordIcon';

const Recibidos = () => {
  const { gestion } = useGestion();
  const [recibidos, setRecibidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [successModalData, setSuccessModalData] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFileType, setPreviewFileType] = useState(null); // 'image' | 'pdf' | 'other'
  const [previewError, setPreviewError] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  // Load preview file as blob whenever previewDoc changes
  useEffect(() => {
    if (!previewDoc || !previewDoc.id || !previewDoc.archivo_path) {
      setPreviewUrl(null);
      setPreviewFileType(null);
      setPreviewError(null);
      setPreviewZoom(1);
      setPreviewRotation(0);
      return;
    }

    let active = true;
    let objUrl = null;

    const loadPreviewFile = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewZoom(1);
        setPreviewRotation(0);

        const blob = await getFileBlob(`/recibidos/${previewDoc.id}/download`);
        if (!active) return;

        objUrl = URL.createObjectURL(blob);
        setPreviewUrl(objUrl);

        const filename = (previewDoc.nombre_archivo || '').toLowerCase();
        const mime = (blob.type || '').toLowerCase();

        if (mime.startsWith('image/') || filename.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)$/)) {
          setPreviewFileType('image');
        } else if (mime.includes('pdf') || filename.endsWith('.pdf')) {
          setPreviewFileType('pdf');
        } else {
          setPreviewFileType('other');
        }
      } catch (err) {
        if (active) {
          console.error('Error al cargar vista previa:', err);
          setPreviewError(err.message || 'Error al cargar vista previa');
        }
      } finally {
        if (active) setPreviewLoading(false);
      }
    };

    loadPreviewFile();

    return () => {
      active = false;
      if (objUrl) {
        URL.revokeObjectURL(objUrl);
      }
    };
  }, [previewDoc]);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [formData, setFormData] = useState({
    remitente: '',
    oficio_original: '',
    asunto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_atencion: 'Requiere respuesta',
    archivo: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getRecibidos({
        gestion,
        busqueda: busqueda || undefined
      });
      const safeList = Array.isArray(list) ? list : [];
      setRecibidos(safeList);
    } catch (err) {
      console.error('Error cargando recibidos:', err);
      setRecibidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [gestion]);

  // Toast helper
  const showToast = (title, desc) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.remitente || !formData.asunto) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('remitente', formData.remitente);
      data.append('asunto', formData.asunto);
      data.append('descripcion', formData.oficio_original ? `Oficio original: ${formData.oficio_original}` : '');
      data.append('fecha', formData.fecha);
      data.append('estado', formData.tipo_atencion.includes('Requiere') ? 'pendiente' : 'completado');
      data.append('tipo_respuesta', formData.tipo_atencion.includes('Requiere') ? 'requiere_respuesta' : 'para_conocimiento');
      data.append('gestion', gestion);
      if (formData.archivo) {
        data.append('archivo', formData.archivo);
      }

      const res = await createRecibido(data);
      const newNro = res?.nro_recibido || highestNumber + 1;
      setFormData({
        remitente: '',
        oficio_original: '',
        asunto: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_atencion: 'Requiere respuesta',
        archivo: null
      });

      setSuccessModalData({
        badge: `RECIBIDO Nº ${String(newNro).padStart(2, '0')} / ${gestion}`,
        title: '¡Documento Registrado con Éxito!',
        message: `El documento enviado por "${formData.remitente}" ha sido indexado y custodiado en el archivo institucional.`
      });

      showToast(
        `Documento recibido #${String(newNro).padStart(2, '0')}/${gestion} registrado`,
        'Guardado con respaldo digital indexado en Sistemas.'
      );
      await fetchData();
    } catch (err) {
      alert('Error al registrar documento: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async (doc) => {
    const nuevoEstado = doc.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      await updateRecibido(doc.id, { estado: nuevoEstado });
      showToast(
        'Estado actualizado',
        `El documento #${String(doc.nro_recibido).padStart(2, '0')} ahora está ${nuevoEstado.toUpperCase()}.`
      );
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleDelete = async (id, nro) => {
    if (!window.confirm(`¿Estás seguro de eliminar el documento recibido N.º ${nro}?`)) return;
    try {
      await deleteRecibido(id);
      showToast('Registro eliminado', `Se eliminó el documento #${nro}.`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Next number calculation
  const safeRecibidos = Array.isArray(recibidos) ? recibidos : [];
  const highestNumber = safeRecibidos.reduce((max, r) => Math.max(max, r?.nro_recibido || 0), 0);
  const nextRecibidoNumber = highestNumber + 1;

  // Filtered & Paginated records
  const filteredRecibidos = safeRecibidos.filter(doc => {
    if (!doc) return false;
    if (!busqueda) return true;
    const term = (busqueda || '').toLowerCase().trim();
    return (
      (doc.remitente && String(doc.remitente).toLowerCase().includes(term)) ||
      (doc.asunto && String(doc.asunto).toLowerCase().includes(term)) ||
      (doc.descripcion && String(doc.descripcion).toLowerCase().includes(term)) ||
      String(doc.nro_recibido || '').includes(term)
    );
  });

  const totalItems = filteredRecibidos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecibidos = filteredRecibidos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col w-full gap-y-space-lg">
      {/* 1. Header Banner Principal con Cortes Geométricos Institucionales */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-space-xl border border-surface-container shadow-[0_8px_30px_rgba(11,37,69,0.06)]">
        <div className="absolute -right-10 top-0 bottom-0 w-80 bg-gradient-to-bl from-[#c1121f] via-[#d90429] to-[#8b0000] pointer-events-none transform skew-x-[-20deg] opacity-95"></div>
        <div className="absolute right-64 top-0 bottom-0 w-8 bg-[#0b2545] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute right-72 top-0 bottom-0 w-2 bg-[#c5a059] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute -right-6 -bottom-6 w-56 h-56 bg-[#0b2545] pointer-events-none transform rotate-12 opacity-90 rounded-2xl"></div>
        
        <img 
          alt="Marca de agua institucional" 
          className="absolute right-12 top-1/2 -translate-y-1/2 h-64 w-auto object-contain opacity-[0.09] pointer-events-none select-none filter contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
        />

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
          <div className="max-w-3xl">
            <nav className="flex items-center gap-2 text-on-surface-variant font-caption text-caption uppercase tracking-wider mb-space-xs">
              <span>Gestión documental</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-[#c1121f] font-bold">Documentos recibidos</span>
            </nav>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-1.5 h-10 bg-[#c1121f] rounded-full hidden sm:block"></div>
              <div>
                <h1 className="font-institutional-serif text-[26px] md:text-[32px] text-[#0b2545] font-bold tracking-tight leading-tight flex items-center gap-space-sm flex-wrap">
                  <span>Documentos Recibidos</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#0b2545]/10 text-[#0b2545] font-label-badge text-caption border border-[#0b2545]/20">
                    SISTEMAS
                  </span>
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                  Registro oficial de correspondencia externa y respaldo digital del archivo físico · <span className="font-semibold text-[#0b2545]">FINI UAGRM</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md self-start lg:self-auto bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-surface-container shadow-sm">
            <div className="flex flex-col text-right hidden sm:flex px-2">
              <span className="font-label-code text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Recepción Vigente
              </span>
              <span className="font-institutional-serif text-lg font-bold text-[#c1121f] leading-none mt-0.5">
                Gestión {gestion}
              </span>
            </div>
            <div className="h-10 w-px bg-surface-container hidden sm:block"></div>
            <button 
              className="inline-flex items-center gap-space-xs rounded-lg bg-gradient-to-r from-[#c1121f] to-[#9e0c18] px-space-lg py-2.5 font-body-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-[#8b0000] hover:to-[#c1121f] transition-all duration-200 border border-white/20 cursor-pointer" 
              onClick={() => {
                const el = document.getElementById('form-registro-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }} 
              type="button"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span className="tracking-wide">+ Registrar recibido</span>
            </button>
          </div>
        </div>

        {/* Separador Institucional con Insignia Central */}
        <div className="relative w-full my-space-lg">
          <div className="h-[2px] w-full bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f] rounded-full opacity-70"></div>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-3">
            <span className="font-label-code text-[9px] uppercase tracking-widest text-[#c5a059] font-bold">
              CUSTODIA INSTITUCIONAL DE CORRESPONDENCIA
            </span>
          </div>
        </div>

        {/* 3 Bloques de Información Normativa */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
          {/* Tarjeta 1: Próximo Interno */}
          <div className="md:col-span-4 bg-gradient-to-br from-[#07162b] via-[#0b2545] to-[#051121] text-white p-space-lg rounded-xl shadow-md relative overflow-hidden flex flex-col justify-between border border-[#c5a059]/30">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-bl from-[#c1121f] to-[#8b0000] transform rotate-45 pointer-events-none opacity-90"></div>
            <img 
              alt="Filigrana Escudo" 
              className="absolute -left-4 -bottom-4 w-28 h-28 object-contain opacity-10 pointer-events-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA"
            />
            <div className="flex items-center justify-between z-10">
              <span className="font-caption text-caption font-bold tracking-widest text-[#c5a059] uppercase">
                Gestión Activa {gestion}
              </span>
              <span className="material-symbols-outlined text-[#c5a059] text-xl">tag</span>
            </div>
            <div className="my-space-md z-10">
              <div className="font-caption text-caption tracking-wider uppercase text-white/70 font-semibold">
                PRÓXIMO INTERNO
              </div>
              <div className="font-correlative-counter text-correlative-counter text-white font-bold tracking-tight mt-1 flex items-baseline gap-1">
                <span>{String(nextRecibidoNumber).padStart(2, '0')}</span>
                <span className="text-[#c5a059] font-headline-md text-headline-md">/ {gestion}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 text-white/80 font-caption text-caption z-10 border-t border-white/10">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Secuencia correlativa reservada</span>
            </div>
          </div>

          {/* Tarjeta 2: Correlativo automático */}
          <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#c5a059] to-[#0b2545]"></div>
            <div className="flex items-center gap-space-sm text-[#0b2545]">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">sync</span>
              </div>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold">Correlativo automático</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant my-space-sm leading-relaxed">
              Se asigna al registrar y reinicia en 01 cada año. No reemplaza el oficio original del remitente institucional.
            </p>
            <div className="bg-surface-container-low px-space-md py-2 rounded-lg flex items-center justify-between text-on-surface-variant font-caption text-caption font-medium border border-slate-200/60">
              <span>Vigencia: Gestión {gestion}</span>
              <span className="font-label-code text-label-code text-[#0b2545] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                R-SYS-{String(gestion).slice(-2)}
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Respaldo digital */}
          <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
            <div className="flex items-center gap-space-sm text-[#0b2545]">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0b2545] border border-blue-200/80 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <h3 className="font-institutional-serif text-lg text-[#0b2545] font-bold">Respaldo digital</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant my-space-sm leading-relaxed">
              El escaneo se consulta o descarga digitalmente; su contenido original no se edita y conserva validez legal.
            </p>
            <div className="bg-surface-container-low px-space-md py-2 rounded-lg flex items-center justify-between text-on-surface-variant font-caption text-caption font-medium border border-slate-200/60">
              <span>Estándar: Archivo PDF/A</span>
              <div className="flex items-center gap-1 text-[#0b2545] font-bold font-caption">
                <span className="material-symbols-outlined text-sm text-[#c1121f]">lock</span>
                <span>Firma y Huella</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tabla de Correspondencia Recibida */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        <div className="px-space-lg py-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border-b border-surface-container">
          <div className="flex items-center gap-space-sm">
            <div className="h-6 w-1 bg-[#c1121f] rounded-full"></div>
            <h2 className="font-institutional-serif text-lg md:text-xl text-[#0b2545] font-bold">
              Registro de correspondencia recibida
            </h2>
            <span className="bg-surface-container-low text-[#0b2545] px-2.5 py-0.5 rounded-full font-label-code text-caption font-bold border border-surface-container">
              {recibidos.length} registros
            </span>
          </div>

          <div className="flex items-center gap-space-sm w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs" 
                id="filtro-recibidos" 
                placeholder="Filtrar por oficio, remitente..." 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-base">search</span>
            </div>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-slate-200 cursor-pointer"
              title="Refrescar lista"
              type="button"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left" id="tabla-recibidos">
            <thead className="bg-surface-container-low text-on-surface-variant font-caption text-caption uppercase tracking-wider border-b border-surface-container">
              <tr>
                <th className="py-3.5 px-space-lg font-bold text-[#0b2545]">N.° Interno</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Fecha recepción</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Remitente / Oficio original</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Asunto / Referencia documental</th>
                <th className="py-3.5 px-space-md font-bold text-[#0b2545]">Estado</th>
                <th className="py-3.5 px-space-lg text-right font-bold text-[#0b2545]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body-sm text-body-sm text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-6 px-4">
                    <LoadingState message={`Sincronizando correspondencia recibida (${gestion})...`} />
                  </td>
                </tr>
              ) : currentRecibidos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 px-4">
                    <EmptyState
                      title={`No se encontraron documentos en ${gestion}`}
                      message={busqueda ? `No hay documentos que coincidan con la búsqueda "${busqueda}".` : "No existen registros de correspondencia externa para esta gestión."}
                      actionText="Registrar documento recibido"
                      onAction={() => {
                        const el = document.getElementById('form-registro-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  </td>
                </tr>
              ) : (
                currentRecibidos.map((doc, idx) => {
                  const esPendiente = doc.estado === 'pendiente';
                  return (
                    <tr 
                      key={doc.id} 
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-surface-container-lowest'
                      }`}
                    >
                      <td className="py-4 px-space-lg">
                        <span className={`font-label-code text-label-code font-bold px-2 py-1 rounded border ${
                          esPendiente
                            ? 'text-[#c1121f] bg-red-50 border-red-200'
                            : 'text-[#0b2545] bg-surface-container-high border-slate-200'
                        }`}>
                          #{String(doc.nro_recibido).padStart(2, '0')} / {gestion}
                        </span>
                      </td>

                      <td className="py-4 px-space-md whitespace-nowrap text-on-surface-variant font-medium">
                        {doc.fecha}
                      </td>

                      <td className="py-4 px-space-md">
                        <div className="font-semibold text-[#0b2545]">{doc.remitente}</div>
                        {doc.descripcion && (
                          <div className="font-label-code text-caption text-on-surface-variant">
                            {doc.descripcion}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-space-md max-w-xs">
                        <div className="font-medium text-on-surface">{doc.asunto}</div>
                        {esPendiente ? (
                          <div className="font-caption text-caption text-[#c1121f] font-semibold flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">priority_high</span> Requiere respuesta
                          </div>
                        ) : (
                          <div className="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">archive</span> Solo conocimiento archivado
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-space-md whitespace-nowrap">
                        {esPendiente ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c1121f] animate-pulse"></span> PENDIENTE
                          </span>
                        ) : doc.estado === 'en_curso' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> EN CURSO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-badge text-caption font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> COMPLETADO
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-space-lg text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {doc.archivo_path ? (
                            <>
                              <button 
                                className="p-1.5 rounded-lg text-[#0b2545] hover:bg-surface-container-high transition-colors cursor-pointer" 
                                onClick={() => setPreviewDoc(doc)}
                                title="Ver escaneo digital" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              <button 
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-[#0b2545] hover:bg-surface-container-high transition-colors cursor-pointer" 
                                onClick={() => downloadFile(`/recibidos/${doc.id}/download`, doc.nombre_archivo || 'recibido.pdf')}
                                title="Descargar documento" 
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">download</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-outline italic mr-2">Sin archivo</span>
                          )}

                          <button 
                            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-[#0b2545] transition-colors text-xs font-semibold cursor-pointer"
                            onClick={() => handleToggleEstado(doc)}
                            title={esPendiente ? "Marcar como respondido" : "Reabrir como pendiente"}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">
                              {esPendiente ? 'check_circle' : 'replay'}
                            </span>
                          </button>

                          <button 
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-[#c1121f] hover:bg-surface-container-high transition-colors cursor-pointer"
                            onClick={() => handleDelete(doc.id, doc.nro_recibido)}
                            title="Eliminar registro"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-space-lg py-3 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-caption text-caption border-t border-surface-container">
          <span>
            Mostrando {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} documentos registrados en la gestión {gestion}
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-white text-on-surface hover:bg-surface-container-high disabled:opacity-50 border border-slate-200 font-medium cursor-pointer"
              type="button"
            >
              Anterior
            </button>
            <span className="font-bold text-[#0b2545] bg-surface-container-high px-2 py-1 rounded">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded bg-white text-on-surface hover:bg-surface-container-high disabled:opacity-50 border border-slate-200 font-medium cursor-pointer"
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* 3. Formulario Integrado: Registrar Documento Recibido */}
      <div 
        className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg border border-surface-container flex flex-col gap-space-lg relative overflow-hidden" 
        id="form-registro-section"
      >
        <div className="absolute inset-1 border border-[#c5a059]/20 rounded-xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c1121f] via-[#c5a059] to-[#0b2545]"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md bg-surface-container-low p-space-md rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#091a32] to-[#15418c] text-white flex items-center justify-center font-bold shadow-sm ring-1 ring-[#c5a059]/40">
              <span className="material-symbols-outlined">post_add</span>
            </div>
            <div>
              <h2 className="font-institutional-serif text-lg md:text-xl text-[#0b2545] font-bold">
                Registrar documento recibido
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Llene los datos formales para anexar al archivo oficial de Sistemas · FINI UAGRM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2 rounded-lg shadow-2xs border border-surface-container">
            <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
              Correlativo asignado:
            </span>
            <span className="font-label-code text-label-code font-bold text-[#c1121f] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              {String(nextRecibidoNumber).padStart(2, '0')} / {gestion} (Automático)
            </span>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-space-lg">
          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1" htmlFor="origen-remitente">
              <span>Origen / Remitente</span>
              <span className="text-[#c1121f]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">corporate_fare</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs" 
                id="origen-remitente" 
                placeholder="Ej. Decanatura FINI, Dirección de Carrera Civil..." 
                value={formData.remitente}
                onChange={(e) => setFormData({ ...formData, remitente: e.target.value })}
                required 
                type="text"
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1" htmlFor="oficio-original">
              <span>N.° de oficio original</span>
              <span className="text-[#c1121f]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">numbers</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-label-code text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs" 
                id="oficio-original" 
                placeholder="Ej. OF-EXT-A/028, CITE-DIR-2026..." 
                value={formData.oficio_original}
                onChange={(e) => setFormData({ ...formData, oficio_original: e.target.value })}
                required 
                type="text"
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1" htmlFor="fecha-recepcion">
              <span>Fecha de recepción</span>
              <span className="text-[#c1121f]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">calendar_month</span>
              <input 
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs" 
                id="fecha-recepcion" 
                required 
                type="date" 
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1" htmlFor="tipo-atencion">
              <span>Tipo de atención</span>
              <span className="text-[#c1121f]">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">tune</span>
              <select 
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs appearance-none cursor-pointer" 
                id="tipo-atencion" 
                required
                value={formData.tipo_atencion}
                onChange={(e) => setFormData({ ...formData, tipo_atencion: e.target.value })}
              >
                <option value="Requiere respuesta">Requiere respuesta (En trámite)</option>
                <option value="Solo conocimiento">Solo conocimiento (Para archivo institucional)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant pointer-events-none text-lg">expand_more</span>
            </div>
          </div>

          <div className="md:col-span-12 flex flex-col gap-1.5">
            <label className="font-body-sm text-body-sm font-semibold text-[#0b2545] flex items-center gap-1" htmlFor="asunto-referencia">
              <span>Asunto / Referencia documental</span>
              <span className="text-[#c1121f]">*</span>
            </label>
            <textarea 
              className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md p-3 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-slate-200 shadow-2xs" 
              id="asunto-referencia" 
              placeholder="Sintetice el contenido del documento, solicitud o antecedente..." 
              required 
              rows="2"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
            ></textarea>
          </div>

          <div className="md:col-span-12">
            <FileDropzone
              file={formData.archivo}
              onFileChange={(f) => setFormData({ ...formData, archivo: f })}
              label="Archivo escaneado (PDF digitalizado o Imagen)"
              hint="Formatos admitidos: PDF, JPG, PNG / Máx 25 MB"
            />
          </div>

          <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-end gap-space-sm pt-space-sm border-t border-slate-100">
            <button 
              className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-body-sm text-body-sm font-medium transition-colors border border-slate-200 cursor-pointer" 
              type="reset"
              onClick={() => setFormData({
                remitente: '',
                oficio_original: '',
                asunto: '',
                fecha: new Date().toISOString().split('T')[0],
                tipo_atencion: 'Requiere respuesta',
                archivo: null
              })}
            >
              Limpiar campos
            </button>
            <button 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-xl py-2.5 rounded-lg bg-gradient-to-r from-[#c1121f] to-[#9e0c18] hover:from-[#8b0000] hover:to-[#c1121f] text-white shadow-md font-body-sm text-body-sm font-bold transition-all border border-white/20 cursor-pointer disabled:opacity-50" 
              type="submit"
              disabled={submitting}
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{submitting ? 'Guardando...' : 'Guardar registro'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Modal Preview de Documento (Visor Interactivo para Imágenes y PDFs) */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#c5a059]/40" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#07162b] via-[#0b2545] to-[#15418c] text-white flex items-center justify-between border-b border-[#c5a059]/30 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#c5a059] shrink-0 shadow-inner">
                  <LordIcon
                    src="https://cdn.lordicon.com/lbjtvqiv.json"
                    trigger="hover"
                    colors="primary:#c5a059,secondary:#ffffff"
                    size={26}
                    fallback={
                      <span className="material-symbols-outlined text-xl">
                        {previewFileType === 'image' ? 'image' : previewFileType === 'pdf' ? 'picture_as_pdf' : 'description'}
                      </span>
                    }
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-institutional-serif text-base font-bold text-white truncate max-w-md">
                      {previewDoc.asunto || 'Vista de Documento'}
                    </h4>
                    <span className="font-label-code text-[11px] text-[#c5a059] bg-white/10 px-2 py-0.5 rounded border border-white/15">
                      #{String(previewDoc.nro_recibido).padStart(2, '0')} / {gestion}
                    </span>
                  </div>
                  <span className="font-caption text-xs text-white/70 truncate">
                    Remitente: <strong className="text-white">{previewDoc.remitente}</strong> · Archivo: {previewDoc.nombre_archivo || 'archivo'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                {previewUrl && (
                  <button 
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Abrir en ventana completa"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                  </button>
                )}
                <button 
                  className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" 
                  onClick={() => setPreviewDoc(null)} 
                  type="button"
                  title="Cerrar visor"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Visor Interactivo */}
            <div className="flex-1 overflow-y-auto bg-slate-100/90 p-4 flex flex-col items-center justify-center min-h-[350px]">
              {previewLoading ? (
                <div className="py-12 w-full flex justify-center">
                  <LoadingState
                    message="Cargando previsualización digital del archivo..."
                    submessage={previewDoc.nombre_archivo}
                    size={52}
                  />
                </div>
              ) : previewError ? (
                <div className="p-8 text-center max-w-md bg-white rounded-xl border border-red-200 shadow-sm flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-[#c1121f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">error_outline</span>
                  </div>
                  <div>
                    <h5 className="font-institutional-serif text-base font-bold text-slate-800">
                      No se pudo cargar la vista previa directa
                    </h5>
                    <p className="font-caption text-xs text-slate-500 mt-1">
                      {previewError}
                    </p>
                  </div>
                  <button 
                    onClick={() => downloadFile(`/recibidos/${previewDoc.id}/download`, previewDoc.nombre_archivo || 'recibido.pdf')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0b2545] text-white rounded-lg text-xs font-bold hover:bg-[#15418c] transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Descargar archivo directamente</span>
                  </button>
                </div>
              ) : previewFileType === 'image' && previewUrl ? (
                /* VISOR DE IMAGEN (JPEG, PNG, WEBP, ETC.) */
                <div className="w-full flex flex-col items-center gap-3">
                  {/* Barra de Controles de Imagen */}
                  <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-slate-700">
                    <button 
                      onClick={() => setPreviewZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Reducir zoom (-)"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">zoom_out</span>
                    </button>
                    <button 
                      onClick={() => setPreviewZoom(1)}
                      className="px-2 py-0.5 rounded hover:bg-slate-100 font-label-code text-xs font-bold text-[#0b2545] cursor-pointer"
                      title="Restablecer tamaño (100%)"
                      type="button"
                    >
                      {Math.round(previewZoom * 100)}%
                    </button>
                    <button 
                      onClick={() => setPreviewZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Aumentar zoom (+)"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">zoom_in</span>
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-1"></div>
                    <button 
                      onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Girar 90° a la derecha"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">rotate_right</span>
                    </button>
                    <button 
                      onClick={() => { setPreviewZoom(1); setPreviewRotation(0); }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Restablecer vista"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">refresh</span>
                    </button>
                  </div>

                  {/* Lienzo de la imagen */}
                  <div className="w-full max-h-[62vh] overflow-auto rounded-xl bg-slate-900/90 p-4 flex items-center justify-center shadow-inner border border-slate-700/50">
                    <img 
                      src={previewUrl} 
                      alt={previewDoc.nombre_archivo || 'Documento recibido'}
                      style={{
                        transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-h-[56vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
                    />
                  </div>
                </div>
              ) : previewFileType === 'pdf' && previewUrl ? (
                /* VISOR DE DOCUMENTO PDF */
                <div className="w-full h-[66vh] rounded-xl overflow-hidden shadow-sm border border-slate-300 bg-white">
                  <iframe 
                    src={previewUrl} 
                    title={previewDoc.nombre_archivo || 'Documento PDF'}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                /* OTROS TIPOS DE ARCHIVO */
                <div className="p-8 text-center max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-[#0b2545] flex items-center justify-center border border-slate-200 shadow-2xs">
                    <span className="material-symbols-outlined text-3xl">draft</span>
                  </div>
                  <div>
                    <h5 className="font-institutional-serif text-lg font-bold text-[#0b2545]">
                      Archivo Documental Adjunto
                    </h5>
                    <p className="font-label-code text-xs text-slate-600 mt-1 font-semibold">
                      {previewDoc.nombre_archivo || 'documento'}
                    </p>
                    <p className="font-caption text-xs text-slate-500 mt-1">
                      Este formato se descarga directamente para su visualización en tu equipo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-caption">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>Documento indexado con resguardo de integridad digital FINI UAGRM</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {previewUrl && (
                  <button 
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b2545] font-body-sm text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    <span>Abrir en pestaña</span>
                  </button>
                )}
                <button 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0b2545] to-[#15418c] text-white font-body-sm text-xs font-bold hover:shadow-md transition-all cursor-pointer shadow-xs border border-white/20" 
                  onClick={() => downloadFile(`/recibidos/${previewDoc.id}/download`, previewDoc.nombre_archivo || 'recibido.pdf')}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Descargar archivo</span>
                </button>
                <button 
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-body-sm text-xs font-semibold transition-colors cursor-pointer"
                  onClick={() => setPreviewDoc(null)} 
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Confirmación Exitosa */}
      <SuccessModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        title={successModalData?.title}
        badge={successModalData?.badge}
        message={successModalData?.message}
      />

      {/* 6. Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#07162b] text-white px-space-lg py-space-md rounded-xl shadow-xl flex items-center gap-space-md border border-[#c5a059]/30">
            <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
            <div className="flex flex-col">
              <span className="font-institutional-serif text-body-sm font-bold text-white">
                {toastMessage.title}
              </span>
              <span className="font-body-sm text-caption text-[#c5a059]">
                {toastMessage.desc}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibidos;
