"use client";

import React, { useState, useCallback } from "react";
import {
  Modal,
  Button,
  Table,
  Tag,
  Tooltip,
  Progress,
  Alert,
  Upload,
} from "antd";
import { FileUp, Download, Upload as UploadIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { parseSpanishNumber, isEsExtraCode } from "@/lib/excelParsers";
import { createPartida } from "@/services/obras";
import type { PartidaFormValues } from "@/types/obras";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ValidationStatus = "ok" | "warn" | "error";
type Step = "upload" | "preview" | "importing" | "done";

interface ParsedRow {
  key: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidadPresupuestada: number;
  precioUnitario: number;
  esExtra: boolean;
  status: ValidationStatus;
  errors: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  errors: string[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  obraId: number;
  onClose: () => void;
  onImported: () => Promise<void>;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const HEADER_KEYWORDS = ["descripci", "unidad", "cantidad", "precio", "codigo", "código"];

function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    const cellStrings = row.map((c) => String(c ?? "").toLowerCase());
    const matches = HEADER_KEYWORDS.filter((kw) =>
      cellStrings.some((cell) => cell.includes(kw))
    );
    if (matches.length >= 2) return i;
  }
  return 0;
}

function findColIndex(headerRow: unknown[], keyword: string): number {
  return headerRow.findIndex((cell) =>
    String(cell ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .includes(keyword)
  );
}

function cellStr(row: unknown[], idx: number): string {
  if (idx < 0 || idx >= row.length) return "";
  return String(row[idx] ?? "").trim();
}

function parseExcelBuffer(buffer: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
  });

  const headerIdx = detectHeaderRow(rawRows);
  const headerRow = rawRows[headerIdx] ?? [];

  // Mapeo de columnas
  let codigoCol = findColIndex(headerRow, "codigo");
  if (codigoCol < 0) codigoCol = findColIndex(headerRow, "digo"); // fallback "Código"
  if (codigoCol < 0) codigoCol = 1; // fallback posicional (col B)

  const descripcionCol = (() => {
    let idx = findColIndex(headerRow, "descripci");
    if (idx < 0) idx = findColIndex(headerRow, "descripcion");
    if (idx < 0) idx = 2;
    return idx;
  })();

  const unidadCol = (() => {
    let idx = findColIndex(headerRow, "unidad");
    if (idx < 0) idx = 3;
    return idx;
  })();

  const cantidadCol = (() => {
    let idx = findColIndex(headerRow, "cantidad");
    if (idx < 0) idx = 4;
    return idx;
  })();

  const precioCol = (() => {
    let idx = findColIndex(headerRow, "precio");
    if (idx < 0) idx = 5;
    return idx;
  })();

  const esExtraCol = findColIndex(headerRow, "extra");

  const results: ParsedRow[] = [];

  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Saltar filas vacías
    if (row.every((c) => String(c ?? "").trim() === "")) continue;

    const rawCodigo = cellStr(row, codigoCol);
    const rawDescripcion = cellStr(row, descripcionCol);

    // Saltar filas de totales o encabezados repetidos
    if (rawCodigo.toUpperCase().includes("TOTAL")) continue;
    if (rawCodigo === "Part No." || rawCodigo === "Part No") continue;
    if (rawCodigo === "" && rawDescripcion === "") continue;

    const rawUnidad = cellStr(row, unidadCol);
    const rawCantidad = row[cantidadCol];
    const rawPrecio = row[precioCol];
    const rawEsExtra = esExtraCol >= 0 ? cellStr(row, esExtraCol) : "";

    const cantidad = parseSpanishNumber(rawCantidad as string | number);
    const precio = parseSpanishNumber(rawPrecio as string | number);

    // Determinar esExtra
    const esExtraByCodigo = isEsExtraCode(rawCodigo);
    const esExtraByCell = ["s", "si", "sí", "yes", "true", "1"].includes(
      rawEsExtra.toLowerCase()
    );
    const esExtra = esExtraByCodigo || esExtraByCell;

    // Validación
    const errors: string[] = [];
    if (!rawCodigo) errors.push("Código requerido");
    if (!rawUnidad) errors.push("Unidad requerida");
    if (isNaN(precio) || precio <= 0) errors.push("Precio inválido");
    if (!esExtra && (isNaN(cantidad) || cantidad < 0))
      errors.push("Cantidad inválida");

    const warns: string[] = [];
    if (!rawDescripcion) warns.push("Sin descripción");

    const status: ValidationStatus =
      errors.length > 0 ? "error" : warns.length > 0 ? "warn" : "ok";

    results.push({
      key: String(i),
      codigo: rawCodigo,
      descripcion: rawDescripcion,
      unidad: rawUnidad,
      cantidadPresupuestada: isNaN(cantidad) ? 0 : cantidad,
      precioUnitario: isNaN(precio) ? 0 : precio,
      esExtra,
      status,
      errors: [...errors, ...warns],
    });
  }

  return results;
}

// ─── Descarga de plantilla ────────────────────────────────────────────────────

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Código", "Descripción", "Unidad", "Cantidad", "Precio Unitario", "Es Extra (S/N)"],
    ["V05.001", "Suministro e instalación de tabiquería de yeso", "m2", 96.78, 45.20, "N"],
    ["OE-01", "Construcción de sobrepiso de concreto", "m3", 0.61, 308.99, "S"],
  ]);
  ws["!cols"] = [
    { wch: 18 },
    { wch: 52 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
  XLSX.writeFile(wb, "plantilla_partidas.xlsx");
}

// ─── Formato moneda ───────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ImportarPartidasModal({
  open,
  obraId,
  onClose,
  onImported,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    errors: [],
  });

  const reset = useCallback(() => {
    setStep("upload");
    setParsedRows([]);
    setSelectedKeys([]);
    setImportProgress({ current: 0, total: 0, errors: [] });
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const rows = parseExcelBuffer(buffer);
        setParsedRows(rows);
        // Pre-seleccionar todas las filas válidas (ok y warn)
        setSelectedKeys(
          rows.filter((r) => r.status !== "error").map((r) => r.key)
        );
        setStep("preview");
      } catch (err) {
        console.error("Error parsing Excel:", err);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // prevenir upload automático de antd
  }, []);

  const handleImport = async () => {
    const selected = parsedRows.filter((r) => selectedKeys.includes(r.key));
    const progress: ImportProgress = {
      current: 0,
      total: selected.length,
      errors: [],
    };
    setImportProgress({ ...progress });
    setStep("importing");

    for (const row of selected) {
      const values: PartidaFormValues = {
        codigo: row.codigo,
        descripcion: row.descripcion,
        unidad: row.unidad,
        cantidadPresupuestada: row.cantidadPresupuestada,
        precioUnitario: row.precioUnitario,
        esExtra: row.esExtra,
      };
      try {
        await createPartida(obraId, values);
        progress.current++;
      } catch {
        progress.errors.push(row.codigo || `fila ${row.key}`);
        progress.current++;
      }
      setImportProgress({ ...progress });
    }

    setStep("done");
    await onImported();
  };

  // ── Contadores para el preview ─────────────────────────────────────────────
  const countOk = parsedRows.filter((r) => r.status === "ok").length;
  const countWarn = parsedRows.filter((r) => r.status === "warn").length;
  const countError = parsedRows.filter((r) => r.status === "error").length;

  // ── Columnas de la tabla preview ───────────────────────────────────────────
  const columns = [
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: ValidationStatus, record: ParsedRow) => {
        const colorMap: Record<ValidationStatus, string> = {
          ok: "success",
          warn: "warning",
          error: "error",
        };
        const labelMap: Record<ValidationStatus, string> = {
          ok: "OK",
          warn: "Advertencia",
          error: "Error",
        };
        return (
          <Tooltip title={record.errors.join(" · ") || undefined}>
            <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 110,
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      render: (v: string) => (
        <Tooltip title={v.length > 40 ? v : undefined}>
          <span>{v.length > 40 ? v.slice(0, 40) + "…" : v || <span className="text-gray-400 italic">sin descripción</span>}</span>
        </Tooltip>
      ),
    },
    {
      title: "Ud.",
      dataIndex: "unidad",
      key: "unidad",
      width: 55,
      align: "center" as const,
    },
    {
      title: "Cantidad",
      dataIndex: "cantidadPresupuestada",
      key: "cantidad",
      width: 90,
      align: "right" as const,
      render: (v: number, r: ParsedRow) =>
        r.esExtra ? <span className="text-gray-400">—</span> : v.toLocaleString("es-CO"),
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precio",
      width: 110,
      align: "right" as const,
      render: (v: number) => fmt(v),
    },
    {
      title: "Extra",
      dataIndex: "esExtra",
      key: "esExtra",
      width: 60,
      align: "center" as const,
      render: (v: boolean) =>
        v ? <Tag color="green">SÍ</Tag> : <Tag color="default">NO</Tag>,
    },
  ];

  // ── Footer por paso ────────────────────────────────────────────────────────
  const footer = () => {
    if (step === "upload") {
      return [
        <Button key="tpl" icon={<Download size={14} />} onClick={downloadTemplate}>
          Descargar Plantilla
        </Button>,
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
      ];
    }
    if (step === "preview") {
      return [
        <Button key="back" onClick={() => setStep("upload")}>
          Volver
        </Button>,
        <Button key="cancel" onClick={handleClose}>
          Cancelar
        </Button>,
        <Button
          key="import"
          type="primary"
          icon={<FileUp size={14} />}
          disabled={selectedKeys.length === 0}
          onClick={handleImport}
        >
          Importar {selectedKeys.length} seleccionada{selectedKeys.length !== 1 ? "s" : ""}
        </Button>,
      ];
    }
    if (step === "done") {
      return [
        <Button key="close" type="primary" onClick={handleClose}>
          Cerrar
        </Button>,
      ];
    }
    return [];
  };

  const title =
    step === "preview"
      ? `Revisar partidas detectadas (${parsedRows.length} filas)`
      : "Importar Partidas desde Excel";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={step === "importing" ? undefined : handleClose}
      closable={step !== "importing"}
      maskClosable={step !== "importing"}
      footer={footer()}
      width={step === "preview" ? 1000 : 600}
      destroyOnHidden
      afterClose={reset}
    >
      {/* ── Paso: upload ─────────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Sube un archivo Excel con las partidas presupuestadas de la obra.
            El sistema detectará automáticamente los encabezados y filas de datos.
          </p>

          <Upload.Dragger
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleFile}
            className="py-4"
          >
            <div className="flex flex-col items-center gap-3 py-4">
              <UploadIcon size={40} className="text-blue-400" />
              <p className="text-base font-medium text-gray-700">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-400">.xlsx o .xls — máx. 5 MB</p>
            </div>
          </Upload.Dragger>

          <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 space-y-1">
            <p className="font-semibold">Formato esperado en el Excel:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>Columnas: <strong>Código, Descripción, Unidad, Cantidad, Precio Unitario</strong></li>
              <li>Los números pueden usar coma decimal (ej: "4.374,46") o punto decimal</li>
              <li>Códigos que empiecen con <strong>OE</strong> se marcan automáticamente como Obras Extras</li>
              <li>Las filas de totales y encabezados se omiten automáticamente</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Paso: preview ────────────────────────────────────────────── */}
      {step === "preview" && (
        <div className="space-y-3">
          {/* Resumen */}
          <div className="flex gap-3 text-sm">
            {countOk > 0 && (
              <span className="flex items-center gap-1">
                <Tag color="success">OK</Tag>
                <span>{countOk} listas</span>
              </span>
            )}
            {countWarn > 0 && (
              <span className="flex items-center gap-1">
                <Tag color="warning">Advertencia</Tag>
                <span>{countWarn} con advertencias</span>
              </span>
            )}
            {countError > 0 && (
              <span className="flex items-center gap-1">
                <Tag color="error">Error</Tag>
                <span>{countError} con errores (no pre-seleccionadas)</span>
              </span>
            )}
          </div>

          <Table
            size="small"
            bordered
            pagination={{ pageSize: 15, showSizeChanger: false }}
            dataSource={parsedRows}
            columns={columns}
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as string[]),
              getCheckboxProps: (record: ParsedRow) => ({
                disabled: false,
              }),
            }}
            rowClassName={(record: ParsedRow) =>
              record.status === "error" ? "opacity-50" : ""
            }
          />
        </div>
      )}

      {/* ── Paso: importing ──────────────────────────────────────────── */}
      {step === "importing" && (
        <div className="py-8 space-y-4">
          <p className="text-center text-gray-600">
            Importando partida {importProgress.current} de {importProgress.total}…
          </p>
          <Progress
            percent={Math.round(
              (importProgress.current / importProgress.total) * 100
            )}
            status="active"
          />
          <p className="text-center text-sm text-gray-400">
            No cierres esta ventana hasta que termine
          </p>
        </div>
      )}

      {/* ── Paso: done ───────────────────────────────────────────────── */}
      {step === "done" && (
        <div className="py-4 space-y-3">
          <Alert
            type="success"
            message={`${importProgress.total - importProgress.errors.length} partidas importadas correctamente`}
            showIcon
          />
          {importProgress.errors.length > 0 && (
            <Alert
              type="warning"
              message={`${importProgress.errors.length} partidas fallaron`}
              description={
                <ul className="mt-1 list-disc list-inside text-sm">
                  {importProgress.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              }
              showIcon
            />
          )}
        </div>
      )}
    </Modal>
  );
}
