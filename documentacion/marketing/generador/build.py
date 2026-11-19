# -*- coding: utf-8 -*-
"""Arma el documento, actualiza índices con Word y exporta a PDF."""
import os
import sys
from apa import APA
import c1_inicio as c1, c2_analisis as c2, c3_estrategia as c3, c4_procedimiento as c4, c5_final as c5

AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
SALIDA = os.path.abspath(os.path.join(AQUI, ".."))
NOMBRE = "Procedimiento_Marketing_SIGAD_APA7"


def armar():
    a = APA()
    c1.caratula(a)
    c1.indices(a)
    c1.resumen(a)
    c1.introduccion(a)
    c1.planteamiento(a)
    c1.marco_teorico(a)
    c2.empresa_producto(a)
    c2.situacion(a)
    c2.investigacion(a)
    c3.produccion(a)
    c3.estrategia(a)
    c4.procedimiento(a)
    c5.financiero(a)
    c5.cronograma(a)
    c5.control(a)
    c5.conclusiones(a)
    c5.referencias(a)
    c5.anexos(a)
    ruta = os.path.join(SALIDA, NOMBRE + ".docx")
    a.guardar(ruta)
    print("tablas:", a.ntab, "figuras:", a.nfig)
    return ruta


def word(ruta):
    import win32com.client
    w = win32com.client.DispatchEx("Word.Application")
    w.Visible = False
    w.DisplayAlerts = 0
    try:
        d = w.Documents.Open(ruta)
        for _ in range(2):
            for t in d.TablesOfContents:
                t.Update()
            d.Fields.Update()
        d.Repaginate()
        paginas = d.ComputeStatistics(2)
        palabras = d.ComputeStatistics(0)
        d.Save()
        d.ExportAsFixedFormat(ruta[:-5] + ".pdf", 17)
        d.Close(False)
        print("paginas:", paginas, "palabras:", palabras)
    finally:
        w.Quit()


if __name__ == "__main__":
    r = armar()
    if "--sin-word" not in sys.argv:
        word(r)
