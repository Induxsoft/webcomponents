"""Valida con openpyxl los XLSX que genera run.mjs. Uso: python3 validate.py out/results.json"""
import json
import sys
import zipfile
from datetime import date, datetime

import openpyxl

R = json.load(open(sys.argv[1], encoding='utf-8'))
F = R['files']
fails = 0


def check(name, cond, detail=''):
    global fails
    print(('ok   ' if cond else 'FAIL ') + name + ('' if cond else '  -> ' + str(detail)))
    if not cond:
        fails += 1


def zip_ok(key, method=None):
    with zipfile.ZipFile(F[key]) as z:
        check(f'{key}: ZIP íntegro (CRC32)', z.testzip() is None)
        names = z.namelist()
        need = ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels',
                'xl/worksheets/sheet1.xml', 'xl/styles.xml', 'xl/sharedStrings.xml']
        check(f'{key}: partes SpreadsheetML', all(n in names for n in need), names)
        if method is not None:
            ms = {i.compress_type for i in z.infolist()}
            check(f'{key}: método ZIP {method}', ms <= {method} and (method == 0 or method in ms), ms)


def load(key):
    return openpyxl.load_workbook(F[key])


def eq(name, got, exp):
    check(name, got == exp, f'{got!r} != {exp!r}')


# ---------- utilidades ----------
u = R['unit']
eq('sheetName saneado', u['sheet'], ['a_b_c_d_e_f_g_h', 'Hoja1', 'x' * 31, 'abc', 'Hoja1'])
s26 = (date(2026, 3, 15) - date(1899, 12, 30)).days
eq('serial de fechas', u['serial'], [61, s26, s26 + 0.5, None])
eq('numFmt', u['fmt'], ['"$"#,##0.00', '0', None, '0.000%'])
eq('CRC32("123456789")', u['crc'], 'cbf43926')
eq('tipo MIME', u['blobType'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# ---------- basico ----------
zip_ok('basico.xlsx', zipfile.ZIP_STORED)
wb = load('basico.xlsx')
ws = wb.active
t = ws.title
check('basico: hoja con nombre inválido saneado (<=31, sin []:*?/\\)',
      len(t) <= 31 and not any(c in t for c in '[]:*?/\\') and t.startswith('Ventas_ _2026_____enero'), t)
eq('basico: encabezados (sin columna oculta)', [c.value for c in ws[1]],
   ['Clave', 'Importe', 'Porcentaje', 'Cantidad', 'Fecha', 'Fecha y hora', 'Activo', 'Unidad', 'Texto'])
check('basico: encabezado en negritas', all(c.font.b for c in ws[1]))
check('basico: datos sin negritas', not ws['B2'].font.b)
eq('basico: freeze', ws.freeze_panes, 'A2')
eq('basico: autofiltro', ws.auto_filter.ref, 'A1:I5')
eq('basico: número', (ws['B2'].value, ws['B2'].data_type), (1234.567, 'n'))
eq('basico: numFmt prefijo/miles/decimales', ws['B2'].number_format, '"$"#,##0.00')
eq('basico: número desde texto negativo', ws['B3'].value, -50)
eq('basico: numFmt sufijo', (ws['C2'].value, ws['C2'].number_format), (15.25, '0.0" %"'))
eq('basico: número desde texto "42"', (ws['D2'].value, ws['D2'].data_type), (42, 'n'))
eq('basico: Number no numérico queda texto', (ws['D4'].value, ws['D4'].data_type), ('N/A', 's'))
eq('basico: cero', ws['D5'].value, 0)
eq('basico: fecha ISO', (ws['E2'].value, ws['E2'].number_format), (datetime(2026, 3, 15), 'dd/mm/yyyy'))
eq('basico: fecha Date()', ws['E3'].value, datetime(2026, 1, 31))
eq('basico: fecha inválida queda texto', ws['E4'].value, 'no es fecha')
eq('basico: 29 de febrero', ws['E5'].value, datetime(2000, 2, 29))
eq('basico: fecha-hora ISO', (ws['F2'].value, ws['F2'].number_format), (datetime(2026, 3, 15, 13, 45, 30), 'dd/mm/yyyy hh:mm'))
eq('basico: fecha-hora con espacio', ws['F3'].value, datetime(2026, 12, 31, 23, 59))
eq('basico: fecha-hora Date()', ws['F5'].value, datetime(2026, 6, 1, 8, 30))
eq('basico: Check como Sí/No', [ws[f'G{i}'].value for i in range(2, 6)], ['Sí', 'No', 'Sí', 'No'])
eq('basico: Select muestra el texto', [ws[f'H{i}'].value for i in range(2, 6)], ['PIEZA', 'CAJA', 'OTRA', None])
eq('basico: escape &<>"', ws['I2'].value, 'a & b < c > d "e"')
eq('basico: caracteres de control quitados, tab/salto/_x0041_ intactos', ws['I3'].value, 'control: fin\ttab\nnueva línea _x0041_')
eq('basico: espacios conservados', ws['I4'].value, '  espacios  ')
eq('basico: emoji y ñ', ws['I5'].value, 'emoji 😀 y ñ')
eq('basico: celdas vacías', (ws['A4'].value, ws['B4'].value, ws['C4'].value, ws['F4'].value), (None, None, None, None))
eq('basico: fila de totales', (ws['A6'].value, ws['B6'].value, ws['D6'].value), ('Total', 1001234.567, 49))
check('basico: totales en negritas', ws['A6'].font.b and ws['B6'].font.b and ws['D6'].font.b)
eq('basico: totales con formato', ws['B6'].number_format, '"$"#,##0.00')
eq('basico: max_row', ws.max_row, 6)
eq('basico: ancho desde width=140px', ws.column_dimensions['B'].width, 20)
widths = [ws.column_dimensions[c].width for c in 'ACDEFGHI']
check('basico: anchos por contenido entre 6 y 60', all(6 <= w <= 60 for w in widths), widths)
check('basico: columna de texto más ancha que la de clave', ws.column_dimensions['I'].width > ws.column_dimensions['A'].width)

# ---------- raw ----------
zip_ok('raw.xlsx')
ws = load('raw.xlsx').active
eq('raw: apóstrofos quitados del nombre', ws.title, 'Hoja')
eq('raw: includeHidden agrega la columna oculta', ws['J1'].value, 'Oculta')
eq('raw: Check booleano', [ws[f'G{i}'].value for i in range(2, 6)], [True, False, True, False])
eq('raw: Select con la llave', ws['H2'].value, 'PZA')
eq('raw: sin fila de totales', ws.max_row, 5)

# ---------- vacío y una fila ----------
zip_ok('vacio.xlsx')
ws = load('vacio.xlsx').active
eq('vacio: nombre por omisión', ws.title, 'Hoja1')
eq('vacio: solo encabezado', (ws.max_row, ws['A1'].value), (1, 'Clave'))
eq('vacio: autofiltro', ws.auto_filter.ref, 'A1:I1')
ws = load('una.xlsx').active
eq('una: dos filas', (ws.max_row, ws['A2'].value, ws['B2'].value), (2, 'A1', 1234.567))

# ---------- async (DEFLATE) ----------
zip_ok('async.xlsx', zipfile.ZIP_DEFLATED if R['timings']['compressionStream'] else zipfile.ZIP_STORED)
ws = load('async.xlsx').active
eq('async: valores', (ws['B2'].value, ws['I2'].value, ws['A6'].value, ws['B6'].value), (1234.567, 'a & b < c > d "e"', 'Total', 1))

# ---------- 20,000 filas ----------
for key, m in (('grande.xlsx', zipfile.ZIP_STORED), ('grande-deflate.xlsx', zipfile.ZIP_DEFLATED if R['timings']['compressionStream'] else zipfile.ZIP_STORED)):
    zip_ok(key, m)
    ws = openpyxl.load_workbook(F[key], read_only=True).active
    rows = list(ws.iter_rows(values_only=True))
    eq(f'{key}: 20,001 filas x 10 columnas', (len(rows), len(rows[0])), (20001, 10))
    last = rows[-1]
    eq(f'{key}: última fila', (last[0], last[3], last[4], last[6], last[9]),
       (19999 * 1.5, 19999 * 1.5 + 3, datetime(2026, 1 + 19999 % 12, 1 + 19999 % 28), 'No', 'Texto 499 col 9'))

# ---------- componente real ----------
e = R['edittable']
eq('edittable: versión del componente detectada', e['version'], 1)
eq('edittable: columnas exportadas (sin no-print ni ocultas)', e['columns'],
   ['clave', 'nombre', 'precio', 'unidad', 'alta', 'mod', 'activo', 'extra', 'nota'])
zip_ok('edittable.xlsx')
ws = load('edittable.xlsx').active
eq('edittable: hoja', ws.title, 'Productos')
eq('edittable: encabezados', [c.value for c in ws[1]], ['Clave', 'Nombre', 'Precio', 'Unidad', 'Alta', 'Modificado', 'Activo', 'Extra', 'Nota'])
eq('edittable: NoEditable texto', ws['A2'].value, 'A-001')
eq('edittable: escape', ws['B2'].value, 'Tornillo <M4> & "tuerca"')
eq('edittable: Number desde texto', (ws['C2'].value, ws['C3'].value, ws['C4'].value), (1234.5, 0.75, 2000))
eq('edittable: numFmt', ws['C2'].number_format, '"$ "#,##0.00" MXN"')
eq('edittable: Select texto de la opción', [ws[f'D{i}'].value for i in (2, 3, 4)], ['PIEZA', 'CAJA', 'PAQUETE'])
eq('edittable: Date', ws['E2'].value, datetime(2026, 1, 15))
eq('edittable: DateTime', (ws['F2'].value, ws['F3'].value), (datetime(2026, 1, 15, 13, 45), datetime(2026, 2, 1, 8, 0)))
eq('edittable: Check', [ws[f'G{i}'].value for i in (2, 3, 4)], ['Sí', 'No', 'Sí'])
eq('edittable: Memo con salto', ws['I2'].value, 'Línea 1\nLínea 2')
check('edittable: ancho desde width=250px', abs(ws.column_dimensions['B'].width - 35.71) < 0.01, ws.column_dimensions['B'].width)
eq('edittable: freeze y autofiltro', (ws.freeze_panes, ws.auto_filter.ref), ('A2', 'A1:I4'))
ws = load('edittable-llave.xlsx').active
eq('edittable keyfield: texto', (ws.title, ws['A2'].value, ws['A3'].value), ('conllave', 'PIEZA', 'CAJA'))
ws = load('edittable-llave-raw.xlsx').active
eq('edittable keyfield raw: llave', (ws['A2'].value, ws['A3'].value), ('PZA', 'CAJA'))

# ---------- fromTable con edit-table (delegación) y libro con edit-table ----------
ws = load('et-via-table.xlsx').active
eq('fromTable(edit-table) delega en fromEditTable', (ws.title, ws['C2'].value, ws['D2'].value, ws.max_column), ('productos', 1234.5, 'PIEZA', 9))
ws = load('et-via-selector.xlsx').active
eq('fromTable("#productos") delega', (ws.title, ws['C4'].value), ('productos', 2000))
wb = load('libro-et.xlsx')
eq('libro con edit-table: hojas', wb.sheetnames, ['productos', 'Hoja2', 'plana', 'Datos'])
eq('libro con edit-table: tabla plana', (wb['plana']['B2'].value, wb['plana']['B2'].number_format), (1500, '"$"#,##0.00'))
eq('libro con edit-table: arreglo', (wb['Hoja2']['A2'].value, wb['Hoja2']['B2'].value), (1, 'x'))
c = R['edittableCsv'].split('\r\n')
eq('toCSV(edit-table): encabezado', c[0], 'Clave,Nombre,Precio,Unidad,Alta,Modificado,Activo,Extra,Nota')
eq('toCSV(edit-table): fila con escapes RFC 4180', c[1], 'A-001,"Tornillo <M4> & ""tuerca""",1234.5,PIEZA,2026-01-15,2026-01-15T13:45:00,Sí,x,"Línea 1\nLínea 2"')

# ---------- página sin EdiTable ----------
T = R['tabla']
check('sin EdiTable: la página no lo cargó', T['noEditTable'])
zip_ok('tabla-ventas.xlsx')
ws = load('tabla-ventas.xlsx').active
eq('tabla: hoja (id)', ws.title, 'ventas')
eq('tabla: tamaño sin fila/columna ocultas', (ws.max_row, ws.max_column), (6, 7))
eq('tabla: encabezado 1', [c.value for c in ws[1]], ['Zona', 'Importe', None, 'Fecha', 'Código', 'Avance', 'Folio'])
eq('tabla: encabezado 2', (ws['B2'].value, ws['C2'].value), ('Bruto', 'Neto'))
check('tabla: encabezados en negritas', ws['A1'].font.b and ws['B2'].font.b)
eq('tabla: celdas combinadas (colspan/rowspan)', sorted(str(r) for r in ws.merged_cells.ranges), sorted(['A1:A2', 'B1:C1', 'D1:D2', 'E1:E2', 'F1:F2', 'G1:G2', 'A3:A4', 'B5:C5']))
eq('tabla: freeze bajo 2 filas de encabezado', ws.freeze_panes, 'A3')
eq('tabla: autofiltro en la última fila de encabezado', ws.auto_filter.ref, 'A2:G5')
eq('tabla: $1,234.56', (ws['B3'].value, ws['B3'].number_format), (1234.56, '"$"#,##0.00'))
eq('tabla: -1,234.5', (ws['C3'].value, ws['C3'].number_format), (-1234.5, '#,##0.0'))
eq('tabla: 12.5%', (ws['F3'].value, ws['F3'].number_format), (0.125, '0.0%'))
eq('tabla: 100%', (ws['F4'].value, ws['F4'].number_format), (1, '0%'))
eq('tabla: 00123 queda texto', ws['E3'].value, '00123')
eq('tabla: data-type=text en el th', (ws['G3'].value, ws['G4'].value), ('0042', '7'))
eq('tabla: data-type=date en el th (dd/mm/yyyy, es-MX)', (ws['D3'].value, ws['D3'].number_format), (datetime(2026, 3, 15), 'dd/mm/yyyy'))
eq('tabla: data-value numérico', ws['B4'].value, 999.5)
eq('tabla: data-value de fecha', ws['D4'].value, datetime(2026, 4, 1))
eq('tabla: 2,000', (ws['C4'].value, ws['C4'].number_format), (2000, '#,##0'))
eq('tabla: data-type=number en celda con colspan', (ws['B5'].value, ws['B5'].number_format), (5000, '#,##0.00'))
eq('tabla: data-type=bool', ws['E5'].value, 'Sí')
eq('tabla: escape', ws['A5'].value, 'Sur & "Centro"')
eq('tabla: tfoot como totales', (ws['A6'].value, ws['B6'].value, ws['C6'].value), ('Total', 7234.06, 765.5))
check('tabla: tfoot en negritas', ws['A6'].font.b and ws['B6'].font.b)
ws = load('tabla-ventasHidden.xlsx').active
eq('tabla includeHidden: filas y columnas ocultas incluidas', (ws.title, ws.max_row, ws.max_column, ws['E1'].value, ws['A5'].value), ('Todo', 8, 8, 'Interno', 'Oculta por estilo'))
ws = load('tabla-simple.xlsx').active
eq('tabla sin thead: primera fila de th', (ws.title, ws['A1'].value, ws['A1'].font.b, ws['B2'].value, ws.freeze_panes), ('simple', 'Concepto', True, 12000, 'A2'))

ws = load('tabla-inferido.xlsx').active
eq('arreglo: columnas inferidas en orden de aparición', [c.value for c in ws[1]], ['id', 'nombre', 'alta', 'activo', 'cliente', 'saldo', 'extra'])
eq('arreglo: número (incluye "3")', [ws[f'A{i}'].value for i in (2, 3, 4)], [1, 2, 3])
eq('arreglo: fecha-hora inferida', (ws['C2'].value, ws['C3'].value, ws['C2'].number_format, ws['C4'].value), (datetime(2026, 1, 5), datetime(2026, 2, 10, 10, 30), 'dd/mm/yyyy hh:mm', None))
eq('arreglo: booleano inferido', [ws[f'D{i}'].value for i in (2, 3, 4)], ['Sí', 'No', 'Sí'])
eq('arreglo: objeto como JSON', ws['E2'].value, '{"nombre":"ACME","rfc":"XAXX010101000"}')
eq('arreglo: número en texto del locale', (ws['F2'].value, ws['F3'].value, ws['F4'].value), (1234.5, 10, None))
eq('arreglo: llave que aparece después', (ws['G2'].value, ws['G3'].value), (None, 'tarde'))
ws = load('tabla-explicito.xlsx').active
eq('arreglo explícito: encabezados', [c.value for c in ws[1]], ['nombre', 'Cliente', 'Mayúsculas', 'id'])
eq('arreglo explícito: ruta con punto', (ws['B2'].value, ws['B3'].value, ws['B4'].value), ('ACME', 'Beta', None))
eq('arreglo explícito: función value', ws['C3'].value, 'LUIS')
eq('arreglo explícito: tipo y formato', (ws['D4'].value, ws['D4'].number_format), (3, '0.00'))
eq('arreglo explícito: nombre de hoja', ws.title, 'Explícito')

zip_ok('tabla-libro.xlsx', zipfile.ZIP_STORED)
wb = load('tabla-libro.xlsx')
eq('libro mixto: hojas (nombre repetido desambiguado)', wb.sheetnames, ['Arreglo', 'Tabla', 'Datos', 'Arreglo (2)', 'simple'])
eq('libro mixto: cada hoja con sus datos', (wb['Arreglo']['B3'].value, wb['Tabla']['B3'].value, wb['Datos']['A2'].value, wb['Arreglo (2)'].max_row, wb['simple']['B2'].value), ('Luis', 1234.56, 5, 2, 12000))
eq('libro mixto: totales de la hoja Datos', (wb['Datos']['A3'].value, wb['Datos']['A3'].font.b), (5, True))
eq('libro mixto: combinadas en la hoja Tabla', len(wb['Tabla'].merged_cells.ranges), 8)
eq('libro mixto: freeze por hoja', (wb['Arreglo'].freeze_panes, wb['Tabla'].freeze_panes), ('A2', 'A3'))
zip_ok('tabla-libroAsync.xlsx', zipfile.ZIP_DEFLATED)
eq('libro asíncrono', load('tabla-libroAsync.xlsx').sheetnames, ['A', 'B'])

c = T['csv']
check('toCSV: BOM', c.startswith('﻿'), repr(c[:3]))
c = c.lstrip('﻿').split('\r\n')
eq('toCSV: encabezado', c[0], 'id,nombre,alta,activo,cliente,saldo,extra')
eq('toCSV: objeto, fecha y número', c[1], '1,Ana,2026-01-05 00:00:00,Sí,"{""nombre"":""ACME"",""rfc"":""XAXX010101000""}",1234.5,')
eq('toCSV: comillas y coma', c[3], '3,"Eva, ""la jefa""",,Sí,,,')
eq('toCSV: CRLF final', c[-1], '')
c = T['csvTabla'].split('\r\n')
eq('toCSV(tabla): encabezados y fila', (c[0], c[2]), ('Zona,Importe,,Fecha,Código,Avance,Folio', 'Norte,1234.56,-1234.5,2026-03-15,00123,0.125,0042'))
eq('toCSV: delimitador forzado', T['csvExplicito'].split('\r\n')[0], 'nombre|Cliente|Mayúsculas|id')
eq('download(fuente, nombre)', T['downloadName'], 'ventas.xlsx')
ws = load('descarga.xlsx').active
eq('download: el archivo descargado abre', (ws.title, ws['B3'].value), ('ventas', 1234.56))

# ---------- locales (R7) ----------
def nd(key, sheet, rows=(2,)):
    w = load(key)[sheet]
    return [(w[f'A{r}'].value, w[f'B{r}'].value) for r in rows]
D = datetime
L = 'locales.xlsx'
eq('locale es-MX', nd(L, 'es-MX'), [(1234.56, D(2026, 3, 15))])
eq('locale en-US', nd(L, 'en-US'), [(1234.56, D(2026, 3, 4))])
eq('locale es-ES (1.234,56)', nd(L, 'es-ES'), [(1234.56, D(2026, 4, 3))])
eq('locale es-CO (1.234,56)', nd(L, 'es-CO'), [(1234.56, D(2026, 4, 3))])
eq('locale de-DE (1.234,56 €, 25.12.2026)', nd(L, 'de-DE'), [(1234.56, D(2026, 12, 25))])
eq('locale de-DE: formato con sufijo', load(L)['de-DE']['A2'].number_format, '#,##0.00" €"')
eq('opción locale gana a lang de la tabla', nd(L, 'opcion'), [(1234.56, D(2026, 3, 4))])
eq('opción decimal/thousands/dateOrder', nd(L, 'explicito'), [(1234.56, D(2026, 4, 3))])
eq('fecha ambigua resuelta por la columna (en-US -> DMY)', nd(L, 'amb-en', (2, 3)), [(1, D(2026, 4, 3)), (2, D(2026, 4, 25))])
eq('fecha ambigua resuelta por la columna (es-MX -> MDY)', nd(L, 'amb-mx', (2, 3)), [(1, D(2026, 4, 13)), (2, D(2026, 3, 4))])
eq('fecha ambigua sin resolver: decide el locale', nd(L, 'amb-loc', (2, 3)), [(1, D(2026, 4, 3)), (2, D(2026, 6, 5))])
eq('navegador en-US sin locale:auto no participa (es-MX)', nd(L, 'navegador'), [(1234.5, D(2026, 4, 3))])
eq('arreglo con locale de-DE', nd(L, 'arreglo-de', (2, 3)), [(1234.56, D(2026, 12, 25)), (2.5, D(2026, 2, 1))])
eq('locale del documento (de-DE) gana al navegador', nd('locale-documento.xlsx', 'documento'), [(1234.5, D(2026, 4, 3))])
L2 = 'locales-nav-de.xlsx'
eq('navegador de-DE sin locale:auto no participa (es-MX)', nd(L2, 'navegador'), [(1234.5, D(2026, 4, 3))])
eq('navegador de-DE: lang de la tabla sigue mandando', nd(L2, 'en-US'), [(1234.56, D(2026, 3, 4))])
lc = R['locale']
eq('resolución: sin lang ni opción -> es-MX (navegador en-US)', lc['en']['loc']['nav'], ['es-MX', '.', ',', 'DMY'])
eq('resolución: documento', lc['en']['loc']['doc'], ['de-DE', ',', '.', 'DMY'])
eq('resolución: lang de la tabla', lc['en']['loc']['tabla'], ['en-US', '.', ',', 'MDY'])
eq('resolución: opción', lc['en']['loc']['opcion'], ['es-CO', ',', '.', 'DMY'])
for ctx in ('de', 'esES', 'es'):
    eq(f'resolución: sin lang ni opción -> es-MX (navegador {ctx})', lc[ctx]['loc']['nav'], ['es-MX', '.', ',', 'DMY'])
eq('resolución: locale:auto usa el navegador en-US', lc['en']['loc']['auto'], ['en-US', '.', ',', 'MDY'])
eq('resolución: locale:auto usa el navegador es-ES', lc['esES']['loc']['auto'], ['es-ES', ',', '.', 'DMY'])
eq('resolución: locale:auto usa el navegador es', lc['es']['loc']['auto'], ['es', ',', '.', 'DMY'])
eq('resolución: lang="es" sin región = no declarado', lc['en']['loc']['langEs'], ['es-MX', '.', ',', 'DMY'])
eq('resolución: lang="es" sube al ancestro con región', lc['en']['loc']['anidada'], ['es-CO', ',', '.', 'DMY'])
for key, ctx in (('locales.xlsx', 'en-US'), ('locales-nav-de.xlsx', 'de-DE'), ('locales-nav-es-ES.xlsx', 'es-ES'), ('locales-nav-es.xlsx', 'es')):
    eq(f'navegador {ctx}, página sin lang: "1,234.56" es 1234.56', nd(key, 'sin-lang'), [(1234.56, D(2026, 4, 3))])
    eq(f'navegador {ctx}: lang="es" sin región no declara ("1,234" = 1234)', nd(key, 'lang-es'), [(1234, D(2026, 4, 3))])
    eq(f'navegador {ctx}: inferencia por columna, coma decimal', nd(key, 'columna', (2, 3)), [(1234.56, D(2026, 4, 3)), (12.5, D(2026, 6, 5))])
    eq(f'navegador {ctx}: inferencia por "1.234.567"', nd(key, 'columna-miles', (2, 3)), [(1234567, None), (12.5, None)])
    eq(f'navegador {ctx}: arreglo con inferencia por columna', [load(key)['arreglo-inferido'][f'A{r}'].value for r in (2, 3)], [1234.56, 12.5])
    eq(f'navegador {ctx}: lang="es" dentro de lang="es-CO"', nd(key, 'anidada'), [(1.5, D(2026, 4, 3))])
eq('locale:auto con navegador en-US', nd('locales.xlsx', 'auto'), [(1234.5, D(2026, 3, 4))])
eq('locale:auto con navegador es-ES ("1,234.5" no es número)', nd('locales-nav-es-ES.xlsx', 'auto'), [('1,234.5', D(2026, 4, 3))])
eq('locale:auto con navegador es', nd('locales-nav-es.xlsx', 'auto'), [('1,234.5', D(2026, 4, 3))])
cs = lc['en']['csv']
eq('CSV es-ES: ";" y coma decimal', cs['esES'], 'N;F\r\n1234,56;2026-04-03\r\n')
eq('CSV en-US: ","', cs['enUS'], 'N,F\r\n1234.56,2026-03-04\r\n')
eq('CSV delimiter forzado', cs['forzado'], 'N,F\r\n"1234,56",2026-04-03\r\n')
eq('CSV de-DE desde arreglo', cs['deArr'], 'a;b\r\n1,5;"x;y"\r\n')
eq('CSV raw: punto decimal', cs['raw'], 'N;F\r\n1234.56;2026-04-03\r\n')
eq('CSV: la inferencia por contenido no cambia el delimitador (es-MX)', cs['columna'], 'N,F\r\n1234.56,2026-04-03\r\n12.5,2026-06-05\r\n')

# ---------- Node ----------
ws = load('node.xlsx').active
eq('Node require: XLSX', (ws.title, ws['A2'].value, ws['B2'].value), ('Node', 1, 'Node'))
eq('Node require: CSV', R['nodeCsv'], 'a,b\r\n1.5,x\r\n')

# ---------- ejemplo ----------
eq('excel-demo.html: descargas', R['demo'], ['demo-clientes.xlsx', 'demo-clientes-columnas.xlsx', 'demo-clientes.csv', 'demo-ventas.xlsx', 'demo-productos.xlsx', 'demo-gastos.xlsx', 'demo-libro-completo.xlsx'])
eq('excel-demo.html: libro con las cuatro fuentes', load('demo-libro-completo.xlsx').sheetnames, ['Clientes', 'Ventas', 'Productos', 'Gastos'])
ws = load('demo-ventas.xlsx').active
eq('excel-demo.html: tabla sin la columna no-print', (ws.max_column, ws['B3'].value, ws['A5'].value), (4, 1234.56, 'Total'))
ws = load('demo-productos.xlsx').active
eq('excel-demo.html: edit-table', (ws.title, ws['C2'].value, ws['D2'].value, ws['F3'].value), ('Productos', 45.5, 'PIEZA', 'No'))

print(f'\nopenpyxl {openpyxl.__version__}: {"todas las validaciones pasaron" if not fails else str(fails) + " fallas"}')
sys.exit(1 if fails else 0)
