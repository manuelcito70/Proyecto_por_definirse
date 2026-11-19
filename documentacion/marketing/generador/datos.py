# -*- coding: utf-8 -*-
"""Datos numéricos únicos del plan (los usan los gráficos y el texto)."""

EMPRESA = "Ichilo Soft"
PRODUCTO = "SIGAD"

# ---------------------------------------------------------------- planes
PLANES = [
    # nombre, implantación (Bs), mensual (Bs), anual con descuento (Bs), alcance
    {"nombre": "Básico", "impl": 4000, "mes": 590, "anual": 6372,
     "alcance": "1 dirección de carrera, 10 usuarios, 50 GB"},
    {"nombre": "Profesional", "impl": 8500, "mes": 1390, "anual": 15012,
     "alcance": "Facultad hasta 8 unidades, 40 usuarios, 250 GB"},
    {"nombre": "Institucional", "impl": 22000, "mes": 3490, "anual": 37692,
     "alcance": "Universidad completa, usuarios ilimitados, 1 TB"},
]

# clientes nuevos por año y plan
NUEVOS = {
    1: {"Básico": 11, "Profesional": 4, "Institucional": 1},
    2: {"Básico": 18, "Profesional": 8, "Institucional": 2},
    3: {"Básico": 24, "Profesional": 11, "Institucional": 4},
}
RETENCION = 0.92          # clientes que renuevan cada año
MESES_PROMEDIO_NUEVO = 6  # un cliente nuevo factura en promedio medio año

# costos fijos mensuales por año (Bs)
PERSONAL = [
    # cargo, sueldo mensual, año desde que se contrata
    ("Gerente general y jefe de producto", 5000, 1),
    ("Desarrollador full stack", 4500, 1),
    ("Ejecutivo de ventas (sueldo base)", 3000, 1),
    ("Técnico de implantación y soporte", 3200, 2),
    ("Analista de marketing digital", 3500, 2),
    ("Segundo desarrollador", 4500, 3),
]
CARGAS_SOCIALES = 0.1671  # aportes patronales aproximados (Bolivia)
OTROS_FIJOS_MES = [
    ("Servidores en la nube y respaldos", 900),
    ("Alquiler de oficina y servicios básicos", 1500),
    ("Internet, telefonía y licencias de herramientas", 600),
    ("Contabilidad, impuestos y trámites", 500),
]
PRESUPUESTO_MKT = {1: 48000, 2: 60000, 3: 72000}
COMISION_VENTAS = 0.10  # sobre implantación
COSTO_VAR_IMPL = 0.22   # viajes, capacitación y horas de implantación
INVERSION_INICIAL = [
    ("Equipos de cómputo (3 laptops)", 16500),
    ("Mobiliario de oficina", 4500),
    ("Registro de empresa, marca y trámites legales", 5000),
    ("Ajustes del producto para versión comercial", 15000),
    ("Sitio web, identidad de marca y material inicial", 8000),
    ("Capital de trabajo (3 meses)", 51000),
]
TASA_DESCUENTO = 0.12


def fmt(n, dec=0):
    """Formato boliviano: espacio de miles, coma decimal."""
    neg = n < 0
    n = abs(n)
    s = f"{n:,.{dec}f}".replace(",", " ").replace(".", ",")
    return ("-" if neg else "") + s


def bs(n, dec=0):
    return "Bs " + fmt(n, dec)


def plan(nombre):
    return next(p for p in PLANES if p["nombre"] == nombre)


def proyeccion():
    activos_prev = {p["nombre"]: 0.0 for p in PLANES}
    filas = []
    for anio in (1, 2, 3):
        imp = sub = 0.0
        activos_fin = {}
        for p in PLANES:
            n = p["nombre"]
            nuevos = NUEVOS[anio][n]
            retenidos = activos_prev[n] * RETENCION
            imp += nuevos * p["impl"]
            sub += retenidos * p["mes"] * 12 + nuevos * p["mes"] * MESES_PROMEDIO_NUEVO
            activos_fin[n] = retenidos + nuevos
        personal = sum(s for _, s, desde in PERSONAL if desde <= anio) * 12 * (1 + CARGAS_SOCIALES)
        otros = sum(v for _, v in OTROS_FIJOS_MES) * 12
        mkt = PRESUPUESTO_MKT[anio]
        comision = imp * COMISION_VENTAS
        var_impl = imp * COSTO_VAR_IMPL
        ingresos = imp + sub
        costos = personal + otros + mkt + comision + var_impl
        utilidad_ai = ingresos - costos
        iue = max(utilidad_ai, 0) * 0.25
        filas.append({
            "anio": anio, "impl": imp, "sub": sub, "ingresos": ingresos,
            "personal": personal, "otros": otros, "mkt": mkt,
            "comision": comision, "var_impl": var_impl, "costos": costos,
            "utilidad_ai": utilidad_ai, "iue": iue, "neta": utilidad_ai - iue,
            "clientes": round(sum(activos_fin.values())),
            "nuevos": sum(NUEVOS[anio].values()),
            "activos": activos_fin,
        })
        activos_prev = activos_fin
    return filas


def inversion_total():
    return sum(v for _, v in INVERSION_INICIAL)


def van_tir():
    flujos = [-inversion_total()] + [f["neta"] for f in proyeccion()]
    van = sum(f / (1 + TASA_DESCUENTO) ** i for i, f in enumerate(flujos))
    lo, hi = -0.99, 5.0
    for _ in range(200):
        mid = (lo + hi) / 2
        v = sum(f / (1 + mid) ** i for i, f in enumerate(flujos))
        lo, hi = (mid, hi) if v > 0 else (lo, mid)
    return flujos, van, mid


def equilibrio():
    """Clientes Básico-equivalentes que cubren los costos fijos del año 2."""
    f = proyeccion()[1]
    fijos_mes = (f["personal"] + f["otros"] + f["mkt"]) / 12
    margen = plan("Básico")["mes"]
    return fijos_mes, margen, fijos_mes / margen


def cac_ltv():
    """CAC = marketing + comisiones + sueldo del vendedor / clientes nuevos.
    LTV = ingreso mensual promedio x 12 x margen bruto 75 % x vida útil de 5 años."""
    vend = 3000 * 12 * (1 + CARGAS_SOCIALES)
    cac = [(PRESUPUESTO_MKT[f["anio"]] + f["comision"] + vend) / f["nuevos"] for f in proyeccion()]
    arpu = sum(p["mes"] * w for p, w in zip(PLANES, (0.62, 0.30, 0.08)))
    ltv = arpu * 12 * 0.75 * 5
    return cac, arpu, ltv


# embudo comercial anual (año 1)
EMBUDO = [
    ("Visitantes del sitio web y redes", 12000),
    ("Prospectos registrados (leads)", 480),
    ("Prospectos calificados (BANT)", 160),
    ("Demostraciones realizadas", 80),
    ("Propuestas enviadas", 40),
    ("Contratos firmados", 16),
]

PRESUPUESTO_DETALLE = [
    ("Publicidad digital (Meta, Google, LinkedIn)", 14500),
    ("Producción de contenido (video, blog, diseño)", 8000),
    ("Ferias, congresos y eventos universitarios", 7500),
    ("Visitas comerciales y viáticos", 6500),
    ("Material impreso y merchandising", 3500),
    ("Webinars y talleres gratuitos", 2500),
    ("Herramientas (CRM, email marketing, SEO)", 3500),
    ("Programa de referidos e incentivos", 2000),
]

if __name__ == "__main__":
    for f in proyeccion():
        print({k: (round(v) if isinstance(v, float) else v) for k, v in f.items() if k != "activos"})
    print("inversion", inversion_total())
    print(van_tir())
    print(equilibrio())
    print(sum(v for _, v in PRESUPUESTO_DETALLE))
