# -*- coding: utf-8 -*-
"""Plan de producción y estrategia de marketing."""
import datos as D


def produccion(a):
    a.h1("Plan de producción del software")
    a.ps(
        "Para vender un software de forma repetible no basta con tenerlo programado: se debe poder "
        "*producir* cada nueva implantación con la misma calidad, en un plazo conocido y a un costo "
        "controlado. Este capítulo aplica los conceptos de administración de operaciones a la producción de "
        "SIGAD como producto comercial.",
    )
    a.h2("Proceso productivo")
    a.p("El proceso productivo de SIGAD tiene dos líneas que trabajan en paralelo. La **línea de producto** "
        "desarrolla nuevas versiones para todos los clientes; la **línea de implantación** entrega el "
        "producto a cada cliente nuevo. Ambas se conectan mediante la retroalimentación: lo que se aprende en "
        "cada implantación alimenta la lista de mejoras del producto.")
    a.figura("Proceso productivo del software SIGAD", "graficos/g18_proceso_productivo.png",
             "Elaboración propia con base en Schwaber y Sutherland (2020).", 6.3)
    a.tabla("Etapas del proceso productivo, entradas y salidas",
            ["Etapa", "Entradas", "Actividades", "Salidas"],
            [["Captura de requisitos", "Solicitudes de clientes, encuestas, reportes de ventas",
              "Registrar, agrupar y estimar", "Lista priorizada del producto"],
             ["Planificación del sprint", "Lista priorizada, capacidad del equipo", "Seleccionar tareas de dos semanas",
              "Objetivo del sprint"],
             ["Diseño y desarrollo", "Tareas del sprint", "Diseñar, programar, revisar código", "Incremento funcional"],
             ["Pruebas y calidad", "Incremento funcional", "Pruebas unitarias, de integración y de aceptación",
              "Versión candidata"],
             ["Empaquetado y despliegue", "Versión candidata aprobada", "Respaldo, migración de base, publicación",
              "Versión en producción"],
             ["Implantación", "Contrato firmado, datos del cliente", "Configurar, migrar, capacitar",
              "Cliente operando"],
             ["Retroalimentación", "Uso real, tickets de soporte, encuestas", "Analizar y proponer mejoras",
              "Nuevos requisitos"]],
            "Elaboración propia.", [3.4, 4.2, 4.4, 4])
    a.h2("Metodología de trabajo: Scrum")
    a.p("El desarrollo se organiza con Scrum en sprints de dos semanas. El gerente cumple el rol de dueño "
        "del producto, porque es quien conversa con los clientes y conoce el mercado; el desarrollador "
        "principal actúa como *scrum master*; y el equipo de desarrollo lo integran los programadores. Cada "
        "revisión de sprint se abre al área comercial para que conozca las novedades que puede anunciar.")
    a.tabla("Eventos de Scrum aplicados en Ichilo Soft",
            ["Evento", "Frecuencia y duración", "Participantes", "Relación con marketing"],
            [["Planificación del sprint", "Cada dos semanas, 2 horas", "Todo el equipo",
              "Ventas presenta los pedidos de clientes"],
             ["Reunión diaria", "Diaria, 15 minutos", "Desarrollo y soporte", "Se informan urgencias de clientes"],
             ["Revisión del sprint", "Cada dos semanas, 1 hora", "Equipo y área comercial",
              "Se definen novedades para comunicar"],
             ["Retrospectiva", "Cada dos semanas, 45 minutos", "Todo el equipo", "Mejora de la coordinación"]],
            "Elaboración propia con base en Schwaber y Sutherland (2020).", [3.4, 3.8, 3.6, 5.2])
    a.h2("Hoja de ruta del producto")
    a.p("La hoja de ruta comunica qué funciones llegarán y cuándo. Es una herramienta tanto de producción "
        "como de marketing: el equipo técnico la usa para planificar, y el área comercial la usa para "
        "responder a la objeción «le falta tal función» con una fecha comprometida.")
    a.tabla("Hoja de ruta de versiones de SIGAD",
            ["Versión", "Fecha", "Funciones principales"],
            [["4.0 Comercial", "Marzo 2027", "Configuración multiinstitución, personalización de logo y formatos, "
              "planes de suscripción"],
             ["4.1", "Junio 2027", "Importación masiva desde Excel, reportes avanzados, registro de auditoría"],
             ["4.2", "Septiembre 2027", "Derivación de documentos entre unidades y hoja de ruta del trámite"],
             ["5.0", "Marzo 2028", "Firma digital, aplicación móvil para consultas y notificaciones"],
             ["5.1", "Septiembre 2028", "Búsqueda dentro del contenido de los archivos y asistente con IA"]],
            "Elaboración propia.", [3, 3, 10])
    a.h2("Capacidad de producción")
    a.ps(
        "En una empresa de software la capacidad no se mide en unidades fabricadas, sino en horas de trabajo "
        "disponibles. La implantación de un plan Básico requiere en promedio 32 horas de trabajo técnico "
        "(configuración, migración de datos y dos sesiones de capacitación), un plan Profesional requiere 70 "
        "horas y un plan Institucional, 180 horas.",
        "Un técnico dedica unas 120 horas al mes a implantaciones, después de descontar el soporte y otras "
        "tareas. Con esa capacidad puede atender hasta tres implantaciones Básicas por mes. Durante el año 1, "
        "con 16 clientes previstos, la carga se concentra en los meses de marzo a mayo y de agosto a "
        "octubre, que coinciden con el inicio de los semestres. La siguiente tabla verifica que la capacidad "
        "es suficiente.",
    )
    horas = {"Básico": 32, "Profesional": 70, "Institucional": 180}
    filas = []
    for anio in (1, 2, 3):
        req = sum(D.NUEVOS[anio][k] * h for k, h in horas.items())
        tecnicos = 1 if anio == 1 else 2 if anio == 2 else 3
        disp = tecnicos * 120 * 12 * 0.5
        filas.append([f"Año {anio}", D.fmt(req), tecnicos, D.fmt(disp), f"{req / disp * 100:.0f} %"])
    a.tabla("Capacidad de implantación requerida y disponible",
            ["Periodo", "Horas requeridas", "Personas que implantan", "Horas disponibles", "Utilización"],
            filas,
            "Se considera que cada persona dedica la mitad de su tiempo a implantaciones. En el año 1 implanta el "
            "desarrollador; desde el año 2 se suma el técnico de soporte y en el año 3 el segundo desarrollador "
            "apoya. Elaboración propia.", [2.4, 3.2, 3.6, 3.4, 3.4])
    a.p("La utilización por debajo del 85 % deja un margen para imprevistos y para atender picos. Si las "
        "ventas superan lo previsto, la regla es contratar un técnico adicional cuando la utilización "
        "proyectada del trimestre supere el 85 %, y no aceptar plazos de implantación que el equipo no pueda "
        "cumplir. Esta regla es el principal punto de coordinación entre ventas y producción.")
    a.h2("Costos de producción")
    a.p("Los costos de producción del software se dividen en costos fijos, que no dependen del número de "
        "clientes, y costos variables, que aumentan con cada nuevo cliente. La siguiente tabla muestra los "
        "costos mensuales fijos del primer año.")
    p1 = D.proyeccion()[0]
    filas = [[c, D.bs(s * (1 + D.CARGAS_SOCIALES))] for c, s, y in D.PERSONAL if y == 1]
    filas += [[c, D.bs(v)] for c, v in D.OTROS_FIJOS_MES]
    filas.append(["**Total costos fijos de producción y operación**",
                  f"**{D.bs(p1['personal'] / 12 + p1['otros'] / 12)}**"])
    a.tabla("Costos fijos mensuales del año 1",
            ["Concepto", "Costo mensual"], filas,
            "Los sueldos incluyen aportes patronales. Elaboración propia.", [11, 5])
    a.tabla("Costos variables por cliente nuevo",
            ["Concepto", "Básico", "Profesional", "Institucional"],
            [["Horas de implantación (Bs 45 por hora)", D.bs(32 * 45), D.bs(70 * 45), D.bs(180 * 45)],
             ["Viáticos y transporte", D.bs(300), D.bs(500), D.bs(1200)],
             ["Comisión de venta (10 % de la implantación)", D.bs(400), D.bs(850), D.bs(2200)],
             ["Almacenamiento en la nube (mensual)", D.bs(25), D.bs(80), D.bs(260)]],
            "Elaboración propia.", [7, 3, 3, 3])
    a.h2("Control de calidad")
    a.p("La calidad se controla con base en las características de la norma ISO/IEC 25010 (ISO, 2011). Cada "
        "versión debe superar los criterios de aceptación de la siguiente tabla antes de publicarse. Si una "
        "versión no los supera, no se publica, aunque el área comercial la haya anunciado; en ese caso se "
        "comunica una nueva fecha. Esta disciplina protege la reputación de la marca.")
    a.tabla("Criterios de calidad de SIGAD según ISO/IEC 25010",
            ["Característica", "Criterio de aceptación", "Forma de verificación"],
            [["Adecuación funcional", "100 % de casos de prueba críticos aprobados", "Pruebas de aceptación"],
             ["Eficiencia de desempeño", "Búsquedas en menos de 2 segundos con 50 000 documentos", "Pruebas de carga"],
             ["Compatibilidad", "Funciona en Chrome, Edge y Firefox actuales", "Pruebas en navegadores"],
             ["Usabilidad", "Un usuario nuevo registra un documento en menos de 3 minutos", "Prueba con usuarios"],
             ["Fiabilidad", "Disponibilidad mensual igual o mayor a 99,5 %", "Monitoreo del servidor"],
             ["Seguridad", "Sin vulnerabilidades críticas; contraseñas cifradas", "Revisión de seguridad"],
             ["Mantenibilidad", "Código revisado por un segundo desarrollador", "Revisión de código"],
             ["Portabilidad", "Instalación en servidor propio en menos de 4 horas", "Prueba de instalación"]],
            "Elaboración propia con base en ISO (2011).", [3.8, 7, 5.2])
    a.h2("Cadena de valor")
    a.p("La cadena de valor muestra que, en SIGAD, la ventaja competitiva no está solo en el desarrollo. Está "
        "sobre todo en la implantación rápida, en el marketing especializado en el sector académico y en el "
        "servicio postventa cercano, que son actividades difíciles de imitar por un proveedor extranjero.")
    a.figura("Cadena de valor de Ichilo Soft", "graficos/g17_cadena_valor.png",
             "Elaboración propia con base en Porter (2015).", 6.3)
    a.h2("Soporte y acuerdos de nivel de servicio")
    a.p("El acuerdo de nivel de servicio (SLA) define los tiempos de respuesta que la empresa se compromete "
        "a cumplir. Es una promesa de marketing que producción debe respaldar con personal de soporte.")
    a.tabla("Acuerdo de nivel de servicio por prioridad de incidente",
            ["Prioridad", "Ejemplo", "Tiempo de respuesta", "Tiempo de solución"],
            [["Crítica", "El sistema no está disponible", "1 hora", "4 horas"],
             ["Alta", "Un módulo no funciona", "4 horas", "1 día hábil"],
             ["Media", "Error que tiene una alternativa", "1 día hábil", "5 días hábiles"],
             ["Baja", "Consulta o sugerencia", "2 días hábiles", "Siguiente versión"]],
            "Horario de atención: lunes a viernes de 8:00 a 18:00 y sábados de 8:00 a 12:00. Elaboración propia.",
            [2.6, 5.4, 3.8, 4.2])


def estrategia(a):
    a.h1("Estrategia de marketing")
    a.h2("Objetivos de marketing")
    a.p("Los objetivos se redactan con el criterio SMART: específicos, medibles, alcanzables, relevantes y "
        "con un plazo definido.")
    P = D.proyeccion()
    a.tabla("Objetivos SMART de marketing para el año 1",
            ["N.º", "Objetivo", "Indicador", "Meta"],
            [["1", "Captar clientes en el departamento de Santa Cruz", "Contratos firmados", f"{P[0]['nuevos']} al 31/12/2027"],
             ["2", "Generar prospectos calificados", "Prospectos que cumplen BANT", "160 en el año"],
             ["3", "Posicionar la marca en el sector académico", "Seguidores en Facebook y LinkedIn", "3 000 en el año"],
             ["4", "Convertir demostraciones en ventas", "Contratos / demostraciones", "20 % o más"],
             ["5", "Fidelizar a los clientes", "Tasa de renovación", "92 % o más"],
             ["6", "Lograr clientes satisfechos que recomienden", "NPS", "+40 o más"],
             ["7", "Alcanzar ingresos del primer año", "Ventas facturadas", D.bs(P[0]["ingresos"])]],
            "Elaboración propia.", [1.2, 6.2, 4.6, 4])
    a.h2("Segmentación del mercado")
    a.tabla("Segmentación del mercado de SIGAD",
            ["Variable", "Segmento elegido"],
            [["Geográfica", "Santa Cruz (año 1); Cochabamba, La Paz y Chuquisaca (años 2 y 3)"],
             ["Tipo de institución", "Universidades públicas, universidades privadas, institutos técnicos superiores"],
             ["Unidad compradora", "Dirección de carrera, decanato, dirección de posgrado, rectorado"],
             ["Tamaño", "Unidades con más de 300 documentos por año"],
             ["Tecnología", "Con computadora e internet; sin sistema documental especializado"],
             ["Comportamiento", "Interés en acreditación, modernización o cambio reciente de autoridades"]],
            "Elaboración propia con base en Kotler y Keller (2016).", [4, 12])
    a.h3("Mercado meta y prioridad de segmentos")
    a.tabla("Evaluación y prioridad de los segmentos",
            ["Segmento", "Tamaño", "Necesidad", "Facilidad de venta", "Prioridad"],
            [["Direcciones de carrera de universidades públicas", "Alto", "Alta", "Media", "1"],
             ["Universidades privadas (facultades)", "Medio", "Alta", "Alta", "1"],
             ["Institutos técnicos superiores", "Alto", "Media", "Alta", "2"],
             ["Escuelas de posgrado", "Bajo", "Alta", "Alta", "2"],
             ["Unidades educativas privadas grandes", "Medio", "Media", "Media", "3"]],
            "Elaboración propia.", [6, 2.2, 2.4, 3, 2.4])
    a.h2("Perfiles de comprador (buyer personas)")
    a.p("Los perfiles de comprador representan a los clientes ideales con nombre, edad y motivaciones. Son "
        "personajes ficticios, construidos con base en la investigación, que ayudan a redactar mensajes "
        "dirigidos a personas reales.")
    for nombre, filas in [
        ("Lic. Carla, la secretaria de dirección", [
            ["Edad y cargo", "38 años, secretaria de la dirección de carrera desde hace 10 años"],
            ["Rol en la compra", "Iniciadora y usuaria principal"],
            ["Problemas", "Busca notas en cuadernos, recibe presión cuando un documento no aparece"],
            ["Objetivos", "Trabajar con orden y sin estrés; ser reconocida por su eficiencia"],
            ["Objeciones", "«No sé si podré aprender un sistema nuevo»"],
            ["Mensaje clave", "«Encuentra cualquier nota en segundos. Te enseñamos paso a paso.»"],
            ["Canal", "WhatsApp, Facebook, recomendación de colegas"]]),
        ("Ing. Roberto, el director de carrera", [
            ["Edad y cargo", "47 años, director de carrera elegido por un periodo de tres años"],
            ["Rol en la compra", "Decisor"],
            ["Problemas", "Falta de información para acreditación; demoras en certificaciones"],
            ["Objetivos", "Dejar una gestión moderna y bien evaluada"],
            ["Objeciones", "«No tengo presupuesto este año» y «el próximo director lo abandonará»"],
            ["Mensaje clave", "«Moderniza tu carrera en dos semanas y deja un legado ordenado.»"],
            ["Canal", "Visita presencial, LinkedIn, eventos académicos"]]),
        ("Ing. Marcelo, el jefe de sistemas", [
            ["Edad y cargo", "35 años, responsable de tecnologías de información de la facultad"],
            ["Rol en la compra", "Influenciador técnico con poder de veto"],
            ["Problemas", "Muchos sistemas que mantener y poco personal"],
            ["Objetivos", "Soluciones seguras que no le generen trabajo adicional"],
            ["Objeciones", "«¿Dónde están los datos? ¿Es seguro? ¿Qué pasa si la empresa desaparece?»"],
            ["Mensaje clave", "«Tecnología libre, datos exportables, respaldos diarios y nosotros nos encargamos.»"],
            ["Canal", "Documentación técnica, demostración técnica, correo electrónico"]]),
    ]:
        a.tabla(f"Perfil de comprador: {nombre}", ["Atributo", "Descripción"], filas,
                "Perfil ficticio elaborado con base en la investigación de mercado.", [4, 12])
    a.h2("Posicionamiento")
    a.p("La declaración de posicionamiento de SIGAD es la siguiente:")
    a.p("*Para las direcciones de carrera y unidades académicas de Bolivia que pierden tiempo buscando "
        "documentos y elaborando certificaciones a mano, SIGAD es el sistema de gestión documental académica "
        "que ordena toda su documentación en un solo lugar seguro y permite encontrar cualquier documento en "
        "segundos. A diferencia de las carpetas compartidas y de los gestores documentales genéricos, SIGAD "
        "está diseñado específicamente para los procesos universitarios, se implanta en dos semanas y "
        "cuenta con soporte local en bolivianos.*")
    a.h2("Identidad de marca")
    a.p("La marca utiliza el nombre del producto, que ya es conocido por sus usuarios iniciales, acompañado "
        "de un eslogan que resume el beneficio. El isotipo representa documentos apilados con una marca de "
        "verificación, que transmite orden y control.")
    a.figura("Propuesta de logotipo y eslogan de SIGAD", "graficos/g20_logo.png", "Elaboración propia.", 5.4)
    a.tabla("Elementos de la identidad de marca",
            ["Elemento", "Definición", "Significado"],
            [["Nombre", "SIGAD", "Corto, pronunciable y descriptivo"],
             ["Eslogan", "Tus documentos en orden, tu carrera en control", "Beneficio emocional y funcional"],
             ["Color principal", "Azul institucional (#1F4E79)", "Confianza, seriedad, tecnología"],
             ["Color secundario", "Verde (#2E8B57)", "Orden, tarea cumplida, crecimiento"],
             ["Tipografía", "Sans serif moderna para títulos; serif para documentos", "Modernidad y formalidad"],
             ["Tono de comunicación", "Cercano, claro, sin tecnicismos", "Dirigido a personas no técnicas"]],
            "Elaboración propia.", [3.6, 6.4, 6])

    a.h2("Mezcla de marketing (7P)")
    a.figura("Mezcla de marketing de servicios aplicada a SIGAD", "graficos/g23_7p.png",
             "Elaboración propia con base en Lovelock y Wirtz (2015).", 4.8)
    a.h3("Producto")
    a.ps(
        "El producto se ofrece en tres planes que comparten el mismo núcleo funcional y se diferencian por "
        "la cantidad de unidades, usuarios y almacenamiento. Todos incluyen la migración inicial de datos, "
        "la capacitación, las actualizaciones y el soporte, porque la investigación mostró que el temor a "
        "no saber usar el sistema es una barrera importante.",
        "Como garantía, se ofrece una **prueba gratuita de 30 días** con datos de demostración y una "
        "**garantía de satisfacción**: si en los primeros 30 días de uso real el cliente no está conforme, se "
        "le devuelve el pago de la suscripción. Esta garantía reduce el riesgo percibido y acelera la "
        "decisión.",
    )
    a.h3("Precio")
    a.p("El precio combina tres criterios: cubre los costos y el margen esperado, se ubica dentro de la "
        "disposición de pago detectada y es significativamente menor que las alternativas de desarrollo a "
        "medida o de software extranjero. Se adopta un modelo de dos componentes: un pago único de "
        "implantación y una suscripción mensual o anual.")
    a.tabla("Planes y precios de SIGAD",
            ["Plan", "Alcance", "Implantación", "Mensual", "Anual (10 % desc.)"],
            [[p["nombre"], p["alcance"], D.bs(p["impl"]), D.bs(p["mes"]), D.bs(p["anual"])] for p in D.PLANES]
            + [["Licencia en servidor propio", "Instalación en servidores del cliente", D.bs(30000),
                "—", "18 % anual de mantenimiento"]],
            "Precios en bolivianos, con factura. Elaboración propia.", [2.8, 5.6, 2.6, 2.2, 2.8])
    a.tabla("Políticas de descuentos y condiciones de pago",
            ["Política", "Condición", "Beneficio"],
            [["Pago anual", "Pago adelantado de 12 meses", "10 % de descuento"],
             ["Clientes fundadores", "Primeros 5 clientes del año 1", "50 % en la implantación y testimonio público"],
             ["Varias carreras", "Desde 3 unidades de la misma institución", "Se aplica el plan Profesional"],
             ["Referido", "Cliente que recomienda a otro que contrata", "1 mes gratis por cada referido"],
             ["Instituciones públicas", "Pago contra factura según la normativa", "Contrato anual con plazo de pago a 30 días"],
             ["Pago de implantación", "En dos cuotas", "50 % a la firma y 50 % a la puesta en marcha"]],
            "Elaboración propia.", [3.6, 6, 6.4])
    a.p("El precio del plan Básico, de Bs 590 al mes, equivale aproximadamente a Bs 20 por día. Este "
        "argumento facilita la comparación con el costo de una hora de trabajo de la secretaria perdida en "
        "buscar documentos, y se utiliza en la propuesta comercial.")
    a.h3("Plaza (distribución)")
    a.ps(
        "Al ser un servicio en la nube, la distribución física no existe: el cliente accede desde su "
        "navegador. Sin embargo, la plaza incluye los canales por los cuales el cliente conoce, compra y "
        "recibe el servicio.",
    )
    a.tabla("Canales de distribución y venta",
            ["Canal", "Tipo", "Función"],
            [["Venta directa (visitas y reuniones)", "Directo", "Canal principal para cerrar contratos"],
             ["Sitio web sigad.com.bo", "Directo digital", "Información, solicitud de demostración, prueba gratuita"],
             ["WhatsApp Business", "Directo digital", "Atención rápida, seguimiento y soporte"],
             ["Aliados: consultores y docentes", "Indirecto", "Recomiendan SIGAD a cambio de una comisión del 10 %"],
             ["Asociaciones de carreras y congresos", "Indirecto", "Acceso a muchas autoridades a la vez"],
             ["Plataforma de contrataciones estatales", "Directo institucional", "Participación en convocatorias públicas"]],
            "Elaboración propia.", [5.4, 3.4, 7.2])
    a.h3("Promoción")
    a.p("La promoción combina las herramientas de la mezcla promocional, con un peso mayor en la venta "
        "personal y el marketing digital, de acuerdo con la investigación de mercado.")
    a.tabla("Mezcla promocional de SIGAD",
            ["Herramienta", "Acciones", "Etapa del embudo"],
            [["Publicidad", "Anuncios en Facebook, Instagram, Google y LinkedIn segmentados por cargo", "Atención"],
             ["Marketing de contenidos", "Blog, guías descargables, videos cortos, plantillas gratuitas", "Interés"],
             ["Relaciones públicas", "Notas de prensa sobre clientes, participación en congresos", "Atención y confianza"],
             ["Promoción de ventas", "Prueba gratuita, precio de fundador, mes gratis por referido", "Deseo y acción"],
             ["Venta personal", "Reuniones de diagnóstico, demostraciones, negociación", "Deseo y acción"],
             ["Marketing directo", "Correos personalizados, WhatsApp, cartas a autoridades", "Interés y acción"],
             ["Eventos", "Webinars mensuales, talleres de organización de archivos, ferias", "Interés y deseo"]],
            "Elaboración propia.", [3.6, 8.4, 4])
    a.h3("Personas")
    a.p("En un servicio, las personas son parte del producto. El vendedor debe conocer el funcionamiento de "
        "una dirección de carrera y hablar el lenguaje del cliente; el técnico de implantación debe tener "
        "paciencia pedagógica; y el soporte debe responder con amabilidad. Por ello, todo el personal recibe "
        "una inducción de una semana sobre el producto, el sector universitario y el protocolo de atención, "
        "y se evalúa con la satisfacción del cliente.")
    a.h3("Procesos")
    a.p("Los procesos garantizan que el servicio sea igual de bueno para todos los clientes. Los procesos "
        "principales son el procedimiento de venta, el procedimiento de implantación y el procedimiento de "
        "soporte, que se describen en el siguiente capítulo. Cada proceso tiene responsables, plazos, "
        "registros e indicadores.")
    a.h3("Evidencia física")
    a.p("La evidencia física hace tangible un servicio intangible. En SIGAD se compone de la interfaz del "
        "sistema, el sitio web, el manual de usuario, la ficha técnica, los certificados de capacitación "
        "entregados a los usuarios, la propuesta comercial impresa con diseño profesional y los "
        "documentos que el propio sistema genera con el logo de la institución.")

    a.h2("Plan de marketing digital")
    a.h3("Sitio web")
    a.p("El sitio web es el centro de la estrategia digital. Debe cargar rápido, verse bien en el celular y "
        "tener un objetivo claro: que el visitante solicite una demostración o una prueba gratuita.")
    a.tabla("Estructura del sitio web de SIGAD",
            ["Sección", "Contenido", "Llamada a la acción"],
            [["Inicio", "Beneficio principal, video de 60 segundos, logos de clientes", "Solicitar demostración"],
             ["Funciones", "Módulos con capturas y explicaciones simples", "Probar gratis 30 días"],
             ["Precios", "Planes, comparativa y preguntas frecuentes", "Cotizar mi plan"],
             ["Casos de éxito", "Testimonios con resultados medibles", "Hablar con un asesor"],
             ["Recursos", "Blog, guías y plantillas descargables", "Descargar a cambio del correo"],
             ["Contacto", "Formulario, WhatsApp, dirección y mapa", "Escribir por WhatsApp"]],
            "Elaboración propia.", [3, 8, 5])
    a.h3("Posicionamiento en buscadores (SEO)")
    a.tabla("Palabras clave objetivo para el posicionamiento en buscadores",
            ["Palabra clave", "Intención", "Contenido asociado"],
            [["sistema de gestión documental Bolivia", "Comercial", "Página de inicio"],
             ["software para dirección de carrera", "Comercial", "Página de funciones"],
             ["cómo organizar el archivo de una oficina", "Informativa", "Guía descargable"],
             ["modelo de constancia universitaria", "Informativa", "Plantilla gratuita"],
             ["control de correspondencia Excel", "Informativa", "Artículo con plantilla y comparación con SIGAD"],
             ["requisitos de acreditación carrera", "Informativa", "Artículo sobre expedientes docentes"]],
            "Elaboración propia.", [6, 3, 7])
    a.h3("Redes sociales")
    a.tabla("Uso de cada red social",
            ["Red", "Público", "Tipo de contenido", "Frecuencia"],
            [["Facebook", "Secretarias, directores, personal administrativo", "Consejos, videos, testimonios, anuncios",
              "4 publicaciones por semana"],
             ["Instagram", "Personal joven y estudiantes", "Carruseles, historias, reels", "3 por semana"],
             ["TikTok", "Público general y estudiantes", "Videos cortos «antes y después»", "2 por semana"],
             ["LinkedIn", "Autoridades y jefes de sistemas", "Artículos, logros, casos de éxito", "2 por semana"],
             ["WhatsApp Business", "Prospectos y clientes", "Catálogo, respuestas rápidas, estados", "Diario"],
             ["YouTube", "Usuarios y prospectos", "Tutoriales y webinars grabados", "2 por mes"]],
            "Elaboración propia.", [2.8, 4.6, 5, 3.6])
    a.h3("Calendario de contenidos")
    a.p("El contenido se planifica por temas mensuales relacionados con el calendario académico. El "
        "calendario anual completo se presenta en el Anexo H; la siguiente tabla muestra un mes tipo.")
    a.tabla("Calendario de contenidos de un mes tipo (marzo)",
            ["Semana", "Tema", "Publicaciones"],
            [["1", "Inicio de semestre sin caos", "Video «Cómo recibir 100 notas sin perder ninguna»; carrusel de consejos"],
             ["2", "Certificaciones rápidas", "Tutorial de constancias; testimonio de secretaria"],
             ["3", "Seguridad de la información", "Infografía sobre respaldos; artículo para jefes de sistemas"],
             ["4", "Webinar mensual", "Invitación, recordatorios, transmisión y resumen"]],
            "Elaboración propia.", [2, 5, 9])
    a.h3("Correo electrónico y nutrición de prospectos")
    a.p("Los prospectos que todavía no están listos para comprar reciben una secuencia automática de "
        "correos que les aporta valor y los acerca a la decisión.")
    a.tabla("Secuencia de correos de nutrición de prospectos",
            ["Día", "Asunto", "Objetivo"],
            [["0", "Aquí está tu guía para organizar el archivo", "Entregar el recurso prometido"],
             ["3", "¿Cuánto tiempo pierde tu oficina buscando documentos?", "Hacer consciente el problema"],
             ["7", "Así trabaja la carrera de Ingeniería en Sistemas con SIGAD", "Caso de éxito"],
             ["12", "Las 5 preguntas que debes hacer antes de elegir un sistema", "Educar al comprador"],
             ["18", "Te invitamos al webinar de este mes", "Generar interacción"],
             ["25", "Prueba SIGAD 30 días sin costo", "Invitar a la acción"],
             ["35", "¿Te ayudamos a presentar el proyecto a tu consejo?", "Ofrecer apoyo para la aprobación"]],
            "Elaboración propia con base en Halligan y Shah (2010).", [1.6, 8.4, 6])
    a.h3("Publicidad digital pagada")
    a.p("La publicidad pagada se concentra en dos momentos del año: febrero a abril y julio a septiembre, "
        "que coinciden con la planificación de los semestres y la elaboración de presupuestos. Se segmenta "
        "por ubicación (Santa Cruz y luego otros departamentos), por intereses (educación superior, "
        "administración) y, en LinkedIn, por cargo (director, decano, jefe de sistemas).")
    a.h2("Marketing tradicional y relacional")
    a.lista([
        "**Visitas presenciales** con material impreso y demostración en una laptop o tableta.",
        "**Participación en ferias y congresos** universitarios y de tecnología, con un módulo de "
        "demostración y un sorteo de un año de suscripción.",
        "**Cartas institucionales** dirigidas a decanos y directores, con una invitación a una demostración.",
        "**Alianzas** con asociaciones de carreras de sistemas y con docentes que actúan como embajadores.",
        "**Talleres gratuitos** de organización de archivos para secretarias, que posicionan a la marca "
        "como experta.",
    ])
