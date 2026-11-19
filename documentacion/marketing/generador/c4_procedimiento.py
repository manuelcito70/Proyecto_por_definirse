# -*- coding: utf-8 -*-
"""Procedimiento de venta del software (núcleo del documento)."""
import datos as D


def etapa(a, titulo, intro, actividades, registros, tiempo, extra=None):
    a.h3(titulo)
    for t in ([intro] if isinstance(intro, str) else intro):
        a.p(t)
    a.tabla(f"Actividades de la etapa: {titulo.split('. ', 1)[1].lower()}",
            ["N.º", "Actividad", "Responsable"],
            [[str(i), act, resp] for i, (act, resp) in enumerate(actividades, 1)],
            f"Registros: {registros}. Tiempo estimado: {tiempo}.", [1.2, 10.8, 4])
    if extra:
        extra(a)


def procedimiento(a):
    a.h1("Procedimiento de marketing y venta del software SIGAD")
    a.p("Este capítulo constituye el núcleo del trabajo. Presenta, en formato de procedimiento "
        "institucional, la secuencia ordenada de actividades que sigue la empresa para vender SIGAD: desde "
        "que identifica a un posible cliente hasta que ese cliente usa el sistema, está satisfecho y renueva "
        "su contrato. Responde a la pregunta del examen: cómo se hará la venta del software y cómo el "
        "marketing hará que el cliente lo compre.")
    a.h2("Información general del procedimiento")
    a.tabla("Datos de control del procedimiento",
            ["Campo", "Contenido"],
            [["Código", "PRO-MKT-001"],
             ["Nombre", "Procedimiento de marketing y venta del software SIGAD"],
             ["Versión", "1.0"],
             ["Elaborado por", "Victor Daniel Guayao Medina"],
             ["Aprobado por", "Gerencia general de Ichilo Soft S.R.L."],
             ["Fecha de vigencia", "1 de enero de 2027"],
             ["Revisión", "Semestral o cuando cambie el producto o el mercado"]],
            "Elaboración propia.", [4.5, 11.5])
    a.h3("Objetivo del procedimiento")
    a.p("Establecer las actividades, responsables, registros y tiempos para atraer, convertir, cerrar, "
        "implantar y fidelizar clientes de SIGAD, de manera que todas las ventas se realicen con la misma "
        "calidad y que cada compromiso comercial pueda ser cumplido por el área de producción.")
    a.h3("Alcance del procedimiento")
    a.p("Se aplica a todas las ventas de SIGAD en sus planes Básico, Profesional, Institucional y licencia "
        "en servidor propio, realizadas por el personal de la empresa o por aliados comerciales. Comienza con "
        "la investigación del mercado y termina con la renovación del contrato.")
    a.h3("Responsables")
    a.tabla("Matriz de responsabilidades (RACI) del procedimiento",
            ["Etapa", "Gerente", "Ventas", "Marketing", "Implantación", "Desarrollo"],
            [["1. Investigación y segmentación", "A", "C", "R", "I", "I"],
             ["2. Generación de prospectos", "I", "C", "R/A", "I", "—"],
             ["3. Registro y calificación", "I", "R/A", "C", "—", "—"],
             ["4. Contacto y diagnóstico", "C", "R/A", "I", "I", "—"],
             ["5. Demostración", "C", "R/A", "I", "C", "C"],
             ["6. Propuesta y cotización", "A", "R", "C", "C", "C"],
             ["7. Negociación y cierre", "R/A", "R", "I", "I", "I"],
             ["8. Implantación", "I", "C", "I", "R/A", "C"],
             ["9. Capacitación", "I", "I", "C", "R/A", "I"],
             ["10. Postventa y renovación", "A", "R", "C", "R", "C"]],
            "R = responsable de ejecutar, A = aprueba y rinde cuentas, C = consultado, I = informado. "
            "Elaboración propia.", [5, 2, 2, 2.4, 2.6, 2.4], size=10)
    a.h3("Definiciones")
    a.tabla("Definiciones utilizadas en el procedimiento",
            ["Término", "Definición"],
            [["Prospecto (lead)", "Persona o unidad que mostró interés y dejó sus datos de contacto"],
             ["Prospecto calificado", "Prospecto que cumple al menos tres de los cuatro criterios BANT"],
             ["Oportunidad", "Prospecto calificado con el que se agendó una demostración"],
             ["CRM", "Sistema donde se registran prospectos, interacciones y etapas de venta"],
             ["Demostración", "Presentación del sistema adaptada a los procesos del cliente"],
             ["Propuesta comercial", "Documento que describe la solución, el precio y las condiciones"],
             ["Implantación", "Configuración, migración de datos y puesta en marcha del sistema"],
             ["Cliente activo", "Institución con suscripción vigente"],
             ["Renovación", "Continuación de la suscripción por un nuevo periodo"],
             ["NPS", "Índice que mide la probabilidad de que el cliente recomiende SIGAD"]],
            "Elaboración propia.", [4.2, 11.8])
    a.h3("Documentos de referencia")
    a.lista([
        "Plan de marketing de SIGAD (este documento).",
        "Lista de precios y políticas de descuento vigentes.",
        "Modelo de propuesta comercial (Anexo C) y de cotización (Anexo D).",
        "Modelo de contrato de suscripción (Anexo E).",
        "Guion de demostración (Anexo B).",
        "Formato de registro de prospectos (Anexo I).",
        "Acuerdo de nivel de servicio (capítulo de producción).",
    ])

    a.h2("Flujograma del procedimiento")
    a.p("El siguiente flujograma muestra las diez etapas del procedimiento y los dos puntos de decisión. Si "
        "un prospecto no cumple los criterios BANT, no se descarta, sino que vuelve a la etapa de nutrición "
        "con contenidos hasta que madure. Si un cliente no acepta la propuesta, se analiza el motivo y se "
        "ajusta la solución o se repite una demostración enfocada en la objeción.")
    a.figura("Flujograma del procedimiento de marketing y venta de SIGAD", "graficos/g02_flujograma.png",
             "Elaboración propia.", 5.0)
    a.h2("Embudo de ventas del primer año")
    a.p("El embudo traduce la meta de ventas en metas para cada etapa. Para lograr 16 contratos en el año "
        "se necesitan alrededor de 40 propuestas, 80 demostraciones, 160 prospectos calificados, 480 "
        "prospectos registrados y unas 12 000 visitas al sitio web y a las redes. Estas cifras se "
        "convierten en metas mensuales para el equipo.")
    a.figura("Embudo de ventas proyectado para el año 1", "graficos/g01_embudo.png",
             "Las tasas de conversión se basan en referencias de la industria de software para empresas y "
             "deben ajustarse con los datos reales. Elaboración propia.", 5.8)
    a.tabla("Metas mensuales del embudo de ventas",
            ["Etapa", "Meta anual", "Meta mensual", "Conversión esperada"],
            [[e, D.fmt(v), D.fmt(v / 12, 0 if v >= 120 else 1), "—" if i == 0 else
              f"{v / D.EMBUDO[i - 1][1] * 100:.0f} %"] for i, (e, v) in enumerate(D.EMBUDO)],
            "Elaboración propia.", [6.4, 3, 3, 3.6])

    a.h2("Descripción detallada de las etapas")

    etapa(a, "Etapa 1. Investigación y segmentación del mercado",
          ["El procedimiento comienza conociendo a quién se le venderá. Marketing elabora y actualiza una base "
           "de datos de las unidades académicas del departamento: nombre de la institución, carrera, "
           "autoridades, correo, teléfono, número aproximado de estudiantes y si usa algún sistema.",
           "Con esa base se asigna a cada unidad un segmento y una prioridad, y se planifican las campañas "
           "del trimestre. La información se obtiene de los sitios web institucionales, las redes sociales "
           "oficiales, las guías universitarias y la encuesta del Anexo A."],
          [("Recopilar datos públicos de universidades, carreras e institutos", "Marketing"),
           ("Aplicar la encuesta de investigación de mercado", "Marketing"),
           ("Clasificar cada unidad por segmento y prioridad", "Marketing"),
           ("Identificar autoridades y fechas de cambio de gestión", "Ventas"),
           ("Aprobar la lista de cuentas objetivo del trimestre", "Gerente")],
          "base de datos de cuentas objetivo, informe de encuesta", "permanente, con revisión trimestral")

    etapa(a, "Etapa 2. Generación de prospectos",
          ["En esta etapa el marketing *hace que el cliente llegue*. Se combinan acciones digitales "
           "(contenidos, publicidad, webinars) y presenciales (ferias, talleres, cartas). Cada acción debe "
           "tener un mecanismo de captura de datos: un formulario, un mensaje de WhatsApp o un registro en "
           "un evento.",
           "La regla principal es ofrecer algo de valor a cambio de los datos: una guía, una plantilla, un "
           "taller o una prueba gratuita. Así, el prospecto llega con interés genuino y no por presión."],
          [("Publicar contenidos según el calendario editorial", "Marketing"),
           ("Ejecutar campañas pagadas segmentadas por zona y cargo", "Marketing"),
           ("Organizar el webinar mensual y el taller trimestral", "Marketing"),
           ("Participar en ferias y congresos con módulo de demostración", "Marketing y ventas"),
           ("Enviar cartas institucionales a las cuentas prioritarias", "Ventas"),
           ("Activar el programa de referidos con los clientes actuales", "Ventas")],
          "formularios web, listas de asistencia, conversaciones de WhatsApp", "permanente")

    def bant(a):
        a.p("Para calificar al prospecto se utiliza la siguiente tabla de puntuación. Un prospecto con 9 "
            "puntos o más pasa a la etapa de contacto; uno con menos puntos se incorpora a la secuencia de "
            "nutrición por correo y se vuelve a evaluar a los 60 días.")
        a.tabla("Tabla de puntuación BANT para calificar prospectos",
                ["Criterio", "Pregunta clave", "1 punto", "2 puntos", "3 puntos"],
                [["Presupuesto", "¿Tiene recursos para software este año?", "No sabe", "Puede gestionarlo",
                  "Tiene partida asignada"],
                 ["Autoridad", "¿Quién decide la compra?", "Usuario sin influencia", "Influenciador",
                  "Decisor o aprobador"],
                 ["Necesidad", "¿Qué tan grave es su problema documental?", "Leve", "Moderado", "Urgente"],
                 ["Tiempo", "¿Cuándo quiere resolverlo?", "Más de 6 meses", "De 2 a 6 meses", "Menos de 2 meses"]],
                "Puntaje mínimo para continuar: 9 de 12. Elaboración propia.", [2.6, 4.6, 2.8, 3, 3], size=10)

    etapa(a, "Etapa 3. Registro y calificación del prospecto",
          "Todo prospecto se registra en el CRM dentro de las 24 horas siguientes al primer contacto, con "
          "su origen (qué campaña lo trajo), sus datos y la etapa en que se encuentra. Luego el ejecutivo de "
          "ventas lo califica con el criterio BANT mediante una breve conversación telefónica o por WhatsApp.",
          [("Registrar al prospecto en el CRM con su origen", "Ventas"),
           ("Responder el primer mensaje en menos de 2 horas hábiles", "Ventas"),
           ("Realizar la llamada de calificación BANT", "Ventas"),
           ("Asignar el puntaje y la etapa en el CRM", "Ventas"),
           ("Enviar a nutrición a los prospectos no calificados", "Marketing")],
          "ficha del prospecto en el CRM (Anexo I)", "de 1 a 3 días", bant)

    def spin(a):
        a.p("La reunión de diagnóstico sigue el método SPIN (Rackham, 1988). El vendedor no presenta el "
            "producto todavía: escucha, pregunta y entiende. La siguiente tabla contiene las preguntas guía.")
        a.tabla("Preguntas guía para la reunión de diagnóstico (método SPIN)",
                ["Tipo", "Preguntas"],
                [["Situación", "¿Cuántos documentos reciben y emiten al mes? ¿Cómo los registran hoy? ¿Quién se "
                  "encarga del archivo?"],
                 ["Problema", "¿Cuánto tardan en encontrar una nota de hace dos años? ¿Han perdido documentos? "
                  "¿Cómo elaboran las constancias?"],
                 ["Implicación", "¿Qué pasa cuando un estudiante espera una certificación varios días? ¿Cómo "
                  "afecta esto a la acreditación? ¿Qué ocurre cuando cambia la secretaria?"],
                 ["Necesidad de beneficio", "Si pudieran encontrar cualquier documento en segundos, ¿cuánto tiempo "
                  "ahorrarían? ¿Qué significaría para la imagen de la carrera?"]],
                "Elaboración propia con base en Rackham (1988).", [3.6, 12.4])

    etapa(a, "Etapa 4. Primer contacto y reunión de diagnóstico",
          "Con el prospecto calificado se agenda una reunión de 30 a 45 minutos, de preferencia presencial "
          "con el decisor y la usuaria principal. El objetivo es entender cómo trabaja la unidad, qué "
          "problemas tiene y qué resultados espera, para luego mostrar una demostración a su medida.",
          [("Agendar la reunión por teléfono o WhatsApp y confirmar un día antes", "Ventas"),
           ("Investigar previamente a la unidad (redes, sitio web, autoridades)", "Ventas"),
           ("Conducir la reunión con las preguntas SPIN", "Ventas"),
           ("Identificar a todos los miembros del centro de compras", "Ventas"),
           ("Registrar hallazgos, problemas y procesos en el CRM", "Ventas"),
           ("Agendar la demostración al final de la reunión", "Ventas")],
          "acta de diagnóstico en el CRM", "de 3 a 7 días desde la calificación", spin)

    etapa(a, "Etapa 5. Demostración personalizada",
          ["La demostración es el momento en que el cliente *ve* el producto resolviendo *su* problema. No se "
           "muestran todas las funciones, sino las que responden a los problemas detectados en el diagnóstico. "
           "Se utiliza una instancia de demostración cargada con el nombre y el logo de la institución del "
           "cliente, lo que genera un fuerte impacto emocional.",
           "Al final se ofrece la prueba gratuita de 30 días y se identifica qué información necesita el "
           "decisor para presentar el proyecto a su consejo. El guion completo está en el Anexo B."],
          [("Preparar la instancia de demostración con el logo del cliente", "Implantación"),
           ("Presentar el sistema siguiendo el guion de demostración", "Ventas"),
           ("Permitir que la usuaria registre un documento por sí misma", "Ventas"),
           ("Responder preguntas técnicas con apoyo del desarrollador si es necesario", "Desarrollo"),
           ("Ofrecer la prueba gratuita y crear los usuarios de prueba", "Implantación"),
           ("Acordar la fecha para presentar la propuesta", "Ventas")],
          "registro de demostración, usuarios de prueba creados", "de 1 a 2 semanas")

    def objeciones(a):
        a.p("Durante la propuesta y la negociación aparecen objeciones. Una objeción no es un rechazo, sino "
            "una solicitud de más información. La siguiente tabla contiene las respuestas preparadas para las "
            "objeciones más frecuentes.")
        a.tabla("Manejo de objeciones frecuentes",
                ["Objeción", "Respuesta sugerida"],
                [["«Es muy caro»", "Comparemos: Bs 590 al mes son menos de Bs 20 al día. ¿Cuántas horas pierde "
                  "su oficina buscando documentos? Además, el desarrollo a medida cuesta más de Bs 40 000."],
                 ["«No tenemos presupuesto este año»", "Podemos iniciar con la prueba gratuita y preparar juntos "
                  "la justificación para el presupuesto del próximo periodo. También existe el pago en cuotas."],
                 ["«Ya usamos Excel y funciona»", "Excel registra, pero no avisa, no controla permisos ni genera "
                  "constancias. Le mostramos en 5 minutos la diferencia con sus propios datos."],
                 ["«Mi personal no sabrá usarlo»", "La capacitación está incluida y el sistema se diseñó para "
                  "personas no técnicas. En la demostración su secretaria registró un documento en 2 minutos."],
                 ["«¿Y si la empresa desaparece?»", "Sus datos son exportables en cualquier momento y el "
                  "contrato incluye la entrega del respaldo completo. También ofrecemos licencia en servidor propio."],
                 ["«Lo tenemos que consultar al consejo»", "Le preparamos una presentación y un resumen ejecutivo "
                  "para el consejo, y podemos acompañarle a la sesión."],
                 ["«La universidad va a desarrollar su propio sistema»", "Muchas lo intentan; mientras tanto, "
                  "SIGAD resuelve hoy el problema y sus datos podrán migrar al sistema futuro."]],
                "Elaboración propia.", [4.6, 11.4])

    etapa(a, "Etapa 6. Propuesta comercial y cotización",
          "La propuesta comercial se envía en un plazo máximo de tres días hábiles después de la "
          "demostración. Se redacta en función de los problemas del cliente, no de las funciones del "
          "producto, y contiene el diagnóstico, la solución, el plan de implantación, la inversión, las "
          "condiciones y los testimonios. Antes de enviarla, el área de implantación confirma que puede "
          "cumplir la fecha de inicio propuesta.",
          [("Seleccionar el plan adecuado según el tamaño de la unidad", "Ventas"),
           ("Confirmar con implantación la disponibilidad de fechas", "Implantación"),
           ("Redactar la propuesta con el modelo del Anexo C", "Ventas"),
           ("Aprobar descuentos superiores al 10 %", "Gerente"),
           ("Enviar la propuesta y la cotización (Anexo D) por correo y en físico", "Ventas"),
           ("Hacer seguimiento a los 3 y a los 7 días", "Ventas")],
          "propuesta comercial, cotización", "de 3 a 10 días", objeciones)

    etapa(a, "Etapa 7. Negociación y firma del contrato",
          ["La negociación busca un acuerdo en el que ambas partes ganen. Se prefiere conceder valor "
           "(capacitación adicional, migración de más años de archivo, un mes gratis) antes que bajar el "
           "precio, para proteger el margen y la percepción de calidad.",
           "Cuando el cliente es una institución pública, el ejecutivo de ventas apoya en la preparación de "
           "los términos de referencia y de la documentación que solicite la unidad de contrataciones. El "
           "contrato se firma con la institución, no con la autoridad de turno, para que sobreviva a los "
           "cambios de gestión."],
          [("Identificar el margen de negociación aprobado", "Gerente"),
           ("Negociar condiciones de pago, plazo y alcance", "Gerente y ventas"),
           ("Preparar el contrato según el modelo del Anexo E", "Gerente"),
           ("Apoyar el trámite de contratación pública si corresponde", "Ventas"),
           ("Firmar el contrato y emitir la factura de implantación", "Gerente"),
           ("Comunicar el cierre al equipo y transferir la cuenta a implantación", "Ventas")],
          "contrato firmado, factura, acta de transferencia", "de 1 a 4 semanas (sector público hasta 8)")

    def plan_impl(a):
        a.tabla("Cronograma tipo de implantación de un plan Básico",
                ["Día", "Actividad", "Responsable"],
                [["1", "Reunión de inicio: objetivos, responsables y calendario", "Implantación"],
                 ["2-3", "Creación de la instancia, configuración de logo, formatos y usuarios", "Implantación"],
                 ["4-7", "Migración de registros existentes desde Excel o cuadernos", "Implantación y cliente"],
                 ["8", "Capacitación 1: registro y búsqueda de documentos", "Implantación"],
                 ["9-11", "Uso asistido con acompañamiento por WhatsApp", "Implantación"],
                 ["12", "Capacitación 2: expedientes, constancias y reportes", "Implantación"],
                 ["14", "Acta de conformidad y puesta en marcha", "Implantación y cliente"]],
                "Elaboración propia.", [1.6, 10.4, 4])

    etapa(a, "Etapa 8. Implantación y migración de datos",
          "La implantación es el primer contacto del cliente con la promesa cumplida. El objetivo es que en "
          "un máximo de 14 días calendario la unidad esté trabajando con SIGAD. Se trabaja con un responsable "
          "designado por el cliente y se registra cada avance.",
          [("Realizar la reunión de inicio del proyecto", "Implantación"),
           ("Configurar la instancia con la identidad de la institución", "Implantación"),
           ("Recibir y depurar los datos que se migrarán", "Implantación"),
           ("Migrar los registros y verificar con el cliente", "Implantación"),
           ("Resolver ajustes técnicos solicitados", "Desarrollo"),
           ("Firmar el acta de conformidad", "Implantación")],
          "plan de implantación, acta de conformidad", "14 días (Básico), 30 días (Profesional), 60 días "
          "(Institucional)", plan_impl)

    etapa(a, "Etapa 9. Capacitación y puesta en marcha",
          "La capacitación es la mejor herramienta contra la resistencia al cambio. Se realiza en grupos "
          "pequeños, con los datos reales del cliente y con ejercicios prácticos. Cada participante recibe un "
          "manual de usuario y un certificado de capacitación, que funcionan como evidencia física del "
          "servicio.",
          [("Programar las sesiones según el horario del personal", "Implantación"),
           ("Dictar la capacitación por perfil de usuario", "Implantación"),
           ("Entregar el manual y los videotutoriales", "Implantación"),
           ("Aplicar una evaluación práctica corta", "Implantación"),
           ("Entregar certificados de capacitación", "Implantación"),
           ("Agregar a los usuarios al grupo de soporte por WhatsApp", "Implantación")],
          "lista de asistencia, evaluación, certificados", "de 2 a 3 sesiones de 2 horas")

    def fidel(a):
        a.tabla("Plan de fidelización y desarrollo de clientes",
                ["Momento", "Acción", "Objetivo"],
                [["Día 30", "Llamada de seguimiento y primera encuesta de satisfacción", "Detectar problemas a tiempo"],
                 ["Mes 3", "Informe de uso: documentos registrados, tiempos de búsqueda", "Mostrar el valor obtenido"],
                 ["Mes 6", "Encuesta NPS y solicitud de testimonio a los promotores", "Generar casos de éxito"],
                 ["Cada nueva versión", "Correo y video con las novedades", "Mantener el interés"],
                 ["Cambio de autoridad", "Visita de presentación a la nueva autoridad", "Proteger la cuenta"],
                 ["Mes 10", "Reunión de renovación y propuesta de ampliación", "Renovar y crecer"],
                 ["Permanente", "Programa de referidos: un mes gratis por cada referido", "Conseguir nuevos clientes"]],
                "Elaboración propia.", [3.2, 8, 4.8])
        a.figura("Meta del índice de recomendación neta (NPS) para el año 1", "graficos/g22_nps.png",
                 "Elaboración propia.", 5.8)

    etapa(a, "Etapa 10. Postventa, fidelización y renovación",
          ["En el modelo de suscripción, la venta no termina con la firma: comienza. Un cliente que no renueva "
           "representa la pérdida de todos los ingresos futuros y del costo invertido en conseguirlo. Por eso, "
           "la postventa tiene metas tan claras como las ventas nuevas.",
           "El objetivo es convertir a cada cliente en un promotor que recomiende SIGAD a otras carreras. En un "
           "sector donde las autoridades se conocen entre sí, la recomendación es el canal más poderoso, como "
           "mostró la investigación de mercado."],
          [("Atender las solicitudes de soporte según el SLA", "Implantación"),
           ("Realizar las llamadas y encuestas de seguimiento", "Ventas"),
           ("Enviar informes periódicos de uso", "Implantación"),
           ("Gestionar la renovación dos meses antes del vencimiento", "Ventas"),
           ("Ofrecer ampliaciones a otras unidades de la institución", "Ventas"),
           ("Solicitar testimonios y referidos a los promotores", "Marketing")],
          "tickets de soporte, encuestas NPS (Anexo J), contrato renovado", "durante toda la relación", fidel)

    a.h2("Cómo el marketing hace que el cliente compre")
    a.p("El procedimiento no se basa en presionar al cliente, sino en eliminar una a una las razones por las "
        "que no compraría. La siguiente tabla relaciona cada barrera de compra con la acción de marketing "
        "que la elimina.")
    a.tabla("Barreras de compra y acciones de marketing que las eliminan",
            ["Barrera del cliente", "Acción de marketing", "Resultado esperado"],
            [["No conoce SIGAD", "Publicidad segmentada, ferias, cartas, contenidos", "Conocimiento de la marca"],
             ["No sabe que tiene un problema", "Contenidos sobre el costo del desorden documental", "Conciencia del problema"],
             ["No confía en una empresa nueva", "Testimonios, casos de éxito, origen universitario", "Confianza"],
             ["No ve cómo funcionaría en su oficina", "Demostración con su logo y sus procesos", "Deseo"],
             ["Teme que su personal no aprenda", "Capacitación incluida y prueba gratuita", "Reducción del riesgo"],
             ["Cree que es caro", "Comparación de costos y precio por día", "Percepción de valor"],
             ["No puede decidir solo", "Material para el consejo y acompañamiento", "Aprobación institucional"],
             ["Teme quedar atrapado", "Datos exportables, garantía de 30 días", "Decisión de compra"],
             ["Podría no renovar", "Informes de uso, soporte cercano, novedades", "Fidelidad y recomendación"]],
            "Elaboración propia.", [4.6, 6.4, 5])
    a.h2("Guion de primer contacto telefónico")
    a.p("El siguiente guion se utiliza en la llamada de calificación. No se lee de forma mecánica, sino que "
        "sirve como guía para que todos los vendedores mantengan la misma calidad.")
    a.lista([
        "**Saludo:** «Buenos días, Lic. ___. Le habla ___ de Ichilo Soft, la empresa que desarrolló SIGAD en "
        "la Facultad Integral de Ichilo. ¿Tiene dos minutos?»",
        "**Motivo:** «Le llamo porque usted descargó nuestra guía para organizar el archivo y quería saber si "
        "le fue útil.»",
        "**Pregunta de situación:** «¿Cómo registran actualmente las notas que reciben?»",
        "**Pregunta de problema:** «¿Les ha pasado que una nota no aparece cuando la necesitan?»",
        "**Calificación:** «¿Quién decide normalmente sobre las herramientas que usa la dirección? ¿Tienen "
        "pensado mejorar esto este semestre?»",
        "**Propuesta de siguiente paso:** «Me gustaría mostrarle en 30 minutos cómo lo resolvió la carrera de "
        "Sistemas. ¿Le parece bien el martes o el jueves?»",
        "**Cierre:** «Perfecto, le envío la confirmación por WhatsApp. Muchas gracias.»",
    ], numerada=True)
    a.h2("Indicadores del procedimiento")
    a.tabla("Indicadores de desempeño del procedimiento de venta",
            ["Indicador", "Fórmula", "Meta", "Frecuencia"],
            [["Tiempo de respuesta", "Horas entre el contacto y la respuesta", "Menos de 2 h hábiles", "Semanal"],
             ["Tasa de calificación", "Calificados / prospectos", "33 %", "Mensual"],
             ["Tasa de demostración", "Demostraciones / calificados", "50 %", "Mensual"],
             ["Tasa de cierre", "Contratos / propuestas", "40 %", "Mensual"],
             ["Ciclo de venta", "Días desde el contacto hasta el contrato", "Menos de 45 días", "Mensual"],
             ["Cumplimiento de implantación", "Implantaciones a tiempo / total", "90 %", "Mensual"],
             ["Tasa de renovación", "Renovados / contratos por vencer", "92 %", "Trimestral"],
             ["NPS", "% promotores − % detractores", "+40", "Semestral"]],
            "Elaboración propia.", [3.8, 5.6, 3.6, 3])
