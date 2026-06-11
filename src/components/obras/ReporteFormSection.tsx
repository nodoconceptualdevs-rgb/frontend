import React, { useState } from "react";
import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Empty,
  Tabs,
} from "antd";
import { Plus, Trash2, Users, Package } from "lucide-react";
import type {
  Obra,
  MaterialDisponible,
  Personal,
  ReporteFormValues,
} from "@/types/obras";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

interface Props {
  obra: Obra;
  personal: Personal[];
  materiales: MaterialDisponible[];
  onSubmit: (values: ReporteFormValues) => Promise<void>;
}

interface LineaPartida {
  id: string;
  partidaId?: number;
  avanceLogrado: number;
  personal: { id: string; personalId?: number; horasTrabajadas: number }[];
  materiales: {
    id: string;
    materialId?: number;
    cantidad: number;
    precioUnitario: number;
  }[];
  herramientas: {
    id: string;
    nombre: string;
    descripcion?: string;
    cantidad: number;
    costoUnitario: number;
  }[];
}

export default function ReporteFormSection({
  obra,
  personal,
  materiales,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<string>(dayjs().toISOString());
  const [observaciones, setObservaciones] = useState<string>("");
  const [partidasLineas, setPartidasLineas] = useState<LineaPartida[]>([]);
  const [activeTabPartida, setActiveTabPartida] = useState<string | null>(null);

  const handleAgregarPartida = () => {
    const newPartida: LineaPartida = {
      id: uuidLocal(),
      partidaId: undefined,
      avanceLogrado: 0,
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
    if (partidasLineas.some((p) => !p.partidaId || p.avanceLogrado <= 0)) {
      toast.error("Todas las partidas deben tener partida seleccionada y avance > 0");
      return;
    }

    try {
      setLoading(true);

      for (const partida of partidasLineas) {
        const values: ReporteFormValues = {
          obraId: obra.id,
          partidaId: partida.partidaId!,
          fecha,
          avanceLogrado: partida.avanceLogrado,
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
        };
        await onSubmit(values);
      }

      setFecha(dayjs().toISOString());
      setObservaciones("");
      setPartidasLineas([]);
      setActiveTabPartida(null);
      toast.success("Reportes guardados exitosamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <style>{`
        .partida-header {
          display: grid;
          grid-template-columns: 28px 1fr 60px 50px 50px;
          gap: 12px;
          align-items: start;
        }
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
        .partida-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }
        .partida-item:hover {
          border-color: #1e3a5f;
          background: #f9fafb;
        }
        .fila-input {
          display: grid;
          grid-template-columns: 1.5fr 60px 70px 70px 80px 50px;
          gap: 8px;
          align-items: end;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .fila-herramienta {
          display: grid;
          grid-template-columns: 1.5fr 1fr 60px 70px 80px 50px;
          gap: 8px;
          align-items: end;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .label-small {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 3px;
          display: block;
        }
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
      </div>

      {/* Partidas */}
      <div className="flex-1 overflow-y-auto px-5 py-4 scroll-hide">
        {partidasLineas.map((partida, idx) => {
          const costoPartida = calcularCostoPartida(partida);
          const isActive = activeTabPartida === partida.id;

          return (
            <div key={partida.id} className="partida-item">
              {/* Header Partida */}
              <div className="partida-header mb-3">
                <div className="partida-num">{idx + 1}</div>
                <Select
                  placeholder="Partida..."
                  value={partida.partidaId}
                  onChange={(v) => handleUpdatePartida(partida.id, "partidaId", v)}
                  options={obra.partidas.map((p) => ({
                    label: `${p.codigo} - ${p.descripcion}`,
                    value: p.id,
                  }))}
                  size="small"
                  style={{ fontSize: "12px" }}
                />
                <div className="text-center">
                  <span className="label-small">Avance</span>
                  <InputNumber
                    value={partida.avanceLogrado}
                    onChange={(v) => handleUpdatePartida(partida.id, "avanceLogrado", v)}
                    min={0}
                    max={100}
                    step={5}
                    size="small"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <span className="label-small">%</span>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleEliminarPartida(partida.id)}
                />
              </div>

              {/* Tabs */}
              <Tabs
                activeKey={isActive ? "personal" : undefined}
                onChange={() => setActiveTabPartida(isActive ? null : partida.id)}
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
                                      placeholder="..."
                                      value={p.personalId}
                                      onChange={(v) =>
                                        handleUpdatePersonaEnPartida(partida.id, idx, "personalId", v)
                                      }
                                      options={personal.map((x) => ({
                                        label: x.nombre,
                                        value: x.id,
                                      }))}
                                      size="small"
                                      style={{ fontSize: "11px" }}
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
                              return (
                                <div key={m.id} className="fila-input">
                                  <div>
                                    <span className="label-small">Material</span>
                                    <Select
                                      placeholder="..."
                                      value={m.materialId}
                                      onChange={(v) => {
                                        const material = materiales.find((x) => x.materialId === v);
                                        handleUpdateMaterialEnPartida(partida.id, idx, "materialId", v);
                                        if (material) {
                                          handleUpdateMaterialEnPartida(
                                            partida.id,
                                            idx,
                                            "precioUnitario",
                                            material.precioPromedio
                                          );
                                        }
                                      }}
                                      options={materiales.map((x) => ({
                                        label: x.materialNombre,
                                        value: x.materialId,
                                      }))}
                                      size="small"
                                      style={{ fontSize: "11px" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="label-small">Cant.</span>
                                    <InputNumber
                                      value={m.cantidad}
                                      onChange={(v) =>
                                        handleUpdateMaterialEnPartida(partida.id, idx, "cantidad", v)
                                      }
                                      min={0}
                                      step={0.1}
                                      size="small"
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                  </div>
                                  <div className="text-right">
                                    <span className="label-small">Ud.</span>
                                    <div className="text-xs text-gray-700">{mat?.unidad || "-"}</div>
                                  </div>
                                  <div>
                                    <span className="label-small">P.Unit.</span>
                                    <InputNumber
                                      value={m.precioUnitario}
                                      onChange={(v) =>
                                        handleUpdateMaterialEnPartida(partida.id, idx, "precioUnitario", v)
                                      }
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
                              const total = h.cantidad * h.costoUnitario;
                              return (
                                <div key={h.id} className="fila-herramienta">
                                  <div>
                                    <span className="label-small">Nombre</span>
                                    <Input
                                      placeholder="..."
                                      value={h.nombre}
                                      onChange={(e) =>
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "nombre", e.target.value)
                                      }
                                      size="small"
                                      style={{ fontSize: "11px" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="label-small">Descripción</span>
                                    <Input
                                      placeholder="..."
                                      value={h.descripcion || ""}
                                      onChange={(e) =>
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "descripcion", e.target.value)
                                      }
                                      size="small"
                                      style={{ fontSize: "11px" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="label-small">Cant.</span>
                                    <InputNumber
                                      value={h.cantidad}
                                      onChange={(v) =>
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "cantidad", v)
                                      }
                                      min={0}
                                      step={0.5}
                                      size="small"
                                      style={{ width: "100%", fontSize: "11px" }}
                                    />
                                  </div>
                                  <div>
                                    <span className="label-small">Costo Unit.</span>
                                    <InputNumber
                                      value={h.costoUnitario}
                                      onChange={(v) =>
                                        handleUpdateHerramientaEnPartida(partida.id, idx, "costoUnitario", v)
                                      }
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

              {/* Subtotal compacto */}
              {isActive && (
                <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">MO:</span>
                    <div className="font-semibold text-gray-900">
                      ${partida.personal
                        .reduce((s, p) => {
                          const pers = personal.find((x) => x.id === p.personalId);
                          return s + (pers ? p.horasTrabajadas * pers.costoPorHora : 0);
                        }, 0)
                        .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Mat:</span>
                    <div className="font-semibold text-gray-900">
                      ${partida.materiales
                        .reduce((s, m) => s + m.cantidad * m.precioUnitario, 0)
                        .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Her:</span>
                    <div className="font-semibold text-gray-900">
                      ${partida.herramientas
                        .reduce((s, h) => s + h.cantidad * h.costoUnitario, 0)
                        .toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600">Sub:</span>
                    <div className="font-bold text-gray-900">
                      ${costoPartida.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Botón agregar partida */}
        {partidasLineas.length === 0 ? (
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
          <Button size="small">Cancelar</Button>
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={handleSubmit}
            style={{ fontSize: "12px" }}
          >
            Guardar Reporte
          </Button>
        </div>
      </div>
    </div>
  );
}
