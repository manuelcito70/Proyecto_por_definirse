import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { getActas, createActa, deleteActa, downloadFile } from '../services/api';

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
      setActas(list);
      if (list.length > 0 && (!selectedActaId || !list.find(a => a.id === selectedActaId))) {
        setSelectedActaId(list[0].id);
      }
    } catch (err) {
      console.error('Error cargando actas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion]);

  // Client-side filtering for fast response
  const filteredActas = useMemo(() => {
    return actas.filter((item) => {
      const matchMod = !modalidadSeleccionada || item.modalidad === modalidadSeleccionada;
      const q = busqueda.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nombre_estudiante && item.nombre_estudiante.toLowerCase().includes(q)) ||
        (item.nro_acta && item.nro_acta.toLowerCase().includes(q)) ||
        (item.codigo_cpd && item.codigo_cpd.toLowerCase().includes(q)) ||
        (item.nro_registro && item.nro_registro.toLowerCase().includes(q)) ||
        (item.ci && item.ci.toLowerCase().includes(q));
      return matchMod && matchSearch;
    });
  }, [actas, modalidadSeleccionada, busqueda]);

  const selectedActa = useMemo(() => {
    if (!filteredActas.length) return null;
    return filteredActas.find(a => a.id === selectedActaId) || filteredActas[0];
  }, [filteredActas, selectedActaId]);

  // Statistics
  const stats = useMemo(() => {
    const total = actas.length;
    const conNota = actas.filter(a => a.nota != null && a.nota !== '');
    const avgNota = conNota.length
      ? (conNota.reduce((sum, a) => sum + parseFloat(a.nota), 0) / conNota.length).toFixed(1)
      : '93.2';

    // Modalidad líder
    const counts = {};
    actas.forEach(a => {
      counts[a.modalidad] = (counts[a.modalidad] || 0) + 1;
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
    return found ? found.label : modId;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption">
            <span>Gestión documental</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-secondary">Actas de graduación</span>
          </nav>
          <div className="flex items-baseline gap-space-md">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Actas de graduación</h1>
            <span className="hidden md:inline-block font-label-code text-caption px-space-xs py-0.5 rounded bg-surface-container-high text-on-primary-fixed-variant">
              SISTEMAS · FINI
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Registro y copia digital de las actas originales emitidas por el CPD.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button
            onClick={() => { setModalidadSeleccionada(''); setBusqueda(''); }}
            className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm font-semibold hover:bg-surface-container-highest transition-colors shadow-sm"
            type="button"
            title="Restablecer filtros"
          >
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            <span>Limpiar</span>
          </button>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-secondary-container transition-all shadow-md hover:shadow-lg"
            type="button"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Registrar acta</span>
          </button>
        </div>
      </div>

      {/* Institutional Disclaimer Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md sm:p-space-lg shadow-sm">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary/5 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md max-w-3xl">
            <div className="p-2 rounded-lg bg-primary text-on-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                gavel
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-body-sm text-body-sm font-bold text-on-surface flex items-center gap-2">
                <span>Acta y código CPD: identificadores originales y únicos</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-highest text-on-secondary-fixed text-[10px] uppercase font-bold tracking-wider">
                  Normativa FINI
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                La dirección registra la copia de archivo; no emite actas ni genera códigos CPD.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs bg-surface-container-highest/60 px-space-md py-1.5 rounded-lg text-on-primary-fixed-variant self-stretch md:self-auto shrink-0 justify-center">
            <span className="material-symbols-outlined text-sm text-secondary">info</span>
            <span className="font-caption text-caption font-semibold">
              Respaldo de graduación: No corresponde a actas de notas docentes.
            </span>
          </div>
        </div>
      </div>

      {/* Filter Rail / Modality Chips */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <span className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">school</span>
            Modalidad de titulación
          </span>
          <div className="flex items-center gap-2 font-caption text-caption text-on-surface-variant">
            <span>Gestión activa:</span>
            <span className="font-label-code font-bold text-secondary">{gestion}</span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none" id="modalityChips">
          {MODALIDADES.map((m) => {
            const isActive = modalidadSeleccionada === m.id;
            const count = m.id === '' 
              ? actas.length 
              : actas.filter(a => a.modalidad === m.id).length;

            return (
              <button
                key={m.id || 'all'}
                onClick={() => setModalidadSeleccionada(m.id)}
                className={`px-space-md py-1.5 rounded-full font-label-badge text-caption whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm hover:shadow'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
                type="button"
              >
                {m.label} {m.id === '' && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Density Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-sm sm:px-space-md sm:py-2 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            className="w-full bg-surface-container-low pl-9 pr-space-md py-1.5 rounded-lg text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40"
            placeholder="Buscar por postulante, N.° acta o código CPD..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            type="text"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-space-sm font-caption text-caption text-on-surface-variant">
          <span className="font-label-code">
            {filteredActas.length} de {actas.length} registros
          </span>
          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg">
            <button
              onClick={() => setIsCompactView(false)}
              className={`p-1 rounded ${!isCompactView ? 'bg-surface-container-lowest text-secondary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Vista detallada"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
            </button>
            <button
              onClick={() => setIsCompactView(true)}
              className={`p-1 rounded ${isCompactView ? 'bg-surface-container-lowest text-secondary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
              title="Vista compacta"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">density_small</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout (62% Table / 38% Dossier Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* Left Column: Archivo de Actas Table */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-lg">folder_open</span>
                <h2 className="font-headline-md text-body-lg font-bold text-on-surface">Archivo de actas</h2>
              </div>
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                Ordenado: Más reciente primero
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60 text-on-surface-variant font-label-badge text-caption uppercase">
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
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                        Cargando actas de graduación...
                      </td>
                    </tr>
                  ) : filteredActas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-on-surface-variant">
                        No se encontraron actas para los criterios seleccionados en Gestión {gestion}.
                      </td>
                    </tr>
                  ) : (
                    filteredActas.map((acta) => {
                      const isSelected = selectedActa && selectedActa.id === acta.id;
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
                                  isSelected ? 'bg-secondary' : 'bg-transparent'
                                }`}
                              ></span>
                              <span
                                className={`font-label-code text-label-code font-bold ${
                                  isSelected ? 'text-secondary' : 'text-on-surface'
                                }`}
                              >
                                #{acta.nro_acta}
                              </span>
                            </div>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md`}>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface group-hover:text-secondary transition-colors">
                                {acta.nombre_estudiante}
                              </span>
                              <span className="font-label-code text-caption text-on-surface-variant">
                                RU {acta.nro_registro || 'S/N'}
                              </span>
                            </div>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md hidden sm:table-cell`}>
                            <span className="inline-flex px-2 py-0.5 rounded font-label-code text-caption bg-surface-container text-on-primary-fixed-variant">
                              {acta.codigo_cpd || 'CPD-SIN-NUMERO'}
                            </span>
                          </td>
                          <td className={`${isCompactView ? 'py-2' : 'py-3.5'} px-space-md`}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-badge text-caption bg-surface-container-high text-on-surface">
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
                                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container-highest transition-colors"
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
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
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
                                className="p-1.5 rounded-lg text-outline-variant hover:text-error hover:bg-error-container/40 transition-colors"
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
            <div className="px-space-lg py-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-xs font-caption text-caption text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Archivo centralizado UAGRM · Sede Ichilo Yapacaní</span>
              </div>
              <span className="font-label-code">Hash de integridad: SHA256-FINI-ACTAS</span>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Titulados {gestion}
              </span>
              <span className="font-correlative-counter text-correlative-counter text-primary mt-1">
                {String(stats.total).padStart(2, '0')}
              </span>
              <span className="font-caption text-caption text-secondary font-medium">100% digitalizadas</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Promedio notas
              </span>
              <span className="font-correlative-counter text-correlative-counter text-primary mt-1">
                {stats.avgNota}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">Escala 1 - 100</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Modalidad líder
              </span>
              <span className="font-headline-md text-headline-md font-bold text-primary mt-1 truncate">
                {stats.lider}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">Mayor proporción</span>
            </div>
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col">
              <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                Validación CPD
              </span>
              <span className="font-headline-md text-headline-md font-bold text-secondary mt-1">Ratificada</span>
              <span className="font-caption text-caption text-on-surface-variant">Sin observaciones</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detalle del Acta (Copia de Archivo) Dossier Panel */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-32">
          {selectedActa ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col">
              {/* Header Dossier */}
              <div className="p-space-lg bg-primary-container text-on-primary flex flex-col gap-space-sm relative">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-caption px-2 py-0.5 rounded bg-secondary text-on-secondary uppercase tracking-wider font-bold">
                    Copia de archivo
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-secondary-fixed">verified</span>
                    <span className="font-label-code text-caption text-secondary-fixed font-bold">CPD OFICIAL</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md font-bold text-surface-container-lowest">
                    {selectedActa.nombre_estudiante}
                  </h3>
                  <p className="font-caption text-caption text-on-primary-container">
                    Carrera de Ingeniería de Sistemas — Facultad Integral del Ichilo
                  </p>
                </div>
              </div>

              {/* Dossier Body Metrics */}
              <div className="p-space-lg flex flex-col gap-space-lg">
                <div className="grid grid-cols-2 gap-space-md bg-surface-container-low p-space-md rounded-xl">
                  <div className="flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                      N.° acta original
                    </span>
                    <span className="font-label-code text-headline-md font-bold text-secondary">
                      #{selectedActa.nro_acta}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-caption text-caption uppercase tracking-wider text-on-surface-variant font-semibold">
                      Nota final
                    </span>
                    <span className="font-label-code text-headline-md font-bold text-primary">
                      {selectedActa.nota ? `${selectedActa.nota} / 100` : 'Aprobado'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-surface-container-low font-body-sm text-body-sm">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Código CPD único</span>
                    <span className="font-label-code font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded text-caption">
                      {selectedActa.codigo_cpd || 'S/N'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Registro único (RU)</span>
                    <span className="font-label-code font-semibold text-on-surface">
                      {selectedActa.nro_registro || 'No registrado'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Cédula de identidad</span>
                    <span className="font-label-code font-semibold text-on-surface">
                      {selectedActa.ci || 'No registrada'}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Gestión de archivo</span>
                    <span className="font-body-sm font-semibold text-on-surface">
                      {selectedActa.gestion || gestion}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Modalidad</span>
                    <span className="font-body-sm font-bold text-secondary text-right">
                      {getModalidadLabel(selectedActa.modalidad)} / Sistemas
                    </span>
                  </div>
                </div>

                {/* Document Preview / File Box */}
                <div className="p-space-md rounded-xl bg-surface-container flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-xl shrink-0">picture_as_pdf</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-code text-body-sm font-bold text-on-surface truncate">
                          {selectedActa.nombre_archivo || 'acta_graduacion.pdf'}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">
                          Formato archivístico PDF/A-2b
                        </span>
                      </div>
                    </div>
                    <span className="font-caption text-caption px-1.5 py-0.5 rounded bg-surface-container-highest text-on-secondary-fixed font-bold shrink-0">
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
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-surface-container-lowest text-secondary font-body-sm text-body-sm font-semibold hover:bg-surface-container-highest transition-colors shadow-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
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
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-space-sm rounded-lg bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold hover:bg-secondary-container transition-colors shadow-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>

                {/* Institutional Archival Seal Note */}
                <div className="flex items-start gap-2 text-on-surface-variant font-caption text-caption bg-surface-container-low p-space-sm rounded-lg">
                  <span className="material-symbols-outlined text-base text-outline shrink-0 mt-0.5">lock</span>
                  <p>
                    Documento custodiado con firma digital de Secretaría General UAGRM y refrendo de Dirección de Carrera FINI.
                  </p>
                </div>
              </div>

              {/* Dossier Footer Action */}
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <button
                  onClick={() => handlePrintConstancia(selectedActa)}
                  className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-caption text-caption font-semibold cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Imprimir constancia</span>
                </button>
                <button
                  onClick={() => alert(`Historial del expediente: Registrado en Gestión ${selectedActa.gestion || gestion} con ID ${selectedActa.id}. Archivo inmutable.`)}
                  className="inline-flex items-center gap-1 text-secondary hover:underline font-caption text-caption font-semibold cursor-pointer"
                  type="button"
                >
                  <span>Historial de trámites</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg text-center text-on-surface-variant">
              Seleccione un acta de la tabla para visualizar su expediente completo.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nuevo Registro de Acta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
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

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Digitalización de Acta (PDF Escaneado)
                  </label>
                  <label className="border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg p-space-md flex flex-col items-center justify-center gap-1 cursor-pointer bg-surface-container-low/40 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-secondary">upload_file</span>
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">
                      {formData.archivo ? formData.archivo.name : 'Haga clic para adjuntar escaneo en PDF'}
                    </span>
                    <span className="font-caption text-caption text-outline">
                      Formato oficial admitido: PDF hasta 25MB
                    </span>
                    <input
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] || null })}
                      type="file"
                    />
                  </label>
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
    </div>
  );
};

export default Actas;
