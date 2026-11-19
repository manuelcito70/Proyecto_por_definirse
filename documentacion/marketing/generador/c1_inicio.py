# -*- coding: utf-8 -*-
"""Carátula, índices, resumen, introducción, planteamiento y marco teórico."""
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
import datos as D

TITULO = ("Procedimiento de marketing para la venta del software SIGAD: aplicación de la "
          "producción y el marketing en la comercialización de un sistema de gestión documental académica")


def caratula(a):
    d = a.doc
    def linea(t, bold=False, size=12, espacio=0):
        p = d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(t); r.bold = bold; r.font.size = Pt(size)
        return p
    linea("Universidad Autónoma Gabriel René Moreno", True, 14)
    linea("Facultad Integral de Ichilo", True)
    linea("Carrera de Ingeniería en Sistemas")
    linea("")
    linea(TITULO, True, 13)
    linea("")
    linea("Examen final de Producción y Marketing")
    linea("")
    t = d.add_table(rows=2, cols=3)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, h in zip(t.rows[0].cells, ["Nombre y apellido", "Registro", "Firma"]):
        c.text = ""; r = c.paragraphs[0].add_run(h); r.bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    t.rows[1].cells[0].text = "Victor Daniel Guayao Medina"
    for row in t.rows:
        for c, w in zip(row.cells, (7.5, 3.5, 4.5)):
            c.width = Cm(w)
    linea("")
    linea("Materia: Producción y Marketing")
    linea("Docente: Ing. Dorado Prado")
    linea("")
    linea("Yapacaní, 16 de noviembre de 2026")


def indices(a):
    a.indice("Índice de contenido", 'TOC \\o "1-3" \\h \\z \\u')
    a.indice("Índice de tablas", "TOC \\h \\z \\f t")
    a.indice("Índice de figuras", "TOC \\h \\z \\f f")


def resumen(a):
    a.h1("Resumen")
    a.p("El presente trabajo desarrolla un procedimiento de marketing completo para la venta del Sistema de "
        "Gestión de Archivos y Documentación (SIGAD), un software web creado para las direcciones de carrera "
        "universitarias que necesitan registrar, ordenar y consultar documentos recibidos y expedidos, actas, "
        "expedientes de docentes y auxiliares, certificaciones y constancias. El documento integra los dos "
        "pilares de la asignatura: la **producción**, entendida como el proceso que transforma requisitos en "
        "un producto de software confiable que puede entregarse de forma repetible a muchos clientes, y el "
        "**marketing**, entendido como el conjunto de actividades que crean valor para el cliente, comunican "
        "ese valor y lo convierten en una venta rentable y duradera.", sangria=False)
    a.p("Se realizó un análisis del entorno (PESTEL), de la industria (cinco fuerzas de Porter), de la "
        "competencia y de la situación interna (FODA y matrices EFI y EFE). Se diseñó una investigación de "
        "mercado dirigida a directores de carrera y personal administrativo, se definieron segmentos, "
        "perfiles de comprador y una declaración de posicionamiento. Sobre esa base se formuló una mezcla "
        "de marketing de siete elementos (7P), un plan de marketing digital, un plan de producción del "
        f"software y un procedimiento de venta de diez etapas, que va desde la generación de prospectos "
        f"hasta la renovación del contrato. La evaluación financiera, con una inversión inicial de "
        f"{D.bs(D.inversion_total())}, proyecta un valor actual neto de {D.bs(D.van_tir()[1])} y una tasa "
        f"interna de retorno de {D.van_tir()[2] * 100:.1f} % en un horizonte de tres años.")
    p = a.doc.add_paragraph(); p.paragraph_format.first_line_indent = Cm(1.27)
    r = p.add_run("Palabras clave: "); r.italic = True
    p.add_run("marketing de software, producción, venta consultiva, SaaS, gestión documental, embudo de ventas, "
              "mezcla de marketing")


def introduccion(a):
    a.h1(TITULO)
    a.h2("Introducción")
    a.ps(
        "Vender software no es lo mismo que vender un producto físico. Un sistema informático no se ve ni se "
        "toca antes de comprarlo, su valor depende de cómo se integra al trabajo diario de las personas y "
        "su compra suele ser una decisión colectiva que pasa por varias autoridades. Por eso, una buena "
        "aplicación no se vende sola: necesita un proceso ordenado que lleve al cliente desde el "
        "desconocimiento del problema hasta la confianza suficiente para firmar un contrato y renovarlo cada "
        "año. A ese proceso ordenado se lo denomina, en este trabajo, **procedimiento de marketing**.",
        "El producto elegido es SIGAD, un sistema de gestión de archivos y documentación desarrollado "
        "originalmente para la Dirección de Carrera de Ingeniería en Sistemas de la Facultad Integral de "
        "Ichilo. El sistema reemplaza los cuadernos de registro, las carpetas físicas y las hojas de cálculo "
        "dispersas por una aplicación web centralizada, con control de acceso por roles, notificaciones, "
        "búsqueda inmediata y generación de certificaciones y constancias con formato institucional. Al "
        "tratarse de un software ya funcional, el reto ya no es construirlo, sino convertirlo en un producto "
        "comercial y llevarlo a otras unidades académicas del país.",
        "La asignatura de Producción y Marketing enseña que ambas funciones no pueden trabajar aisladas. "
        "Marketing promete y producción cumple: si el área comercial ofrece una implantación en dos semanas "
        "y el equipo técnico necesita seis, el cliente pierde la confianza; si producción crea funciones que "
        "nadie pidió, marketing tendrá un producto difícil de vender. Este documento, por ello, combina el "
        "plan de producción del software con la estrategia de marketing y con un procedimiento de venta "
        "paso a paso, de modo que cada promesa comercial tenga respaldo en la capacidad productiva.",
        "El trabajo se organiza de la siguiente manera. Primero se plantea el problema, la justificación y "
        "los objetivos. Luego se presenta el marco teórico que sustenta las decisiones. A continuación se "
        "describen la empresa y el producto, se analiza la situación del mercado y se expone la "
        "investigación de mercado. Después se desarrollan el plan de producción, la estrategia de marketing "
        "y el procedimiento de venta, que constituye el núcleo del documento. Finalmente se presentan el "
        "presupuesto, la evaluación financiera, el cronograma, los indicadores de control, las conclusiones, "
        "las recomendaciones, las referencias y los anexos con los formatos listos para usar.",
    )


def planteamiento(a):
    a.h1("Planteamiento del problema")
    a.h2("Antecedentes")
    a.ps(
        "En la mayoría de las universidades bolivianas, la gestión de la correspondencia y de los documentos "
        "académicos de una dirección de carrera todavía se apoya en registros manuales. Cada nota recibida "
        "se anota en un cuaderno, cada nota expedida se guarda en un archivador y cada certificación se "
        "redacta en un procesador de texto copiando datos de otros documentos. Cuando cambia el director o "
        "la secretaria, gran parte de ese conocimiento se pierde, porque la información está en la memoria "
        "de las personas más que en un sistema.",
        "En respuesta a esta situación se desarrolló SIGAD como proyecto de la carrera de Ingeniería en "
        "Sistemas. El sistema fue construido con tecnologías modernas y de uso libre (React en la interfaz, "
        "Node.js con Express en el servidor y PostgreSQL como base de datos), y se probó con datos reales "
        "de la dirección de carrera. Los resultados mostraron que el tiempo para ubicar un documento pasó de "
        "varios minutos a pocos segundos y que las constancias se generan sin errores de transcripción.",
        "A partir de este resultado surge una pregunta natural: si el problema existe en una carrera, "
        "¿existe también en las demás? La experiencia cotidiana indica que sí. Cada facultad, cada instituto "
        "técnico y cada escuela de posgrado maneja notas, actas, resoluciones y expedientes. Esto abre una "
        "oportunidad de negocio, pero también un desafío: transformar un proyecto académico en un producto "
        "que pueda producirse, venderse, instalarse y mantenerse de forma sostenible.",
    )
    a.h2("Descripción del problema")
    a.ps(
        "SIGAD cuenta con un producto funcional, pero no con un mecanismo para llegar a sus clientes. No "
        "existe una marca reconocida, un precio definido, un canal de ventas, materiales de comunicación ni "
        "un proceso que indique quién hace qué, en qué orden y con qué documentos desde que aparece un "
        "posible cliente hasta que el sistema funciona en su oficina. Tampoco se ha definido cómo el equipo "
        "técnico atenderá varias implantaciones a la vez sin bajar la calidad.",
        "Sin un procedimiento de marketing, la venta depende de contactos personales y de la improvisación. "
        "Esto provoca ciclos de venta largos, precios inconsistentes, promesas que producción no puede "
        "cumplir y clientes que abandonan el servicio porque nadie les acompañó después de la compra. En "
        "el sector educativo, donde las decisiones pasan por consejos y presupuestos anuales, la "
        "improvisación es todavía más costosa, porque una oportunidad perdida puede tardar un año en volver.",
    )
    a.h2("Formulación del problema")
    a.p("¿Qué procedimiento de marketing, apoyado en una planificación de la producción del software, permite "
        "vender SIGAD de manera ordenada, rentable y sostenible a las unidades académicas de educación "
        "superior de Bolivia, comenzando por el departamento de Santa Cruz?")
    a.h2("Justificación")
    a.h3("Justificación económica")
    a.p("El modelo de software como servicio genera ingresos recurrentes: cada cliente paga una cuota mensual "
        "o anual mientras usa el sistema. Esto permite que un producto ya desarrollado produzca ingresos "
        "durante varios años con un costo adicional bajo por cada nuevo cliente. La evaluación financiera de "
        f"este trabajo muestra que, con una inversión de {D.bs(D.inversion_total())}, el negocio alcanza "
        "utilidades a partir del segundo año.")
    a.h3("Justificación social")
    a.p("Una dirección de carrera que encuentra sus documentos en segundos atiende mejor a sus estudiantes y "
        "docentes. Las certificaciones salen más rápido, los trámites de auxiliatura tienen seguimiento y la "
        "información institucional deja de depender de una sola persona. Además, el proyecto genera empleo "
        "calificado para profesionales jóvenes de la región de Ichilo.")
    a.h3("Justificación académica")
    a.p("El trabajo aplica de forma integrada los contenidos de la asignatura: análisis del entorno, "
        "investigación de mercado, segmentación, posicionamiento, mezcla de marketing, planificación de la "
        "producción, control de calidad, costos, punto de equilibrio e indicadores de gestión. Sirve, además, "
        "como guía práctica para otros estudiantes que deseen comercializar el software que desarrollan.")
    a.h3("Justificación tecnológica")
    a.p("La transformación digital de la administración pública y educativa es una política vigente en "
        "Bolivia. El Decreto Supremo 3251 de 2017 aprobó el Plan de Implementación de Software Libre y "
        "Estándares Abiertos, y la Agencia de Gobierno Electrónico y Tecnologías de Información y "
        "Comunicación (AGETIC) impulsa la digitalización de trámites. SIGAD, construido con tecnologías "
        "libres, se alinea con esa política.")
    a.h2("Objetivos")
    a.h3("Objetivo general")
    a.p("Diseñar un procedimiento de marketing, integrado con la planificación de la producción, para la venta "
        "del software SIGAD a unidades académicas de educación superior de Bolivia, que permita captar al "
        "menos 16 clientes durante el primer año de operación.")
    a.h3("Objetivos específicos")
    a.lista([
        "Analizar el entorno, la industria y la competencia del mercado de software de gestión documental "
        "académica en Bolivia.",
        "Diseñar una investigación de mercado que identifique necesidades, disposición de pago y canales "
        "preferidos de los clientes potenciales.",
        "Definir los segmentos de mercado, los perfiles de comprador y el posicionamiento de SIGAD.",
        "Planificar la producción del software: proceso productivo, capacidad, costos y control de calidad.",
        "Formular la mezcla de marketing de siete elementos y el plan de marketing digital.",
        "Elaborar el procedimiento de venta paso a paso, con responsables, registros y tiempos.",
        "Estimar el presupuesto, la proyección de ventas y la rentabilidad del plan.",
        "Establecer indicadores de control y un cronograma de implementación.",
    ], numerada=True)
    a.h2("Alcance y limitaciones")
    a.ps(
        "**Alcance geográfico.** El primer año se concentra en el departamento de Santa Cruz, especialmente "
        "en la ciudad de Santa Cruz de la Sierra y en las provincias con sedes universitarias, como Ichilo, "
        "Sara, Andrés Ibáñez y Chiquitos. A partir del segundo año se amplía a Cochabamba, La Paz y "
        "Chuquisaca.",
        "**Alcance del producto.** El procedimiento se refiere a SIGAD en su versión comercial, ofrecida "
        "como servicio en la nube y, de manera excepcional, como instalación en servidores del cliente.",
        "**Limitaciones.** Los datos de mercado son estimaciones elaboradas para la planificación; la "
        "encuesta propuesta en el Anexo A debe aplicarse para validarlos. Los costos y precios están "
        "expresados en bolivianos de 2026 y pueden variar con la inflación y el tipo de cambio. Las "
        "proyecciones financieras no reemplazan un estudio de factibilidad con información contable real.",
    )
    a.h2("Metodología del trabajo")
    a.ps(
        "El trabajo tiene un enfoque mixto y un alcance descriptivo y propositivo. Es descriptivo porque "
        "caracteriza el mercado, la competencia y el producto; es propositivo porque formula un "
        "procedimiento que puede aplicarse directamente. Se utilizaron las siguientes técnicas:",
    )
    a.lista([
        "**Revisión documental** de libros de marketing, producción y operaciones, ingeniería de software y "
        "normativa boliviana.",
        "**Análisis del producto** mediante la revisión del código fuente, la base de datos y las pantallas "
        "de SIGAD.",
        "**Encuesta estructurada** dirigida a directores de carrera, secretarias y jefes de sistemas "
        "(instrumento en el Anexo A).",
        "**Herramientas de análisis estratégico**: PESTEL, cinco fuerzas de Porter, FODA, matrices EFI y EFE, "
        "matriz de Ansoff, lienzo del modelo de negocio y cadena de valor.",
        "**Herramientas de inteligencia artificial**, tal como lo autorizó el docente, para apoyar la "
        "redacción, la elaboración de gráficos y la revisión del formato APA.",
    ])


def marco_teorico(a):
    a.h1("Marco teórico")
    a.p("Este capítulo reúne los conceptos que sustentan el procedimiento. Se organiza desde lo general "
        "(qué es el marketing y qué es la producción) hasta lo específico (cómo se vende software a "
        "organizaciones y cómo se mide el éxito de esa venta).")

    a.h2("El marketing")
    a.ps(
        "Kotler y Armstrong (2017) definen el marketing como el proceso mediante el cual las empresas crean "
        "valor para los clientes y establecen relaciones sólidas con ellos, con el fin de obtener a cambio "
        "valor de los clientes. Esta definición tiene dos partes que guían todo este trabajo: primero hay "
        "que *crear valor* (un producto que resuelva un problema real) y después hay que *capturar valor* "
        "(convertirlo en ventas, utilidades y clientes leales).",
        "Kotler y Keller (2016) explican que el enfoque de marketing ha evolucionado desde la orientación a "
        "la producción, en la que se suponía que los clientes compran lo que esté disponible y barato, "
        "hacia la orientación al marketing holístico, que considera al cliente, a la empresa, a los socios "
        "y a la sociedad. En el caso del software, la orientación al cliente es indispensable, porque un "
        "sistema que no se adapta a la forma de trabajar del usuario termina abandonado.",
    )
    a.h3("Necesidades, deseos y demandas")
    a.p("La necesidad es una carencia básica; el deseo es la forma que toma esa necesidad según la cultura y "
        "la experiencia; la demanda es el deseo respaldado por capacidad de pago (Kotler & Armstrong, 2017). "
        "Una dirección de carrera *necesita* encontrar documentos y cumplir plazos; *desea* una herramienta "
        "sencilla y en español; y *demanda* SIGAD cuando cuenta con presupuesto y autorización para "
        "contratarlo. El procedimiento de venta debe identificar en qué punto se encuentra cada prospecto.")
    a.h3("Valor y satisfacción del cliente")
    a.p("El valor percibido es la diferencia entre los beneficios que el cliente espera y los costos que "
        "asume, que no son solo monetarios, sino también de tiempo, esfuerzo y riesgo (Kotler & Keller, "
        "2016). Por esta razón, la estrategia de SIGAD no busca únicamente un precio bajo: reduce el riesgo "
        "con una prueba gratuita, el esfuerzo con capacitación incluida y el tiempo con una implantación "
        "rápida.")

    a.h2("La producción y la administración de operaciones")
    a.ps(
        "Heizer et al. (2020) definen la producción como la creación de bienes y servicios, y la "
        "administración de operaciones como el conjunto de actividades que transforman insumos en "
        "productos. En una empresa de software los insumos son conocimiento, horas de trabajo, "
        "infraestructura en la nube y requisitos de los clientes; la transformación es el desarrollo, las "
        "pruebas y la configuración; y el producto es un servicio disponible para el usuario.",
        "Chase y Jacobs (2014) destacan que las decisiones de operaciones incluyen la capacidad, la calidad, "
        "la programación de actividades y la gestión de la cadena de suministro. En este trabajo, esas "
        "decisiones se traducen en cuántas implantaciones simultáneas puede atender el equipo, qué pruebas "
        "debe pasar cada versión, cómo se programan los sprints de desarrollo y qué proveedores de nube se "
        "utilizan.",
    )
    a.h3("Particularidades de la producción de software")
    a.p("A diferencia de un producto manufacturado, el software tiene un costo marginal de reproducción casi "
        "nulo: producir la primera versión es caro, pero entregar una copia más a un nuevo cliente cuesta muy "
        "poco. Sommerville (2011) señala, sin embargo, que el software requiere mantenimiento continuo, "
        "porque el entorno cambia y aparecen nuevos requisitos. Por eso, en un modelo comercial la "
        "producción no termina con el lanzamiento: se convierte en un proceso continuo de mejora, corrección "
        "y adaptación.")
    a.h3("Relación entre producción y marketing")
    a.p("Producción y marketing comparten un mismo objetivo: satisfacer al cliente de forma rentable. "
        "Marketing aporta información sobre lo que el mercado necesita y lo que está dispuesto a pagar; "
        "producción aporta información sobre lo que es posible fabricar, a qué costo y en qué plazo. Cuando "
        "ambas áreas se coordinan, la empresa promete lo que puede cumplir y cumple lo que promete. La "
        "Tabla 1 resume los puntos de contacto entre ambas funciones en una empresa de software.")
    a.tabla("Puntos de coordinación entre producción y marketing en una empresa de software",
            ["Decisión", "Aporte de marketing", "Aporte de producción"],
            [["Funciones del producto", "Necesidades detectadas en ventas y encuestas",
              "Factibilidad técnica, esfuerzo y plazo"],
             ["Precio", "Disposición de pago y precios de la competencia", "Costo de desarrollo, nube y soporte"],
             ["Plazos de implantación", "Expectativa del cliente y calendario académico",
              "Capacidad del equipo de implantación"],
             ["Calidad", "Quejas, reclamos e indicadores de satisfacción", "Pruebas, estándares y corrección de errores"],
             ["Lanzamientos", "Campañas y comunicación de novedades", "Hoja de ruta y versiones estables"],
             ["Postventa", "Fidelización, renovación y referidos", "Soporte técnico y acuerdos de nivel de servicio"]],
            "Elaboración propia con base en Heizer et al. (2020) y Kotler y Keller (2016).", [4, 6, 6])

    a.h2("El software como producto y como servicio")
    a.ps(
        "Lovelock y Wirtz (2015) caracterizan los servicios por su intangibilidad, inseparabilidad entre "
        "producción y consumo, variabilidad y caducidad. El software ofrecido en la nube comparte varias de "
        "estas características: el cliente no recibe un objeto, sino acceso a una funcionalidad; la calidad "
        "percibida depende de la atención del equipo de soporte; y la experiencia varía según la "
        "capacitación recibida.",
        "El modelo de **software como servicio** (SaaS, por sus siglas en inglés) consiste en que el "
        "proveedor aloja la aplicación en sus servidores y el cliente la utiliza a través de internet "
        "pagando una suscripción. Para el cliente, el SaaS reduce la inversión inicial y elimina la "
        "necesidad de mantener servidores propios; para el proveedor, genera ingresos recurrentes y "
        "facilita las actualizaciones, porque todos los clientes usan la misma versión.",
    )
    a.h3("Niveles del producto")
    a.p("Kotler y Armstrong (2017) distinguen tres niveles de producto: el valor fundamental para el cliente "
        "(el beneficio central que busca), el producto real (las características, el diseño, la marca y la "
        "calidad) y el producto aumentado (los servicios y beneficios adicionales). En el software, el "
        "producto aumentado (capacitación, soporte, actualizaciones y migración de datos) suele ser el "
        "factor que define la compra, porque reduce el temor del cliente a no saber usar el sistema.")

    a.h2("La mezcla de marketing")
    a.ps(
        "La mezcla de marketing es el conjunto de herramientas tácticas que la empresa combina para producir "
        "la respuesta deseada en el mercado meta. McCarthy la resumió en cuatro elementos: producto, "
        "precio, plaza y promoción (Kotler & Armstrong, 2017). Para los servicios, Booms y Bitner añadieron "
        "tres elementos más: personas, procesos y evidencia física (Lovelock & Wirtz, 2015). Dado que SIGAD "
        "se comercializa como servicio, se utiliza el modelo de las 7P.",
    )
    a.tabla("Elementos de la mezcla de marketing de servicios (7P)",
            ["Elemento", "Pregunta que responde", "Aplicación al software"],
            [["Producto", "¿Qué se ofrece?", "Funciones, módulos, calidad, marca, soporte"],
             ["Precio", "¿Cuánto y cómo se paga?", "Planes, implantación, suscripción, descuentos"],
             ["Plaza", "¿Dónde y cómo llega al cliente?", "Nube, venta directa, aliados, sitio web"],
             ["Promoción", "¿Cómo se comunica?", "Marketing digital, ferias, demostraciones, referidos"],
             ["Personas", "¿Quién atiende?", "Vendedores, implantadores, soporte"],
             ["Procesos", "¿Cómo se entrega el servicio?", "Procedimiento de venta, implantación, soporte"],
             ["Evidencia física", "¿Qué hace tangible el servicio?", "Sitio web, manuales, certificados, interfaz"]],
            "Adaptado de Lovelock y Wirtz (2015).", [3.2, 5, 7.8])

    a.h2("Segmentación, mercado meta y posicionamiento")
    a.ps(
        "La segmentación divide el mercado en grupos con necesidades y comportamientos similares. En los "
        "mercados de organizaciones, las variables más útiles son el tipo de institución, el tamaño, la "
        "ubicación, la tecnología que utilizan y el proceso de compra (Kotler & Keller, 2016). Después de "
        "segmentar, la empresa elige uno o varios segmentos como mercado meta y define su posicionamiento, "
        "es decir, el lugar que desea ocupar en la mente del cliente frente a los competidores.",
        "Una declaración de posicionamiento útil indica el público objetivo, la necesidad, la categoría del "
        "producto, el beneficio diferencial y la razón para creer. Kim y Mauborgne (2015) añaden que las "
        "empresas pueden crear un *océano azul* cuando dejan de competir en los mismos atributos que sus "
        "rivales y ofrecen una combinación de valor distinta; por ejemplo, un software especializado y a la "
        "vez accesible para unidades pequeñas que hoy no son atendidas por los grandes proveedores.",
    )

    a.h2("El ciclo de vida del producto")
    a.p("Todo producto atraviesa las etapas de introducción, crecimiento, madurez y declive. En la "
        "introducción las ventas crecen lentamente y los costos de promoción son altos; en el crecimiento "
        "aumentan la aceptación y los competidores; en la madurez las ventas se estabilizan y la competencia "
        "se centra en el precio y la diferenciación; y en el declive las ventas bajan (Kotler & Armstrong, "
        "2017). SIGAD se encuentra en la etapa de introducción, por lo que la estrategia debe priorizar el "
        "conocimiento de la marca, la prueba del producto y la obtención de los primeros casos de éxito.")
    a.figura("Ciclo de vida del producto y ubicación de SIGAD", "graficos/g10_ciclo_vida.png",
             "Elaboración propia con base en Kotler y Armstrong (2017).", 5.6)

    a.h2("El marketing de empresa a empresa")
    a.ps(
        "Cuando el comprador es una organización, el proceso de compra es más racional, más largo y en él "
        "intervienen varias personas. Kotler y Keller (2016) describen el *centro de compras* con los roles de "
        "iniciador, usuario, influenciador, decisor, aprobador, comprador y guardián. En una universidad, "
        "la secretaria de dirección puede ser la usuaria e iniciadora, el jefe de sistemas el influenciador "
        "técnico, el director de carrera o el decano el decisor, la dirección administrativa financiera el "
        "comprador y el consejo facultativo el aprobador.",
        "Moore (2014) advierte que los productos tecnológicos deben cruzar un *abismo* entre los primeros "
        "adoptantes, entusiastas de la innovación, y la mayoría pragmática, que solo compra cuando ve casos "
        "de éxito en organizaciones parecidas. Esta idea justifica que el procedimiento de SIGAD dé "
        "prioridad a conseguir clientes de referencia y a documentar sus resultados.",
    )
    a.tabla("Roles del centro de compras en una institución de educación superior",
            ["Rol", "Persona habitual", "Qué le interesa"],
            [["Iniciador", "Secretaria o encargada de archivo", "Dejar de buscar papeles y cuadernos"],
             ["Usuario", "Secretaria, director, auxiliares", "Facilidad de uso y rapidez"],
             ["Influenciador", "Jefe de sistemas o TIC", "Seguridad, respaldos, tecnología"],
             ["Decisor", "Director de carrera o decano", "Orden, imagen institucional, control"],
             ["Aprobador", "Consejo de carrera o facultativo", "Justificación y legalidad"],
             ["Comprador", "Dirección administrativa financiera", "Precio, forma de pago, factura"],
             ["Guardián", "Asistente de dirección", "Filtrar a quién recibe la autoridad"]],
            "Elaboración propia con base en Kotler y Keller (2016).", [3, 5.5, 7.5])

    a.h2("El embudo de ventas y el modelo AIDA")
    a.ps(
        "El embudo de ventas representa el recorrido del cliente desde que conoce la empresa hasta que "
        "compra. En la parte superior hay muchos contactos con bajo interés y, a medida que avanzan, el "
        "número disminuye y la probabilidad de compra aumenta. El modelo AIDA, uno de los más antiguos de "
        "la comunicación comercial, describe las etapas de atención, interés, deseo y acción, que se "
        "corresponden con las partes del embudo.",
        "Chaffey y Ellis-Chadwick (2019) proponen además el marco RACE (alcanzar, actuar, convertir y "
        "comprometer) para planificar el marketing digital a lo largo de todo el ciclo de vida del cliente, "
        "incluida la etapa posterior a la compra, que en el modelo de suscripción es tan importante como la "
        "venta inicial.",
    )

    a.h2("Inbound marketing y marketing de contenidos")
    a.p("Halligan y Shah (2010) proponen el *inbound marketing*, que consiste en atraer clientes con "
        "contenido útil en lugar de interrumpirlos con publicidad. El proceso se resume en atraer, convertir, "
        "cerrar y deleitar. Para un software dirigido a directores de carrera, el contenido útil incluye "
        "guías para organizar el archivo, plantillas de documentos, consejos sobre normativa universitaria y "
        "testimonios de otras carreras. Este enfoque es adecuado porque el cliente investiga antes de "
        "comprar y valora a quien le enseña algo útil.")

    a.h2("Marketing digital")
    a.ps(
        "Kotler et al. (2018) explican que en la era digital el recorrido del cliente pasa por las etapas de "
        "conocimiento, atracción, consulta, acción y recomendación, y que la recomendación de otros clientes "
        "es el factor más influyente. Las herramientas digitales más utilizadas son el sitio web, la "
        "optimización para motores de búsqueda (SEO), la publicidad en buscadores y redes sociales, el "
        "correo electrónico, los seminarios web y la mensajería instantánea.",
        "En Bolivia, las redes sociales con mayor alcance son Facebook, TikTok e Instagram, mientras que "
        "WhatsApp es el principal canal de conversación, incluso en el ámbito institucional. LinkedIn tiene "
        "menor alcance, pero concentra a profesionales y autoridades académicas. Por ello, el plan digital "
        "de SIGAD combina estas plataformas según el objetivo de cada etapa del embudo.",
    )

    a.h2("La venta consultiva")
    a.ps(
        "Rackham (1988) estudió miles de reuniones de venta y concluyó que, en las ventas complejas, los "
        "vendedores exitosos hacen más preguntas y hablan menos del producto. Su método SPIN propone cuatro "
        "tipos de preguntas: de **situación** (cómo trabaja hoy el cliente), de **problema** (qué "
        "dificultades tiene), de **implicación** (qué consecuencias trae el problema) y de **necesidad de "
        "beneficio** (qué valor tendría resolverlo). El procedimiento de SIGAD incorpora este método en la "
        "reunión de diagnóstico.",
        "Para decidir en qué prospectos invertir tiempo se utiliza el criterio BANT, que evalúa el "
        "presupuesto (*budget*), la autoridad (*authority*), la necesidad (*need*) y el tiempo (*timing*). Un "
        "prospecto que tiene necesidad pero no tiene presupuesto ni autoridad debe ser nutrido con "
        "contenidos hasta que madure, en lugar de recibir visitas costosas.",
    )

    a.h2("Gestión de la relación con el cliente")
    a.p("La gestión de la relación con el cliente (CRM, por sus siglas en inglés) es el proceso de construir y "
        "mantener relaciones rentables entregando valor y satisfacción superiores (Kotler & Armstrong, "
        "2017). En la práctica, un sistema CRM registra a cada prospecto, sus interacciones, la etapa en que "
        "se encuentra y las tareas pendientes. Sin este registro, el seguimiento depende de la memoria del "
        "vendedor y las oportunidades se pierden.")

    a.h2("Estrategias de precios")
    a.ps(
        "Los precios pueden fijarse con base en los costos, en el valor percibido por el cliente o en los "
        "precios de la competencia (Kotler & Keller, 2016). En el software es frecuente el precio por "
        "niveles (*tiered pricing*), en el que se ofrecen planes con distintas capacidades, de modo que cada "
        "cliente elige según su tamaño. También son comunes los descuentos por pago anual, los precios de "
        "introducción y el modelo *freemium* o de prueba gratuita.",
        "El precio de un software para el sector público debe considerar además los procesos de "
        "contratación estatal. En Bolivia, las universidades públicas adquieren bienes y servicios según "
        "las Normas Básicas del Sistema de Administración de Bienes y Servicios, que establecen modalidades "
        "según el monto, como la contratación menor y la modalidad de apoyo nacional a la producción y "
        "empleo (ANPE). Un precio "
        "que permite contratar por la modalidad más sencilla acorta el ciclo de venta.",
    )

    a.h2("Métricas de un negocio de software por suscripción")
    a.p("Ries (2012) recomienda medir el aprendizaje con métricas accionables y no con métricas de "
        "vanidad. En los negocios de suscripción, las métricas más utilizadas se resumen en la Tabla 4.")
    a.tabla("Métricas clave de un negocio de software por suscripción",
            ["Métrica", "Definición", "Uso en SIGAD"],
            [["MRR", "Ingreso mensual recurrente: suma de las suscripciones activas", "Mide el tamaño real del negocio"],
             ["CAC", "Costo de adquisición de cliente: gasto comercial dividido entre clientes nuevos",
              "Indica cuánto cuesta conseguir un cliente"],
             ["LTV", "Valor de vida del cliente: ingreso total esperado durante la relación",
              "Debe ser al menos tres veces el CAC"],
             ["Churn", "Tasa de abandono: porcentaje de clientes que no renuevan", "Meta: menor a 8 % anual"],
             ["NPS", "Índice de recomendación neta: promotores menos detractores", "Meta: mayor a +40"],
             ["Tasa de conversión", "Porcentaje que pasa de una etapa del embudo a la siguiente",
              "Detecta en qué etapa se pierden clientes"]],
            "Elaboración propia con base en Ries (2012) y Chaffey y Ellis-Chadwick (2019).", [2.8, 7.2, 6])

    a.h2("Herramientas de análisis estratégico")
    a.ps(
        "**Análisis PESTEL.** Examina los factores políticos, económicos, sociales, tecnológicos, "
        "ecológicos y legales del entorno que la empresa no controla, pero que influyen en su desempeño.",
        "**Cinco fuerzas de Porter.** Porter (2008) sostiene que la rentabilidad de una industria depende de "
        "la rivalidad entre competidores, la amenaza de nuevos entrantes, la amenaza de productos "
        "sustitutos y el poder de negociación de clientes y proveedores.",
        "**Cadena de valor.** Porter (2015) descompone la empresa en actividades primarias y de apoyo para "
        "identificar dónde se crea valor y dónde puede obtenerse una ventaja competitiva.",
        "**Análisis FODA y matrices EFI y EFE.** Organizan las fortalezas y debilidades internas y las "
        "oportunidades y amenazas externas; las matrices asignan pesos y calificaciones para obtener un "
        "valor ponderado que muestra si la empresa responde bien a su entorno.",
        "**Matriz de Ansoff.** Clasifica las estrategias de crecimiento en penetración de mercado, desarrollo "
        "de mercado, desarrollo de producto y diversificación.",
        "**Lienzo del modelo de negocio.** Osterwalder y Pigneur (2011) proponen describir un negocio en "
        "nueve bloques: segmentos de clientes, propuesta de valor, canales, relaciones, fuentes de ingreso, "
        "recursos clave, actividades clave, socios clave y estructura de costos.",
    )

    a.h2("Calidad del producto de software")
    a.p("La norma ISO/IEC 25010 (International Organization for Standardization [ISO], 2011) define el "
        "modelo de calidad del producto de software con ocho características: adecuación funcional, "
        "eficiencia de desempeño, compatibilidad, usabilidad, fiabilidad, seguridad, mantenibilidad y "
        "portabilidad. Pressman y Maxim (2020) señalan que la calidad no se agrega al final, sino que se "
        "construye durante todo el proceso mediante revisiones, pruebas y gestión de la configuración. Para "
        "marketing, la calidad es un argumento de venta; para producción, es una disciplina diaria.")

    a.h2("Metodologías ágiles de producción de software")
    a.p("Scrum es un marco de trabajo en el que un equipo pequeño entrega incrementos del producto en "
        "ciclos cortos llamados *sprints*, de una a cuatro semanas (Schwaber & Sutherland, 2020). Sus roles "
        "son el dueño del producto, que prioriza lo que se construye; el *scrum master*, que facilita el "
        "proceso; y los desarrolladores. Sus eventos son la planificación del sprint, la reunión diaria, la "
        "revisión y la retrospectiva. Scrum facilita la coordinación con marketing, porque cada revisión "
        "del sprint es una oportunidad para incorporar lo que piden los clientes.")

    a.h2("Marco legal aplicable en Bolivia")
    a.tabla("Normativa boliviana relacionada con la comercialización de software",
            ["Norma", "Contenido relevante"],
            [["Constitución Política del Estado (2009)", "Reconoce la libertad de empresa y el derecho a la "
              "privacidad e intimidad de las personas"],
             ["Ley 164 General de Telecomunicaciones y TIC (2011)",
              "Regula los servicios de tecnologías de información y el gobierno electrónico"],
             ["Decreto Supremo 1793 (2013)", "Reglamenta el desarrollo de TIC, el documento y la firma digital"],
             ["Decreto Supremo 3251 (2017)", "Aprueba el Plan de Implementación de Software Libre y "
              "Estándares Abiertos en el Estado"],
             ["Ley 453 de derechos de usuarios y consumidores (2013)",
              "Obliga a informar con veracidad sobre el servicio y sus condiciones"],
             ["Ley 1322 de Derecho de Autor (1992)", "Protege los programas de computación como obras"],
             ["Código de Comercio y normativa tributaria",
              "Regula la constitución de la empresa, la facturación y el pago de impuestos (IVA, IT, IUE)"]],
            "Elaboración propia con base en la normativa citada.", [6.5, 9.5])
