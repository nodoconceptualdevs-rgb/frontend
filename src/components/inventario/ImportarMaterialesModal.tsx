"use client";

import React, { useState } from "react";
import { Modal, Button, Upload, Progress, Table, Tag, Tooltip, Alert, Empty } from "antd";
import { Plus, Download, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { createMaterial, getCategorias, getUnidades } from "@/services/inventario";
import { parseSpanishNumber } from "@/lib/excelParsers";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
}

interface ParsedRow {
  key: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stockInicial: number;
  precioUnitario: number;
  status: "ok" | "warn" | "error";
  errors: string[];
}

export default function ImportarMaterialesModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });
  const [categorias, setCategorias] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Código", "Nombre", "Categoría", "Unidad", "Stock Inicial", "Precio Unitario"],
      ["MAT-001", "Cemento Portland (50kg)", "Cementantes", "bolsa", "100", "15.500,00"],
      ["MAT-002", "Acero corrugado #3", "Aceros", "kg", "500", "2.850,75"],
    ]);
    ws["!cols"] = [{ wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_materiales.xlsx");
  };

  const parseExcelFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];

        // Obtener categorías y unidades disponibles
        const [cats, unis] = await Promise.all([getCategorias(), getUnidades()]);
        const categoriasSet = new Set(cats.map((c: any) => c.nombre.toLowerCase()));
        const unidadesSet = new Set(unis.map((u: any) => u.nombre.toLowerCase()));

        // Detectar encabezados
        let headerRowIndex = -1;
        const keywords = ["código", "codigo", "nombre", "categoría", "categoria", "unidad", "stock", "precio"];
        for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
          const row = rawRows[i];
          const matches = row.filter((cell) =>
            typeof cell === "string" && keywords.some((kw) => cell.toLowerCase().includes(kw))
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
        const codigoCol = headerRow.findIndex((h) =>
          typeof h === "string" && (h.toLowerCase().includes("código") || h.toLowerCase().includes("codigo"))
        );
        const nombreCol = headerRow.findIndex((h) => typeof h === "string" && h.toLowerCase().includes("nombre"));
        const categoriaCol = headerRow.findIndex((h) =>
          typeof h === "string" && (h.toLowerCase().includes("categoría") || h.toLowerCase().includes("categoria"))
        );
        const unidadCol = headerRow.findIndex((h) => typeof h === "string" && h.toLowerCase().includes("unidad"));
        const stockCol = headerRow.findIndex((h) => typeof h === "string" && h.toLowerCase().includes("stock"));
        const precioCol = headerRow.findIndex((h) => typeof h === "string" && h.toLowerCase().includes("precio"));

        const parsed: ParsedRow[] = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every((cell) => !cell)) continue;

          const rawCodigo = String(row[codigoCol] || "").trim();
          const rawNombre = String(row[nombreCol] || "").trim();
          const rawCategoria = String(row[categoriaCol] || "").trim();
          const rawUnidad = String(row[unidadCol] || "").trim();
          const rawStock = row[stockCol];
          const rawPrecio = row[precioCol];

          if (!rawNombre && !rawCodigo) continue;

          const codigo = rawCodigo || `MAT-${parsed.length + 1}`;
          const nombre = rawNombre;
          const categoria = rawCategoria;
          const unidad = rawUnidad;
          const stockInicial = parseSpanishNumber(rawStock);
          const precioUnitario = parseSpanishNumber(rawPrecio);

          const errors: string[] = [];

          if (!nombre) errors.push("Nombre requerido");
          if (!categoria) errors.push("Categoría requerida");
          if (!unidad) errors.push("Unidad requerida");
          if (isNaN(precioUnitario) || precioUnitario < 0) errors.push("Precio inválido");
          if (isNaN(stockInicial) && stockInicial !== 0) errors.push("Stock inválido");
          if (categoria && !categoriasSet.has(categoria.toLowerCase())) errors.push(`Categoría no existe: ${categoria}`);
          if (unidad && !unidadesSet.has(unidad.toLowerCase())) errors.push(`Unidad no existe: ${unidad}`);

          const status = errors.length > 0 ? "error" : "ok";

          parsed.push({
            key: `${codigo}-${nombre}`,
            codigo,
            nombre,
            categoria,
            unidad,
            stockInicial: isNaN(stockInicial) ? 0 : stockInicial,
            precioUnitario,
            status,
            errors,
          });
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
      toast.error("Selecciona al menos un material");
      return;
    }

    setStep("importing");
    setImportProgress({ current: 0, total: selected.length, errors: [] });

    for (const row of selected) {
      try {
        await createMaterial(
          row.nombre,
          row.categoria,
          row.unidad,
          undefined,
          row.precioUnitario,
          row.codigo
        );
        setImportProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      } catch (error) {
        console.error("Error importando material:", error);
        setImportProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          errors: [...prev.errors, row.codigo],
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
      width: 100,
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
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 120,
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (text: string) => text.substring(0, 35) + (text.length > 35 ? "..." : ""),
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 130,
    },
    {
      title: "Unidad",
      dataIndex: "unidad",
      key: "unidad",
      width: 100,
    },
    {
      title: "Stock Inicial",
      dataIndex: "stockInicial",
      key: "stockInicial",
      align: "right" as const,
      width: 120,
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      align: "right" as const,
      width: 130,
      render: (val: number) => `$${val.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`,
    },
  ];

  return (
    <Modal
      title={
        step === "upload" ? "Importar Materiales desde Excel" :
        step === "preview" ? `Revisar materiales detectados (${parsedRows.length} filas)` :
        step === "importing" ? "Importando materiales..." :
        "Importación completada"
      }
      open={open}
      onCancel={handleClose}
      width={step === "preview" ? 1000 : 600}
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
            scroll={{ x: 900 }}
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
            Importando material {importProgress.current} de {importProgress.total}...
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <Alert
            message={`${importProgress.current - importProgress.errors.length} materiales importados correctamente`}
            type="success"
            showIcon
          />
          {importProgress.errors.length > 0 && (
            <Alert
              message={`${importProgress.errors.length} materiales con error`}
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
