# -*- coding: utf-8 -*-
"""Presupuesto, finanzas, cronograma, control, conclusiones, referencias y anexos."""
import datos as D

CAP = "../../capturas/"


def financiero(a):
    P = D.proyeccion()
    flujos, van, tir = D.van_tir()
    a.h1("Presupuesto y evaluación financiera")
    a.p("Este capítulo traduce el plan a números. Permite saber cuánto dinero se necesita para iniciar, "
        "cuánto se invertirá en marketing, cuántos clientes se necesitan para cubrir los costos y si el "
        "proyecto es rentable.")
    a.h2("Inversión inicial")
    a.tabla("Inversión inicial requerida",
            ["Concepto", "Monto"],
            [[c, D.bs(v)] for c, v in D.INVERSION_INICIAL] + [["**Total inversión**", f"**{D.bs(D.inversion_total())}**"]],
            "Financiamiento previsto: 60 % aporte de socios y 40 % crédito para emprendimientos productivos. "
            "Elaboración propia.", [11, 5])
    a.h2("Presupuesto de marketing")
    a.p("El presupuesto de marketing del primer año asciende a " + D.bs(D.PRESUPUESTO_MKT[1]) + ", que "
        "representa alrededor del " + f"{D.PRESUPUESTO_MKT[1] / P[0]['ingresos'] * 100:.0f} %" + " de los "
        "ingresos proyectados. Es un porcentaje alto, propio de la etapa de introducción del producto; en el "
        "tercer año baja a " + f"{D.PRESUPUESTO_MKT[3] / P[2]['ingresos'] * 100:.0f} %" + " de los ingresos.")
    a.tabla("Distribución del presupuesto de marketing del año 1",
            ["Rubro", "Monto anual", "Porcentaje"],
            [[c, D.bs(v), f"{v / D.PRESUPUESTO_MKT[1] * 100:.1f} %".replace(".", ",")] for c, v in D.PRESUPUESTO_DETALLE]
            + [["**Total**", f"**{D.bs(D.PRESUPUESTO_MKT[1])}**", "**100 %**"]],
            "Elaboración propia.", [9, 4, 3])
    a.figura("Distribución del presupuesto de marketing del año 1", "graficos/g13_presupuesto.png",
             "Elaboración propia.", 6.0)
    a.h2("Proyección de ventas")
    filas = []
    for p in D.PLANES:
        filas.append([p["nombre"]] + [str(D.NUEVOS[y][p["nombre"]]) for y in (1, 2, 3)])
    filas.append(["**Total clientes nuevos**"] + [f"**{f['nuevos']}**" for f in P])
    filas.append(["Clientes activos al cierre"] + [str(f["clientes"]) for f in P])
    a.tabla("Proyección de clientes nuevos por plan y año",
            ["Plan", "Año 1", "Año 2", "Año 3"], filas,
            f"Se considera una tasa de renovación anual de {D.RETENCION * 100:.0f} %. Elaboración propia.",
            [7, 3, 3, 3])
    a.figura("Clientes activos al cierre de cada año por plan", "graficos/g12_clientes.png",
             "Elaboración propia.", 5.6)
    a.h2("Estado de resultados proyectado")
    rows = [("Ingresos por implantación", "impl"), ("Ingresos por suscripciones", "sub"),
            ("**Total ingresos**", "ingresos"), ("Sueldos y cargas sociales", "personal"),
            ("Gastos de operación (nube, oficina, servicios)", "otros"), ("Marketing", "mkt"),
            ("Comisiones de venta", "comision"), ("Costos variables de implantación", "var_impl"),
            ("**Total costos y gastos**", "costos"), ("**Utilidad antes de impuestos**", "utilidad_ai"),
            ("Impuesto sobre las utilidades (25 %)", "iue"), ("**Utilidad neta**", "neta")]
    a.tabla("Estado de resultados proyectado a tres años (en bolivianos)",
            ["Concepto", "Año 1", "Año 2", "Año 3"],
            [[n] + [(f"**{D.fmt(f[k])}**" if n.startswith("**") else D.fmt(f[k])) for f in P] for n, k in rows],
            "Los ingresos se expresan sin IVA. Elaboración propia.", [7.6, 2.8, 2.8, 2.8])
    a.figura("Ingresos, costos y utilidad neta proyectados", "graficos/g11_proyeccion.png",
             "Elaboración propia.", 6.0)
    a.p(f"El primer año presenta una pérdida de {D.bs(-P[0]['neta'])}, que es normal en la etapa de "
        "introducción, porque los costos de marketing y personal se asumen antes de que se acumulen las "
        f"suscripciones. En el segundo año la utilidad neta llega a {D.bs(P[1]['neta'])} y en el tercero a "
        f"{D.bs(P[2]['neta'])}. Esta evolución muestra la ventaja del modelo de suscripción: cada cliente "
        "conseguido sigue pagando en los años siguientes, por lo que los ingresos crecen más rápido que los "
        "costos.")
    a.h2("Flujo de caja, VAN y TIR")
    a.tabla("Flujo de caja proyectado y evaluación financiera",
            ["Concepto", "Año 0", "Año 1", "Año 2", "Año 3"],
            [["Flujo neto"] + [D.fmt(f) for f in flujos],
             ["Flujo acumulado"] + [D.fmt(sum(flujos[:i + 1])) for i in range(4)],
             ["Factor de descuento (12 %)"] + [f"{1 / 1.12 ** i:.4f}".replace(".", ",") for i in range(4)],
             ["Flujo descontado"] + [D.fmt(f / 1.12 ** i) for i, f in enumerate(flujos)]],
            f"VAN = {D.bs(van)}; TIR = {tir * 100:.1f} %. Tasa de descuento: 12 % anual. Elaboración propia."
            .replace(".", ",", 1) if False else
            f"VAN = {D.bs(van)}; TIR = {tir * 100:.1f} %; tasa de descuento de 12 % anual. Elaboración propia.",
            [5, 2.75, 2.75, 2.75, 2.75])
    a.p(f"El valor actual neto (VAN) es de {D.bs(van)}, es decir, positivo: el proyecto recupera la "
        "inversión, cubre el costo de oportunidad del dinero (12 % anual) y genera un excedente. La tasa "
        f"interna de retorno (TIR) es de {tir * 100:.1f} %, muy superior a la tasa de descuento. Ambos "
        "indicadores señalan que el proyecto es financieramente viable. El flujo acumulado se vuelve positivo "
        "durante el tercer año, que es el periodo de recuperación de la inversión.")
    a.h2("Punto de equilibrio")
    fijos, margen, q = D.equilibrio()
    a.p(f"Los costos fijos mensuales del segundo año (personal, operación y marketing) suman {D.bs(fijos)}. Si "
        f"cada suscripción del plan Básico aporta {D.bs(margen)} al mes, se necesitan aproximadamente "
        f"{q:.0f} suscripciones Básico equivalentes para cubrir los costos fijos únicamente con ingresos "
        "recurrentes. Considerando que los planes Profesional e Institucional equivalen a 2,4 y 5,9 "
        "suscripciones Básico respectivamente, y que los pagos de implantación cubren parte de los costos, el "
        "equilibrio operativo se alcanza a mediados del segundo año.")
    a.figura("Punto de equilibrio en suscripciones mensuales", "graficos/g14_equilibrio.png",
             "Elaboración propia.", 5.8)
    a.h2("Costo de adquisición y valor de vida del cliente")
    cac, arpu, ltv = D.cac_ltv()
    a.p(f"El costo de adquisición de cliente (CAC) del primer año es de {D.bs(cac[0])}, al considerar el "
        "presupuesto de marketing, las comisiones y el sueldo del vendedor. El ingreso mensual promedio por "
        f"cliente es de {D.bs(arpu)} y, con un margen bruto de 75 % y una vida útil conservadora de cinco años, "
        f"el valor de vida del cliente (LTV) es de {D.bs(ltv)}. La relación LTV/CAC de {ltv / cac[0]:.1f} veces "
        "supera ampliamente el mínimo recomendado de 3 veces, lo que confirma que invertir en marketing para "
        "conseguir clientes es rentable.")
    a.figura("Relación entre el costo de adquisición y el valor de vida del cliente", "graficos/g21_cac_ltv.png",
             "Elaboración propia.", 5.8)


def cronograma(a):
    a.h1("Cronograma de implementación")
    a.p("El cronograma organiza las actividades del primer año de operación (2027). Las actividades de "
        "preparación se concentran en el primer trimestre, para que el lanzamiento coincida con el inicio del "
        "primer semestre académico, cuando las direcciones de carrera reciben el mayor volumen de documentos.")
    a.figura("Diagrama de Gantt del plan de marketing del año 1", "graficos/g15_gantt.png",
             "Elaboración propia.", 6.4)
    a.tabla("Hitos principales del año 1",
            ["Mes", "Hito", "Indicador de logro"],
            [["Febrero", "Empresa constituida y marca registrada", "Matrícula de comercio y registro en SENAPI"],
             ["Marzo", "Lanzamiento de SIGAD 4.0 comercial y del sitio web", "Sitio en línea y versión publicada"],
             ["Abril", "Primeros 3 clientes fundadores", "Contratos firmados"],
             ["Junio", "Participación en feria o congreso universitario", "50 prospectos registrados"],
             ["Julio", "Primer informe de casos de éxito", "3 testimonios publicados"],
             ["Septiembre", "8 clientes activos", "Contratos firmados"],
             ["Diciembre", f"{D.proyeccion()[0]['nuevos']} clientes activos y evaluación anual", "Informe de cierre"]],
            "Elaboración propia.", [2.6, 7.4, 6])


def control(a):
    a.h1("Control y evaluación del plan")
    a.p("Un plan sin control es solo una intención. El control compara lo planificado con lo logrado, "
        "identifica las desviaciones y define acciones correctivas. Se utiliza un tablero de indicadores que "
        "se revisa en una reunión mensual entre gerencia, ventas, marketing y producción.")
    a.h2("Tablero de indicadores")
    a.tabla("Tablero de indicadores clave de desempeño",
            ["Perspectiva", "Indicador", "Meta año 1", "Responsable"],
            [["Financiera", "Ingresos facturados", D.bs(D.proyeccion()[0]["ingresos"]), "Gerente"],
             ["Financiera", "Ingreso mensual recurrente (MRR) al cierre", D.bs(sum(
                 D.NUEVOS[1][p["nombre"]] * p["mes"] for p in D.PLANES)), "Gerente"],
             ["Clientes", "Clientes nuevos", str(D.proyeccion()[0]["nuevos"]), "Ventas"],
             ["Clientes", "NPS", "+40", "Marketing"],
             ["Clientes", "Tasa de renovación", "92 %", "Ventas"],
             ["Marketing", "Prospectos calificados", "160", "Marketing"],
             ["Marketing", "Costo por prospecto", "Menos de Bs 100", "Marketing"],
             ["Procesos", "Implantaciones a tiempo", "90 %", "Implantación"],
             ["Procesos", "Incidentes resueltos dentro del SLA", "95 %", "Implantación"],
             ["Producción", "Disponibilidad del sistema", "99,5 %", "Desarrollo"],
             ["Aprendizaje", "Horas de capacitación del personal", "40 h por persona", "Gerente"]],
            "Elaboración propia.", [3, 6.4, 3.6, 3])
    a.h2("Acciones correctivas")
    a.tabla("Desviaciones posibles y acciones correctivas",
            ["Si ocurre…", "Entonces…"],
            [["Pocos prospectos (menos de 30 al mes)", "Revisar mensajes y segmentación de anuncios; aumentar talleres gratuitos"],
             ["Muchos prospectos, pocas demostraciones", "Mejorar la calificación y el tiempo de respuesta"],
             ["Muchas demostraciones, pocos cierres", "Revisar precio, propuesta y manejo de objeciones"],
             ["Implantaciones retrasadas", "Contratar apoyo temporal y no comprometer nuevas fechas"],
             ["Clientes que no renuevan", "Entrevistar al cliente, corregir causas y reforzar postventa"],
             ["NPS menor a +20", "Plan de mejora del producto y del soporte con prioridad máxima"]],
            "Elaboración propia.", [6, 10])
    a.h2("Gestión de riesgos")
    a.tabla("Matriz de riesgos del plan",
            ["Riesgo", "Probabilidad", "Impacto", "Medida de mitigación"],
            [["Ventas menores a lo proyectado", "Media", "Alto", "Reducir gastos variables y reforzar canales de referidos"],
             ["Cambio de autoridades en el cliente", "Alta", "Medio", "Contrato institucional y visita a la nueva autoridad"],
             ["Falla del servidor o pérdida de datos", "Baja", "Muy alto", "Respaldos diarios en dos ubicaciones y plan de contingencia"],
             ["Salida de un desarrollador clave", "Media", "Alto", "Documentación del código y revisión cruzada"],
             ["Ingreso de un competidor con más capital", "Media", "Medio", "Fidelización, especialización y contratos anuales"],
             ["Retraso en pagos de instituciones públicas", "Alta", "Medio", "Capital de trabajo de 3 meses y facturación anticipada"],
             ["Inflación y variación del tipo de cambio", "Media", "Medio", "Revisión anual de precios en el contrato"]],
            "Elaboración propia.", [4.6, 2.4, 2, 7])


def conclusiones(a):
    a.h1("Conclusiones")
    a.ps(
        "Se diseñó un procedimiento de marketing completo para la venta de SIGAD, que integra la producción "
        "del software con la estrategia comercial. El procedimiento define diez etapas, desde la "
        "investigación del mercado hasta la renovación del contrato, con responsables, actividades, "
        "registros, tiempos e indicadores, cumpliendo así el objetivo general del trabajo.",
        "El análisis de la situación mostró que existe una oportunidad real: la mayoría de las unidades "
        "académicas todavía gestiona sus documentos con cuadernos, Excel y carpetas físicas, y la competencia "
        "especializada es mínima. El principal competidor no es otro software, sino la costumbre, por lo que "
        "la estrategia debe centrarse en demostrar el valor y reducir el riesgo percibido.",
        "La investigación de mercado diseñada permite validar el problema, la disposición de pago y los "
        "canales preferidos. Los resultados estimados indican que los canales personales (WhatsApp, visitas "
        "y recomendaciones) son los más efectivos, y que la decisión involucra a varias personas, lo que "
        "justifica un procedimiento de venta consultiva.",
        "El plan de producción demuestra que la empresa puede atender la demanda proyectada con una "
        "utilización de su capacidad inferior al 85 %, siempre que ventas y producción se coordinen mediante "
        "reglas claras, como confirmar la disponibilidad de implantación antes de comprometer fechas.",
        "La mezcla de marketing de siete elementos posiciona a SIGAD como el sistema especializado y "
        "accesible para la gestión documental académica, con planes escalonados, prueba gratuita, "
        "capacitación incluida y soporte local, atributos difíciles de igualar por proveedores extranjeros.",
        f"La evaluación financiera muestra que, con una inversión de {D.bs(D.inversion_total())}, el proyecto "
        f"alcanza un VAN de {D.bs(D.van_tir()[1])} y una TIR de {D.van_tir()[2] * 100:.1f} %, con utilidades "
        "desde el segundo año. El modelo de suscripción convierte cada venta en ingresos recurrentes, lo que "
        "hace al negocio sostenible.",
        "Finalmente, se comprobó que producción y marketing no pueden trabajar por separado: marketing "
        "promete y producción cumple. El éxito de la venta de software depende tanto de atraer al cliente "
        "como de cumplirle después de la compra, porque en un mercado pequeño y conectado como el "
        "universitario, cada cliente satisfecho es el mejor vendedor.",
    )
    a.h1("Recomendaciones")
    a.lista([
        "Aplicar la encuesta del Anexo A antes del lanzamiento y ajustar precios, mensajes y canales con los "
        "datos reales.",
        "Conseguir tres clientes fundadores en los primeros dos meses y documentar sus resultados con cifras "
        "concretas, porque serán el principal argumento de venta.",
        "Implementar un CRM desde el primer día, aunque sea gratuito, para no perder ningún prospecto.",
        "Respetar la regla de capacidad: no prometer fechas de implantación que el equipo no pueda cumplir.",
        "Priorizar en la hoja de ruta la firma digital y la aplicación móvil, que son las funciones más "
        "solicitadas por el mercado.",
        "Revisar el procedimiento cada seis meses y actualizarlo con lo aprendido en las ventas reales.",
        "Registrar la marca SIGAD en el Servicio Nacional de Propiedad Intelectual (SENAPI) y el software "
        "como obra protegida por derecho de autor.",
        "Buscar convenios con la propia universidad para que estudiantes realicen prácticas en la empresa, "
        "lo que fortalece la relación con el sector y reduce costos de personal.",
    ], numerada=True)


REFS = [
    "American Psychological Association. (2020). *Publication manual of the American Psychological Association* "
    "(7.ª ed.). https://doi.org/10.1037/0000165-000",
    "Chaffey, D., & Ellis-Chadwick, F. (2019). *Digital marketing: Strategy, implementation and practice* "
    "(7.ª ed.). Pearson.",
    "Chase, R. B., & Jacobs, F. R. (2014). *Administración de operaciones: Producción y cadena de suministros* "
    "(13.ª ed.). McGraw-Hill.",
    "Decreto Supremo N.º 1793 de 2013 [Estado Plurinacional de Bolivia]. Reglamento para el desarrollo de "
    "tecnologías de información y comunicación. 13 de noviembre de 2013.",
    "Decreto Supremo N.º 3251 de 2017 [Estado Plurinacional de Bolivia]. Plan de Implementación de Gobierno "
    "Electrónico y Plan de Implementación de Software Libre y Estándares Abiertos. 12 de julio de 2017.",
    "Halligan, B., & Shah, D. (2010). *Inbound marketing: Get found using Google, social media, and blogs*. "
    "John Wiley & Sons.",
    "Heizer, J., Render, B., & Munson, C. (2020). *Operations management: Sustainability and supply chain "
    "management* (13.ª ed.). Pearson.",
    "Hernández Sampieri, R., Fernández Collado, C., & Baptista Lucio, P. (2014). *Metodología de la "
    "investigación* (6.ª ed.). McGraw-Hill.",
    "International Organization for Standardization. (2011). *Systems and software engineering — Systems and "
    "software Quality Requirements and Evaluation (SQuaRE) — System and software quality models* "
    "(ISO/IEC 25010:2011).",
    "Kim, W. C., & Mauborgne, R. (2015). *La estrategia del océano azul* (ed. ampliada). Profit Editorial.",
    "Kotler, P., & Armstrong, G. (2017). *Fundamentos de marketing* (13.ª ed.). Pearson.",
    "Kotler, P., & Keller, K. L. (2016). *Dirección de marketing* (15.ª ed.). Pearson.",
    "Kotler, P., Kartajaya, H., & Setiawan, I. (2018). *Marketing 4.0: Transforma tu estrategia para atraer "
    "al consumidor digital*. LID Editorial.",
    "Ley N.º 164 de 2011 [Estado Plurinacional de Bolivia]. Ley General de Telecomunicaciones, Tecnologías de "
    "Información y Comunicación. 8 de agosto de 2011.",
    "Ley N.º 453 de 2013 [Estado Plurinacional de Bolivia]. Ley General de los Derechos de las Usuarias y los "
    "Usuarios y de las Consumidoras y los Consumidores. 4 de diciembre de 2013.",
    "Lovelock, C., & Wirtz, J. (2015). *Marketing de servicios: Personal, tecnología y estrategia* (7.ª ed.). "
    "Pearson.",
    "Moore, G. A. (2014). *Crossing the chasm: Marketing and selling disruptive products to mainstream "
    "customers* (3.ª ed.). HarperBusiness.",
    "Osterwalder, A., & Pigneur, Y. (2011). *Generación de modelos de negocio*. Deusto.",
    "Porter, M. E. (2008). Las cinco fuerzas competitivas que le dan forma a la estrategia. *Harvard Business "
    "Review América Latina, 86*(1), 58-77.",
    "Porter, M. E. (2015). *Ventaja competitiva: Creación y sostenimiento de un desempeño superior*. Grupo "
    "Editorial Patria.",
    "Pressman, R. S., & Maxim, B. R. (2020). *Software engineering: A practitioner's approach* (9.ª ed.). "
    "McGraw-Hill Education.",
    "Rackham, N. (1988). *SPIN selling*. McGraw-Hill.",
    "Ries, E. (2012). *El método Lean Startup*. Deusto.",
    "Schwaber, K., & Sutherland, J. (2020). *La Guía Scrum: La guía definitiva de Scrum: Las reglas del juego*. "
    "https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-Spanish-European.pdf",
    "Sommerville, I. (2011). *Ingeniería de software* (9.ª ed.). Pearson Educación.",
]


def referencias(a):
    a.referencias(REFS)


def anexos(a):
    def anexo(letra, titulo):
        a.h1(f"Anexo {letra}")
        par = a.doc.add_paragraph(); par.alignment = 1
        r = par.add_run(titulo); r.bold = True

    anexo("A", "Cuestionario de investigación de mercado")
    a.p("**Presentación:** Estimado(a) colaborador(a), el presente cuestionario tiene fines académicos y "
        "comerciales. Su objetivo es conocer cómo se gestionan los documentos en su unidad académica. La "
        "información es confidencial. Tiempo estimado: 8 minutos.", sangria=False)
    preguntas = [
        ("Tipo de institución", "Universidad pública / Universidad privada / Instituto técnico / Posgrado / Otro"),
        ("Cargo de quien responde", "Director(a) / Decano(a) / Secretario(a) / Jefe de sistemas / Otro"),
        ("¿Cuántos documentos recibe y emite su unidad al mes?", "Menos de 50 / 50 a 150 / 151 a 300 / Más de 300"),
        ("¿Cómo registran actualmente los documentos? (puede marcar varias)",
         "Cuaderno / Excel / Carpetas en la nube / Sistema institucional / Otro"),
        ("¿Cuánto tiempo tardan en promedio en encontrar un documento de hace un año?",
         "Menos de 1 min / 1 a 5 min / 6 a 15 min / Más de 15 min"),
        ("¿Han extraviado documentos en el último año?", "Nunca / 1 o 2 veces / 3 a 5 veces / Más de 5 veces"),
        ("¿Cuáles son los principales problemas en la gestión documental? (varias)",
         "Pérdida / Demora en búsqueda / Falta de seguimiento / Duplicidad / Certificados manuales / Sin respaldo / Otro"),
        ("¿Qué tan importante sería para su unidad contar con un sistema especializado?",
         "Escala de 1 (nada importante) a 5 (muy importante)"),
        ("¿Qué funciones considera indispensables? (varias)",
         "Registro / Búsqueda / Notificaciones / Constancias / Expedientes / Reportes / Firma digital / App móvil"),
        ("¿Cuánto estaría dispuesto a pagar mensualmente por el sistema?",
         "No pagaría / Hasta Bs 300 / Bs 301 a 600 / Bs 601 a 1 000 / Más de Bs 1 000"),
        ("¿Qué forma de pago prefiere?", "Mensual / Anual / Pago único"),
        ("¿Quién toma la decisión final de compra de software en su unidad?",
         "Director / Decano / Rector / Jefe de sistemas / Administración financiera"),
        ("¿Por qué medio prefiere recibir información? (varias)",
         "Visita / WhatsApp / Correo / Facebook / LinkedIn / Ferias / Recomendación de colegas"),
        ("¿Qué factor pesa más en su decisión?", "Precio / Facilidad de uso / Soporte / Seguridad / Recomendaciones"),
        ("¿Le interesaría una demostración gratuita?", "Sí / No / Tal vez"),
        ("¿Qué otro problema le gustaría que un sistema resolviera?", "Pregunta abierta"),
        ("Datos de contacto (opcional)", "Nombre, institución, teléfono y correo"),
    ]
    a.tabla("Preguntas del cuestionario de investigación de mercado",
            ["N.º", "Pregunta", "Opciones de respuesta"],
            [[str(i), q, o] for i, (q, o) in enumerate(preguntas, 1)], None, [1.2, 7.6, 7.2], size=10)

    anexo("B", "Guion de demostración de SIGAD (30 minutos)")
    a.tabla("Guion de demostración paso a paso",
            ["Minuto", "Bloque", "Qué se muestra y qué se dice"],
            [["0-3", "Apertura", "Agradecer, recordar los problemas del diagnóstico y acordar el objetivo de la reunión"],
             ["3-6", "Inicio de sesión y panel", "Ingreso seguro, panel con el logo del cliente, indicadores y calendario"],
             ["6-11", "Documentos recibidos", "Registrar una nota real del cliente, adjuntar el archivo y asignar estado"],
             ["11-14", "Búsqueda", "Encontrar un documento en segundos con filtros: el «momento mágico»"],
             ["14-17", "Documentos expedidos", "Numeración correlativa automática y control de respuestas"],
             ["17-20", "Constancias", "Generar una constancia con formato de oficio institucional"],
             ["20-23", "Expedientes", "Expediente de docente y proceso de auxiliares"],
             ["23-25", "Seguridad y notificaciones", "Roles, permisos, respaldos y avisos automáticos"],
             ["25-28", "Preguntas", "Resolver dudas y objeciones"],
             ["28-30", "Cierre", "Ofrecer prueba gratuita, acordar siguiente paso y fecha de propuesta"]],
            "Elaboración propia.", [1.8, 3.8, 10.4])

    anexo("C", "Modelo de propuesta comercial")
    for t in [
        "**Señor(a):** [Nombre de la autoridad]\n[Cargo] — [Institución]\nPresente.",
        "**Referencia:** Propuesta de implementación del Sistema de Gestión de Archivos y Documentación SIGAD.",
        "**1. Diagnóstico.** En la reunión del [fecha] identificamos que la [unidad] recibe aproximadamente "
        "[N] documentos al mes, que se registran en [cuaderno/Excel], y que la búsqueda de un documento "
        "antiguo toma en promedio [N] minutos. También se mencionó [problema específico].",
        "**2. Solución propuesta.** Implementar SIGAD en su plan [plan], que incluye los módulos de "
        "documentos recibidos y expedidos, actas, expedientes de docentes y auxiliares, constancias, "
        "notificaciones y reportes, configurados con la identidad de su institución.",
        "**3. Resultados esperados.** Reducción del tiempo de búsqueda a menos de 30 segundos; emisión de "
        "constancias en menos de 5 minutos; respaldo diario de toda la documentación; información ordenada "
        "para procesos de acreditación.",
        "**4. Plan de implantación.** Inicio el [fecha]; configuración y migración en 7 días; dos sesiones de "
        "capacitación; puesta en marcha en 14 días.",
        "**5. Inversión.** Implantación: Bs [monto]. Suscripción: Bs [monto] mensuales o Bs [monto] anuales. "
        "Incluye soporte, actualizaciones, respaldos y capacitación.",
        "**6. Garantía.** Prueba gratuita de 30 días y devolución de la suscripción si no está satisfecho en "
        "el primer mes de uso.",
        "**7. Vigencia de la propuesta.** 30 días calendario.",
        "Atentamente,\n[Nombre del ejecutivo]\nIchilo Soft S.R.L.",
    ]:
        for k, ln in enumerate(t.split("\n")):
            a.p(ln, sangria=False)

    anexo("D", "Modelo de cotización")
    a.tabla("Cotización tipo para un plan Básico con pago anual",
            ["Ítem", "Descripción", "Cant.", "Precio unitario", "Subtotal"],
            [["1", "Implantación de SIGAD plan Básico (configuración, migración y capacitación)", "1",
              D.bs(4000), D.bs(4000)],
             ["2", "Suscripción anual SIGAD plan Básico (12 meses, 10 % de descuento)", "1",
              D.bs(6372), D.bs(6372)],
             ["3", "Descuento cliente fundador (50 % de la implantación)", "1", "-" + D.bs(2000), "-" + D.bs(2000)],
             ["", "**Total a pagar (incluye impuestos de ley)**", "", "", f"**{D.bs(8372)}**"]],
            "Forma de pago: 50 % a la firma del contrato y 50 % a la puesta en marcha. Validez: 30 días.",
            [1.2, 8, 1.4, 2.8, 2.6])

    anexo("E", "Modelo de contrato de suscripción (cláusulas principales)")
    clausulas = [
        ("Primera (Partes)", "Intervienen Ichilo Soft S.R.L., en calidad de proveedor, y [institución], en calidad "
         "de cliente, representada por [autoridad]."),
        ("Segunda (Objeto)", "El proveedor otorga al cliente el derecho de uso del sistema SIGAD en la modalidad "
         "de suscripción, en el plan [plan], incluyendo implantación, capacitación, soporte y actualizaciones."),
        ("Tercera (Plazo)", "Doce meses desde la puesta en marcha, renovable por periodos iguales salvo aviso "
         "contrario con 30 días de anticipación."),
        ("Cuarta (Precio y forma de pago)", "Implantación de Bs [monto] y suscripción de Bs [monto], pagaderos "
         "según la propuesta aceptada, contra factura."),
        ("Quinta (Nivel de servicio)", "El proveedor garantiza una disponibilidad mensual de 99,5 % y los tiempos "
         "de respuesta del acuerdo de nivel de servicio anexo."),
        ("Sexta (Propiedad de la información)", "Toda la información registrada pertenece al cliente, quien puede "
         "solicitar su exportación completa en cualquier momento y al finalizar el contrato."),
        ("Séptima (Confidencialidad)", "El proveedor se obliga a no divulgar ni utilizar la información del "
         "cliente para fines distintos al servicio."),
        ("Octava (Propiedad intelectual)", "El software SIGAD es propiedad del proveedor; el cliente adquiere "
         "solamente el derecho de uso durante la vigencia del contrato."),
        ("Novena (Resolución)", "Cualquiera de las partes puede resolver el contrato por incumplimiento, previa "
         "notificación escrita con 15 días de plazo para subsanar."),
        ("Décima (Conformidad)", "Las partes firman en señal de conformidad en dos ejemplares de igual valor."),
    ]
    for t, c in clausulas:
        a.p(f"**Cláusula {t}.** {c}", sangria=False)

    anexo("F", "Ficha comercial (brochure) de SIGAD")
    a.figura("Logotipo de SIGAD para material impreso", "graficos/g20_logo.png", None, 5.0)
    a.p("**¿Tu oficina pierde tiempo buscando documentos?** SIGAD ordena toda la documentación de tu carrera "
        "en un solo lugar seguro.", sangria=False)
    a.lista([
        "Encuentra cualquier nota, acta o expediente en segundos.",
        "Emite certificaciones y constancias con formato institucional en minutos.",
        "Controla quién ve y quién modifica cada documento.",
        "Recibe avisos de documentos pendientes.",
        "Respaldos diarios automáticos: tu información siempre segura.",
        "Implantación en 14 días con capacitación incluida.",
        "Soporte local por WhatsApp, en tu idioma y en tu horario.",
        "Desde Bs 590 al mes. Prueba gratis 30 días.",
    ])
    a.p("**Solicita tu demostración:** WhatsApp +591 7XX XXX XX · sigad.com.bo · Yapacaní y Santa Cruz de la Sierra.",
        sangria=False)

    anexo("G", "Capturas adicionales del sistema")
    for img, t in [("p05-expedidos.png", "Módulo de documentos expedidos"),
                   ("p07-actas.png", "Módulo de actas"),
                   ("p09-docentes.png", "Módulo de docentes"),
                   ("p11-auxiliares-proceso.png", "Proceso de selección de auxiliares"),
                   ("p13-docentes-expediente.png", "Expediente digital del docente"),
                   ("p14-notificaciones.png", "Centro de notificaciones")]:
        a.figura(t, CAP + img, "Captura de pantalla del sistema SIGAD.", 6.0)

    anexo("H", "Calendario anual de contenidos")
    a.tabla("Calendario anual de temas de contenido",
            ["Mes", "Tema central", "Acción destacada"],
            [["Enero", "Planifica tu año sin papeles", "Guía descargable de organización del archivo"],
             ["Febrero", "Prepárate para el semestre", "Lanzamiento de la campaña y del sitio web"],
             ["Marzo", "Inicio de semestre sin caos", "Webinar: cómo recibir 100 notas sin perder ninguna"],
             ["Abril", "Certificaciones en minutos", "Video tutorial y testimonio de cliente fundador"],
             ["Mayo", "Seguridad de tu información", "Artículo técnico para jefes de sistemas"],
             ["Junio", "Acreditación sin estrés", "Plantilla de expediente docente y feria universitaria"],
             ["Julio", "Cierre de semestre ordenado", "Caso de éxito con cifras"],
             ["Agosto", "Segundo semestre", "Campaña de publicidad y webinar"],
             ["Septiembre", "Auxiliares de docencia", "Guía del proceso de selección de auxiliares"],
             ["Octubre", "Día del estudiante y del docente", "Concurso en redes sociales"],
             ["Noviembre", "Presupuesto del próximo año", "Material para justificar la inversión ante el consejo"],
             ["Diciembre", "Balance del año", "Resultados de clientes y anuncio de novedades"]],
            "Elaboración propia.", [2.6, 5.6, 7.8])

    anexo("I", "Formato de registro de prospectos (CRM)")
    a.tabla("Campos del registro de prospectos",
            ["Campo", "Descripción", "Ejemplo"],
            [["Fecha de registro", "Día del primer contacto", "15/03/2027"],
             ["Institución", "Universidad o instituto", "Universidad ejemplo"],
             ["Unidad", "Carrera, facultad o dirección", "Dirección de Carrera de Contaduría"],
             ["Contacto", "Nombre y cargo", "Lic. N. N., secretaria"],
             ["Teléfono y correo", "Datos de contacto", "7XXXXXXX / correo@inst.edu.bo"],
             ["Origen", "Campaña o canal", "Webinar de marzo"],
             ["Puntaje BANT", "Suma de los cuatro criterios", "10 de 12"],
             ["Etapa", "Etapa del embudo", "Demostración agendada"],
             ["Próxima acción", "Tarea y fecha", "Demostración el 22/03"],
             ["Valor estimado", "Implantación + suscripción anual", D.bs(10372)],
             ["Observaciones", "Notas relevantes", "Cambio de director en junio"]],
            "Elaboración propia.", [3.6, 5.6, 6.8])

    anexo("J", "Encuesta de satisfacción y recomendación (NPS)")
    a.tabla("Preguntas de la encuesta de satisfacción",
            ["N.º", "Pregunta", "Escala"],
            [["1", "¿Qué tan probable es que recomiende SIGAD a un colega de otra carrera?", "0 a 10"],
             ["2", "¿Cuál es la razón principal de su calificación?", "Abierta"],
             ["3", "¿Qué tan fácil es usar SIGAD?", "1 a 5"],
             ["4", "¿Cómo califica la atención del soporte técnico?", "1 a 5"],
             ["5", "¿Cuánto tiempo ahorra su unidad desde que usa SIGAD?", "Nada / Poco / Bastante / Mucho"],
             ["6", "¿Qué función le gustaría que agreguemos?", "Abierta"],
             ["7", "¿Podemos publicar su opinión como testimonio?", "Sí / No"]],
            "El NPS se calcula restando el porcentaje de detractores (0 a 6) del porcentaje de promotores (9 y 10). "
            "Elaboración propia.", [1.2, 10.8, 4])
