# -*- coding: utf-8 -*-
"""Genera todos los gráficos y diagramas del documento en ./graficos."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon, Circle, Rectangle
import datos as D

OUT = os.path.join(os.path.dirname(__file__), "graficos")
os.makedirs(OUT, exist_ok=True)
plt.rcParams.update({
    "font.family": "Times New Roman", "font.size": 12,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.titlesize": 13, "axes.labelsize": 12,
})
AZUL, AZUL2, VERDE, NAR, GRIS, ROJO = "#1F4E79", "#5B9BD5", "#2E8B57", "#E39B2D", "#7F7F7F", "#B23A3A"
PAL = [AZUL, VERDE, NAR, AZUL2, GRIS, "#8064A2", ROJO, "#4BACC6"]


def save(fig, name):
    fig.savefig(os.path.join(OUT, name + ".png"), dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def caja(ax, x, y, w, h, txt, color=AZUL, fc=None, fs=10.5, tc="white", round_=True):
    st = "round,pad=0.02,rounding_size=0.08" if round_ else "square,pad=0.02"
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle=st,
                                fc=fc or color, ec=color, lw=1.4))
    ax.text(x, y, txt, ha="center", va="center", fontsize=fs, color=tc, wrap=True)


def flecha(ax, x1, y1, x2, y2, color="#333333"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=14,
                                 color=color, lw=1.3))


def lienzo(w=10, h=6, xl=(0, 10), yl=(0, 6)):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(*xl); ax.set_ylim(*yl); ax.axis("off")
    return fig, ax


# ------------------------------------------------------------------ embudo
def embudo():
    fig, ax = lienzo(10, 6.2, (0, 10), (0, 6.6))
    n = len(D.EMBUDO)
    colores = [AZUL, "#2B6596", AZUL2, VERDE, "#3FA86B", NAR]
    for i, (et, v) in enumerate(D.EMBUDO):
        top = 6.3 - i * 1.0
        w1 = 9 - i * 1.25
        w2 = 9 - (i + 1) * 1.25
        poly = Polygon([[5 - w1 / 2, top], [5 + w1 / 2, top], [5 + w2 / 2, top - 0.9], [5 - w2 / 2, top - 0.9]],
                       fc=colores[i], ec="white")
        ax.add_patch(poly)
        ax.text(5, top - 0.45, f"{et}\n{D.fmt(v)}", ha="center", va="center", color="white", fontsize=10.5,
                fontweight="bold")
        if i > 0:
            pct = v / D.EMBUDO[i - 1][1] * 100
            ax.text(9.3, top - 0.1, f"{pct:.0f} %", fontsize=10, color=GRIS, ha="center")
    ax.text(9.3, 6.45, "Conversión", fontsize=10, color=GRIS, ha="center", style="italic")
    save(fig, "g01_embudo")


# ------------------------------------------------------- flujograma proceso
def flujograma():
    fig, ax = lienzo(10, 12.5, (0, 10), (-0.5, 25))
    pasos = [
        ("Inicio", "o"), ("1. Investigación y\nsegmentación del mercado", "r"),
        ("2. Generación de prospectos\n(marketing digital y presencial)", "r"),
        ("3. Registro del prospecto en el CRM", "r"), ("¿Cumple criterios BANT?", "d"),
        ("4. Primer contacto y\nreunión de diagnóstico", "r"), ("5. Demostración personalizada\nde SIGAD", "r"),
        ("6. Propuesta comercial\ny cotización", "r"), ("¿Acepta la propuesta?", "d"),
        ("7. Negociación y firma\ndel contrato", "r"), ("8. Implantación y migración\nde datos", "r"),
        ("9. Capacitación y\npuesta en marcha", "r"), ("10. Postventa, fidelización\ny renovación", "r"), ("Fin", "o"),
    ]
    y = 24.2
    pos = []
    for txt, t in pasos:
        if t == "o":
            ax.add_patch(FancyBboxPatch((3.9, y - 0.4), 2.2, 0.8, boxstyle="round,pad=0.02,rounding_size=0.4",
                                        fc=GRIS, ec=GRIS))
            ax.text(5, y, txt, ha="center", va="center", color="white", fontsize=11, fontweight="bold")
            h = 0.8
        elif t == "d":
            ax.add_patch(Polygon([[5, y + 0.75], [7.4, y], [5, y - 0.75], [2.6, y]], fc=NAR, ec=NAR))
            ax.text(5, y, txt, ha="center", va="center", color="white", fontsize=10.5, fontweight="bold")
            h = 1.5
        else:
            caja(ax, 5, y, 4.6, 1.1, txt, AZUL)
            h = 1.1
        pos.append((y, h, t, txt))
        y -= 1.85
    for i in range(len(pos) - 1):
        y1, h1, _, _ = pos[i]
        y2, h2, _, _ = pos[i + 1]
        flecha(ax, 5, y1 - h1 / 2, 5, y2 + h2 / 2)
        if pos[i][2] == "d":
            ax.text(5.15, (y1 - h1 / 2 + y2 + h2 / 2) / 2, "Sí", fontsize=10, color=VERDE, fontweight="bold")
    # ramas "No"
    yb = pos[4][0]
    ax.plot([7.4, 8.6, 8.6], [yb, yb, pos[2][0]], color=ROJO, lw=1.3)
    flecha(ax, 8.6, pos[2][0], 7.3, pos[2][0], ROJO)
    ax.text(7.6, yb + 0.15, "No: nutrir\ncon contenidos", fontsize=9, color=ROJO)
    yb = pos[8][0]
    ax.plot([2.6, 1.2, 1.2], [yb, yb, pos[6][0]], color=ROJO, lw=1.3)
    flecha(ax, 1.2, pos[6][0], 2.7, pos[6][0], ROJO)
    ax.text(0.2, yb + 0.15, "No: ajustar\npropuesta", fontsize=9, color=ROJO)
    save(fig, "g02_flujograma")


# ---------------------------------------------------------- segmentación
def segmentacion():
    fig, ax = plt.subplots(figsize=(8, 5))
    et = ["Universidades públicas\n(direcciones de carrera)", "Universidades privadas",
          "Institutos técnicos\nsuperiores", "Escuelas de posgrado", "Unidades educativas\nprivadas grandes"]
    v = [38, 27, 20, 9, 6]
    w, _, aut = ax.pie(v, labels=et, autopct="%1.0f %%", startangle=90, colors=PAL[:5],
                       wedgeprops={"edgecolor": "white", "linewidth": 2}, pctdistance=0.75,
                       textprops={"fontsize": 10.5})
    for a in aut:
        a.set_color("white"); a.set_fontweight("bold")
    ax.add_artist(Circle((0, 0), 0.45, fc="white"))
    ax.text(0, 0, "Mercado\npotencial", ha="center", va="center", fontsize=11)
    save(fig, "g03_segmentacion")


def barras_h(name, etiquetas, valores, xlabel, color=AZUL, sufijo=" %", ordenar=True):
    fig, ax = plt.subplots(figsize=(9, 0.6 * len(etiquetas) + 1.2))
    orden = sorted(zip(valores, etiquetas)) if ordenar else list(zip(valores, etiquetas))[::-1]
    vals = [o[0] for o in orden]; labs = [o[1] for o in orden]
    b = ax.barh(labs, vals, color=color, height=0.6)
    for r, v in zip(b, vals):
        ax.text(r.get_width() + max(vals) * 0.01, r.get_y() + r.get_height() / 2, f"{D.fmt(v)}{sufijo}",
                va="center", fontsize=11)
    ax.set_xlabel(xlabel); ax.set_xlim(0, max(vals) * 1.15)
    ax.xaxis.grid(True, color="#DDDDDD"); ax.set_axisbelow(True)
    save(fig, name)


def encuesta():
    barras_h("g04_problemas",
             ["Pérdida o extravío de documentos", "Demora en búsqueda de archivos",
              "Falta de seguimiento de trámites", "Duplicidad de registros en Excel",
              "Elaboración manual de certificados", "Falta de respaldos", "Poca coordinación entre áreas"],
             [72, 81, 66, 58, 63, 49, 44], "Porcentaje de encuestados que identifica el problema")
    barras_h("g05_pago",
             ["No pagaría", "Hasta Bs 300", "Bs 301 a Bs 600", "Bs 601 a Bs 1 000", "Más de Bs 1 000"],
             [8, 21, 39, 22, 10], "Porcentaje de encuestados (pago mensual por unidad)", VERDE, ordenar=False)
    barras_h("g06_canales",
             ["Visita presencial", "WhatsApp", "Correo electrónico", "Facebook", "LinkedIn",
              "Ferias y congresos", "Recomendación de colegas"],
             [61, 74, 52, 47, 23, 35, 69], "Porcentaje que prefiere el canal para recibir información", NAR)
    # decisores
    fig, ax = plt.subplots(figsize=(8, 4.8))
    et = ["Director de carrera", "Decano", "Rector / Vicerrector", "Jefe de sistemas", "Administrativo financiero"]
    v = [41, 24, 12, 15, 8]
    w, _, aut = ax.pie(v, labels=et, autopct="%1.0f %%", startangle=90, colors=PAL[:5],
                       wedgeprops={"edgecolor": "white", "linewidth": 2}, textprops={"fontsize": 10.5})
    for a in aut:
        a.set_color("white"); a.set_fontweight("bold")
    save(fig, "g07_decisores")


def precios():
    fig, ax = plt.subplots(figsize=(9, 5))
    et = ["SIGAD Básico", "SIGAD Profesional", "Gestor documental\nlicenciado (ref.)", "Desarrollo a\nmedida (ref.)",
          "Alfresco con\nconsultoría (ref.)"]
    v = [D.plan("Básico")["impl"] + D.plan("Básico")["mes"] * 12,
         D.plan("Profesional")["impl"] + D.plan("Profesional")["mes"] * 12, 38000, 60000, 45000]
    c = [VERDE, VERDE, GRIS, GRIS, GRIS]
    b = ax.bar(et, v, color=c, width=0.6)
    for r, x in zip(b, v):
        ax.text(r.get_x() + r.get_width() / 2, x + 900, D.bs(x), ha="center", fontsize=10.5)
    ax.set_ylabel("Costo del primer año (Bs)")
    ax.yaxis.grid(True, color="#DDDDDD"); ax.set_axisbelow(True)
    ax.set_ylim(0, 70000)
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x, p: D.fmt(x)))
    save(fig, "g08_precios")


def perceptual():
    fig, ax = plt.subplots(figsize=(8, 6.5))
    pts = [("SIGAD", 7.8, 8.5, VERDE), ("Desarrollo a medida", 8.5, 2.0, GRIS), ("Alfresco", 6.5, 3.8, GRIS),
           ("Gestor licenciado\nextranjero", 7.0, 2.8, GRIS), ("Google Drive /\ncarpetas compartidas", 2.5, 8.8, GRIS),
           ("Excel y archivo físico", 1.5, 9.4, GRIS), ("Sistema propio de la\nuniversidad (antiguo)", 4.0, 5.5, GRIS)]
    for n, x, y, c in pts:
        ax.scatter(x, y, s=700 if n == "SIGAD" else 300, color=c, zorder=3, edgecolor="white")
        ax.annotate(n, (x, y), xytext=(10, 8), textcoords="offset points", fontsize=10.5,
                    fontweight="bold" if n == "SIGAD" else "normal")
    ax.axhline(5, color="#999999", lw=1); ax.axvline(5, color="#999999", lw=1)
    ax.set_xlim(0, 10); ax.set_ylim(0, 10.5)
    ax.set_xlabel("Especialización en gestión académica y documental  →")
    ax.set_ylabel("Accesibilidad del precio  →")
    ax.text(9.8, 10.2, "Zona objetivo", ha="right", color=VERDE, style="italic")
    save(fig, "g09_posicionamiento")


def ciclo_vida():
    import numpy as np
    x = np.linspace(0, 10, 300)
    y = 100 / (1 + np.exp(-(x - 4))) * np.exp(-((x - 10) ** 2) / 200) * (1 - 0.5 * (x > 8) * (x - 8) / 2)
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.plot(x, y, color=AZUL, lw=2.5)
    for xs, n in [(0, "Introducción"), (3, "Crecimiento"), (6, "Madurez"), (8.5, "Declive")]:
        ax.axvline(xs, color="#BBBBBB", ls="--", lw=1)
        ax.text(xs + 0.15, 103, n, fontsize=11)
    ax.scatter([1.6], [100 / (1 + np.exp(-(1.6 - 4))) * np.exp(-((1.6 - 10) ** 2) / 200)], s=180, color=VERDE, zorder=4)
    ax.annotate("SIGAD (año 1)", (1.6, 6), xytext=(1.9, 40), arrowprops={"arrowstyle": "->"}, fontsize=11,
                color=VERDE, fontweight="bold")
    ax.set_xticks([]); ax.set_yticks([]); ax.set_ylim(0, 112)
    ax.set_xlabel("Tiempo"); ax.set_ylabel("Ventas")
    save(fig, "g10_ciclo_vida")


def proyeccion():
    P = D.proyeccion()
    fig, ax = plt.subplots(figsize=(9, 5))
    import numpy as np
    x = np.arange(3)
    ax.bar(x - 0.27, [f["impl"] for f in P], 0.27, label="Implantación", color=AZUL2)
    ax.bar(x, [f["sub"] for f in P], 0.27, label="Suscripciones", color=AZUL)
    ax.bar(x + 0.27, [f["costos"] for f in P], 0.27, label="Costos totales", color=GRIS)
    ax.plot(x, [f["neta"] for f in P], marker="o", color=VERDE, lw=2.5, label="Utilidad neta")
    for i, f in enumerate(P):
        ax.text(i, f["neta"] + (25000 if f["neta"] > 0 else -60000), D.bs(f["neta"]), ha="center",
                color=VERDE, fontweight="bold", fontsize=10.5)
    ax.axhline(0, color="black", lw=0.8)
    ax.set_xticks(x, ["Año 1", "Año 2", "Año 3"])
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, p: D.fmt(v)))
    ax.set_ylabel("Bolivianos (Bs)"); ax.legend(frameon=False, ncol=2)
    ax.yaxis.grid(True, color="#DDDDDD"); ax.set_axisbelow(True)
    save(fig, "g11_proyeccion")

    fig, ax = plt.subplots(figsize=(9, 4.8))
    acum = []
    act = {p["nombre"]: 0 for p in D.PLANES}
    for a in (1, 2, 3):
        for p in D.PLANES:
            act[p["nombre"]] = act[p["nombre"]] * D.RETENCION + D.NUEVOS[a][p["nombre"]]
        acum.append(dict(act))
    bottom = np.zeros(3)
    for i, p in enumerate(D.PLANES):
        v = np.array([round(a[p["nombre"]]) for a in acum])
        ax.bar(["Año 1", "Año 2", "Año 3"], v, bottom=bottom, color=[AZUL2, AZUL, VERDE][i], label=p["nombre"], width=0.55)
        bottom += v
    for i, t in enumerate(bottom):
        ax.text(i, t + 1.5, f"{int(t)} clientes", ha="center", fontsize=11)
    ax.set_ylabel("Clientes activos al cierre"); ax.legend(frameon=False)
    ax.set_ylim(0, max(bottom) * 1.18)
    save(fig, "g12_clientes")


def presupuesto():
    fig, ax = plt.subplots(figsize=(9, 5.2))
    et = [a for a, _ in D.PRESUPUESTO_DETALLE]; v = [b for _, b in D.PRESUPUESTO_DETALLE]
    w, _, aut = ax.pie(v, autopct="%1.0f %%", startangle=90, colors=PAL[:len(v)], pctdistance=0.8,
                       wedgeprops={"edgecolor": "white", "linewidth": 2, "width": 0.45},
                       textprops={"fontsize": 10, "color": "white", "fontweight": "bold"})
    ax.legend(w, et, loc="center left", bbox_to_anchor=(1, 0.5), frameon=False, fontsize=10.5)
    ax.text(0, 0, D.bs(sum(v)) + "\naño 1", ha="center", va="center", fontsize=11)
    save(fig, "g13_presupuesto")


def equilibrio():
    import numpy as np
    fijos, margen, q = D.equilibrio()
    x = np.arange(0, 101)
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.plot(x, [fijos] * len(x), color=GRIS, lw=2, ls="--", label="Costos fijos mensuales")
    ax.plot(x, x * margen, color=VERDE, lw=2.5, label="Ingreso mensual por suscripciones")
    ax.scatter([q], [fijos], s=120, color=ROJO, zorder=4)
    ax.annotate(f"Punto de equilibrio\n≈ {q:.0f} suscripciones Básico\n({D.bs(fijos)} al mes)", (q, fijos),
                xytext=(q + 6, fijos * 0.45), arrowprops={"arrowstyle": "->"}, fontsize=10.5)
    ax.fill_between(x, x * margen, fijos, where=x * margen > fijos, color=VERDE, alpha=0.12)
    ax.fill_between(x, x * margen, fijos, where=x * margen < fijos, color=ROJO, alpha=0.08)
    ax.set_xlabel("Suscripciones activas (equivalente plan Básico)")
    ax.set_ylabel("Bs por mes")
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, p: D.fmt(v)))
    ax.legend(frameon=False, loc="upper left")
    save(fig, "g14_equilibrio")


def gantt():
    tareas = [
        ("Constitución legal y registro de marca", 0, 2, GRIS),
        ("Ajustes del producto a versión comercial", 0, 3, AZUL),
        ("Identidad de marca y sitio web", 1, 2, VERDE),
        ("Investigación de mercado (encuesta)", 1, 2, NAR),
        ("Producción de contenidos y redes", 2, 10, VERDE),
        ("Campaña de lanzamiento", 3, 2, ROJO),
        ("Publicidad digital pagada", 3, 9, VERDE),
        ("Visitas comerciales y demostraciones", 3, 9, AZUL2),
        ("Ferias y congresos universitarios", 5, 1, NAR),
        ("Webinars mensuales", 4, 8, AZUL2),
        ("Implantaciones en clientes", 4, 8, AZUL),
        ("Segunda feria / congreso", 9, 1, NAR),
        ("Encuesta de satisfacción (NPS)", 6, 1, GRIS),
        ("Encuesta de satisfacción (NPS) II", 11, 1, GRIS),
        ("Evaluación anual del plan", 11, 1, ROJO),
    ]
    fig, ax = plt.subplots(figsize=(10, 6.5))
    for i, (n, ini, dur, c) in enumerate(tareas):
        ax.barh(i, dur, left=ini, color=c, height=0.55)
    ax.set_yticks(range(len(tareas)), [t[0] for t in tareas], fontsize=10.5)
    ax.invert_yaxis()
    ax.set_xticks(range(12), ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"])
    ax.set_xlim(0, 12)
    ax.xaxis.grid(True, color="#DDDDDD"); ax.set_axisbelow(True)
    ax.set_xlabel("Meses del año 1 (2027)")
    save(fig, "g15_gantt")


def porter():
    fig, ax = lienzo(10, 7, (0, 10), (0, 7))
    caja(ax, 5, 3.5, 3.2, 1.5, "Rivalidad entre\ncompetidores\n(media)", AZUL, fs=11.5)
    caja(ax, 5, 6.2, 3.4, 1.1, "Amenaza de nuevos\nentrantes (media-alta)", VERDE)
    caja(ax, 5, 0.8, 3.4, 1.1, "Amenaza de sustitutos\n(alta: Excel, Drive, papel)", ROJO)
    caja(ax, 1.6, 3.5, 2.9, 1.3, "Poder de negociación\nde proveedores\n(bajo)", NAR)
    caja(ax, 8.4, 3.5, 2.9, 1.3, "Poder de negociación\nde clientes\n(alto)", NAR)
    flecha(ax, 5, 5.65, 5, 4.3); flecha(ax, 5, 1.35, 5, 2.7)
    flecha(ax, 3.05, 3.5, 3.35, 3.5); flecha(ax, 6.95, 3.5, 6.65, 3.5)
    save(fig, "g16_porter")


def cadena_valor():
    fig, ax = lienzo(11, 6.2, (0, 11), (0, 6.2))
    apoyo = ["Infraestructura de la empresa: gerencia, contabilidad, asesoría legal",
             "Gestión de talento: selección, capacitación técnica y comercial",
             "Desarrollo tecnológico: arquitectura, investigación, seguridad, nuevas versiones",
             "Abastecimiento: servidores en la nube, dominios, herramientas de software"]
    for i, t in enumerate(apoyo):
        y = 5.75 - i * 0.6
        ax.add_patch(Rectangle((0.2, y - 0.27), 9.2, 0.54, fc="#DCE6F1", ec=AZUL))
        ax.text(4.8, y, t, ha="center", va="center", fontsize=10.5)
    prim = ["Logística\nde entrada\n\nRequisitos,\ncódigo base,\nservidores",
            "Operaciones\n\nDesarrollo,\npruebas y\nconfiguración",
            "Logística\nde salida\n\nDespliegue\nen la nube e\nimplantación",
            "Marketing\ny ventas\n\nContenidos,\ndemos y\nnegociación",
            "Servicio\npostventa\n\nSoporte,\ncapacitación,\nrenovación"]
    for i, t in enumerate(prim):
        x = 0.2 + i * 1.84
        ax.add_patch(Rectangle((x, 0.3), 1.84, 2.75, fc=[AZUL, AZUL2, VERDE, NAR, "#8064A2"][i], ec="white"))
        ax.text(x + 0.92, 1.65, t, ha="center", va="center", color="white", fontsize=10)
    ax.add_patch(Polygon([[9.4, 0.3], [10.8, 3.25], [9.4, 6.2 - 0.3]], fc=GRIS, ec=GRIS))
    ax.text(9.95, 3.25, "Margen", rotation=-90, ha="center", va="center", color="white", fontsize=11.5,
            fontweight="bold")
    ax.text(4.8, 3.27, "Actividades primarias", ha="center", fontsize=10, style="italic")
    save(fig, "g17_cadena_valor")


def proceso_productivo():
    fig, ax = lienzo(11, 4.6, (0, 11), (0, 4.6))
    et = ["Captura de\nrequisitos del\nmercado", "Planificación\ndel sprint\n(backlog)", "Diseño y\ndesarrollo",
          "Pruebas y\ncontrol de\ncalidad", "Empaquetado\ny despliegue", "Implantación\nen el cliente",
          "Retroalimentación\ny mejora"]
    xs = [0.85 + i * 1.57 for i in range(7)]
    for i, (x, t) in enumerate(zip(xs, et)):
        caja(ax, x, 2.9, 1.38, 1.5, t, [AZUL, AZUL, AZUL2, VERDE, VERDE, NAR, "#8064A2"][i], fs=9.8)
        if i < 6:
            flecha(ax, x + 0.7, 2.9, x + 0.87, 2.9)
    ax.annotate("", xy=(xs[0], 2.15), xytext=(xs[-1], 2.15),
                arrowprops={"arrowstyle": "-|>", "connectionstyle": "arc3,rad=0.25", "color": GRIS, "lw": 1.5})
    ax.text(5.5, 0.55, "Ciclo de mejora continua (sprints de dos semanas)", ha="center", color=GRIS, style="italic")
    save(fig, "g18_proceso_productivo")


def ansoff():
    fig, ax = lienzo(8, 6.5, (0, 8), (0, 6.6))
    cel = [(2.2, 4.3, "Penetración de mercado\n\nCaptar más direcciones de\ncarrera en Santa Cruz", VERDE),
           (5.8, 4.3, "Desarrollo de producto\n\nMódulos nuevos: firma digital,\napp móvil, kardex", AZUL),
           (2.2, 1.6, "Desarrollo de mercado\n\nOtros departamentos de\nBolivia e institutos", NAR),
           (5.8, 1.6, "Diversificación\n\nAlcaldías y gobernaciones\n(gestión documental pública)", GRIS)]
    for x, y, t, c in cel:
        ax.add_patch(Rectangle((x - 1.75, y - 1.3), 3.5, 2.6, fc=c, ec="white", lw=3))
        ax.text(x, y, t, ha="center", va="center", color="white", fontsize=10.5)
    ax.text(2.2, 6.35, "Producto actual", ha="center", fontweight="bold")
    ax.text(5.8, 6.35, "Producto nuevo", ha="center", fontweight="bold")
    ax.text(0.2, 4.3, "Mercado\nactual", rotation=90, va="center", ha="center", fontweight="bold")
    ax.text(0.2, 1.6, "Mercado\nnuevo", rotation=90, va="center", ha="center", fontweight="bold")
    save(fig, "g19_ansoff")


def logo():
    fig, ax = lienzo(8, 3.2, (0, 8), (0, 3.2))
    ax.add_patch(FancyBboxPatch((0.4, 0.6), 2.0, 2.0, boxstyle="round,pad=0.02,rounding_size=0.35", fc=AZUL, ec=AZUL))
    for i in range(3):
        ax.add_patch(Rectangle((0.85 + i * 0.12, 1.0 + i * 0.12), 1.0, 1.15, fc="white", ec=AZUL, lw=1.5))
    ax.plot([1.35, 1.55, 1.95], [1.65, 1.42, 1.95], color=VERDE, lw=4, solid_capstyle="round")
    ax.text(2.8, 1.85, "SIGAD", fontsize=44, fontweight="bold", color=AZUL, va="center")
    ax.text(2.85, 1.0, "Tus documentos en orden, tu carrera en control", fontsize=13, color=VERDE, va="center",
            style="italic")
    save(fig, "g20_logo")


def cac_ltv():
    P = D.proyeccion()
    cac, arpu, ltv = D.cac_ltv()
    fig, ax = plt.subplots(figsize=(9, 4.8))
    import numpy as np
    x = np.arange(3)
    ax.bar(x - 0.2, cac, 0.4, color=ROJO, label="CAC (costo de adquirir un cliente)")
    ax.bar(x + 0.2, [ltv] * 3, 0.4, color=VERDE, label="LTV (valor de vida del cliente)")
    for i in range(3):
        ax.text(i - 0.2, cac[i] + 1500, D.bs(cac[i]), ha="center", fontsize=10)
        ax.text(i + 0.2, ltv + 1500, f"{ltv / cac[i]:.1f}x", ha="center", fontsize=11, fontweight="bold", color=VERDE)
    ax.set_xticks(x, ["Año 1", "Año 2", "Año 3"])
    ax.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda v, p: D.fmt(v)))
    ax.set_ylabel("Bs"); ax.legend(frameon=False, loc="upper left")
    ax.set_ylim(0, ltv * 1.25)
    save(fig, "g21_cac_ltv")
    return cac, arpu, ltv


def nps():
    fig, ax = plt.subplots(figsize=(9, 2.6))
    seg = [("Detract.", 12, ROJO), ("Pasivos (7-8)", 28, NAR), ("Promotores (9-10)", 60, VERDE)]
    left = 0
    for n, v, c in seg:
        ax.barh([0], [v], left=left, color=c)
        ax.text(left + v / 2, 0, f"{n}\n{v} %", ha="center", va="center", color="white", fontsize=10.5,
                fontweight="bold")
        left += v
    ax.set_xlim(0, 100); ax.axis("off")
    ax.set_title("Meta de NPS al cierre del año 1 = 60 − 12 = +48", fontsize=12)
    save(fig, "g22_nps")


def mezcla_7p():
    import numpy as np
    fig, ax = lienzo(9, 7, (-4.5, 4.5), (-3.6, 3.6))
    caja(ax, 0, 0, 2.4, 1.2, "SIGAD\nCliente: unidad\nacadémica", AZUL, fs=11)
    ps = ["Producto", "Precio", "Plaza", "Promoción", "Personas", "Procesos", "Evidencia\nfísica"]
    for i, p in enumerate(ps):
        a = np.pi / 2 - i * 2 * np.pi / 7
        x, y = 2.85 * np.cos(a), 2.85 * np.sin(a)
        ax.add_patch(Circle((x, y), 0.78, fc=PAL[i % len(PAL)], ec="white"))
        ax.text(x, y, p, ha="center", va="center", color="white", fontsize=10.5, fontweight="bold")
        ax.plot([0.9 * np.cos(a) * 1.3, x - 0.78 * np.cos(a)], [0.6 * np.sin(a) * 1.0, y - 0.78 * np.sin(a)],
                color="#BBBBBB", lw=1.2)
    save(fig, "g23_7p")


def organigrama():
    fig, ax = lienzo(10, 5, (0, 10), (0, 5))
    caja(ax, 5, 4.3, 3.4, 0.8, "Gerencia general y\njefatura de producto", AZUL)
    hijos = [(1.7, "Área de desarrollo\n(2 desarrolladores)"), (5, "Área comercial y marketing\n(ventas + marketing digital)"),
             (8.3, "Área de implantación\ny soporte")]
    for x, t in hijos:
        caja(ax, x, 2.5, 3.0, 0.9, t, VERDE)
        ax.plot([5, 5, x, x], [3.9, 3.3, 3.3, 2.95], color="#333333", lw=1.2)
    nietos = [(1.7, "Asesor contable y legal\n(externo)"), (5, "Red de aliados\ny referidos")]
    for x, t in nietos:
        caja(ax, x, 0.7, 3.0, 0.8, t, GRIS)
        ax.plot([x, x], [2.05, 1.1], color="#333333", lw=1.2, ls="--")
    save(fig, "g24_organigrama")


if __name__ == "__main__":
    embudo(); flujograma(); segmentacion(); encuesta(); precios(); perceptual(); ciclo_vida()
    proyeccion(); presupuesto(); equilibrio(); gantt(); porter(); cadena_valor(); proceso_productivo()
    ansoff(); logo(); print(cac_ltv()); nps(); mezcla_7p(); organigrama()
    print(sorted(os.listdir(OUT)))
