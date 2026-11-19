# -*- coding: utf-8 -*-
"""Empresa y producto, análisis de la situación e investigación de mercado."""
import datos as D

CAP = "../../capturas/"


def empresa_producto(a):
    a.h1("Descripción de la empresa y del producto")
    a.h2("La empresa")
    a.ps(
        f"Para comercializar SIGAD se propone constituir la empresa **{D.EMPRESA} S.R.L.**, una sociedad de "
        "responsabilidad limitada con domicilio en Yapacaní, provincia Ichilo, y una oficina comercial en la "
        "ciudad de Santa Cruz de la Sierra. La forma de sociedad de responsabilidad limitada protege el "
        "patrimonio personal de los socios y es la más utilizada por las pequeñas empresas de tecnología "
        "en Bolivia.",
        "El nombre hace referencia a la provincia donde nació el producto y comunica un mensaje importante: "
        "desde una región fuera de las capitales también se puede producir tecnología de calidad. Este "
        "origen local es, además, un argumento de venta frente a proveedores extranjeros, porque el cliente "
        "valora tener soporte cercano, en su mismo horario y en su mismo idioma.",
    )
    a.h3("Misión")
    a.p("Simplificar la gestión documental de las instituciones educativas bolivianas con software confiable, "
        "fácil de usar y acompañado de un servicio cercano, para que su personal dedique más tiempo a "
        "atender a estudiantes y docentes y menos tiempo a buscar papeles.")
    a.h3("Visión")
    a.p("Ser, hasta el año 2030, la empresa boliviana de referencia en software de gestión académica y "
        "documental, con presencia en los nueve departamentos y más de 200 unidades académicas atendidas.")
    a.h3("Valores")
    a.lista([
        "**Cercanía:** respondemos rápido y en el idioma del cliente.",
        "**Confiabilidad:** cumplimos lo que prometemos y protegemos la información de nuestros clientes.",
        "**Sencillez:** diseñamos para personas que no son expertas en informática.",
        "**Mejora continua:** cada sugerencia de un cliente es una oportunidad para mejorar el producto.",
        "**Compromiso regional:** generamos empleo calificado y demostramos el talento de la provincia.",
    ])
    a.h3("Estructura organizacional")
    a.p("La empresa inicia con un equipo pequeño y polivalente, que crece a medida que aumentan los "
        "clientes. La siguiente figura muestra la estructura prevista para el segundo año, y la tabla "
        "posterior detalla las funciones y el año de incorporación de cada cargo.")
    a.figura(f"Organigrama de {D.EMPRESA} S.R.L.", "graficos/g24_organigrama.png",
             "Elaboración propia.", 5.8)
    a.tabla("Cargos, funciones y año de incorporación del personal",
            ["Cargo", "Funciones principales", "Sueldo mensual", "Desde"],
            [[c, {
                "Gerente general y jefe de producto": "Dirige la empresa, prioriza el desarrollo, negocia con clientes institucionales",
                "Desarrollador full stack": "Programa nuevas funciones, corrige errores, mantiene la plataforma",
                "Ejecutivo de ventas (sueldo base)": "Contacta prospectos, realiza demostraciones y cierra contratos",
                "Técnico de implantación y soporte": "Configura el sistema, migra datos, capacita y atiende consultas",
                "Analista de marketing digital": "Gestiona redes, contenidos, publicidad, correo y métricas",
                "Segundo desarrollador": "Amplía la capacidad de desarrollo para nuevos módulos",
            }[c], D.bs(s), f"Año {y}"] for c, s, y in D.PERSONAL],
            "Los sueldos no incluyen aportes patronales (16,71 %). En el año 1 las tareas de soporte y "
            "marketing las asumen el gerente y el desarrollador. Elaboración propia.", [4.2, 7.2, 2.6, 1.6])

    a.h2("El producto: SIGAD")
    a.ps(
        "SIGAD (Sistema de Gestión de Archivos y Documentación) es una aplicación web que centraliza la "
        "documentación de una dirección de carrera o de cualquier unidad académica. Permite registrar los "
        "documentos que llegan y los que salen, adjuntar el archivo digital, asignarles un estado "
        "(pendiente, en proceso o finalizado), buscarlos por cualquier dato y generar reportes. También "
        "administra los expedientes de docentes y auxiliares de docencia, las actas y la emisión de "
        "certificaciones y constancias con formato de oficio institucional.",
        "El sistema funciona desde cualquier navegador, sin instalar programas en las computadoras del "
        "cliente, y cuenta con tres perfiles de usuario: administrador, usuario interno y usuario externo, "
        "cada uno con permisos diferentes. Envía notificaciones dentro del sistema y por correo, protege "
        "las contraseñas con cifrado y limita los intentos de acceso para evitar ataques.",
    )
    a.h3("Módulos del sistema")
    a.tabla("Módulos de SIGAD y beneficio que aporta cada uno",
            ["Módulo", "Qué hace", "Beneficio para el cliente"],
            [["Panel de control", "Muestra totales, pendientes, gráficos y calendario", "Visión completa en segundos"],
             ["Documentos recibidos", "Registra notas, solicitudes y oficios que llegan, con su archivo",
              "Ninguna nota se pierde"],
             ["Documentos expedidos", "Registra y numera las notas que emite la unidad", "Control de correlativos"],
             ["Actas", "Archiva actas de consejo, reuniones y defensas", "Respaldo ordenado de decisiones"],
             ["Docentes", "Expediente digital de cada docente", "Información disponible para acreditación"],
             ["Auxiliares", "Proceso de selección y expediente de auxiliares de docencia",
              "Seguimiento de cada fase del proceso"],
             ["Certificaciones y constancias", "Genera documentos con formato de oficio institucional",
              "Menos tiempo y cero errores de transcripción"],
             ["Notificaciones", "Avisos de documentos nuevos y plazos", "Nada queda olvidado"],
             ["Usuarios y permisos", "Roles de administrador, interno y externo", "Seguridad y responsabilidad"],
             ["Búsqueda y filtros", "Búsqueda por número, remitente, fecha, estado y texto", "Ubicación inmediata"]],
            "Elaboración propia con base en el sistema SIGAD.", [3.6, 6.6, 5.8])
    a.h3("Características técnicas")
    a.tabla("Ficha técnica de SIGAD",
            ["Aspecto", "Descripción"],
            [["Tipo de aplicación", "Aplicación web de una sola página (SPA) con API REST"],
             ["Interfaz", "React, diseño adaptable a computadoras y tabletas"],
             ["Servidor", "Node.js con Express 5"],
             ["Base de datos", "PostgreSQL, relacional, con respaldos programados"],
             ["Seguridad", "Contraseñas cifradas con bcrypt, sesiones con JWT, cabeceras Helmet, límite de intentos"],
             ["Archivos", "Carga de documentos de hasta 20 MB por archivo"],
             ["Notificaciones", "Campana interna y correo electrónico automático"],
             ["Tareas programadas", "Recordatorios y respaldos automáticos (cron)"],
             ["Modalidad de entrega", "Nube administrada por Ichilo Soft o servidor propio del cliente"],
             ["Licencia de componentes", "Tecnologías de código abierto, sin costos de licencia de terceros"]],
            "Elaboración propia con base en el código fuente del sistema.", [4.5, 11.5])
    a.h3("Interfaz del sistema")
    a.p("Las siguientes figuras muestran pantallas reales del sistema. Estas imágenes forman parte del "
        "material de venta, porque permiten que el cliente *vea* el producto antes de comprarlo y reducen "
        "la intangibilidad propia del software.")
    for img, t in [("p01-login.png", "Pantalla de inicio de sesión de SIGAD"),
                   ("p02-panel.png", "Panel de control con indicadores y calendario"),
                   ("p03-recibidos.png", "Módulo de documentos recibidos"),
                   ("p10-auxiliares.png", "Módulo de auxiliares de docencia"),
                   ("p15-constancia.png", "Constancia generada con formato de oficio institucional")]:
        a.figura(t, CAP + img, "Captura de pantalla del sistema SIGAD.", 6.0)
    a.h3("Niveles del producto SIGAD")
    a.tabla("Niveles del producto SIGAD según Kotler y Armstrong",
            ["Nivel", "Contenido en SIGAD"],
            [["Valor fundamental", "Encontrar cualquier documento en segundos y tener el control de la unidad"],
             ["Producto real", "Módulos, interfaz en español, marca SIGAD, seguridad, reportes, formato institucional"],
             ["Producto aumentado", "Migración de datos, capacitación, soporte por WhatsApp, actualizaciones, "
              "respaldos, garantía de satisfacción de 30 días"]],
            "Elaboración propia con base en Kotler y Armstrong (2017).", [4, 12])
    a.h3("Propuesta de valor")
    a.p("La propuesta de valor resume por qué un cliente debería elegir SIGAD:")
    a.p("*«SIGAD ordena toda la documentación de tu unidad académica en un solo lugar seguro, para que "
        "encuentres cualquier nota, acta o expediente en segundos y emitas certificaciones sin errores, con "
        "implantación en dos semanas, capacitación incluida y soporte local en tu idioma.»*")
    a.h3("Lienzo del modelo de negocio")
    a.tabla("Lienzo del modelo de negocio de SIGAD",
            ["Bloque", "Contenido"],
            [["Segmentos de clientes", "Direcciones de carrera, facultades, universidades públicas y privadas, "
              "institutos técnicos y escuelas de posgrado"],
             ["Propuesta de valor", "Orden, rapidez, seguridad y formato institucional, con soporte local"],
             ["Canales", "Venta directa, sitio web, redes sociales, WhatsApp, ferias, aliados"],
             ["Relación con clientes", "Asistencia personal, comunidad de usuarios, capacitaciones periódicas"],
             ["Fuentes de ingreso", "Pago único de implantación y suscripción mensual o anual"],
             ["Recursos clave", "Código fuente, equipo técnico, marca, casos de éxito"],
             ["Actividades clave", "Desarrollo, implantación, soporte, marketing y ventas"],
             ["Socios clave", "Proveedor de nube, universidades piloto, asociaciones de carreras, contadores"],
             ["Estructura de costos", "Sueldos, servidores, marketing, oficina, comisiones, impuestos"]],
            "Elaboración propia con base en Osterwalder y Pigneur (2011).", [4.5, 11.5])


def situacion(a):
    a.h1("Análisis de la situación")
    a.p("Antes de definir la estrategia es necesario entender el entorno en el que se venderá SIGAD. Este "
        "capítulo analiza el macroentorno, el mercado, la competencia, la industria y la situación interna, "
        "para concluir con las estrategias que surgen de cruzar esos factores.")
    a.h2("Análisis del macroentorno (PESTEL)")
    a.tabla("Análisis PESTEL del mercado de software de gestión documental en Bolivia",
            ["Factor", "Situación", "Efecto para SIGAD"],
            [["Político", "Política estatal de gobierno electrónico y de software libre (D.S. 3251)",
              "Oportunidad: SIGAD usa tecnologías libres"],
             ["Político", "Autonomía universitaria y renovación periódica de autoridades",
              "Amenaza: los cambios de autoridad pueden frenar decisiones"],
             ["Económico", "Escasez de divisas y presión sobre el tipo de cambio desde 2023",
              "Oportunidad: el software nacional cobra en bolivianos y no exige pagos en dólares"],
             ["Económico", "Presupuestos universitarios ajustados", "Amenaza: el cliente busca precios bajos"],
             ["Social", "Estudiantes y docentes exigen trámites más rápidos", "Oportunidad: presión por digitalizar"],
             ["Social", "Resistencia al cambio del personal administrativo", "Amenaza: requiere capacitación"],
             ["Tecnológico", "Mayor acceso a internet y uso masivo de teléfonos inteligentes",
              "Oportunidad: el sistema web es accesible"],
             ["Tecnológico", "Avance de la inteligencia artificial y la firma digital",
              "Oportunidad: nuevas funciones de valor agregado"],
             ["Ecológico", "Interés por reducir el uso de papel", "Oportunidad: argumento de oficina sin papel"],
             ["Legal", "Normativa de documento y firma digital (Ley 164, D.S. 1793)",
              "Oportunidad: validez legal de documentos electrónicos"],
             ["Legal", "Procesos de contratación pública con requisitos formales",
              "Amenaza: ciclos de venta más largos en el sector público"]],
            "Elaboración propia.", [2.6, 7, 6.4])
    a.p("El balance del análisis es favorable: predominan las oportunidades. Las principales amenazas, "
        "como la rotación de autoridades, la resistencia al cambio y la contratación pública, no se eliminan "
        "con el producto, sino con el procedimiento de venta y de implantación, que debe prever múltiples "
        "contactos dentro de cada institución y una capacitación cuidadosa.")

    a.h2("Análisis del mercado")
    a.ps(
        "El mercado potencial de SIGAD está formado por todas las unidades académicas que manejan "
        "documentación institucional. En Bolivia, el Sistema de la Universidad Boliviana agrupa a las "
        "universidades públicas autónomas y de régimen especial, y la Asociación Nacional de Universidades "
        "Privadas (ANUP) agrupa a las universidades privadas. A ellas se suman los institutos técnicos y "
        "tecnológicos de nivel superior, las escuelas de posgrado y las unidades educativas de gran tamaño.",
        "La unidad de compra no es la universidad completa, sino cada dirección de carrera o facultad, "
        "porque cada una tiene su propia secretaría y su propio archivo. Esto multiplica el mercado: una "
        "sola universidad grande puede tener más de cincuenta carreras. La siguiente tabla presenta la "
        "estimación del mercado en tres niveles.",
    )
    a.tabla("Estimación del tamaño del mercado de SIGAD",
            ["Nivel de mercado", "Descripción", "Unidades estimadas", "Valor anual estimado"],
            [["Mercado total (TAM)", "Unidades académicas de educación superior en Bolivia", "2 400",
              D.bs(2400 * 590 * 12)],
             ["Mercado disponible (SAM)", "Unidades en Santa Cruz, Cochabamba, La Paz y Chuquisaca con internet "
              "estable y sin sistema documental", "1 100", D.bs(1100 * 590 * 12)],
             ["Mercado objetivo (SOM)", "Unidades que SIGAD puede captar en tres años", "80",
              D.bs(80 * 590 * 12)]],
            "Estimación propia calculada con el precio mensual del plan Básico. Las cifras deben validarse "
            "con información oficial del Ministerio de Educación, el CEUB y la ANUP.", [3.6, 6.4, 2.6, 3.4])
    a.figura("Composición estimada del mercado potencial por tipo de institución", "graficos/g03_segmentacion.png",
             "Estimación propia.", 5.4)

    a.h2("Análisis de la competencia")
    a.ps(
        "SIGAD no compite únicamente con otros programas. Su competidor más fuerte es la costumbre: el "
        "cuaderno de registro, las carpetas físicas, las hojas de Excel y las carpetas compartidas en "
        "Google Drive. Estas soluciones son gratuitas o muy baratas, pero no ofrecen seguimiento, permisos, "
        "notificaciones ni formatos institucionales. La siguiente tabla compara las alternativas.",
    )
    a.tabla("Comparación de SIGAD con sus competidores y sustitutos",
            ["Alternativa", "Costo aproximado", "Fortalezas", "Debilidades"],
            [["Registro manual y archivo físico", "Muy bajo", "Conocido por todos", "Pérdidas, lentitud, sin respaldo"],
             ["Excel y Google Drive", "Gratis o bajo", "Flexible, conocido", "Sin control de estados, permisos ni formatos"],
             ["Sistema propio de la universidad", "Ya invertido", "Integrado a la institución",
              "Antiguo, sin soporte, difícil de cambiar"],
             ["Desarrollo a medida", "Bs 40 000 a Bs 80 000", "Adaptado al cliente", "Caro, lento, depende de un programador"],
             ["Alfresco con consultoría", "Bs 30 000 a Bs 60 000", "Potente y reconocido",
              "Complejo, requiere personal técnico"],
             ["Gestor documental extranjero licenciado", "USD 3 000 a USD 8 000 por año", "Funciones avanzadas",
              "Pago en dólares, soporte lejano, genérico"],
             ["SIGAD", "Desde Bs 590 al mes", "Especializado en lo académico, local, rápido de implantar",
              "Marca nueva, pocos casos de éxito"]],
            "Rangos de costo referenciales. Elaboración propia.", [3.6, 3.2, 4.4, 4.8])
    a.figura("Comparación del costo del primer año entre SIGAD y otras alternativas", "graficos/g08_precios.png",
             "Las alternativas marcadas como «ref.» son valores referenciales promedio. Elaboración propia.", 5.8)
    a.h3("Mapa de posicionamiento")
    a.p("El mapa perceptual ubica a las alternativas según dos atributos que los clientes valoran: la "
        "especialización en la gestión académica y documental, y la accesibilidad del precio. El cuadrante "
        "superior derecho, que combina especialización y precio accesible, está prácticamente vacío. Allí "
        "se ubica SIGAD, lo que corresponde a la lógica del océano azul descrita por Kim y Mauborgne (2015).")
    a.figura("Mapa perceptual de posicionamiento", "graficos/g09_posicionamiento.png", "Elaboración propia.", 5.2)

    a.h2("Análisis de la industria: cinco fuerzas de Porter")
    a.figura("Cinco fuerzas competitivas aplicadas a SIGAD", "graficos/g16_porter.png",
             "Elaboración propia con base en Porter (2008).", 5.8)
    a.tabla("Evaluación de las cinco fuerzas competitivas",
            ["Fuerza", "Nivel", "Justificación", "Respuesta estratégica"],
            [["Rivalidad entre competidores", "Media", "Pocos competidores especializados en lo académico",
              "Diferenciarse por especialización y soporte local"],
             ["Amenaza de nuevos entrantes", "Media-alta", "Programar un sistema básico no es difícil",
              "Construir marca, casos de éxito y contratos anuales"],
             ["Amenaza de sustitutos", "Alta", "Excel, Drive y papel son gratuitos y conocidos",
              "Demostrar ahorro de tiempo con datos concretos"],
             ["Poder de los clientes", "Alto", "Instituciones grandes negocian precio y condiciones",
              "Planes escalonados y valor agregado en lugar de descuentos"],
             ["Poder de los proveedores", "Bajo", "Muchos proveedores de nube y tecnologías libres",
              "Mantener independencia tecnológica"]],
            "Elaboración propia.", [3.4, 1.8, 5.4, 5.4])

    a.h2("Análisis FODA")
    a.tabla("Matriz FODA de SIGAD",
            ["Fortalezas", "Debilidades"],
            [["F1. Producto funcional y probado en una carrera real\n"
              "F2. Especializado en procesos académicos (auxiliares, actas, constancias)\n"
              "F3. Tecnologías libres sin costo de licencias\n"
              "F4. Equipo local con conocimiento del medio universitario\n"
              "F5. Implantación rápida en la nube",
              "D1. Marca nueva y sin reconocimiento\n"
              "D2. Pocos casos de éxito documentados\n"
              "D3. Equipo pequeño con capacidad limitada\n"
              "D4. Capital inicial reducido\n"
              "D5. Sin aplicación móvil ni firma digital todavía"]],
            None, [8, 8])
    a.tabla("Matriz FODA de SIGAD: factores externos",
            ["Oportunidades", "Amenazas"],
            [["O1. Política de gobierno electrónico y software libre\n"
              "O2. Escasez de divisas que encarece el software extranjero\n"
              "O3. Exigencias de acreditación que piden información ordenada\n"
              "O4. Gran número de unidades académicas sin sistema\n"
              "O5. Tendencia a reducir el uso de papel",
              "A1. Resistencia al cambio del personal\n"
              "A2. Rotación de autoridades universitarias\n"
              "A3. Procesos de contratación pública lentos\n"
              "A4. Ingreso de competidores con más capital\n"
              "A5. Cortes de internet en provincias"]],
            "Elaboración propia.", [8, 8])
    a.h3("Matriz de evaluación de factores internos (EFI)")
    efi = [("F1. Producto probado", 0.15, 4), ("F2. Especialización académica", 0.15, 4),
           ("F3. Sin costo de licencias", 0.10, 3), ("F4. Equipo local", 0.10, 3),
           ("F5. Implantación rápida", 0.10, 3), ("D1. Marca nueva", 0.12, 1), ("D2. Pocos casos de éxito", 0.10, 1),
           ("D3. Capacidad limitada", 0.08, 2), ("D4. Capital reducido", 0.05, 2), ("D5. Sin app móvil", 0.05, 2)]
    tot = sum(p * c for _, p, c in efi)
    a.tabla("Matriz EFI de SIGAD",
            ["Factor interno", "Peso", "Calificación", "Valor ponderado"],
            [[f, f"{p:.2f}".replace(".", ","), c, f"{p * c:.2f}".replace(".", ",")] for f, p, c in efi]
            + [["**Total**", "**1,00**", "", f"**{tot:.2f}**".replace(".", ",")]],
            "Calificación: 1 = debilidad mayor, 2 = debilidad menor, 3 = fortaleza menor, 4 = fortaleza mayor. "
            "Elaboración propia.", [7, 2.4, 3, 3.6])
    a.p(f"El total ponderado de {tot:.2f}".replace(".", ",") + " es superior al promedio de 2,50, lo que indica "
        "una posición interna fuerte. Las fortalezas del producto compensan las debilidades de una empresa "
        "nueva, siempre que estas últimas se ataquen desde el inicio con un plan de casos de éxito y de "
        "construcción de marca.")
    a.h3("Matriz de evaluación de factores externos (EFE)")
    efe = [("O1. Gobierno electrónico y software libre", 0.10, 3), ("O2. Escasez de divisas", 0.12, 3),
           ("O3. Exigencias de acreditación", 0.13, 4), ("O4. Muchas unidades sin sistema", 0.15, 4),
           ("O5. Reducción del papel", 0.05, 2), ("A1. Resistencia al cambio", 0.15, 3),
           ("A2. Rotación de autoridades", 0.10, 2), ("A3. Contratación pública lenta", 0.10, 2),
           ("A4. Nuevos competidores", 0.05, 2), ("A5. Cortes de internet", 0.05, 2)]
    tot2 = sum(p * c for _, p, c in efe)
    a.tabla("Matriz EFE de SIGAD",
            ["Factor externo", "Peso", "Calificación", "Valor ponderado"],
            [[f, f"{p:.2f}".replace(".", ","), c, f"{p * c:.2f}".replace(".", ",")] for f, p, c in efe]
            + [["**Total**", "**1,00**", "", f"**{tot2:.2f}**".replace(".", ",")]],
            "Calificación: 1 = respuesta deficiente, 2 = promedio, 3 = superior al promedio, 4 = excelente. "
            "Elaboración propia.", [7, 2.4, 3, 3.6])
    a.p(f"El total de {tot2:.2f}".replace(".", ",") + " muestra que la estrategia planteada responde por "
        "encima del promedio a las oportunidades y amenazas del entorno. La amenaza de la resistencia al "
        "cambio recibe una buena respuesta porque el procedimiento incluye capacitación y acompañamiento; "
        "en cambio, la rotación de autoridades y la contratación pública requieren mayor atención.")
    a.h3("Estrategias FODA cruzado")
    a.tabla("Estrategias derivadas del FODA cruzado",
            ["Tipo", "Estrategia"],
            [["FO (ofensivas)", "Promocionar SIGAD como software nacional, libre y pagadero en bolivianos (F3, O1, O2)\n"
              "Ofrecer un paquete «listo para acreditación» con expedientes de docentes (F2, O3)"],
             ["DO (de reorientación)", "Conseguir tres clientes piloto con descuento a cambio de testimonios (D2, O4)\n"
              "Incorporar firma digital en la hoja de ruta del producto (D5, O1)"],
             ["FA (defensivas)", "Incluir capacitación y soporte cercano en todos los planes (F4, A1)\n"
              "Firmar contratos anuales con la institución y no con la persona (F5, A2)"],
             ["DA (de supervivencia)", "Ajustar precios a los montos de contratación menor (D4, A3)\n"
              "Permitir el registro sin conexión con sincronización posterior (D5, A5)"]],
            "Elaboración propia.", [3.6, 12.4])
    a.h2("Estrategias de crecimiento: matriz de Ansoff")
    a.p("La matriz de Ansoff ordena la secuencia de crecimiento. En el primer año, la prioridad es la "
        "penetración de mercado con el producto actual en Santa Cruz. Desde el segundo año se inicia el "
        "desarrollo de mercado hacia otros departamentos y el desarrollo de nuevos módulos. La "
        "diversificación hacia instituciones públicas no educativas se plantea solo como opción a largo plazo.")
    a.figura("Matriz de Ansoff aplicada a SIGAD", "graficos/g19_ansoff.png", "Elaboración propia.", 5.0)


def investigacion(a):
    a.h1("Investigación de mercado")
    a.p("La investigación de mercado reduce la incertidumbre de las decisiones comerciales. Hernández Sampieri "
        "et al. (2014) señalan que todo estudio debe partir de objetivos claros, un diseño adecuado, una "
        "muestra representativa y un instrumento válido. Este capítulo describe la investigación diseñada "
        "para SIGAD y presenta los resultados esperados que se utilizaron para planificar.")
    a.h2("Objetivos de la investigación")
    a.lista([
        "Identificar los principales problemas en la gestión documental de las unidades académicas.",
        "Conocer las herramientas que utilizan actualmente para registrar y archivar documentos.",
        "Estimar la disposición de pago mensual por un sistema especializado.",
        "Identificar a las personas que influyen en la decisión de compra.",
        "Determinar los canales de comunicación preferidos para recibir información comercial.",
    ], numerada=True)
    a.h2("Diseño de la investigación")
    a.tabla("Ficha técnica de la investigación de mercado",
            ["Elemento", "Descripción"],
            [["Tipo de estudio", "Cuantitativo, descriptivo, de corte transversal"],
             ["Población", "Personal de direcciones de carrera, decanatos e institutos del departamento de Santa Cruz"],
             ["Unidad de análisis", "Unidad académica (una respuesta por unidad)"],
             ["Tamaño de la población", "Aproximadamente 420 unidades académicas"],
             ["Muestra", "201 unidades (95 % de confianza, 5 % de error)"],
             ["Muestreo", "Probabilístico estratificado por tipo de institución"],
             ["Instrumento", "Cuestionario de 15 preguntas cerradas y 2 abiertas (Anexo A)"],
             ["Aplicación", "Formulario en línea enviado por WhatsApp y correo, y visitas presenciales"],
             ["Periodo", "Febrero de 2027"]],
            "Elaboración propia.", [4.5, 11.5])
    a.h3("Cálculo de la muestra")
    a.p("Para una población finita se aplica la fórmula n = (N · Z² · p · q) / (e² · (N − 1) + Z² · p · q), "
        "donde N es la población (420), Z es el valor de la distribución normal para 95 % de confianza "
        "(1,96), p y q son las proporciones esperadas (0,5 cada una, por no existir estudios previos) y e es "
        "el margen de error (0,05).")
    a.p("Reemplazando: n = (420 · 3,8416 · 0,25) / (0,0025 · 419 + 3,8416 · 0,25) = 403,37 / 2,0079 ≈ 201 "
        "unidades académicas.")
    a.h2("Resultados esperados de la investigación")
    a.p("Los resultados que se presentan a continuación son **estimaciones de planificación** basadas en la "
        "experiencia de la implantación de SIGAD en la Dirección de Carrera de Ingeniería en Sistemas y en "
        "conversaciones informales con personal de otras carreras. Deben reemplazarse por los datos reales "
        "una vez aplicada la encuesta del Anexo A; sin embargo, permiten dimensionar el plan y mostrar cómo "
        "se analizarán los resultados.")
    a.h3("Problemas en la gestión documental")
    a.p("La demora en la búsqueda de archivos y la pérdida de documentos son los problemas más mencionados. "
        "Estos dos problemas se convierten en los mensajes centrales de la comunicación: «encuentra cualquier "
        "documento en segundos» y «ninguna nota se vuelve a perder».")
    a.figura("Principales problemas identificados en la gestión documental", "graficos/g04_problemas.png",
             "Pregunta de respuesta múltiple; los porcentajes no suman 100. Datos estimados para planificación.", 6.0)
    a.h3("Herramientas utilizadas actualmente")
    a.tabla("Herramientas que utilizan las unidades académicas para gestionar documentos",
            ["Herramienta", "Porcentaje estimado", "Interpretación"],
            [["Cuaderno de registro y archivo físico", "78 %", "Práctica dominante: gran oportunidad"],
             ["Hojas de cálculo (Excel)", "64 %", "Se usa junto al cuaderno, con duplicidad"],
             ["Carpetas en la nube (Drive, OneDrive)", "37 %", "Digitalización parcial, sin control"],
             ["Sistema institucional antiguo", "14 %", "Cliente que podría migrar"],
             ["Sistema especializado moderno", "4 %", "Competencia directa casi inexistente"]],
            "Respuesta múltiple. Datos estimados para planificación.", [6.5, 3.5, 6])
    a.h3("Disposición de pago")
    a.p("El 39 % estaría dispuesto a pagar entre Bs 301 y Bs 600 mensuales por unidad, y el 32 % más de Bs 600. "
        "Esto confirma que el precio del plan Básico (Bs 590) se ubica en el rango aceptado por la mayoría, "
        "aunque en el límite superior; por ello se ofrece un descuento por pago anual y un precio de "
        "introducción para los primeros clientes.")
    a.figura("Disposición de pago mensual por un sistema especializado", "graficos/g05_pago.png",
             "Datos estimados para planificación.", 5.8)
    a.h3("Personas que influyen en la decisión")
    a.figura("Persona que toma la decisión final de compra", "graficos/g07_decisores.png",
             "Datos estimados para planificación.", 5.0)
    a.p("El director de carrera es el decisor principal en el 41 % de los casos, seguido por el decano. "
        "Sin embargo, el jefe de sistemas aparece en el 15 % de los casos y suele tener poder de veto "
        "técnico. Por ello, el procedimiento de venta exige identificar y convencer tanto al decisor como "
        "al influenciador técnico.")
    a.h3("Canales de comunicación preferidos")
    a.figura("Canales preferidos para recibir información sobre software", "graficos/g06_canales.png",
             "Pregunta de respuesta múltiple. Datos estimados para planificación.", 6.0)
    a.p("WhatsApp y la recomendación de colegas son los canales preferidos, seguidos de la visita "
        "presencial. LinkedIn tiene poca preferencia. Esto orienta el presupuesto hacia la comunicación "
        "directa, el programa de referidos y las visitas, y deja la publicidad masiva como apoyo.")
    a.h2("Conclusiones de la investigación")
    a.lista([
        "Existe un problema real y extendido: la mayoría de las unidades aún trabaja con cuadernos y Excel.",
        "La competencia directa especializada es mínima; el principal competidor es la costumbre.",
        "El precio propuesto es aceptable si se acompaña de valor agregado y facilidades de pago.",
        "La venta requiere convencer a varias personas: director, decano y jefe de sistemas.",
        "Los canales más efectivos son personales: WhatsApp, visitas y recomendaciones.",
    ])
