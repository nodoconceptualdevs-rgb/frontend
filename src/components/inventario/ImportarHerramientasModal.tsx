"use client";

import React, { useState } from "react";
import { Modal, Button, Upload, Progress, Table, Tag, Tooltip, Alert } from "antd";
import { Download, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { createHerramienta, getCategoriasHerramienta } from "@/services/inventario";
import { parseSpanishNumber } from "@/lib/excelParsers";
import type { Herramienta } from "@/types/inventario";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
}

interface ParsedRow {
  key: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  serie: string;
  marca: string;
  unidad: string;
  ubicacionDeposito: string;
  cantidad: number;
  estado: Herramienta["estado"];
  status: "ok" | "warn" | "error";
  errors: string[];
}

const ESTADO_KEYWORDS: Array<[string, Herramienta["estado"]]> = [
  ["mantenimiento", "MANTENIMIENTO"],
  ["descart", "DESCARTADA"],
  ["baja", "DESCARTADA"],
  ["en uso", "EN_USO"],
  ["uso", "EN_USO"],
  ["bueno", "DISPONIBLE"],
  ["disponible", "DISPONIBLE"],
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function detectarEstado(valor: string): Herramienta["estado"] {
  const normalizado = normalizar(valor);
  if (!normalizado) return "DISPONIBLE";
  const match = ESTADO_KEYWORDS.find(([kw]) => normalizado.includes(kw));
  return match ? match[1] : "DISPONIBLE";
}

function encontrarColumna(headerRow: unknown[], patrones: string[]): number {
  return headerRow.findIndex(
    (h) => typeof h === "string" && patrones.some((p) => normalizar(h).includes(p))
  );
}

export default function ImportarHerramientasModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Serie/Placa", "Categoría", "Descripción", "Marca", "Unidad", "Cantidad", "Estado", "Ubicación en Depósito"],
      ["s/n 25067440182", "Herramienta eléctrica", "Taladro inalámbrico", "WADFOW", "pieza", "1", "Bueno", "Carpintería"],
      ["UWFCP518", "Herramienta eléctrica", "Cargador", "WADFOW", "pieza", "1", "Bueno", "Carpintería"],
    ]);
    ws["!cols"] = [
      { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_herramientas.xlsx");
  };

  const parseExcelFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];

        // Obtener categorías disponibles de herramientas
        const cats = await getCategoriasHerramienta();
        const categoriasSet = new Set(cats.map((c) => c.nombre.toLowerCase()));

        // Detectar fila de encabezados
        let headerRowIndex = -1;
        const keywords = [
          "nombre", "descripcion", "categoria", "cantidad",
          "serie", "placa", "marca", "unidad", "estado", "ubicacion", "deposito",
        ];
        for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
          const row = rawRows[i];
          const matches = row.filter(
            (cell) => typeof cell === "string" && keywords.some((kw) => normalizar(cell).includes(kw))
          ).length;
          if (matches >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          toast.error("No se detectó fila de encabezados");
          return;
        }

        const headerRow = rawRows[headerRowIndex];
        const nombreCol = encontrarColumna(headerRow, ["nombre"]);
        const descripcionCol = encontrarColumna(headerRow, ["descripcion"]);
        const categoriaCol = encontrarColumna(headerRow, ["categoria"]);
        const cantidadCol = encontrarColumna(headerRow, ["cantidad"]);
        const serieCol = encontrarColumna(headerRow, ["serie", "placa"]);
        const marcaCol = encontrarColumna(headerRow, ["marca"]);
        const unidadCol = encontrarColumna(headerRow, ["unidad"]);
        const estadoCol = encontrarColumna(headerRow, ["estado"]);
        const ubicacionCol = encontrarColumna(headerRow, ["ubicacion", "deposito"]);

        const parsed: ParsedRow[] = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every((cell) => !cell)) continue;

          const rawNombre = nombreCol !== -1 ? String(row[nombreCol] || "").trim() : "";
          const rawDescripcionCol = descripcionCol !== -1 ? String(row[descripcionCol] || "").trim() : "";

          // Si no hay columna "Nombre", se usa la Descripción como nombre identificador
          // (formato de planilla real: solo trae una columna de descripción).
          const nombre = rawNombre || rawDescripcionCol;
          const descripcion = rawNombre ? rawDescripcionCol : "";

          const categoria = categoriaCol !== -1 ? String(row[categoriaCol] || "").trim() : "";
          const serie = serieCol !== -1 ? String(row[serieCol] || "").trim() : "";
          const marca = marcaCol !== -1 ? String(row[marcaCol] || "").trim() : "";
          const unidad = unidadCol !== -1 ? String(row[unidadCol] || "").trim() : "";
          const ubicacionDeposito = ubicacionCol !== -1 ? String(row[ubicacionCol] || "").trim() : "";
          const rawCantidad = cantidadCol !== -1 ? (row[cantidadCol] as string | number | undefined) : undefined;
          const cantidad = parseSpanishNumber(rawCantidad) || 1;
          const estado = estadoCol !== -1 ? detectarEstado(String(row[estadoCol] || "")) : "DISPONIBLE";

          if (!nombre) continue;

          const errors: string[] = [];
          if (!categoria) errors.push("Categoría requerida");
          if (isNaN(cantidad) || cantidad < 1) errors.push("Cantidad debe ser ≥ 1");
          if (categoria && !categoriasSet.has(categoria.toLowerCase())) errors.push(`Categoría no existe: ${categoria}`);

          const status = errors.length > 0 ? "error" : "ok";

          parsed.push({
            key: `${i}-${nombre}`,
            nombre,
            descripcion,
            categoria,
            serie,
            marca,
            unidad,
            ubicacionDeposito,
            cantidad: isNaN(cantidad) || cantidad < 1 ? 1 : Math.floor(cantidad),
            estado,
            status,
            errors,
          });
        }

        if (parsed.length === 0) {
          toast.error("No se detectaron filas válidas (verifica que tenga columna Nombre o Descripción)");
          return;
        }

        setParsedRows(parsed);
        setSelectedKeys(parsed.filter((p) => p.status === "ok").map((p) => p.key));
        setStep("preview");
      } catch (error) {
        console.error("Error parsing Excel:", error);
        toast.error("Error al parsear el archivo Excel");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = (files: File[]) => {
    if (files.length > 0) {
      parseExcelFile(files[0]);
    }
    return false;
  };

  const handleImport = async () => {
    const selected = parsedRows.filter((p) => selectedKeys.includes(p.key));
    if (selected.length === 0) {
      toast.error("Selecciona al menos una herramienta");
      return;
    }

    setStep("importing");
    setImportProgress({ current: 0, total: selected.length, errors: [] });

    for (const row of selected) {
      try {
        await createHerramienta({
          nombre: row.nombre,
          descripcion: row.descripcion || undefined,
          categoria: row.categoria,
          serie: row.serie || undefined,
          marca: row.marca || undefined,
          unidad: row.unidad || undefined,
          ubicacionDeposito: row.ubicacionDeposito || undefined,
          estado: row.estado,
          cantidad: row.cantidad,
        });
        setImportProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      } catch (error) {
        console.error("Error importando herramienta:", error);
        setImportProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          errors: [...prev.errors, row.nombre],
        }));
      }
    }

    await onImported();
    setStep("done");
  };

  const handleClose = () => {
    setStep("upload");
    setParsedRows([]);
    setSelectedKeys([]);
    setImportProgress({ current: 0, total: 0, errors: [] });
    onClose();
  };

  const columns = [
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: string, record: ParsedRow) => {
        const icon = status === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />;
        const color = status === "ok" ? "green" : status === "warn" ? "orange" : "red";
        return (
          <Tooltip title={record.errors.join(", ")}>
            <Tag icon={icon} color={color}>
              {status === "ok" ? "OK" : status === "warn" ? "Adv." : "Error"}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      width: 220,
      render: (text: string) => text.substring(0, 35) + (text.length > 35 ? "..." : ""),
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 130,
    },
    {
      title: "Marca",
      dataIndex: "marca",
      key: "marca",
      width: 100,
    },
    {
      title: "Serie/Placa",
      dataIndex: "serie",
      key: "serie",
      width: 130,
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 90,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      align: "right" as const,
      width: 90,
    },
    {
      title: "Ubicación",
      dataIndex: "ubicacionDeposito",
      key: "ubicacionDeposito",
      width: 140,
    },
  ];

  return (
    <Modal
      title={
        step === "upload" ? "Importar Herramientas desde Excel" :
        step === "preview" ? `Revisar herramientas detectadas (${parsedRows.length} filas)` :
        step === "importing" ? "Importando herramientas..." :
        "Importación completada"
      }
      open={open}
      onCancel={handleClose}
      width={step === "preview" ? 1200 : 600}
      footer={null}
      destroyOnHidden
    >
      {step === "upload" && (
        <div className="space-y-4">
          <Upload.Dragger
            accept=".xlsx,.xls"
            beforeUpload={(file) => handleUpload([file])}
          >
            <p className="text-base">📁 Arrastra un archivo Excel aquí</p>
            <p className="text-sm text-gray-500">o haz clic para seleccionar</p>
          </Upload.Dragger>
          <p className="text-xs text-gray-500">
            Acepta planillas con columnas Serie/Placa, Categoría, Descripción (o Nombre), Marca, Unidad,
            Cantidad, Estado y Ubicación en Depósito. El código de barra se genera automáticamente al importar.
          </p>
          <div className="flex justify-between">
            <Button onClick={downloadTemplate} type="default" icon={<Download size={16} />}>
              Descargar Plantilla
            </Button>
            <Button onClick={handleClose}>Cancelar</Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <Table
            columns={columns}
            dataSource={parsedRows}
            rowKey="key"
            size="small"
            pagination={{ pageSize: 10 }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
            }}
            scroll={{ x: 1100 }}
          />
          <div className="text-xs text-gray-500">
            {parsedRows.filter((p) => p.status === "ok").length} listas,{" "}
            {parsedRows.filter((p) => p.status === "warn").length} advertencias,{" "}
            {parsedRows.filter((p) => p.status === "error").length} errores
          </div>
          <div className="flex justify-between">
            <Button onClick={() => setStep("upload")}>Volver</Button>
            <div className="flex gap-2">
              <Button onClick={handleClose}>Cancelar</Button>
              <Button
                type="primary"
                onClick={handleImport}
                disabled={selectedKeys.length === 0}
              >
                Importar {selectedKeys.length} seleccionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="space-y-4 text-center">
          <Progress
            percent={Math.round((importProgress.current / importProgress.total) * 100)}
            status={importProgress.current < importProgress.total ? "active" : "success"}
          />
          <p className="text-sm">
            Importando herramienta {importProgress.current} de {importProgress.total}...
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <Alert
            message={`${importProgress.current - importProgress.errors.length} herramientas importadas correctamente`}
            type="success"
            showIcon
          />
          {importProgress.errors.length > 0 && (
            <Alert
              message={`${importProgress.errors.length} herramientas con error`}
              description={importProgress.errors.join(", ")}
              type="warning"
              showIcon
            />
          )}
          <div className="flex justify-end">
            <Button type="primary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
