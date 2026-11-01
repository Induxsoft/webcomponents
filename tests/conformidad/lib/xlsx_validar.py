#!/usr/bin/env python3
"""Valida un XLSX generado en el navegador y lo describe en JSON (para la batería de conformidad).

Uso: python3 -I xlsx_validar.py archivo.xlsx
Salida: {"zip": {...}, "hojas": [{nombre, celdas: {A1: {v, t, fmt, bold}}, freeze, merged, autofilter, anchos, max_row, max_col}]}
"""
import json
import sys
import zipfile
import datetime


def describir(ruta):
    out = {"zip": {}, "hojas": []}
    with zipfile.ZipFile(ruta) as z:
        out["zip"] = {
            "archivos": sorted(z.namelist()),
            "metodos": sorted({i.compress_type for i in z.infolist()}),
            "crc_ok": z.testzip() is None,
        }
    import openpyxl  # noqa: E402
    wb = openpyxl.load_workbook(ruta)
    for ws in wb.worksheets:
        celdas = {}
        for fila in ws.iter_rows():
            for c in fila:
                if c.value is None:
                    continue
                v = c.value
                if isinstance(v, (datetime.datetime, datetime.date)):
                    v = v.isoformat()
                celdas[c.coordinate] = {
                    "v": v,
                    "t": c.data_type,
                    "fecha": bool(c.is_date),
                    "fmt": c.number_format,
                    "bold": bool(c.font and c.font.b),
                }
        anchos = {k: d.width for k, d in ws.column_dimensions.items() if d.width}
        out["hojas"].append({
            "nombre": ws.title,
            "celdas": celdas,
            "freeze": ws.freeze_panes,
            "merged": sorted(str(r) for r in ws.merged_cells.ranges),
            "autofilter": ws.auto_filter.ref,
            "anchos": anchos,
            "max_row": ws.max_row,
            "max_col": ws.max_column,
        })
    return out


if __name__ == "__main__":
    try:
        print(json.dumps(describir(sys.argv[1]), ensure_ascii=False, default=str))
    except Exception as e:  # el error se informa como dato para que la prueba falle limpia
        print(json.dumps({"error": f"{type(e).__name__}: {e}"}))
