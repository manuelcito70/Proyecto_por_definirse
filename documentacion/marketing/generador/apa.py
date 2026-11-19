# -*- coding: utf-8 -*-
"""Constructor de documentos Word con formato APA 7.a edición (trabajo de estudiante)."""
import re
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

FUENTE = "Times New Roman"


def _set_font(style, size=12, bold=None, italic=None):
    style.font.name = FUENTE
    style.font.size = Pt(size)
    style.font.color.rgb = RGBColor(0, 0, 0)
    if bold is not None:
        style.font.bold = bold
    if italic is not None:
        style.font.italic = italic
    rpr = style.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts"); rpr.append(rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), FUENTE)


def _campo(par, instr, placeholder="", hidden=False):
    def run_fld(tipo):
        r = OxmlElement("w:r")
        if hidden:
            rp = OxmlElement("w:rPr"); v = OxmlElement("w:vanish"); rp.append(v); r.append(rp)
        f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), tipo)
        if tipo == "begin":
            f.set(qn("w:dirty"), "true")
        r.append(f)
        return r
    p = par._p
    p.append(run_fld("begin"))
    r = OxmlElement("w:r")
    if hidden:
        rp = OxmlElement("w:rPr"); v = OxmlElement("w:vanish"); rp.append(v); r.append(rp)
    t = OxmlElement("w:instrText"); t.set(qn("xml:space"), "preserve"); t.text = f" {instr} "
    r.append(t); p.append(r)
    p.append(run_fld("separate"))
    if placeholder:
        r = OxmlElement("w:r"); t = OxmlElement("w:t"); t.text = placeholder; r.append(t); p.append(r)
    p.append(run_fld("end"))


class APA:
    def __init__(self):
        self.doc = Document()
        self.ntab = 0
        self.nfig = 0
        d = self.doc
        sec = d.sections[0]
        sec.page_width, sec.page_height = Inches(8.5), Inches(11)
        for m in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
            setattr(sec, m, Inches(1))
        sec.header_distance = Inches(0.5)
        st = d.styles
        _set_font(st["Normal"])
        pf = st["Normal"].paragraph_format
        pf.line_spacing_rule = WD_LINE_SPACING.DOUBLE
        pf.space_before = pf.space_after = Pt(0)
        pf.widow_control = True
        # títulos APA
        for lvl, (al, b, i) in {1: (WD_ALIGN_PARAGRAPH.CENTER, True, False),
                                2: (WD_ALIGN_PARAGRAPH.LEFT, True, False),
                                3: (WD_ALIGN_PARAGRAPH.LEFT, True, True)}.items():
            s = st[f"Heading {lvl}"]
            _set_font(s, 12, b, i)
            f = s.paragraph_format
            f.alignment = al
            f.line_spacing_rule = WD_LINE_SPACING.DOUBLE
            f.space_before = f.space_after = Pt(0)
            f.first_line_indent = Cm(0)
            f.keep_with_next = True
        for n in ("TOC 1", "TOC 2", "TOC 3", "Table of Figures"):
            try:
                s = st[n]
            except KeyError:
                s = st.add_style(n, 1)
            _set_font(s)
            s.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            s.paragraph_format.space_after = Pt(6)
        st["TOC 2"].paragraph_format.left_indent = Cm(0.6)
        st["TOC 3"].paragraph_format.left_indent = Cm(1.2)
        # número de página arriba a la derecha
        hp = sec.header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        _campo(hp, "PAGE", "1")
        for r in hp.runs:
            r.font.name = FUENTE

    # ------------------------------------------------------------ texto
    def _runs(self, par, texto, size=None):
        """Admite **negrita** y *cursiva*."""
        partes = re.split(r"(\*\*.+?\*\*|\*.+?\*)", texto)
        for pt in partes:
            if not pt:
                continue
            if pt.startswith("**"):
                r = par.add_run(pt[2:-2]); r.bold = True
            elif pt.startswith("*"):
                r = par.add_run(pt[1:-1]); r.italic = True
            else:
                r = par.add_run(pt)
            if size:
                r.font.size = Pt(size)
        return par

    def p(self, texto, sangria=True, align=None):
        par = self.doc.add_paragraph()
        if sangria:
            par.paragraph_format.first_line_indent = Cm(1.27)
        if align:
            par.alignment = align
        return self._runs(par, texto)

    def ps(self, *textos):
        for t in textos:
            self.p(t)

    def lista(self, items, numerada=False):
        for i, it in enumerate(items, 1):
            par = self.doc.add_paragraph()
            f = par.paragraph_format
            f.left_indent = Cm(1.27); f.first_line_indent = Cm(-0.63)
            self._runs(par, (f"{i}.\t" if numerada else "•\t") + it)
            f.tab_stops.add_tab_stop(Cm(1.27))

    def h1(self, t, nueva_pagina=True):
        h = self.doc.add_heading(t, 1)
        h.paragraph_format.page_break_before = nueva_pagina

    def h2(self, t):
        self.doc.add_heading(t, 2)

    def h3(self, t):
        self.doc.add_heading(t, 3)

    def salto(self):
        ps = self.doc.paragraphs
        if ps and not ps[-1].text and not ps[-1].runs:
            ps[-1].add_run().add_break(WD_BREAK.PAGE)
        else:
            self.doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # --------------------------------------------------- tablas y figuras
    def _rotulo(self, tipo, n, titulo, ident):
        par = self.doc.add_paragraph()
        par.paragraph_format.keep_with_next = True
        par.paragraph_format.space_before = Pt(12)
        r = par.add_run(f"{tipo} {n}"); r.bold = True
        _campo(par, f'TC "{tipo} {n}. {titulo}" \\f {ident} \\l 1')
        par2 = self.doc.add_paragraph()
        par2.paragraph_format.keep_with_next = True
        r = par2.add_run(titulo); r.italic = True

    def _nota(self, nota):
        if nota:
            par = self.doc.add_paragraph()
            par.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
            r = par.add_run("Nota. "); r.italic = True
            self._runs(par, nota)

    def tabla(self, titulo, encabezados, filas, nota=None, anchos=None, size=10.5):
        self.ntab += 1
        self._rotulo("Tabla", self.ntab, titulo, "t")
        t = self.doc.add_table(rows=1, cols=len(encabezados))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = anchos is None
        tbl = t._tbl
        # bordes APA: superior, bajo encabezado, inferior
        tblPr = tbl.tblPr
        b = OxmlElement("w:tblBorders")
        for lado in ("top", "bottom"):
            e = OxmlElement(f"w:{lado}"); e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "8"); b.append(e)
        for lado in ("left", "right", "insideV"):
            e = OxmlElement(f"w:{lado}"); e.set(qn("w:val"), "nil"); b.append(e)
        e = OxmlElement("w:insideH"); e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "2")
        e.set(qn("w:color"), "BFBFBF"); b.append(e)
        tblPr.append(b)

        def celda(c, texto, neg=False):
            c.text = ""
            par = c.paragraphs[0]
            par.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            par.paragraph_format.space_before = Pt(2); par.paragraph_format.space_after = Pt(2)
            par.paragraph_format.first_line_indent = Cm(0)
            lineas = str(texto).split("\n")
            for k, ln in enumerate(lineas):
                if k:
                    par = c.add_paragraph()
                    par.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
                    par.paragraph_format.space_after = Pt(2)
                self._runs(par, f"**{ln}**" if neg and ln else ln, size)

        for c, h in zip(t.rows[0].cells, encabezados):
            celda(c, h, True)
            tcPr = c._tc.get_or_add_tcPr()
            bd = OxmlElement("w:tcBorders"); e = OxmlElement("w:bottom")
            e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "8"); bd.append(e); tcPr.append(bd)
        # repetir encabezado
        trPr = t.rows[0]._tr.get_or_add_trPr()
        th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); trPr.append(th)
        for fila in filas:
            cells = t.add_row().cells
            for c, v in zip(cells, fila):
                celda(c, v)
        if anchos:
            for row in t.rows:
                for c, w in zip(row.cells, anchos):
                    c.width = Cm(w)
        self._nota(nota)
        self.doc.add_paragraph().paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE

    def figura(self, titulo, imagen, nota=None, ancho=6.0):
        self.nfig += 1
        self._rotulo("Figura", self.nfig, titulo, "f")
        par = self.doc.add_paragraph()
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        par.paragraph_format.keep_with_next = bool(nota)
        par.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        par.add_run().add_picture(imagen, width=Inches(ancho))
        self._nota(nota)

    # ---------------------------------------------------------- índices
    def indice(self, titulo, instr):
        par = self.doc.add_paragraph()
        par.paragraph_format.page_break_before = True
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = par.add_run(titulo); r.bold = True
        par = self.doc.add_paragraph()
        _campo(par, instr, "Haga clic derecho y elija «Actualizar campo» para generar el índice.")

    def referencias(self, refs):
        self.h1("Referencias")
        for ref in sorted(refs, key=lambda s: s.lower().replace("*", "").replace("á", "a").replace("é", "e")):
            par = self.doc.add_paragraph()
            par.paragraph_format.left_indent = Cm(1.27)
            par.paragraph_format.first_line_indent = Cm(-1.27)
            self._runs(par, ref)

    def guardar(self, ruta):
        self.doc.save(ruta)
