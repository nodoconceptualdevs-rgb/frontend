import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

interface MaterialParaPdf {
  nombre: string;
  codigo: string;
}

function generarImagenBarcode(codigo: string): string {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, codigo, {
    format: "CODE128",
    width: 2,
    height: 50,
    fontSize: 14,
    margin: 6,
    displayValue: true,
  });
  return canvas.toDataURL("image/png");
}

const MARGEN = 15;
const COLUMNAS = 2;
const ANCHO_ETIQUETA = 88;
const ALTO_ETIQUETA = 32;
const GAP_X = 8;
const GAP_Y = 8;

export function generarPdfCodigosBarra(materiales: MaterialParaPdf[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const altoPagina = doc.internal.pageSize.getHeight();

  let x = MARGEN;
  let y = MARGEN;
  let columna = 0;

  materiales.forEach((material) => {
    if (y + ALTO_ETIQUETA > altoPagina - MARGEN) {
      doc.addPage();
      x = MARGEN;
      y = MARGEN;
      columna = 0;
    }

    doc.setDrawColor(210);
    doc.rect(x, y, ANCHO_ETIQUETA, ALTO_ETIQUETA);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const lineasNombre = doc.splitTextToSize(material.nombre, ANCHO_ETIQUETA - 6).slice(0, 1);
    doc.text(lineasNombre, x + 3, y + 6);

    const barcodeDataUrl = generarImagenBarcode(material.codigo);
    doc.addImage(barcodeDataUrl, "PNG", x + 3, y + 9, ANCHO_ETIQUETA - 6, ALTO_ETIQUETA - 12);

    columna++;
    if (columna >= COLUMNAS) {
      columna = 0;
      x = MARGEN;
      y += ALTO_ETIQUETA + GAP_Y;
    } else {
      x += ANCHO_ETIQUETA + GAP_X;
    }
  });

  doc.save(`codigos-barra-materiales-${Date.now()}.pdf`);
}
