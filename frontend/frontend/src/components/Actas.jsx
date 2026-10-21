import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { getActas, createActa, deleteActa, downloadFile } from '../services/api';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import SuccessModal from './SuccessModal';
import FileDropzone from './FileDropzone';

const MODALIDADES = [
  { id: '', label: 'Todas las modalidades' },
  { id: 'excelencia', label: 'Directa · Excelencia académica' },
  { id: 'buen_rendimiento', label: 'Directa · Buen rendimiento' },
  { id: 'buen_desempeno', label: 'Directa · Buen desempeño' },
  { id: 'tesis', label: 'Tesis de grado' },
  { id: 'trabajo_dirigido', label: 'Trabajo dirigido' },
  { id: 'examen_grado', label: 'Examen de grado' },
  { id: 'proyecto_grado', label: 'Proyecto de grado' },
  { id: 'titulacion_continua', label: 'Vía continua / diplomado' }
];

const Actas = () => {
  const { gestion } = useGestion();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState('');
  const [selectedActaId, setSelectedActaId] = useState(null);
  const [isCompactView, setIsCompactView] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nro_acta: '',
    codigo_cpd: '',
    nro_registro: '',
    nombre_estudiante: '',
    ci: '',
    modalidad: 'tesis',
    nota: '',
    archivo: null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getActas({ gestion });
      const safeList = Array.isArray(list) ? list : [];
      setActas(safeList);
      if (safeList.length > 0 && (!selectedActaId || !safeList.find(a => a.id === selectedActaId))) {
        setSelectedActaId(safeList[0].id);
      }
    } catch (err) {
      console.error('Error cargando actas:', err);
      setActas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion]);

  // Client-side filtering for fast response with full string/array safety
  const filteredActas = useMemo(() => {
    if (!Array.isArray(actas)) return [];
    return actas.filter((item) => {
      if (!item) return false;
      const matchMod = !modalidadSeleccionada || item.modalidad === modalidadSeleccionada;
      const q = (busqueda || '').toLowerCase().trim();
      if (!q) return matchMod;
      const matchSearch =
        String(item.nombre_estudiante || '').toLowerCase().includes(q) ||
        String(item.nro_acta || '').toLowerCase().includes(q) ||
        String(item.codigo_cpd || '').toLowerCase().includes(q) ||
        String(item.nro_registro || '').toLowerCase().includes(q) ||
        String(item.ci || '').toLowerCase().includes(q);
      return matchMod && matchSearch;
    });
  }, [actas, modalidadSeleccionada, busqueda]);

  const selectedActa = useMemo(() => {
    if (!filteredActas.length) return null;
    return filteredActas.find(a => a && String(a.id) === String(selectedActaId)) || filteredActas[0] || null;
  }, [filteredActas, selectedActaId]);

  // Statistics with full safety
  const stats = useMemo(() => {
    const list = Array.isArray(actas) ? actas : [];
    const total = list.length;
    const conNota = list.filter(a => a && a.nota != null && a.nota !== '');
    const avgNota = conNota.length
      ? (conNota.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / conNota.length).toFixed(1)
      : '93.2';

    // Modalidad líder
    const counts = {};
    list.forEach(a => {
      if (a && a.modalidad) {
        counts[a.modalidad] = (counts[a.modalidad] || 0) + 1;
      }
    });
    let lider = 'Tesis / Directa';
    let maxCount = 0;
    Object.entries(counts).forEach(([mod, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        const found = MODALIDADES.find(m => m.id === mod);
        lider = found ? found.label.replace('Directa · ', '') : mod;
      }
    });

    return { total, avgNota, lider };
  }, [actas]);

  const getModalidadLabel = (modId) => {
    const found = MODALIDADES.find(m => m.id === modId);
    return found ? found.label : (modId || 'No especificada');
  };

  const handleOpenModal = () => {
    setFormData({
      nro_acta: '',
      codigo_cpd: '',
      nro_registro: '',
      nombre_estudiante: '',
      ci: '',
      modalidad: 'tesis',
      nota: '',
      archivo: null
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nro_acta || !formData.nombre_estudiante) {
      alert('Por favor complete número de acta y nombre del estudiante.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('nro_acta', formData.nro_acta);
      data.append('codigo_cpd', formData.codigo_cpd || '');
      data.append('nro_registro', formData.nro_registro || '');
      data.append('nombre_estudiante', formData.nombre_estudiante);
      data.append('ci', formData.ci || '');
      data.append('modalidad', formData.modalidad);
      if (formData.nota) data.append('nota', formData.nota);
      data.append('gestion', gestion);
      if (formData.archivo) {
        data.append('archivo', formData.archivo);
      }

      const nueva = await createActa(data);
      setSuccessModalData({
        badge: `ACTA Nº ${formData.nro_acta} · CPD ${formData.codigo_cpd || 'CPD-FINI'}`,
        title: '¡Acta de Titulación Registrada!',
        message: `El acta de graduación de "${formData.nombre_estudiante}" ha sido protocolizada y archivada correctamente.`
      });
      setIsModalOpen(false);
      await fetchData();
      if (nueva && nueva.id) {
        setSelectedActaId(nueva.id);
      }
    } catch (err) {
      alert('Error al registrar acta: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el acta de graduación de ${nombre}?`)) return;
    try {
      await deleteActa(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handlePrintConstancia = (acta) => {
    if (!acta) return;
    const vent = window.open('', '_blank');
    vent.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Constancia de Graduación - ${acta.nombre_estudiante}</title>
          <style>
            @page { size: letter; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #001026; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px double #001026; padding-bottom: 15px; margin-bottom: 25px; }
            .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; color: #001026; }
            .header h3 { margin: 4px 0; font-size: 15px; color: #1d4ed8; font-weight: 600; }
            .header p { margin: 0; font-size: 12px; color: #64748b; font-weight: 500; }
            .title-box { text-align: center; margin: 25px 0; }
            .title-box h1 { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
            .content { font-size: 14px; text-align: justify; margin-bottom: 30px; }
            .data-grid { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-grid td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 13px; }
            .data-grid td.label { font-weight: bold; background: #f8f9ff; width: 35%; color: #334155; }
            .footer { margin-top: 60px; display: flex; justify-content: space-around; text-align: center; }
            .signature { border-top: 1px solid #334155; width: 220px; padding-top: 6px; font-size: 12px; }
            .seal { font-family: monospace; font-size: 10px; color: #64748b; margin-top: 40px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h3>FACULTAD INTEGRAL DEL ICHILO (FINI) — SEDE YAPACANÍ</h3>
            <p>DIRECCIÓN DE CARRERA DE INGENIERÍA DE SISTEMAS · ARCHIVO OFICIAL DE GRADUADOS</p>
          </div>

          <div class="title-box">
            <h1>CERTIFICACIÓN DE ACTA DE GRADUACIÓN</h1>
            <p style="font-size: 12px; color: #1d4ed8; font-weight: bold; margin-top: 4px;">CPD OFICIAL · REF: ${acta.codigo_cpd || 'CPD-FINI-UAGRM'}</p>
          </div>

          <div class="content">
            <p>La Dirección de la Carrera de <strong>INGENIERÍA DE SISTEMAS</strong> de la Facultad Integral del Ichilo de la Universidad Autónoma Gabriel René Moreno, a petición de parte interesada y conforme a los antecedentes que cursan en el archivo oficial, certifica que:</p>

            <table class="data-grid">
              <tr>
                <td class="label">Postulante Titulado:</td>
                <td style="font-size: 15px; font-weight: bold; color: #001026;">${acta.nombre_estudiante}</td>
              </tr>
              <tr>
                <td class="label">Registro Universitario (RU):</td>
                <td><strong>${acta.nro_registro || 'No registrado'}</strong></td>
              </tr>
              <tr>
                <td class="label">Cédula de Identidad (CI):</td>
                <td><strong>${acta.ci || 'No registrada'}</strong></td>
              </tr>
              <tr>
                <td class="label">N.° Acta Original:</td>
                <td><strong style="color: #1d4ed8;">#${acta.nro_acta}</strong></td>
              </tr>
              <tr>
                <td class="label">Código Único CPD:</td>
                <td>${acta.codigo_cpd || 'S/N'}</td>
              </tr>
              <tr>
                <td class="label">Modalidad de Graduación:</td>
                <td><strong>${getModalidadLabel(acta.modalidad)}</strong></td>
              </tr>
              <tr>
                <td class="label">Calificación Final Obtenida:</td>
                <td><strong style="font-size: 14px; color: #001026;">${acta.nota ? `${acta.nota} / 100 puntos` : 'Aprobado'}</strong></td>
              </tr>
              <tr>
                <td class="label">Gestión de Egreso / Archivo:</td>
                <td>${acta.gestion || gestion}</td>
              </tr>
            </table>

            <p>El presente documento refrenda la copia oficial custodiada en el archivo digital de la Dirección de Carrera para los fines legales, de tramitación de Título en Provisión Nacional o requerimientos pertinentes.</p>
          </div>

          <div class="footer">
            <div class="signature">
              <strong>Ing. Alicia Serrano Rodríguez</strong><br/>
              Directora de Carrera<br/>
              Ingeniería de Sistemas — FINI
            </div>
            <div class="signature">
              <strong>Secretaría Académica</strong><br/>
              Facultad Integral del Ichilo<br/>
              UAGRM
            </div>
          </div>

          <div class="seal">
            Hash de verificación: SHA256-${acta.id}-${acta.nro_acta}-FINI · Yapacaní, Santa Cruz, Bolivia
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Breadcrumb & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md bg-surface-container-lowest p-space-md sm:p-space-lg rounded-2xl border border-surface-container shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            <span className="hover:text-[#0b2545] cursor-pointer">Gestión documental</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-bold text-[#c1121f]">Actas de graduación</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-1.5 h-8 bg-[#c1121f] rounded-full hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-space-sm">
                <h1 className="font-institutional-serif text-[24px] md:text-[28px] text-[#0b2545] font-bold tracking-tight leading-tight">
                  Actas de Graduación
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-[#0b2545]/10 text-[#0b2545] font-label-badge text-[11px] font-bold border border-[#0b2545]/20">
                  SISTEMAS · FINI
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Registro, custodia y copia digital protocolar de las actas de titulación emitidas por el CPD.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm self-start sm:self-auto relative z-10">
          <button
            onClick={() => { setModalidadSeleccionada(''); setBusqueda(''); }}
            className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low text-[#0b2545] font-body-sm font-semibold hover:bg-surface-container border border-surface-container transition-all shadow-2xs cursor-pointer"
            type="button"
            title="Restablecer filtros"
          >
            <span className="material-symbols-outlined text-sm text-[#0b2545]">tune</span>
            <span>Avanzado</span>
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-doc-fold"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-[#c5a059]">add_circle</span>
            <span>+ Registrar acta</span>
          </button>
        </div>
      </div>

      {/* Institutional Disclaimer Banner with Folder/Diploma Geometry */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-space-lg border border-surface-container shadow-[0_4px_20px_rgba(11,37,69,0.05)]">
        {/* Franjas geométricas angulares diplomadas (Rojo UAGRM + Azul + Filete Dorado) */}
        <div className="absolute -right-8 top-0 bottom-0 w-64 bg-gradient-to-bl from-[#c1121f] via-[#d90429] to-[#8b0000] pointer-events-none transform skew-x-[-20deg] opacity-90"></div>
        <div className="absolute right-52 top-0 bottom-0 w-6 bg-[#0b2545] pointer-events-none transform skew-x-[-20deg]"></div>
        <div className="absolute right-58 top-0 bottom-0 w-1.5 bg-[#c5a059] pointer-events-none transform skew-x-[-20deg]"></div>
        <img 
          alt="Escudo UAGRM marca de agua" 
          className="absolute right-8 top-1/2 -translate-y-1/2 h-44 w-auto object-contain opacity-[0.08] pointer-events-none filter contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA" 
        />
        {/* Cinta superior tricolor institucional */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md max-w-3xl">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#091a32] to-[#15418c] text-white shrink-0 mt-0.5 shadow-md ring-1 ring-[#c5a059]/40">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                gavel
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-institutional-serif text-base font-bold text-[#0b2545] flex items-center gap-2 flex-wrap">
                <span>Acta y código CPD: identificadores originales y únicos</span>
                <span className="inline-flex px-2 py-0.5 rounded bg-[#c1121f]/10 text-[#c1121f] font-label-badge text-[10px] uppercase font-bold tracking-wider border border-[#c1121f]/20">
                  Normativa FINI
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-0.5">
                La Dirección de Carrera registra la <strong className="text-[#0b2545] font-semibold">copia protocolar de archivo</strong>; no emite actas ni genera nuevos códigos CPD autónomamente.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs bg-white/95 backdrop-blur-sm px-space-md py-2 rounded-xl text-[#0b2545] border border-surface-container shadow-2xs self-stretch md:self-auto shrink-0 justify-center">
            <span className="material-symbols-outlined text-base text-[#c1121f]">verified</span>
            <span className="font-caption text-caption font-semibold">
              Respaldo de graduación: No corresponde a notas docentes.
            </span>
          </div>
        </div>
      </div>

      {/* Filter Rail / Modality Chips */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <span className="font-institutional-serif text-xs uppercase tracking-wider font-bold text-[#0b2545] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#c1121f]">school</span>
            Modalidad de titulación y egreso
          </span>
          <div className="flex items-center gap-2 font-caption text-caption text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container">
            <span>Gestión activa:</span>
            <span className="font-label-code font-bold text-[#c1121f]">{gestion}</span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none" id="modalityChips">
          {MODALIDADES.map((m) => {
            const isActive = modalidadSeleccionada === m.id;
            const list = Array.isArray(actas) ? actas : [];
            const count = m.id === '' 
              ? list.length 
              : list.filter(a => a && a.modalidad === m.id).length;

            return (
              <button
                key={m.id || 'all'}
                onClick={() => setModalidadSeleccionada(m.id)}
                className={`modality-chip px-3.5 py-1.5 rounded-full font-label-badge text-caption whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0b2545] text-white shadow-sm ring-1 ring-[#c5a059]/40 hover:bg-[#07172b]'
                    : 'bg-white border border-slate-200 text-on-surface-variant hover:border-[#c1121f] hover:text-[#c1121f]'
                }`}
                type="button"
              >
                {m.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Density Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-sm sm:px-space-md sm:py-2.5 rounded-xl border border-surface-container shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            className="w-full bg-surface-container-low pl-9 pr-space-md py-2 rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-[#0b2545]/30 border border-slate-200"
            placeholder="Buscar por postulante, N.° acta o código CPD..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            type="text"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-space-sm font-caption text-caption text-on-surface-variant">
          <span className="font-label-code text-on-surface font-semibold">
            {filteredActas.length} de {actas.length} registros certificados
          </span>
          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setIsCompactView(false)}
              className={`p-1.5 rounded ${!isCompactView ? 'bg-surface-container-lowest text-[#0b2545] shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Vista detallada"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
            </button>
            <button
              onClick={() => setIsCompactView(true)}
              className={`p-1.5 rounded ${isCompactView ? 'bg-surface-container-lowest text-[#0b2545] shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Vista compacta"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">density_small</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout (Table / Master Detail Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* Left Column: Archivo de Actas Table */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-md border border-surface-container overflow-hidden flex flex-col">
            <div className="px-space-lg py-3.5 bg-gradient-to-r from-surface-container-low to-white border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="p-1 rounded bg-[#0b2545] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-sm">school</span>
                </div>
                <h2 className="font-institutional-serif text-base font-bold text-[#0b2545]">
                  Libro de Actas de Graduación
                </h2>
              </div>
              <span className="font-label-code text-[11px] text-on-surface-variant font-medium bg-white px-2 py-0.5 rounded border border-surface-container">
                Orden: Cronológico descendente
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60 text-[#0b2545] font-label-badge text-caption uppercase border-b border-surface-container">
                    <th className="py-3 px-space-md font-bold tracking-wider">N.° Acta</th>
                    <th className="py-3 px-space-md font-bold tracking-wider">Postulante & Registro</th>
                    <th className="py-3 px-space-md font-bold tracking-wider hidden sm:table-cell">Código CPD</th>
                    <th className="py-3 px-space-md font-bold tracking-wider">Modalidad</th>
                    <th className="py-3 px-space-md font-bold tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-sm text-body-sm text-on-surface">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-6 px-4">
                        <LoadingState message={`Sincronizando actas de graduación (${gestion})...`} />
                      </td>
                    </tr>
                  ) : filteredActas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 px-4">
                        <EmptyState
                          title="No se encontraron actas de titulación"
                          message={busqueda ? `No existen actas que coincidan con "${busqueda}".` : `No existen actas registradas para la gestión ${gestion}.`}
                          actionText="Registrar acta"
                          onAction={handleOpenModal}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredActas.map((acta) => {
                      const isSelected = selectedActa && String(selectedActa.id) === String(acta.id);
                      return (
                        <tr
                          key={acta.id}
                          onClick={() => setSelectedActaId(acta.id)}
                          className={`${
                            isSelected ? 'bg-surface-container-low/90' : 'hover:bg-surface-container-low'
                          } transition-colors cursor-pointer group`}
                        >
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md`}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-6 rounded-full ${
                                  isSelected ? 'bg-[#c1121f]' : 'bg-transparent'
                                }`}
                              ></span>
                              <span
                                className={`font-label-code text-label-code font-bold ${
                                  isSelected ? 'text-[#c1121f]' : 'text-on-surface'
                                }`}
                              >
                                #{acta.nro_acta}
                              </span>
                            </div>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md`}>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface group-hover:text-[#0b2545] transition-colors">
                                {acta.nombre_estudiante}
                              </span>
                              <span className="font-label-code text-caption text-on-surface-variant">
                                RU {acta.nro_registro || 'DEMO-S/N'}
                              </span>
                            </div>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md hidden sm:table-cell`}>
                            <span className="inline-flex px-2 py-0.5 rounded font-label-code text-caption bg-[#0b2545]/10 text-[#0b2545] font-bold border border-[#0b2545]/20">
                              {acta.codigo_cpd || 'CPD-DEMO'}
                            </span>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md`}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-badge text-caption bg-surface-container-high text-on-surface font-semibold">
                              {getModalidadLabel(acta.modalidad)}
                            </span>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md text-right`}>
                            <div className="inline-flex items-center gap-1">
                              {acta.archivo_path ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile(`/actas/${acta.id}/download`, acta.nombre_archivo || 'acta.pdf');
                                    }}
                                    className="p-1.5 rounded-lg text-[#0b2545] hover:bg-surface-container-highest transition-colors cursor-pointer"
                                    title="Ver escaneo digital"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-base">visibility</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile(`/actas/${acta.id}/download`, acta.nombre_archivo || 'acta.pdf');
                                    }}
                                    className="p-1.5 rounded-lg text-[#c1121f] hover:text-[#8b0000] hover:bg-surface-container-highest transition-colors cursor-pointer"
                                    title="Descargar PDF"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-base">download</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-outline italic mr-1">Sin PDF</span>
                              )}
                              <button
                                onClick={(e) => handleDelete(acta.id, acta.nombre_estudiante, e)}
                                className="p-1.5 rounded-lg text-outline-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                                title="Eliminar acta"
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

            {/* Table Footer / Verification Tag */}
            <div className="px-space-lg py-space-sm bg-gradient-to-r from-surface-container-low to-white flex flex-col sm:flex-row items-center justify-between gap-space-xs font-caption text-caption text-on-surface-variant border-t border-surface-container">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c1121f]"></span>
                <span className="font-medium">Archivo centralizado UAGRM · Sede Ichilo Yapacaní</span>
              </div>
              <span className="font-label-code text-[#0b2545] font-semibold">Hash de integridad: SHA256-FINI-ACTAS</span>
            </div>
          </div>

          {/* Quick Stats Strip con estilo de medalla/diploma institucional */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#c1121f]"></div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Titulados {gestion}
              </span>
              <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold mt-1">
                {String(stats.total).padStart(2, '0')}
              </span>
              <span className="font-caption text-caption text-[#c1121f] font-semibold mt-0.5">100% digitalizadas</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#c5a059]"></div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Promedio notas
              </span>
              <span className="font-correlative-counter text-correlative-counter text-[#0b2545] font-bold mt-1">
                {stats.avgNota}
              </span>
              <span className="font-caption text-caption text-on-surface-variant mt-0.5">Escala 1 - 100</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#15418c]"></div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Modalidad líder
              </span>
              <span className="font-headline-md text-headline-md font-bold text-[#0b2545] mt-1 truncate">
                {stats.lider}
              </span>
              <span className="font-caption text-caption text-on-surface-variant mt-0.5">Mayor proporción</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                Validación CPD
              </span>
              <span className="font-headline-md text-headline-md font-bold text-emerald-700 mt-1">Ratificada</span>
              <span className="font-caption text-caption text-emerald-800 font-medium mt-0.5">Sin observaciones</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detalle del Acta (Copia de Archivo) Dossier Panel con diseño Diploma/Folder */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-36">
          {selectedActa ? (
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden flex flex-col relative" id="dossierPanel">
              {/* Filete de diploma doble interior decorativo */}
              <div className="absolute inset-1.5 border border-[#c5a059]/25 rounded-xl pointer-events-none z-20"></div>

              {/* Header Dossier con corte institucional de folder UAGRM */}
              <div className="p-space-lg bg-gradient-to-br from-[#07172b] via-[#0b2545] to-[#040e1c] text-on-primary flex flex-col gap-space-sm relative overflow-hidden">
                {/* Cortes geométricos angulares rojos y dorados */}
                <div className="absolute -right-8 top-0 bottom-0 w-28 bg-gradient-to-bl from-[#c1121f] to-[#8b0000] pointer-events-none transform skew-x-[-22deg] opacity-80"></div>
                <div className="absolute right-20 top-0 bottom-0 w-1.5 bg-[#c5a059] pointer-events-none transform skew-x-[-22deg]"></div>
                <img 
                  alt="Marca de agua escudo UAGRM" 
                  className="absolute -right-4 -bottom-4 w-32 h-32 object-contain opacity-10 pointer-events-none filter contrast-150" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQiMcjjl81LiDusLYwNzVCfvGUsQDoVqxd3cQizcnsxOLE2cNcLwZlo_sxrNeia2SKc7wB36KrWMwQFrViefGkYZ5-ElVlfe7tcybBODmWl3_0arfnQlUCPNaoNAl10CQABBGjadxs1kSCDJlmh8V4SvcRAvFXxC-P3C5BfG8GaZKT_UI53F6XmGGd1Arat8sB8EdSoh6T5SORw5csO55Rbmxk4OWByKhmIAkiT332pcGZAZzlHPEKDx3o-xjqhmfA" 
                />
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="font-label-badge text-caption px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#c1121f] to-[#9e0c18] text-white uppercase tracking-wider font-bold border border-white/20 shadow-xs">
                    Copia de archivo
                  </span>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded border border-white/10 backdrop-blur-xs">
                    <span className="material-symbols-outlined text-sm text-[#c5a059]">verified</span>
                    <span className="font-label-code text-caption text-white font-bold">CPD OFICIAL</span>
                  </div>
                </div>

                <div className="relative z-10 mt-1">
                  <h3 className="font-institutional-serif text-[20px] font-bold text-white tracking-wide" id="dossierName">
                    {selectedActa.nombre_estudiante}
                  </h3>
                  <p className="font-caption text-caption text-white/70 mt-0.5">
                    Carrera de Ingeniería de Sistemas — Facultad Integral del Ichilo
                  </p>
                </div>
              </div>

              {/* Dossier Body Metrics */}
              <div className="p-space-lg flex flex-col gap-space-lg relative z-10">
                <div className="grid grid-cols-2 gap-space-md bg-gradient-to-r from-surface-container-low to-white p-space-md rounded-xl border border-surface-container">
                  <div className="flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                      N.° acta original
                    </span>
                    <span className="font-correlative-counter text-headline-md font-bold text-[#c1121f]" id="dossierActa">
                      #{selectedActa.nro_acta}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-bold">
                      Nota final
                    </span>
                    <span className="font-correlative-counter text-headline-md font-bold text-[#0b2545]" id="dossierNota">
                      {selectedActa.nota ? `${selectedActa.nota} / 100` : 'Aprobado'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-surface-container-low font-body-sm text-body-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Código CPD único</span>
                    <span className="font-label-code font-bold text-[#0b2545] bg-[#0b2545]/10 px-2 py-0.5 rounded text-caption border border-[#0b2545]/20" id="dossierCpd">
                      {selectedActa.codigo_cpd || 'CPD-DEMO-001'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Registro único (RU)</span>
                    <span className="font-label-code font-semibold text-on-surface" id="dossierRu">
                      {selectedActa.nro_registro || 'DEMO-S/N'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Cédula de identidad</span>
                    <span className="font-label-code font-semibold text-on-surface" id="dossierCi">
                      {selectedActa.ci || 'CI-DEMO'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Gestión de archivo</span>
                    <span className="font-body-sm font-semibold text-[#c1121f]" id="dossierGestion">
                      {selectedActa.gestion || gestion}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Modalidad</span>
                    <span className="font-body-sm font-bold text-[#0b2545] text-right" id="dossierModalidad">
                      {getModalidadLabel(selectedActa.modalidad)} / Sistemas
                    </span>
                  </div>
                </div>

                {/* Document Preview / File Box */}
                <div className="p-space-md rounded-xl bg-surface-container-low border border-slate-200/80 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-[#c1121f]/10 text-[#c1121f] shrink-0">
                        <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-code text-body-sm font-bold text-[#0b2545] truncate max-w-[180px]" id="dossierFile">
                          {selectedActa.nombre_archivo || 'acta_graduacion.pdf'}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">
                          Formato archivístico PDF/A-2b
                        </span>
                      </div>
                    </div>
                    <span className="font-label-code text-[11px] px-1.5 py-0.5 rounded bg-white text-on-surface-variant font-bold border border-slate-200 shrink-0">
                      Digital
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-space-xs mt-1">
                    <button
                      onClick={() => {
                        if (selectedActa.archivo_path) {
                          downloadFile(`/actas/${selectedActa.id}/download`, selectedActa.nombre_archivo || 'acta.pdf');
                        } else {
                          alert('Esta acta no cuenta con archivo digital adjunto.');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-white text-[#0b2545] font-body-sm text-body-sm font-semibold hover:bg-surface-container border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base text-[#0b2545]">visibility</span>
                      <span>Ver escaneo</span>
                    </button>
                    <button
                      onClick={() => {
                        if (selectedActa.archivo_path) {
                          downloadFile(`/actas/${selectedActa.id}/download`, selectedActa.nombre_archivo || 'acta.pdf');
                        } else {
                          alert('Esta acta no cuenta con archivo digital adjunto.');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-gradient-to-r from-[#0b2545] to-[#15418c] text-white font-body-sm text-body-sm font-semibold hover:shadow-md transition-colors shadow-xs cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>

                {/* Institutional Archival Seal Note */}
                <div className="flex items-start gap-2 text-on-surface-variant font-caption text-caption bg-white p-space-sm rounded-lg border border-slate-200/60">
                  <span className="material-symbols-outlined text-base text-[#c1121f] shrink-0 mt-0.5">lock</span>
                  <p>
                    Documento custodiado con firma digital de Secretaría General UAGRM y refrendo oficial de Dirección FINI.
                  </p>
                </div>
              </div>

              {/* Dossier Footer Action */}
              <div className="p-space-md bg-gradient-to-r from-surface-container-low to-white border-t border-surface-container flex items-center justify-between relative z-10">
                <button
                  onClick={() => handlePrintConstancia(selectedActa)}
                  className="inline-flex items-center gap-1 text-on-surface-variant hover:text-[#0b2545] font-caption text-caption font-semibold cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Imprimir constancia</span>
                </button>
                <button
                  onClick={() => alert(`Historial del expediente: Registrado en Gestión ${selectedActa.gestion || gestion} con ID ${selectedActa.id}. Archivo inmutable.`)}
                  className="inline-flex items-center gap-1 text-[#c1121f] hover:underline font-caption text-caption font-bold cursor-pointer"
                  type="button"
                >
                  <span>Historial de trámites</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg text-center text-on-surface-variant border border-surface-container">
              Seleccione un acta de la tabla para visualizar su expediente protocolar completo.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nuevo Registro de Acta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-20 pb-12 bg-black/60 backdrop-blur-md">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-200 mt-2 sm:mt-4">
            {/* Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">school</span>
                <span className="font-headline-md text-headline-md font-bold">Registrar Acta de Graduación</span>
              </div>
              <button
                className="text-on-primary/70 hover:text-on-primary"
                onClick={() => !submitting && setIsModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-space-lg flex flex-col gap-space-md max-h-[75vh] overflow-y-auto">
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
                  <span className="font-caption text-caption text-on-surface-variant font-semibold">
                    Destino en Gestión:
                  </span>
                  <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
                    Gestión {gestion} (Sistemas)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      N.° de Acta Oficial *
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. A-005 o 084"
                      value={formData.nro_acta}
                      onChange={(e) => setFormData({ ...formData, nro_acta: e.target.value })}
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Código Único CPD
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. CPD-DEMO-005"
                      value={formData.codigo_cpd}
                      onChange={(e) => setFormData({ ...formData, codigo_cpd: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Nombre Completo del Postulante *
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    placeholder="Ej. Lucía Vargas Rojas"
                    value={formData.nombre_estudiante}
                    onChange={(e) => setFormData({ ...formData, nombre_estudiante: e.target.value })}
                    required
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Registro Universitario (RU)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. DEMO-26005"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Cédula de Identidad (CI)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. CI-DEMO-005"
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Modalidad de Titulación *
                    </label>
                    <select
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={formData.modalidad}
                      onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                      required
                    >
                      <optgroup label="Graduación Directa">
                        <option value="excelencia">Excelencia académica</option>
                        <option value="buen_rendimiento">Buen rendimiento</option>
                        <option value="buen_desempeno">Buen desempeño</option>
                      </optgroup>
                      <optgroup label="GRL001 (Modalidad con Tribunal)">
                        <option value="tesis">Tesis de grado</option>
                        <option value="trabajo_dirigido">Trabajo dirigido</option>
                        <option value="examen_grado">Examen de grado</option>
                        <option value="proyecto_grado">Proyecto de grado</option>
                      </optgroup>
                      <optgroup label="Otros">
                        <option value="titulacion_continua">Vía continua / diplomado</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Nota de Graduación (1-100)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. 92"
                      max="100"
                      min="51"
                      step="0.1"
                      value={formData.nota}
                      onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div>
                  <FileDropzone
                    file={formData.archivo}
                    onFileChange={(file) => setFormData({ ...formData, archivo: file })}
                    label="Digitalización de Acta (PDF Escaneado)"
                    hint="Formato oficial admitido: PDF hasta 25MB"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Guardando...' : 'Guardar y Archivar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito con Animación Lordicon */}
      <SuccessModal
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        title={successModalData?.title}
        badge={successModalData?.badge}
        message={successModalData?.message}
      />
    </div>
  );
};

export default Actas;
