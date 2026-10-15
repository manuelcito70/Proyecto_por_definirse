import React, { useState, useEffect, useMemo } from 'react';
import { useGestion } from '../context/GestionContext';
import { getAuxiliares, createAuxiliar, deleteAuxiliar } from '../services/api';

const Auxiliares = () => {
  const { gestion, setGestion } = useGestion();
  const [auxiliares, setAuxiliares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [semestreFiltro, setSemestreFiltro] = useState('todos');
  const [materiaFiltro, setMateriaFiltro] = useState('todas');
  const [selectedAuxId, setSelectedAuxId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    nro_registro: '',
    materia: '',
    semestre: '1',
    nota_examen: '',
    estado: 'aprobado',
    nro_convocatoria: `CONV-01/${gestion}`,
    es_ratificacion: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await getAuxiliares({
        gestion,
        semestre: semestreFiltro !== 'todos' ? parseInt(semestreFiltro) : undefined,
        busqueda: busqueda || undefined
      });
      const safeList = Array.isArray(list) ? list : [];
      setAuxiliares(safeList);
      if (safeList.length > 0 && (!selectedAuxId || !safeList.find(a => a.id === selectedAuxId))) {
        setSelectedAuxId(safeList[0].id);
      }
    } catch (err) {
      console.error('Error cargando auxiliares:', err);
      setAuxiliares([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gestion, semestreFiltro]);

  // Extract unique subjects for the filter dropdown
  const materiasDisponibles = useMemo(() => {
    const set = new Set();
    const list = Array.isArray(auxiliares) ? auxiliares : [];
    list.forEach(a => {
      if (a && a.materia) set.add(a.materia);
    });
    return Array.from(set);
  }, [auxiliares]);

  // Client filtered with string safety
  const filteredAuxiliares = useMemo(() => {
    if (!Array.isArray(auxiliares)) return [];
    return auxiliares.filter((item) => {
      if (!item) return false;
      const matchMateria = materiaFiltro === 'todas' || item.materia === materiaFiltro;
      const q = (busqueda || '').toLowerCase().trim();
      if (!q) return matchMateria;
      const matchSearch =
        String(item.nombre || '').toLowerCase().includes(q) ||
        String(item.materia || '').toLowerCase().includes(q) ||
        String(item.nro_registro || '').toLowerCase().includes(q) ||
        String(item.nro_convocatoria || '').toLowerCase().includes(q);
      return matchMateria && matchSearch;
    });
  }, [auxiliares, materiaFiltro, busqueda]);

  const selectedAux = useMemo(() => {
    if (!filteredAuxiliares.length) return null;
    return filteredAuxiliares.find(a => a && a.id === selectedAuxId) || filteredAuxiliares[0] || null;
  }, [filteredAuxiliares, selectedAuxId]);

  const getInitials = (name) => {
    if (!name) return 'AX';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenModal = () => {
    setFormData({
      nombre: '',
      nro_registro: '',
      materia: '',
      semestre: '1',
      nota_examen: '',
      estado: 'aprobado',
      nro_convocatoria: `CONV-01/${gestion}`,
      es_ratificacion: false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.materia) {
      alert('Por favor complete el nombre del auxiliar y la materia.');
      return;
    }

    try {
      setSubmitting(true);
      const nuevo = await createAuxiliar({
        ...formData,
        gestion,
        semestre: parseInt(formData.semestre),
        nota_examen: formData.nota_examen ? parseFloat(formData.nota_examen) : null
      });
      setIsModalOpen(false);
      await fetchData();
      if (nuevo && nuevo.id) {
        setSelectedAuxId(nuevo.id);
      }
    } catch (err) {
      alert('Error al registrar auxiliar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nombre, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${nombre}?`)) return;
    try {
      await deleteAuxiliar(id);
      fetchData();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handlePrintConstancia = (aux) => {
    if (!aux) return;
    const vent = window.open('', '_blank');
    vent.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Constancia de Auxiliatura - ${aux.nombre}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #001026; line-height: 1.7; }
            .header { text-align: center; border-bottom: 3px double #001026; padding-bottom: 15px; margin-bottom: 30px; }
            .header h2 { margin: 0; font-size: 19px; text-transform: uppercase; letter-spacing: 1.2px; color: #001026; }
            .header h3 { margin: 5px 0; font-size: 15px; color: #1d4ed8; font-weight: 600; }
            .header p { margin: 0; font-size: 12px; color: #64748b; }
            .title-box { text-align: center; margin: 30px 0; }
            .title-box h1 { font-size: 19px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
            .content { font-size: 15px; text-align: justify; margin-bottom: 40px; }
            .highlight-name { text-align: center; font-size: 18px; font-weight: 800; color: #001026; margin: 20px 0; letter-spacing: 0.5px; }
            .highlight-materia { text-align: center; font-size: 17px; font-weight: bold; color: #1d4ed8; margin: 15px 0; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; text-align: center; }
            .signature { border-top: 1px solid #334155; width: 230px; padding-top: 8px; font-size: 12px; }
            .seal { font-family: monospace; font-size: 10px; color: #64748b; margin-top: 50px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h3>FACULTAD INTEGRAL DEL ICHILO (FINI)</h3>
            <p>DIRECCIÓN DE CARRERA DE INGENIERÍA DE SISTEMAS · SEDE ICHILO (YAPACANÍ)</p>
          </div>

          <div class="title-box">
            <h1>CONSTANCIA DE AUXILIATURA DE CÁTEDRA</h1>
            <p style="font-size: 12px; color: #1d4ed8; font-weight: bold; margin-top: 4px;">REF: ${aux.nro_convocatoria || `CONV-DIR-${aux.gestion}`}</p>
          </div>

          <div class="content">
            <p>La Dirección de Carrera de <strong>Ingeniería de Sistemas</strong> de la Facultad Integral del Ichilo de la Universidad Autónoma Gabriel René Moreno, a solicitud del interesado y a los fines que estime pertinentes, hace constar que:</p>

            <div class="highlight-name">${aux.nombre.toUpperCase()}</div>

            <p>Con Registro Universitario (RU) <strong>${aux.nro_registro || 'En trámite institucional'}</strong>, ejerció funciones oficiales como <strong>AUXILIAR DE DOCENCIA / CÁTEDRA</strong> en la asignatura de:</p>

            <div class="highlight-materia">${aux.materia}</div>

            <p>Durante la <strong>Gestión Académica ${aux.gestion}</strong> (Semestre ${aux.semestre === 1 ? 'I' : 'II'}), habiendo cumplido satisfactoriamente las actividades de apoyo a la docencia con una calificación evaluada de <strong>${aux.nota_examen ? `${aux.nota_examen}/100 puntos` : 'Aprobada'}</strong>, bajo la condición de <strong>${aux.es_ratificacion ? 'Ratificación reglamentaria del Semestre anterior' : 'Concurso de méritos y examen de competencia'}</strong>, conforme a resolución de Consejo Facultativo.</p>

            <p>Se expide la presente constancia para acreditar experiencia docente y antecedentes académicos y laborales.</p>
          </div>

          <div class="footer">
            <div class="signature">
              <strong>Ing. Alicia Serrano Rodríguez</strong><br/>
              Directora de Carrera<br/>
              Ingeniería de Sistemas — FINI
            </div>
            <div class="signature">
              <strong>Decanatura FINI</strong><br/>
              Facultad Integral del Ichilo<br/>
              UAGRM
            </div>
          </div>

          <div class="seal">
            Identificador único de verificación: AUX-FINI-${aux.id}-${aux.gestion} · Yapacaní, Santa Cruz, Bolivia
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  const handlePrintInforme = (aux) => {
    if (!aux) return;
    const vent = window.open('', '_blank');
    vent.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Informe de Cátedra - ${aux.nombre}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #001026; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #001026; padding-bottom: 12px; margin-bottom: 25px; }
            .header h2 { margin: 0; font-size: 17px; text-transform: uppercase; }
            .header h4 { margin: 4px 0; color: #1d4ed8; }
            .content { font-size: 14px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            th { background: #f1f5f9; text-align: left; }
            .signature { margin-top: 60px; text-align: center; border-top: 1px solid #334155; width: 230px; margin-left: auto; margin-right: auto; padding-top: 6px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
            <h4>INFORME TÉCNICO DE ANTECEDENTES DE AUXILIATURA</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Dirección de Carrera de Ingeniería de Sistemas — FINI Ichilo</p>
          </div>
          <div class="content">
            <p><strong>A:</strong> Honorable Consejo de Carrera / Decanatura FINI</p>
            <p><strong>DE:</strong> Ing. Alicia Serrano Rodríguez — Directora de Carrera</p>
            <p><strong>FECHA:</strong> Gestión ${aux.gestion} · Semestre ${aux.semestre === 1 ? 'I' : 'II'}</p>
            <p><strong>ASUNTO:</strong> Elevación de informe de auxiliatura y verificación de antecedentes académicos.</p>

            <table>
              <tr><th>Auxiliar Designado</th><td><strong>${aux.nombre}</strong></td></tr>
              <tr><th>Registro Universitario</th><td>${aux.nro_registro || 'S/N'}</td></tr>
              <tr><th>Materia Asignada</th><td><strong>${aux.materia}</strong></td></tr>
              <tr><th>Semestre / Gestión</th><td>Semestre ${aux.semestre === 1 ? 'I' : 'II'} / ${aux.gestion}</td></tr>
              <tr><th>Calificación de Examen</th><td>${aux.nota_examen ? `${aux.nota_examen}/100` : 'Sin examen (Ratificación)'}</td></tr>
              <tr><th>Condición Legal</th><td>${aux.es_ratificacion ? 'Ratificado del Semestre anterior' : 'Ganador de Convocatoria Pública'}</td></tr>
              <tr><th>Convocatoria de Origen</th><td>${aux.nro_convocatoria || 'CONV-01'}</td></tr>
              <tr><th>Estado Administrativo</th><td><span style="color: #166534; font-weight: bold;">DESIGNACIÓN VÁLIDA</span></td></tr>
            </table>

            <p>Se informa que el expediente del auxiliar cuenta con los respaldos de rigor: Formulario CPD, Acta notariada y Resolución de designación correspondiente, cumpliendo con la normativa del Estatuto Orgánico de la UAGRM.</p>
          </div>
          <div class="signature">
            <strong>Ing. Alicia Serrano Rodríguez</strong><br/>
            Directora de Carrera — Sistemas FINI
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Encabezado & Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col">
          <nav className="flex items-center gap-space-xs text-caption font-caption text-on-surface-variant mb-1">
            <span>Gestión documental</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-semibold">Auxiliares</span>
          </nav>
          <div className="flex items-baseline gap-space-md">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Auxiliares</h1>
            <span className="hidden md:inline-block font-label-code text-caption px-space-xs py-0.5 rounded bg-surface-container-high text-on-primary-fixed-variant">
              SISTEMAS · FINI
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            Antecedentes por materia, gestión y semestre, con documentación de respaldo y trazabilidad jurídica.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-secondary text-on-secondary shadow-md hover:bg-secondary-container transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="font-body-sm text-body-sm font-semibold">+ Registrar antecedente</span>
          </button>
        </div>
      </div>

      {/* Stepper de Referencia Jurídico-Administrativa */}
      <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-lg">account_tree</span>
            <span className="font-label-badge text-caption uppercase text-secondary font-bold tracking-wider">
              Proceso de referencia para el archivo
            </span>
          </div>
          <span className="font-caption text-caption text-on-surface-variant">
            Conforme a normativa del Estatuto Orgánico UAGRM
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          {/* Etapa 1 */}
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-surface-container-highest/60 select-none pointer-events-none">
              01
            </div>
            <div className="flex items-center gap-space-xs mb-1.5">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-code text-caption font-bold">
                1
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-secondary">
                Fase Inicial
              </span>
            </div>
            <div className="font-headline-md text-body-lg font-semibold text-primary leading-tight">
              Propuesta de materias
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Se eleva a Consejo de Carrera con plazas requeridas.
            </p>
          </div>

          {/* Etapa 2 */}
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-surface-container-highest/60 select-none pointer-events-none">
              02
            </div>
            <div className="flex items-center gap-space-xs mb-1.5">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-code text-caption font-bold">
                2
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-on-surface-variant">
                Consejo
              </span>
            </div>
            <div className="font-headline-md text-body-lg font-semibold text-primary leading-tight">
              Tratamiento en Consejo
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Resolución facultativa de aprobación o rechazo.
            </p>
          </div>

          {/* Etapa 3 */}
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-surface-container-highest/60 select-none pointer-events-none">
              03
            </div>
            <div className="flex items-center gap-space-xs mb-1.5">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-code text-caption font-bold">
                3
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-on-surface-variant">
                Convocatoria
              </span>
            </div>
            <div className="font-headline-md text-body-lg font-semibold text-primary leading-tight">
              Convocatoria pública
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Plazos reglamentarios según calendario ICU.
            </p>
          </div>

          {/* Etapa 4 */}
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-3 -right-2 font-correlative-counter text-4xl text-surface-container-highest/60 select-none pointer-events-none">
              04
            </div>
            <div className="flex items-center gap-space-xs mb-1.5">
              <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-code text-caption font-bold">
                4
              </span>
              <span className="font-caption text-caption font-bold uppercase tracking-wider text-secondary font-bold">
                Cierre
              </span>
            </div>
            <div className="font-headline-md text-body-lg font-semibold text-primary leading-tight">
              Evaluación y selección
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Actas de examen, cuadro de méritos y notas con CPD.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        {/* Buscador */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 text-body-sm font-body-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40 transition-all"
            placeholder="Buscar por auxiliar, registro o materia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            type="text"
          />
        </div>

        {/* Selectores */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
          {/* Selector Gestión */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm font-semibold pl-space-md pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
              value={gestion}
              onChange={(e) => setGestion(e.target.value)}
            >
              <option value="2026">Gestión 2026</option>
              <option value="2025">Gestión 2025</option>
              <option value="2024">Gestión 2024</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          {/* Selector Semestre */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-space-md pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
              value={semestreFiltro}
              onChange={(e) => setSemestreFiltro(e.target.value)}
            >
              <option value="todos">Ambos semestres</option>
              <option value="1">Semestre I</option>
              <option value="2">Semestre II</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          {/* Selector Materias */}
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-space-md pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40"
              value={materiaFiltro}
              onChange={(e) => setMateriaFiltro(e.target.value)}
            >
              <option value="todas">Todas las materias</option>
              {materiasDisponibles.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
              expand_more
            </span>
          </div>

          <button
            onClick={() => {
              setBusqueda('');
              setSemestreFiltro('todos');
              setMateriaFiltro('todas');
            }}
            className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            title="Limpiar filtros"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
        </div>
      </div>

      {/* Tabla de Antecedentes */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-base">folder_shared</span>
            <span className="font-headline-md text-body-lg font-bold text-primary">
              Nómina de Antecedentes Registrados
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-caption font-bold">
              {filteredAuxiliares.length} registros activos
            </span>
          </div>
          <div className="flex items-center gap-space-xs text-caption font-caption text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Sede Ichilo (Yapacaní)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-on-surface-variant text-caption font-caption uppercase tracking-wider">
                <th className="py-3 px-space-lg font-bold">Auxiliar / Cód. Registro</th>
                <th className="py-3 px-space-md font-bold">Materia de Cátedra</th>
                <th className="py-3 px-space-md font-bold text-center">Calificación</th>
                <th className="py-3 px-space-md font-bold text-center">Periodo</th>
                <th className="py-3 px-space-md font-bold">Condición Jurídica</th>
                <th className="py-3 px-space-lg font-bold text-right">Respaldo Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    Cargando antecedentes de cátedra...
                  </td>
                </tr>
              ) : filteredAuxiliares.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                    No se encontraron antecedentes para la gestión {gestion}.
                  </td>
                </tr>
              ) : (
                filteredAuxiliares.map((aux) => {
                  const isSelected = selectedAux && selectedAux.id === aux.id;
                  const initials = getInitials(aux.nombre);
                  return (
                    <tr
                      key={aux.id}
                      onClick={() => setSelectedAuxId(aux.id)}
                      className={`${
                        isSelected ? 'bg-surface-container/70' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                      } transition-colors cursor-pointer group`}
                    >
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-8 h-8 rounded-full ${
                              isSelected ? 'bg-secondary text-on-secondary' : 'bg-primary-container text-on-primary'
                            } flex items-center justify-center font-bold text-caption shadow-sm`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary group-hover:text-secondary transition-colors">
                              {aux.nombre}
                            </span>
                            <span className="font-label-code text-caption text-on-surface-variant">
                              {aux.nro_registro ? `RU: ${aux.nro_registro}` : `ID: DEMO-AUX-${String(aux.id).padStart(2, '0')}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-secondary">terminal</span>
                          <span className="font-medium text-primary">{aux.materia}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-space-md text-center">
                        <span className="font-label-code text-body-sm font-bold text-primary">
                          {aux.nota_examen != null ? aux.nota_examen : '-'}
                        </span>
                        <span className="font-label-code text-caption text-on-surface-variant">
                          {aux.nota_examen != null ? ' / 100' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-space-md text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-highest font-label-code text-caption font-semibold text-on-surface">
                          {aux.semestre === 1 ? 'I' : 'II'} / {aux.gestion}
                        </span>
                      </td>

                      <td className="py-3.5 px-space-md">
                        {aux.es_ratificacion ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-badge text-caption">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            RATIFICADO DEL I
                          </span>
                        ) : aux.estado === 'aprobado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-badge text-caption">
                            <span className="material-symbols-outlined text-xs">military_tech</span>
                            GANADOR DE EXAMEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-label-badge text-caption">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            PROPUESTA CONSEJO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-space-lg text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuxId(aux.id);
                              handlePrintConstancia(aux);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-secondary shadow-sm hover:bg-secondary hover:text-on-secondary transition-all"
                            type="button"
                            title="Emitir constancia"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span className="font-body-sm text-caption font-semibold">Ver respaldo</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(aux.id, aux.nombre, e)}
                            className="p-1 rounded-lg text-outline-variant hover:text-error hover:bg-error-container/40 transition-colors"
                            title="Eliminar antecedente"
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

        {/* Paginación / Footer Tabla */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm text-caption font-caption text-on-surface-variant">
          <span>
            Mostrando {filteredAuxiliares.length} de {auxiliares.length} registros históricos de cátedra
          </span>
          <div className="flex items-center gap-1">
            <span className="font-label-code font-bold text-secondary">
              Gestión {gestion} · Archivo FINI UAGRM
            </span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Dossier de Antecedente Seleccionado */}
      {selectedAux && (
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md">
          {/* Header del Antecedente Activo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-correlative-counter text-xl shadow-sm">
                {getInitials(selectedAux.nombre)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-label-badge text-caption uppercase tracking-wider text-secondary font-bold">
                    Antecedente seleccionado
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-code text-caption font-semibold">
                    ID: {selectedAux.nro_registro || `AUX-${selectedAux.id}`}
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  {selectedAux.nombre} — Semestre {selectedAux.semestre === 1 ? 'I' : 'II'} / {selectedAux.gestion}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Cátedra: {selectedAux.materia} · Condición de designación:{' '}
                  {selectedAux.es_ratificacion ? 'Ratificado del Semestre I' : 'Convocatoria y Examen de Méritos'}
                </p>
              </div>
            </div>

            {/* Acciones de Impresión / Emisión */}
            <div className="flex items-center gap-space-xs flex-wrap sm:flex-nowrap">
              <button
                onClick={() => handlePrintConstancia(selectedAux)}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-highest transition-colors font-body-sm text-body-sm font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-secondary">print</span>
                <span>Imprimir constancia</span>
              </button>
              <button
                onClick={() => handlePrintInforme(selectedAux)}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-highest transition-colors font-body-sm text-body-sm font-semibold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-secondary">description</span>
                <span>Imprimir informe</span>
              </button>
            </div>
          </div>

          {/* Panel de Documentación de Respaldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
            {/* Documento 1: Formulario CPD */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary font-label-code text-caption font-bold">
                  CPD-{selectedAux.gestion}-088
                </span>
              </div>
              <div>
                <div className="font-headline-md text-body-lg font-bold text-primary">Formulario oficial CPD</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                  Carga horaria asignada de 32 hrs/mes. Certificación presupuestaria aprobada por la DAF.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">PDF firmado digitalmente</span>
                <button
                  onClick={() => handlePrintConstancia(selectedAux)}
                  className="text-secondary hover:text-on-secondary-fixed font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>

            {/* Documento 2: Convocatoria y evaluación */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-xl">gavel</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary font-label-code text-caption font-bold">
                  {selectedAux.nro_convocatoria || 'ACTA-EX-14'}
                </span>
              </div>
              <div>
                <div className="font-headline-md text-body-lg font-bold text-primary">Convocatoria y evaluación</div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                  Acta de concurso de méritos y examen de competencia. Nota certificada: {selectedAux.nota_examen != null ? `${selectedAux.nota_examen}/100` : 'Aprobada'}.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">Acta notariada FINI</span>
                <button
                  onClick={() => handlePrintInforme(selectedAux)}
                  className="text-secondary hover:text-on-secondary-fixed font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>

            {/* Documento 3: Carta de ratificación / designación */}
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary font-label-code text-caption font-bold">
                  RES-CC-09/{String(selectedAux.gestion || gestion).slice(-2)}
                </span>
              </div>
              <div>
                <div className="font-headline-md text-body-lg font-bold text-primary">
                  {selectedAux.es_ratificacion ? 'Carta de ratificación' : 'Resolución de designación'}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                  Resolución de Consejo de Carrera que aprueba la designación reglamentaria para el Semestre {selectedAux.semestre === 1 ? 'I' : 'II'}.
                </p>
              </div>
              <div className="mt-space-md pt-space-xs flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">Resolución oficial UAGRM</span>
                <button
                  onClick={() => handlePrintConstancia(selectedAux)}
                  className="text-secondary hover:text-on-secondary-fixed font-body-sm text-caption font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  type="button"
                >
                  Descargar <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Registro de Antecedente de Auxiliar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-primary-container/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary-fixed">badge</span>
                <span className="font-headline-md text-headline-md font-bold">Registrar Antecedente de Auxiliar</span>
              </div>
              <button
                className="text-on-primary/70 hover:text-on-primary cursor-pointer"
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
                    Período Académico:
                  </span>
                  <span className="font-label-code text-label-code font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
                    Gestión {gestion} · Carrera Sistemas
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                    Nombre Completo del Postulante / Auxiliar *
                  </label>
                  <input
                    className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    placeholder="Ej. Valeria Méndez Soto"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                      placeholder="Ej. DEMO-AUX-01"
                      value={formData.nro_registro}
                      onChange={(e) => setFormData({ ...formData, nro_registro: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Semestre de Designación
                    </label>
                    <select
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={formData.semestre}
                      onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    >
                      <option value="1">Semestre I</option>
                      <option value="2">Semestre II</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Materia / Cátedra *
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. Programación I, Base de datos I..."
                      value={formData.materia}
                      onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                      required
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Calificación (0 - 100)
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. 86"
                      max="100"
                      min="0"
                      step="0.1"
                      value={formData.nota_examen}
                      onChange={(e) => setFormData({ ...formData, nota_examen: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      N.° Convocatoria / Referencia
                    </label>
                    <input
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Ej. CONV-01/2026"
                      value={formData.nro_convocatoria}
                      onChange={(e) => setFormData({ ...formData, nro_convocatoria: e.target.value })}
                      type="text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-caption text-caption uppercase tracking-wider font-bold text-on-surface-variant">
                      Estado de Designación
                    </label>
                    <select
                      className="w-full px-space-sm py-2 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="aprobado">🟢 Aprobado / Ganador de Examen</option>
                      <option value="pendiente">🟡 Propuesta en Consejo</option>
                      <option value="reprobado">🔴 Rechazado / Sin cupo</option>
                    </select>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-md rounded-lg flex items-center gap-space-sm">
                  <input
                    checked={formData.es_ratificacion}
                    className="w-4 h-4 rounded text-secondary focus:ring-secondary"
                    id="chk_ratificacion"
                    onChange={(e) => setFormData({ ...formData, es_ratificacion: e.target.checked })}
                    type="checkbox"
                  />
                  <label className="text-body-sm font-body-sm text-on-surface cursor-pointer select-none" htmlFor="chk_ratificacion">
                    <strong>¿Es ratificación para el Semestre II?</strong> (Continuidad reglamentaria sin nuevo examen)
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="px-space-lg py-space-md bg-surface-container-low flex items-center justify-end gap-space-sm">
                <button
                  className="px-space-md py-2 rounded-lg font-body-sm text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="px-space-md py-2 bg-secondary text-on-secondary rounded-lg font-body-sm text-body-sm font-semibold shadow-sm hover:bg-primary transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Guardando...' : 'Guardar Antecedente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auxiliares;
