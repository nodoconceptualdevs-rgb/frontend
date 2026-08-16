import React, { useState } from "react";
import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Empty,
  Tabs,
  Upload,
} from "antd";
import { Plus, Trash2, Users, Package, Image, X, FolderOpen, Camera } from "lucide-react";
import BibliotecaArchivos from "@/components/BibliotecaArchivos";
import type { MediaFile } from "@/services/mediaLibrary";
import type {
  Obra,
  MaterialDisponible,
  Personal,
  ReporteFormValues,
  ReporteDiario,
} from "@/types/obras";
import type { Herramienta } from "@/types/inventario";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

interface Props {
  obra: Obra;
  personal: Personal[];
  materiales: MaterialDisponible[];
  herramientas: Herramienta[];
  reporteEditar?: ReporteDiario | null;
  onSubmit: (values: ReporteFormValues) => Promise<void>;
  onCancel?: () => void;
}

interface LineaPartida {
  id: string;
  partidaId?: number;
  montoAplicado: number;
  personal: { id: string; personalId?: number; horasTrabajadas: number }[];
  materiales: {
    id: string;
    materialId?: number;
    cantidad: number;
    precioUnitario: number;
  }[];
  herramientas: {
    id: string;
    herramientaId?: number;
    cantidad: number;
    costoUnitario: number;
  }[];
}

export default function ReporteFormSection({
  obra,
  personal,
  materiales,
  herramientas,
  reporteEditar,
  onSubmit,
  onCancel,
}: Props) {
  const lineaInicial: LineaPartida | null = reporteEditar
    ? {
        id: uuidLocal(),
        partidaId: reporteEditar.partidaId,
        montoAplicado: reporteEditar.montoAplicado,
        personal: reporteEditar.personal.map((p) => ({
          id: uuidLocal(),
          personalId: p.personalId,
          horasTrabajadas: p.horasTrabajadas,
        })),
        materiales: reporteEditar.materiales.map((m) => ({
          id: uuidLocal(),
          materialId: m.materialId,
          cantidad: m.cantidad,
          precioUnitario: m.precioUnitario,
        })),
        herramientas: [],
      }
    : null;

  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<string>(reporteEditar ? reporteEditar.fecha : dayjs().toISOString());
  const [observaciones, setObservaciones] = useState<string>(reporteEditar?.observaciones || "");
  const [imagenesArchivos, setImagenesArchivos] = useState<File[]>([]);
  const [previewImagenes, setPreviewImagenes] = useState<string[]>([]);
  const [imagenesFromLibrary, setImagenesFromLibrary] = useState<MediaFile[]>(
    (reporteEditar?.imagenes || []).map((img) => ({
      id: img.id,
      name: img.name,
      alternativeText: null,
      caption: null,
      width: null,
      height: null,
      formats: null,
      hash: "",
      ext: "",
      mime: img.mime,
      size: img.size,
      url: img.url,
      previewUrl: null,
      provider: "local",
      createdAt: "",
      updatedAt: "",
    }))
  );
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false);
  const [partidasLineas, setPartidasLineas] = useState<LineaPartida[]>(lineaInicial ? [lineaInicial] : []);
  const [activeTabPartida, setActiveTabPartida] = useState<string | null>(lineaInicial?.id ?? null);
  const [tabKeys, setTabKeys] = useState<Record<string, string>>({});

  const handleAgregarPartida = () => {
    const newPartida: LineaPartida = {
      id: uuidLocal(),
      partidaId: undefined,
      montoAplicado: 0,
      personal: [],
      materiales: [],
      herramientas: [],
    };
    setPartidasLineas([...partidasLineas, newPartida]);
    setActiveTabPartida(newPartida.id);
  };

  const handleEliminarPartida = (id: string) => {
    setPartidasLineas(partidasLineas.filter((p) => p.id !== id));
    if (activeTabPartida === id) {
      setActiveTabPartida(null);
    }
  };

  const handleAgregarImagenes = (files: File[]) => {
    const nuevasImagenes = [...imagenesArchivos, ...files];
    setImagenesArchivos(nuevasImagenes);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImagenes((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEliminarImagen = (index: number) => {
    setImagenesArchivos((prev) => prev.filter((_, i) => i !== index));
    setPreviewImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAgregarPersonaAPartida = (partidaId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].personal.push({
        id: uuidLocal(),
        personalId: undefined,
        horasTrabajadas: 8,
      });
      setPartidasLineas(newPartidas);
    }
  };

  const handleAgregarMaterialAPartida = (partidaId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].materiales.push({
        id: uuidLocal(),
        materialId: undefined,
        cantidad: 0,
        precioUnitario: 0,
      });
      setPartidasLineas(newPartidas);
    }
  };

  const handleAgregarHerramientaAPartida = (partidaId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].herramientas.push({
        id: uuidLocal(),
        nombre: "",
        descripcion: "",
        cantidad: 1,
        costoUnitario: 0,
      });
      setPartidasLineas(newPartidas);
    }
  };

  const handleEliminarPersonaDePartida = (partidaId: string, personaId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].personal = newPartidas[idx].personal.filter((p) => p.id !== personaId);
      setPartidasLineas(newPartidas);
    }
  };

  const handleEliminarMaterialDePartida = (partidaId: string, materialId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].materiales = newPartidas[idx].materiales.filter((m) => m.id !== materialId);
      setPartidasLineas(newPartidas);
    }
  };

  const handleEliminarHerramientaDePartida = (partidaId: string, herramientaId: string) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      newPartidas[idx].herramientas = newPartidas[idx].herramientas.filter((h) => h.id !== herramientaId);
      setPartidasLineas(newPartidas);
    }
  };

  const handleUpdatePartida = (partidaId: string, field: string, value: any) => {
    const idx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (idx >= 0) {
      const newPartidas = [...partidasLineas];
      (newPartidas[idx] as any)[field] = value;
      setPartidasLineas(newPartidas);
    }
  };

  const handleUpdatePersonaEnPartida = (
    partidaId: string,
    personaIdx: number,
    field: string,
    value: any
  ) => {
    const pIdx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (pIdx >= 0) {
      const newPartidas = [...partidasLineas];
      (newPartidas[pIdx].personal[personaIdx] as any)[field] = value;
      setPartidasLineas(newPartidas);
    }
  };

  const handleUpdateMaterialEnPartida = (
    partidaId: string,
    materialIdx: number,
    field: string,
    value: any
  ) => {
    const pIdx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (pIdx >= 0) {
      const newPartidas = [...partidasLineas];
      (newPartidas[pIdx].materiales[materialIdx] as any)[field] = value;
      setPartidasLineas(newPartidas);
    }
  };

  const handleUpdateHerramientaEnPartida = (
    partidaId: string,
    herramientaIdx: number,
    field: string,
    value: any
  ) => {
    const pIdx = partidasLineas.findIndex((p) => p.id === partidaId);
    if (pIdx >= 0) {
      const newPartidas = [...partidasLineas];
      (newPartidas[pIdx].herramientas[herramientaIdx] as any)[field] = value;
      setPartidasLineas(newPartidas);
    }
  };

  const calcularCostoPartida = (partida: LineaPartida) => {
    const costoMO = partida.personal.reduce((s, p) => {
      const pers = personal.find((x) => x.id === p.personalId);
      return s + (pers ? p.horasTrabajadas * pers.costoPorHora : 0);
    }, 0);

    const costoMat = partida.materiales.reduce((s, m) => {
      return s + (m.cantidad * m.precioUnitario);
    }, 0);

    const costoHer = partida.herramientas.reduce((s, h) => {
      return s + (h.cantidad * h.costoUnitario);
    }, 0);

    return costoMO + costoMat + costoHer;
  };

  const costoTotalReporte = partidasLineas.reduce((s, p) => s + calcularCostoPartida(p), 0);

  const handleSubmit = async () => {
    if (!fecha) {
      toast.error("Fecha es requerida");
      return;
    }
    if (partidasLineas.length === 0) {
      toast.error("Debe agregar al menos una partida");
      return;
    }
    if (partidasLineas.some((p) => !p.partidaId || p.montoAplicado <= 0)) {
      toast.error("Todas las partidas deben tener partida seleccionada y monto > 0");
      return;
    }

    // Validar stock de materiales
    for (const partida of partidasLineas) {
      for (const mat of partida.materiales) {
        const catalogo = materiales.find((x) => x.materialId === mat.materialId);
        if (catalogo && mat.cantidad > catalogo.stockActual) {
          toast.error(`"${catalogo.materialNombre}" excede el stock disponible (${catalogo.stockActual} ${catalogo.unidad})`);
          return;
        }
      }
    }

    // Validar stock de herramientas
    for (const partida of partidasLineas) {
      for (const herr of partida.herramientas) {
        const catalogo = herramientas.find((x) => x.id === herr.herramientaId);
        if (catalogo && herr.cantidad > (catalogo.cantidad || 0)) {
          toast.error(`"${catalogo.nombre}" excede el stock disponible (${catalogo.cantidad || 0} unidad)`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      for (let i = 0; i < partidasLineas.length; i++) {
        const partida = partidasLineas[i];
        const values: ReporteFormValues = {
          obraId: obra.id,
          partidaId: partida.partidaId!,
          fecha,
          montoAplicado: partida.montoAplicado,
          observaciones: observaciones || undefined,
          personal: partida.personal
            .map((p) => ({
              personalId: p.personalId!,
              horasTrabajadas: p.horasTrabajadas,
            }))
            .filter((p) => p.personalId),
          materiales: partida.materiales
            .map((m) => ({
              materialId: m.materialId!,
              cantidad: m.cantidad,
              precioUnitario: m.precioUnitario,
            }))
            .filter((m) => m.materialId),
          // Solo adjuntar imágenes al primer reporte
          imagenesArchivos: i === 0 && imagenesArchivos.length > 0 ? imagenesArchivos : undefined,
          existingImageIds: i === 0 && imagenesFromLibrary.length > 0 ? imagenesFromLibrary.map(f => f.id) : undefined,
        };
        await onSubmit(values);
      }

      if (!reporteEditar) {
        setFecha(dayjs().toISOString());
        setObservaciones("");
        setImagenesArchivos([]);
        setPreviewImagenes([]);
        setImagenesFromLibrary([]);
        setPartidasLineas([]);
        setActiveTabPartida(null);
      }
      toast.success(reporteEditar ? "Reporte actualizado" : "Reportes guardados exitosamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <style>{`
        /* ============ RESPONSIVE VARIABLES ============ */
        @media (max-width: 640px) {
          :root {
            --gap-main: 8px;
            --padding-item: 12px;
            --partida-cols: 1fr;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          :root {
            --gap-main: 10px;
            --padding-item: 14px;
            --partida-cols: 1fr;
          }
        }
        @media (min-width: 1025px) {
          :root {
            --gap-main: 12px;
            --padding-item: 16px;
            --partida-cols: 28px 1fr 80px 50px 50px;
          }
        }

        /* ============ PARTIDA HEADER ============ */
        .partida-header {
          display: grid;
          gap: var(--gap-main);
          align-items: start;
        }

        /* Mobile: stack vertically */
        @media (max-width: 640px) {
          .partida-header {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
          }
          .partida-header > :nth-child(2) {
            grid-column: 1;
          }
          .partida-header > :nth-child(3) {
            grid-column: 1;
          }
          .partida-header > :nth-child(4) {
            grid-column: 1;
          }
          .partida-header > :nth-child(5) {
            grid-column: 1;
          }
        }

        /* Tablet: 2 columns */
        @media (min-width: 641px) and (max-width: 1024px) {
          .partida-header {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
          }
          .partida-header > :nth-child(2) {
            grid-column: 1 / -1;
          }
          .partida-header > :nth-child(3) {
            grid-column: 1;
          }
          .partida-header > :nth-child(4) {
            grid-column: 2;
          }
          .partida-header > :nth-child(5) {
            grid-column: 1;
          }
        }

        /* Desktop: original layout */
        @media (min-width: 1025px) {
          .partida-header {
            grid-template-columns: 28px 1fr 80px 50px 50px;
          }
        }

        .partida-header .ant-select {
          width: 100% !important;
          min-width: auto;
        }

        /* ============ PARTIDA NUMBER ============ */
        .partida-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #1e3a5f;
          color: white;
          border-radius: 4px;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .partida-num {
            width: 24px;
            height: 24px;
            font-size: 11px;
            margin-top: 0;
          }
        }

        /* ============ PARTIDA ITEM ============ */
        .partida-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: var(--padding-item);
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .partida-item:hover {
          border-color: #1e3a5f;
          background: #f9fafb;
          box-shadow: 0 2px 8px rgba(30, 58, 95, 0.08);
        }

        /* ============ FILA INPUT ============ */
        .fila-input {
          display: grid;
          gap: var(--gap-main);
          align-items: end;
          padding: var(--padding-item);
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 12px;
        }

        /* Mobile: stack vertically */
        @media (max-width: 640px) {
          .fila-input {
            grid-template-columns: 1fr;
            padding: 10px;
            gap: 8px;
            margin-bottom: 4px;
          }
          .fila-input > div {
            width: 100%;
          }
          .label-small {
            font-size: 9px;
            margin-bottom: 2px;
          }
        }

        /* Tablet: 2-3 columns */
        @media (min-width: 641px) and (max-width: 1024px) {
          .fila-input {
            grid-template-columns: 1fr 1fr 60px 50px;
            padding: 12px;
            gap: 10px;
          }
          .fila-input > div:nth-child(n+3) {
            display: none;
          }
          .fila-input > div:nth-child(1) {
            grid-column: 1 / -1;
          }
        }

        /* Desktop: original layout */
        @media (min-width: 1025px) {
          .fila-input {
            grid-template-columns: 2.5fr 60px 70px 70px 80px 50px;
            padding: 12px;
            gap: 12px;
          }
        }

        .fila-input > div:first-child {
          min-width: 0;
        }

        .fila-input .ant-select,
        .fila-herramienta .ant-select {
          width: 100% !important;
          min-width: 0;
        }

        @media (min-width: 1025px) {
          .fila-input .ant-select,
          .fila-herramienta .ant-select {
            min-width: 280px;
          }
        }

        .fila-input .ant-select-selector,
        .fila-herramienta .ant-select-selector {
          height: 36px !important;
          padding: 4px 11px !important;
        }

        /* ============ FILA HERRAMIENTA ============ */
        .fila-herramienta {
          display: grid;
          gap: var(--gap-main);
          align-items: end;
          padding: var(--padding-item);
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 12px;
        }

        /* Mobile: stack */
        @media (max-width: 640px) {
          .fila-herramienta {
            grid-template-columns: 1fr;
            padding: 10px;
            gap: 8px;
            margin-bottom: 4px;
          }
          .fila-herramienta > div {
            width: 100%;
          }
        }

        /* Tablet: 2 columns */
        @media (min-width: 641px) and (max-width: 1024px) {
          .fila-herramienta {
            grid-template-columns: 2fr 60px 50px;
            padding: 12px;
            gap: 10px;
          }
        }

        /* Desktop: simple layout - solo herramienta, cantidad, delete */
        @media (min-width: 1025px) {
          .fila-herramienta {
            grid-template-columns: 3fr 60px 50px;
            padding: 12px;
            gap: 12px;
          }
        }

        /* ============ LABEL ============ */
        .label-small {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 3px;
          display: block;
          letter-spacing: 0.5px;
        }

        @media (max-width: 640px) {
          .label-small {
            font-size: 9px;
            margin-bottom: 2px;
          }
        }

        /* ============ SCROLL ============ */
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* ============ BUTTONS RESPONSIVE ============ */
        @media (max-width: 640px) {
          .ant-btn {
            font-size: 11px !important;
            padding: 4px 8px !important;
            height: 28px !important;
          }
          .ant-btn-lg {
            height: 36px !important;
            font-size: 12px !important;
          }
        }

        /* ============ INPUTS RESPONSIVE ============ */
        @media (max-width: 640px) {
          .ant-input,
          .ant-input-number,
          .ant-select-selector {
            font-size: 12px !important;
            height: 32px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .ant-input,
          .ant-input-number,
          .ant-select-selector {
            font-size: 11px !important;
            height: 34px !important;
          }
        }

        /* ============ HEADER RESPONSIVE ============ */
        @media (max-width: 640px) {
          .px-5 {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          h2 {
            font-size: 14px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .px-5 {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          h2 {
            font-size: 16px !important;
          }
        }

        /* ============ GRID HEADER RESPONSIVE ============ */
        @media (max-width: 640px) {
          .grid.grid-cols-4 {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .grid.grid-cols-4 > div {
            width: 100%;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .grid.grid-cols-4 {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        /* ============ PREVIEW IMAGES RESPONSIVE ============ */
        @media (max-width: 640px) {
          .grid.grid-cols-4 {
            grid-template-columns: 1fr 1fr !important;
          }
          .h-24 {
            height: 80px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .grid.grid-cols-4 {
            grid-template-columns: 1fr 1fr 1fr !important;
          }
        }

        /* ============ MONTO A EJECUTAR / SUBTOTALES RESPONSIVE ============ */
        @media (max-width: 640px) {
          .monto-ejecutar-grid {
            grid-template-columns: 1fr !important;
          }
          .subtotal-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .subtotal-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      {/* Header compacto */}
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-900 mb-3">Reporte Diario: {obra.nombre}</h2>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className="label-small">Fecha</span>
            <DatePicker
              value={dayjs(fecha)}
              onChange={(val) =>
                setFecha(val ? val.toISOString() : dayjs().toISOString())
              }
              style={{ width: "100%" }}
              size="small"
            />
          </div>
          <div className="col-span-3">
            <span className="label-small">Observaciones</span>
            <Input.TextArea
              placeholder="..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={1}
              style={{ fontSize: "12px" }}
            />
          </div>
        </div>

        {/* Fotos del avance */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="label-small flex items-center gap-2">
              <Image size={14} />
              Fotos del Avance
              {(previewImagenes.length + imagenesFromLibrary.length) > 0 && (
                <span style={{ background: "#1e3a5f", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "10px", fontWeight: 700 }}>
                  {previewImagenes.length + imagenesFromLibrary.length}
                </span>
              )}
            </span>
            <div className="flex gap-2">
              {/* Subir nuevas fotos */}
              <Upload
                accept="image/*"
                multiple
                showUploadList={false}
                beforeUpload={(file) => {
                  handleAgregarImagenes([file]);
                  return false;
                }}
              >
                <Button
                  size="small"
                  icon={<Camera size={13} />}
                  style={{ fontSize: "11px", borderColor: "#d1d5db" }}
                >
                  Subir foto
                </Button>
              </Upload>
              {/* Seleccionar de biblioteca */}
              <Button
                size="small"
                icon={<FolderOpen size={13} />}
                onClick={() => setBibliotecaOpen(true)}
                style={{ fontSize: "11px", borderColor: "#1e3a5f", color: "#1e3a5f" }}
              >
                Abrir Biblioteca
              </Button>
            </div>
          </div>

          {/* Grid de previews unificado */}
          {(previewImagenes.length > 0 || imagenesFromLibrary.length > 0) ? (
            <div className="grid grid-cols-4 gap-2">
              {/* Nuevas fotos subidas */}
              {previewImagenes.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-20 object-cover rounded border border-gray-200"
                  />
                  <div className="absolute top-1 left-1 bg-blue-500 text-white rounded text-xs px-1" style={{ fontSize: "8px", fontWeight: 700 }}>
                    NUEVA
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarImagen(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {/* Fotos de biblioteca */}
              {imagenesFromLibrary.map((file) => {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://backend-production-2ce7.up.railway.app";
                const imgUrl = file.url.startsWith("http") ? file.url : `${baseUrl}${file.url}`;
                return (
                  <div key={`lib-${file.id}`} className="relative group">
                    <img
                      src={imgUrl}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded border border-green-200"
                    />
                    <div className="absolute top-1 left-1 bg-green-600 text-white rounded text-xs px-1" style={{ fontSize: "8px", fontWeight: 700 }}>
                      BIBLIO
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagenesFromLibrary(prev => prev.filter(f => f.id !== file.id))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                border: "1.5px dashed #d1d5db",
                borderRadius: "6px",
                padding: "16px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "11px",
                cursor: "pointer",
              }}
              onClick={() => setBibliotecaOpen(true)}
            >
              <Image size={20} style={{ margin: "0 auto 6px", opacity: 0.4 }} />
              <p>Sin fotos — sube nuevas o selecciona de la biblioteca</p>
            </div>
          )}
        </div>

        {/* Modal Biblioteca */}
        <BibliotecaArchivos
          visible={bibliotecaOpen}
          onClose={() => setBibliotecaOpen(false)}
          onSelect={(files) => {
            setImagenesFromLibrary(prev => {
              const existingIds = new Set(prev.map(f => f.id));
              const newFiles = files.filter(f => !existingIds.has(f.id));
              return [...prev, ...newFiles];
            });
            setBibliotecaOpen(false);
          }}
          maxSelection={20}
          defaultFilter="image"
        />
      </div>

      {/* Partidas */}
      <div className="flex-1 overflow-y-auto px-5 py-4 scroll-hide">
        {partidasLineas.map((partida, idx) => {
          const costoPartida = calcularCostoPartida(partida);
          const isActive = activeTabPartida === partida.id;
          const pd = obra.partidas.find(p => p.id === partida.partidaId);
          const precioUnit = pd?.precioUnitario ?? 0;
          const cantidadPresupuestada = pd?.cantidadPresupuestada ?? 0;
          // Obras extra sin cantidad presupuestada fija: no hay tope, se ejecuta la cantidad que sea.
          const esExtraSinLimite = !!pd && (pd.esExtra || cantidadPresupuestada <= 0);
          const montoPresup = cantidadPresupuestada * precioUnit;
          // Si estamos editando este mismo reporte y sigue en su partida original, su propia
          // cantidad anterior ya está contada en cantidadEjecutada — hay que descontarla para saber
          // cuánto queda realmente disponible (el backend hace lo mismo al guardar).
          const esLineaOriginalDeEdicion = !!reporteEditar && partida.partidaId === reporteEditar.partidaId;
          const cantidadEjecutadaOriginal = esLineaOriginalDeEdicion && precioUnit > 0
            ? reporteEditar!.montoAplicado / precioUnit
            : 0;
          const cantidadEjec = Math.max(0, (pd?.cantidadEjecutada ?? 0) - cantidadEjecutadaOriginal);
          const montoEjec = cantidadEjec * precioUnit;
          const cantidadDisp = esExtraSinLimite ? Infinity : Math.max(0, cantidadPresupuestada - cantidadEjec);
          const montoDisp = esExtraSinLimite ? Infinity : Math.max(0, montoPresup - montoEjec);
          const pct = montoPresup > 0 ? Math.round((montoEjec / montoPresup) * 100) : 0;
          const completada = !esExtraSinLimite && pct >= 100;
          const statusColor = completada ? "#ef4444" : pct >= 80 ? "#f97316" : "#22c55e";

          return (
            <div
              key={partida.id}
              className="partida-item"
              style={{
                background: "#ffffff",
                border: `1.5px solid ${completada ? "#fecaca" : pct >= 80 ? "#fed7aa" : "#dcfce7"}`,
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "14px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                e.currentTarget.style.borderColor = statusColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = completada ? "#fecaca" : pct >= 80 ? "#fed7aa" : "#dcfce7";
              }}
            >
              {/* Header: Partida num + Status badge */}
              <div className="flex items-center justify-between mb-3">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: statusColor,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "13px",
                      fontFamily: '"Dosis", system-ui, sans-serif',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "#6b7280" }}>
                    PARTIDA {idx + 1}
                  </div>
                </div>
                {!reporteEditar && (
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={16} />}
                    style={{ color: "#ef4444" }}
                    onClick={() => handleEliminarPartida(partida.id)}
                  />
                )}
              </div>

              {/* Selector de Partida */}
              <div className="mb-4">
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Partida
                </label>
                <Select
                  placeholder="Seleccionar partida..."
                  value={partida.partidaId}
                  onChange={(v) => handleUpdatePartida(partida.id, "partidaId", v ?? undefined)}
                  allowClear
                  onClear={() => handleUpdatePartida(partida.id, "montoAplicado", 0)}
                  options={obra.partidas.map((p) => {
                    // Al editar, la partida original no debe contarse a sí misma como "completada"
                    const avanceEfectivo = reporteEditar && p.id === reporteEditar.partidaId
                      ? Math.max(0, (p.avancePorcentaje ?? 0) - reporteEditar.avanceLogrado)
                      : (p.avancePorcentaje ?? 0);
                    return {
                      label: avanceEfectivo >= 100
                        ? `${p.codigo} - ${p.descripcion} ✓`
                        : `${p.codigo} - ${p.descripcion}`,
                      value: p.id,
                      disabled: avanceEfectivo >= 100,
                    };
                  })}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  size="middle"
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                  status={!partida.partidaId ? "warning" : undefined}
                />
              </div>

              {/* Monto Ejecutado + Progreso */}
              {!pd ? null : !completada ? (
                <div className="monto-ejecutar-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  {/* Input Cantidad / Monto */}
                  <div>
                    {precioUnit > 0 ? (
                      <>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Cantidad a ejecutar{pd?.unidad ? ` (${pd.unidad})` : ""}
                        </label>
                        {!esExtraSinLimite && (
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "6px" }}>
                            Disponible: {Number(cantidadDisp.toFixed(2))} de {Number(cantidadPresupuestada.toFixed(2))} {pd?.unidad}
                          </div>
                        )}
                        <InputNumber
                          value={partida.montoAplicado > 0 ? Number((partida.montoAplicado / precioUnit).toFixed(2)) : undefined}
                          onChange={(v) => {
                            const cantidadNueva = v ?? 0;
                            const cantidadClamped = esExtraSinLimite
                              ? cantidadNueva
                              : Math.min(cantidadNueva, cantidadDisp);
                            handleUpdatePartida(partida.id, "montoAplicado", cantidadClamped * precioUnit);
                          }}
                          min={0}
                          max={esExtraSinLimite ? undefined : cantidadDisp}
                          step={1}
                          size="middle"
                          suffix={pd?.unidad}
                          style={{
                            width: "100%",
                            fontSize: "13px",
                            fontWeight: 600,
                            borderColor: statusColor,
                          }}
                        />
                        {partida.montoAplicado > 0 && (
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                            ≈ ${partida.montoAplicado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                            {montoPresup > 0 && ` (${((partida.montoAplicado / montoPresup) * 100).toFixed(0)}%)`}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#4b5563", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Monto a ejecutar
                        </label>
                        <InputNumber
                          value={partida.montoAplicado || undefined}
                          onChange={(v) => handleUpdatePartida(partida.id, "montoAplicado", v ?? 0)}
                          min={0}
                          step={1000}
                          size="middle"
                          prefix="$"
                          formatter={(v) => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                          parser={(v) => v ? parseFloat(v.replace(/,/g, "")) : 0}
                          style={{
                            width: "100%",
                            fontSize: "13px",
                            fontWeight: 600,
                            borderColor: statusColor,
                          }}
                        />
                      </>
                    )}
                  </div>

                  {/* Resumen Montos */}
                  {pd && montoPresup > 0 && (
                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: `1px solid #e2e8f0`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "3px", letterSpacing: "0.5px" }}>
                        Presupuesto
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                        ${montoPresup.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ height: "4px", borderRadius: "2px", background: "#e2e8f0", overflow: "hidden", marginBottom: "4px", display: "flex" }}>
                        {/* Monto ejecutado (barra principal) */}
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: statusColor,
                            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                        {/* Monto a ejecutar ahora (barra secundaria en color más claro) */}
                        {partida.montoAplicado > 0 && (
                          <div
                            style={{
                              height: "100%",
                              width: `${(partida.montoAplicado / montoPresup) * 100}%`,
                              background: statusColor === "#22c55e" ? "#86efac" : statusColor === "#f97316" ? "#fed7aa" : "#fecaca",
                              transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600 }}>
                        {pct}% ({(partida.montoAplicado > 0 ? `+${((partida.montoAplicado / montoPresup) * 100).toFixed(0)}% nuevo` : 'sin cambios')})
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    marginBottom: "12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626" }}>
                    ✓ Partida completada al 100%
                  </div>
                  <div style={{ fontSize: "10px", color: "#b91c1c", marginTop: "4px" }}>
                    Crea una partida extra para trabajo adicional
                  </div>
                </div>
              )}

              {/* Tabs - Siempre visibles */}
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                <Tabs
                  activeKey={tabKeys[partida.id] || "personal"}
                  onChange={(key) => setTabKeys(prev => ({ ...prev, [partida.id]: key }))}
                    size="small"
                items={[
                  {
                    key: "personal",
                    label: (
                      <span className="text-xs flex items-center gap-1">
                        <Users size={12} />
                        Personal ({partida.personal.length})
                      </span>
                    ),
                    children: (
                      <div className="mt-2">
                        {partida.personal.length === 0 ? (
                          <div className="text-xs text-gray-400 py-2">Sin personal</div>
                        ) : (
                          <div className="space-y-1">
                            {partida.personal.map((p, idx) => {
                              const pers = personal.find((x) => x.id === p.personalId);
                              const total = p.horasTrabajadas * (pers?.costoPorHora || 0);
                              return (
                                <div key={p.id} className="fila-input">
                                  <div>
                                    <span className="label-small">Trabajador</span>
                                    <Select
                                      placeholder="Buscar trabajador..."
                                      value={p.personalId}
                                      onChange={(v) =>
                                        handleUpdatePersonaEnPartida(partida.id, idx, "personalId", v)
                                      }
                                      options={personal.map((x) => ({
                                        label: `${x.nombre} • ${x.cargo}`,
                                        value: x.id,
                                      }))}
                                      showSearch
                                      optionFilterProp="label"
                                      filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                      }
                                      size="middle"
                                      style={{ fontSize: "12px" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="label-small">Horas</span>
                                    <InputNumber
                                      value={p.horasTrabajadas}
                                      onChange={(v) =>
                                        handleUpdatePersonaEnPartida(partida.id, idx, "horasTrabajadas", v)
                                      }
                                      min={0}
                                      step={0.5}
                                      size="small"
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">Cargo</span>
                                    <div className="text-xs text-gray-700">{pers?.cargo || "-"}</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">$/Hr</span>
                                    <div className="text-xs text-gray-700">
                                      ${pers?.costoPorHora.toLocaleString("es-CO", {
                                        maximumFractionDigits: 0,
                                      }) || "-"}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">Total</span>
                                    <div className="text-xs font-semibold text-gray-900">
                                      ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                                    </div>
                                  </div>
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<Trash2 size={12} />}
                                    onClick={() => handleEliminarPersonaDePartida(partida.id, p.id)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <Button
                          type="primary"
                          size="small"
                          icon={<Plus size={12} />}
                          onClick={() => handleAgregarPersonaAPartida(partida.id)}
                          className="mt-2"
                          style={{ fontSize: "11px" }}
                        >
                          Agregar
                        </Button>
                      </div>
                    ),
                  },
                  {
                    key: "materials",
                    label: (
                      <span className="text-xs flex items-center gap-1">
                        <Package size={12} />
                        Materiales ({partida.materiales.length})
                      </span>
                    ),
                    children: (
                      <div className="mt-2">
                        {partida.materiales.length === 0 ? (
                          <div className="text-xs text-gray-400 py-2">Sin materiales</div>
                        ) : (
                          <div className="space-y-1">
                            {partida.materiales.map((m, idx) => {
                              const mat = materiales.find((x) => x.materialId === m.materialId);
                              const total = m.cantidad * m.precioUnitario;
                              const stockDisponible = mat?.stockActual ?? null;
                              const excede = stockDisponible !== null && m.cantidad > stockDisponible;
                              return (
                                <div key={m.id} className="fila-input">
                                  <div>
                                    <span className="label-small">Material</span>
                                    <Select
                                      placeholder="Buscar material..."
                                      value={m.materialId}
                                      onChange={(v) => {
                                        const material = materiales.find((x) => x.materialId === v);
                                        handleUpdateMaterialEnPartida(partida.id, idx, "materialId", v);
                                        handleUpdateMaterialEnPartida(partida.id, idx, "cantidad", 0);
                                        if (material) {
                                          handleUpdateMaterialEnPartida(partida.id, idx, "precioUnitario", material.precioPromedio);
                                        }
                                      }}
                                      options={materiales.map((x) => ({
                                        label: `${x.materialNombre} (disp: ${x.stockActual} ${x.unidad})`,
                                        value: x.materialId,
                                        disabled: x.stockActual <= 0,
                                      }))}
                                      showSearch
                                      optionFilterProp="label"
                                      filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                      }
                                      size="middle"
                                      style={{ fontSize: "12px" }}
                                    />
                                    {mat && (
                                      <div className={`text-xs mt-0.5 ${stockDisponible === 0 ? "text-red-500" : excede ? "text-orange-500" : "text-gray-400"}`}>
                                        Disponible: <strong>{stockDisponible} {mat.unidad}</strong>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="label-small">Cant.</span>
                                    <InputNumber
                                      value={m.cantidad}
                                      onChange={(v) =>
                                        handleUpdateMaterialEnPartida(partida.id, idx, "cantidad", v)
                                      }
                                      min={0}
                                      max={stockDisponible ?? undefined}
                                      step={0.1}
                                      size="small"
                                      status={excede ? "error" : undefined}
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                    {excede && (
                                      <div className="text-xs text-red-500 mt-0.5">Excede stock</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">Ud.</span>
                                    <div className="text-xs text-gray-700">{mat?.unidad || "-"}</div>
                                  </div>
                                  <div>
                                    <span className="label-small">P.Unit.</span>
                                    <InputNumber
                                      value={m.precioUnitario}
                                      disabled
                                      min={0}
                                      step={1000}
                                      size="small"
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">Total</span>
                                    <div className="text-xs font-semibold text-gray-900">
                                      ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                                    </div>
                                  </div>
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<Trash2 size={12} />}
                                    onClick={() => handleEliminarMaterialDePartida(partida.id, m.id)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <Button
                          type="primary"
                          size="small"
                          icon={<Plus size={12} />}
                          onClick={() => handleAgregarMaterialAPartida(partida.id)}
                          className="mt-2"
                          style={{ fontSize: "11px" }}
                        >
                          Agregar
                        </Button>
                      </div>
                    ),
                  },
                  {
                    key: "tools",
                    label: (
                      <span className="text-xs flex items-center gap-1">
                        🔧 Herramientas ({partida.herramientas.length})
                      </span>
                    ),
                    children: (
                      <div className="mt-2">
                        {partida.herramientas.length === 0 ? (
                          <div className="text-xs text-gray-400 py-2">Sin herramientas</div>
                        ) : (
                          <div className="space-y-1">
                            {partida.herramientas.map((h, idx) => {
                              const herr = herramientas.find((x) => x.id === h.herramientaId);
                              const total = h.cantidad * h.costoUnitario;
                              const stockDisponible = herr?.cantidad ?? null;
                              const excede = stockDisponible !== null && h.cantidad > stockDisponible;
                              return (
                                <div key={h.id} className="fila-herramienta">
                                  <div>
                                    <span className="label-small">Herramienta</span>
                                    <Select
                                      placeholder="Buscar herramienta..."
                                      value={h.herramientaId}
                                      onChange={(v) => {
                                        const herramienta = herramientas.find((x) => x.id === v);
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "herramientaId", v);
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "cantidad", 0);
                                        if (herramienta && herramienta.id) {
                                          handleUpdateHerramientaEnPartida(partida.id, idx, "costoUnitario", 0);
                                        }
                                      }}
                                      options={herramientas.map((x) => ({
                                        label: `${x.nombre} (disp: ${x.cantidad || 0})`,
                                        value: x.id,
                                        disabled: (x.cantidad || 0) <= 0,
                                      }))}
                                      showSearch
                                      optionFilterProp="label"
                                      filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                      }
                                      size="middle"
                                      style={{ fontSize: "12px" }}
                                    />
                                    {herr && (
                                      <div className={`text-xs mt-0.5 ${stockDisponible === 0 ? "text-red-500" : excede ? "text-orange-500" : "text-gray-400"}`}>
                                        Disponible: <strong>{stockDisponible}</strong>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="label-small">Cant.</span>
                                    <InputNumber
                                      value={h.cantidad}
                                      onChange={(v) =>
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "cantidad", v)
                                      }
                                      min={0}
                                      max={stockDisponible ?? undefined}
                                      step={0.5}
                                      size="small"
                                      status={excede ? "error" : undefined}
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                    {excede && (
                                      <div className="text-xs text-red-500 mt-0.5">Excede stock</div>
                                    )}
                                  </div>
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<Trash2 size={12} />}
                                    onClick={() => handleEliminarHerramientaDePartida(partida.id, h.id)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <Button
                          type="primary"
                          size="small"
                          icon={<Plus size={12} />}
                          onClick={() => handleAgregarHerramientaAPartida(partida.id)}
                          className="mt-2"
                          style={{ fontSize: "11px" }}
                        >
                          Agregar
                        </Button>
                      </div>
                    ),
                  },
                ]}
                />

                {/* Subtotal - Siempre visible */}
                <div
                    className="subtotal-grid"
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #e2e8f0",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "12px",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Mano de Obra</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        ${partida.personal
                          .reduce((s, p) => {
                            const pers = personal.find((x) => x.id === p.personalId);
                            return s + (pers ? p.horasTrabajadas * pers.costoPorHora : 0);
                          }, 0)
                          .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Materiales</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        ${partida.materiales
                          .reduce((s, m) => s + m.cantidad * m.precioUnitario, 0)
                          .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Herramientas</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        ${partida.herramientas
                          .reduce((s, h) => s + h.cantidad * h.costoUnitario, 0)
                          .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ background: statusColor + "20", padding: "8px", borderRadius: "4px", border: `1.5px solid ${statusColor}` }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: statusColor, textTransform: "uppercase", marginBottom: "4px" }}>Total de Costos</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: statusColor }}>
                        ${(costoPartida + (partida.montoAplicado || 0)).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ fontSize: "8px", color: statusColor, marginTop: "4px", opacity: 0.7 }}>
                        {costoPartida > 0 ? (
                          <>Personal/Mat/Her: ${costoPartida.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</>
                        ) : (
                          <>Sin Personal/Materiales</>
                        )}
                        {partida.montoAplicado > 0 && (
                          <> + Monto: ${partida.montoAplicado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botón agregar partida (no aplica al editar un reporte existente) */}
        {!reporteEditar && (
          partidasLineas.length === 0 ? (
            <div className="text-center py-6">
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                onClick={handleAgregarPartida}
                className="mb-2"
              >
                Agregar Primera Partida
              </Button>
              <p className="text-xs text-gray-400">Comienza a registrar trabajo</p>
            </div>
          ) : (
            <Button
              type="dashed"
              block
              size="small"
              icon={<Plus size={14} />}
              onClick={handleAgregarPartida}
              className="mt-2"
              style={{ fontSize: "12px" }}
            >
              Agregar Partida
            </Button>
          )
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
        {partidasLineas.length > 0 && (
          <div className="mb-3 p-3 bg-white rounded border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Total Reporte:</span>
              <span className="text-lg font-black text-gray-900">
                ${costoTotalReporte.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {partidasLineas.length}P · {partidasLineas.reduce((s, p) => s + p.personal.length, 0)}T · {partidasLineas.reduce((s, p) => s + p.materiales.length, 0)}M · {partidasLineas.reduce((s, p) => s + p.herramientas.length, 0)}H
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button size="small" onClick={onCancel}>Cancelar</Button>
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={handleSubmit}
            style={{ fontSize: "12px" }}
          >
            {reporteEditar ? "Guardar Cambios" : "Guardar Reporte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
