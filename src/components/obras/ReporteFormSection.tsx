import React, { useState, useMemo } from "react";
import {
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Table,
  Empty,
  Tag,
  Divider,
  Card,
  Space,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import type {
  Obra,
  MaterialDisponible,
  Personal,
  ReporteFormValues,
} from "@/types/obras";
import { calcularCostoManoObra, calcularCostoMateriales } from "@/lib/obras";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const uuidLocal = () => Math.random().toString(36).slice(2, 11);

interface Props {
  obra: Obra;
  personal: Personal[];
  materiales: MaterialDisponible[];
  onSubmit: (values: ReporteFormValues) => Promise<void>;
}

export default function ReporteFormSection({
  obra,
  personal,
  materiales,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Info general
  const [fecha, setFecha] = useState<string>(dayjs().toISOString());
  const [observaciones, setObservaciones] = useState<string>("");

  // Partidas trabajadas
  const [partidasTrabajadas, setPartidasTrabajadas] = useState<
    { id: string; partidaId?: number; avanceLogrado: number }[]
  >([]);

  // Personal
  const [personasAgregar, setPersonasAgregar] = useState<
    { id: string; personalId?: number; horasTrabajadas: number }[]
  >([]);

  // Materiales
  const [materialesAgregar, setMaterialesAgregar] = useState<
    {
      id: string;
      materialId?: number;
      cantidad: number;
      precioUnitario: number;
    }[]
  >([]);

  const lineasPersonalCalc = useMemo(
    () =>
      personasAgregar
        .map((lp) => {
          const p = personal.find((x) => x.id === lp.personalId);
          if (!p) return null;
          return {
            personalId: lp.personalId!,
            personalNombre: p.nombre,
            cargo: p.cargo,
            horasTrabajadas: lp.horasTrabajadas,
            costoPorHora: p.costoPorHora,
            subtotal: lp.horasTrabajadas * p.costoPorHora,
          };
        })
        .filter(Boolean) as any[],
    [personasAgregar, personal]
  );

  const lineasMaterialCalc = useMemo(
    () =>
      materialesAgregar
        .map((lm) => {
          const m = materiales.find((x) => x.materialId === lm.materialId);
          if (!m) return null;
          return {
            materialId: lm.materialId!,
            materialNombre: m.materialNombre,
            unidad: m.unidad,
            cantidad: lm.cantidad,
            precioUnitario: lm.precioUnitario,
            subtotal: lm.cantidad * lm.precioUnitario,
          };
        })
        .filter(Boolean) as any[],
    [materialesAgregar, materiales]
  );

  const costoManoObra = calcularCostoManoObra(lineasPersonalCalc);
  const costoMateriales = calcularCostoMateriales(lineasMaterialCalc);
  const costoTotal = costoManoObra + costoMateriales;

  const handleAgregarPartida = () => {
    setPartidasTrabajadas([
      ...partidasTrabajadas,
      { id: uuidLocal(), partidaId: undefined, avanceLogrado: 0 },
    ]);
  };

  const handleAgregarPersona = () => {
    setPersonasAgregar([
      ...personasAgregar,
      { id: uuidLocal(), personalId: undefined, horasTrabajadas: 8 },
    ]);
  };

  const handleAgregarMaterial = () => {
    setMaterialesAgregar([
      ...materialesAgregar,
      { id: uuidLocal(), materialId: undefined, cantidad: 0, precioUnitario: 0 },
    ]);
  };

  const handleEliminarPartida = (id: string) => {
    setPartidasTrabajadas(partidasTrabajadas.filter((p) => p.id !== id));
  };

  const handleEliminarPersona = (id: string) => {
    setPersonasAgregar(personasAgregar.filter((p) => p.id !== id));
  };

  const handleEliminarMaterial = (id: string) => {
    setMaterialesAgregar(materialesAgregar.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!fecha) {
      toast.error("Fecha es requerida");
      return;
    }
    if (partidasTrabajadas.length === 0) {
      toast.error("Debe agregar al menos una partida");
      return;
    }
    if (partidasTrabajadas.some((p) => !p.partidaId || p.avanceLogrado <= 0)) {
      toast.error("Todas las partidas deben tener partida seleccionada y avance > 0");
      return;
    }

    try {
      setLoading(true);

      for (const partida of partidasTrabajadas) {
        const values: ReporteFormValues = {
          obraId: obra.id,
          partidaId: partida.partidaId!,
          fecha,
          avanceLogrado: partida.avanceLogrado,
          observaciones: observaciones || undefined,
          personal: personasAgregar
            .map((p) => ({
              personalId: p.personalId!,
              horasTrabajadas: p.horasTrabajadas,
            }))
            .filter((p) => p.personalId),
          materiales: materialesAgregar
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
      setPartidasTrabajadas([]);
      setPersonasAgregar([]);
      setMaterialesAgregar([]);
      toast.success("Reportes guardados exitosamente");
    } finally {
      setLoading(false);
    }
  };

  const partidasColumns = [
    {
      title: "Partida",
      dataIndex: "partidaId",
      key: "partidaId",
      render: (val: number | undefined, record: any) => {
        const partida = obra.partidas.find((p) => p.id === val);
        return (
          <Select
            placeholder="Seleccionar partida"
            value={val}
            onChange={(v) => {
              const idx = partidasTrabajadas.findIndex((p) => p.id === record.id);
              const newPartidas = [...partidasTrabajadas];
              newPartidas[idx].partidaId = v;
              setPartidasTrabajadas(newPartidas);
            }}
            options={obra.partidas.map((p) => ({
              label: `${p.codigo} - ${p.descripcion}`,
              value: p.id,
            }))}
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Avance %",
      dataIndex: "avanceLogrado",
      key: "avanceLogrado",
      width: 80,
      render: (val: number, record: any) => (
        <InputNumber
          value={val}
          onChange={(v) => {
            const idx = partidasTrabajadas.findIndex((p) => p.id === record.id);
            const newPartidas = [...partidasTrabajadas];
            newPartidas[idx].avanceLogrado = v || 0;
            setPartidasTrabajadas(newPartidas);
          }}
          min={0}
          max={100}
          step={5}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "",
      key: "acciones",
      width: 40,
      render: (_, record: any) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={14} />}
          onClick={() => handleEliminarPartida(record.id)}
        />
      ),
    },
  ];

  const personalColumns = [
    {
      title: "Personal",
      dataIndex: "personalId",
      key: "personalId",
      render: (val: number | undefined, record: any) => (
        <Select
          placeholder="Seleccionar"
          value={val}
          onChange={(v) => {
            const idx = personasAgregar.findIndex((p) => p.id === record.id);
            const newPersonas = [...personasAgregar];
            newPersonas[idx].personalId = v;
            setPersonasAgregar(newPersonas);
          }}
          options={personal.map((p) => ({ label: p.nombre, value: p.id }))}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Cargo",
      key: "cargo",
      width: 100,
      render: (_, record: any) => {
        const p = personal.find((x) => x.id === record.personalId);
        return <span style={{ fontSize: "12px" }}>{p?.cargo || "-"}</span>;
      },
    },
    {
      title: "Horas",
      dataIndex: "horasTrabajadas",
      key: "horasTrabajadas",
      width: 70,
      render: (val: number, record: any) => (
        <InputNumber
          value={val}
          onChange={(v) => {
            const idx = personasAgregar.findIndex((p) => p.id === record.id);
            const newPersonas = [...personasAgregar];
            newPersonas[idx].horasTrabajadas = v || 0;
            setPersonasAgregar(newPersonas);
          }}
          min={0}
          step={0.5}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Costo/Hr",
      key: "costoPorHora",
      width: 90,
      render: (_, record: any) => {
        const p = personal.find((x) => x.id === record.personalId);
        return (
          <span style={{ fontSize: "12px" }}>
            ${p?.costoPorHora.toLocaleString("es-CO", { maximumFractionDigits: 0 }) || "-"}
          </span>
        );
      },
    },
    {
      title: "Total",
      key: "total",
      width: 100,
      render: (_, record: any) => {
        const p = personal.find((x) => x.id === record.personalId);
        if (!p) return "-";
        const total = record.horasTrabajadas * p.costoPorHora;
        return (
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      title: "",
      key: "acciones",
      width: 40,
      render: (_, record: any) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={14} />}
          onClick={() => handleEliminarPersona(record.id)}
        />
      ),
    },
  ];

  const materialColumns = [
    {
      title: "Material",
      dataIndex: "materialId",
      key: "materialId",
      render: (val: number | undefined, record: any) => {
        const mat = materiales.find((m) => m.materialId === val);
        return (
          <div className="flex items-center gap-2">
            <Select
              placeholder="Seleccionar"
              value={val}
              onChange={(v) => {
                const idx = materialesAgregar.findIndex((m) => m.id === record.id);
                const newMateriales = [...materialesAgregar];
                const mat = materiales.find((x) => x.materialId === v);
                newMateriales[idx].materialId = v;
                newMateriales[idx].precioUnitario = mat?.precioPromedio || 0;
                setMaterialesAgregar(newMateriales);
              }}
              options={materiales.map((m) => ({
                label: m.materialNombre,
                value: m.materialId,
              }))}
              size="small"
              style={{ width: "130px" }}
            />
            {mat && (
              <Tag
                color={
                  mat.estadoStock === "NORMAL"
                    ? "green"
                    : mat.estadoStock === "BAJO"
                    ? "orange"
                    : "red"
                }
                style={{ fontSize: "10px" }}
              >
                {mat.estadoStock}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Unidad",
      key: "unidad",
      width: 70,
      render: (_, record: any) => {
        const m = materiales.find((x) => x.materialId === record.materialId);
        return <span style={{ fontSize: "12px" }}>{m?.unidad || "-"}</span>;
      },
    },
    {
      title: "Cant.",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 70,
      render: (val: number, record: any) => (
        <InputNumber
          value={val}
          onChange={(v) => {
            const idx = materialesAgregar.findIndex((m) => m.id === record.id);
            const newMateriales = [...materialesAgregar];
            newMateriales[idx].cantidad = v || 0;
            setMaterialesAgregar(newMateriales);
          }}
          min={0}
          step={0.1}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "P. Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 90,
      render: (val: number, record: any) => (
        <InputNumber
          value={val}
          onChange={(v) => {
            const idx = materialesAgregar.findIndex((m) => m.id === record.id);
            const newMateriales = [...materialesAgregar];
            newMateriales[idx].precioUnitario = v || 0;
            setMaterialesAgregar(newMateriales);
          }}
          min={0}
          step={1000}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Total",
      key: "subtotal",
      width: 100,
      render: (_, record: any) => {
        const total = (record.cantidad || 0) * (record.precioUnitario || 0);
        return (
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            ${total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      title: "",
      key: "acciones",
      width: 40,
      render: (_, record: any) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={14} />}
          onClick={() => handleEliminarMaterial(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col" style={{ maxHeight: "80vh" }}>
      {/* Contenedor con scroll oculto */}
      <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Encabezado estilo factura */}
        <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Reporte Diario de Obra</h2>
            <p className="text-sm text-gray-500">{obra.nombre}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Fecha *
            </label>
            <DatePicker
              value={dayjs(fecha)}
              onChange={(val) =>
                setFecha(val ? val.toISOString() : dayjs().toISOString())
              }
              style={{ width: "100%" }}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
              Observaciones
            </label>
            <Input.TextArea
              placeholder="Observaciones del día de trabajo"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Partidas */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Partidas Trabajadas</h3>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={handleAgregarPartida}
          >
            Agregar Partida
          </Button>
        </div>
        {partidasTrabajadas.length > 0 ? (
          <Table
            columns={partidasColumns}
            dataSource={partidasTrabajadas}
            rowKey="id"
            size="small"
            pagination={false}
            bordered={false}
            style={{ fontSize: "12px" }}
          />
        ) : (
          <Empty description="Sin partidas" />
        )}
      </div>

      {/* Tabla de Personal */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Personal</h3>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={handleAgregarPersona}
          >
            Agregar Trabajador
          </Button>
        </div>
        {personasAgregar.length > 0 ? (
          <Table
            columns={personalColumns}
            dataSource={personasAgregar}
            rowKey="id"
            size="small"
            pagination={false}
            bordered={false}
            style={{ fontSize: "12px" }}
          />
        ) : (
          <Empty description="Sin personal" />
        )}
      </div>

      {/* Tabla de Materiales */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Materiales Consumidos</h3>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={16} />}
            onClick={handleAgregarMaterial}
          >
            Agregar Material
          </Button>
        </div>
        {materialesAgregar.length > 0 ? (
          <Table
            columns={materialColumns}
            dataSource={materialesAgregar}
            rowKey="id"
            size="small"
            pagination={false}
            bordered={false}
            style={{ fontSize: "12px" }}
          />
        ) : (
          <Empty description="Sin materiales" />
        )}
      </div>

        {/* Resumen Totales - Estilo factura */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-sm text-gray-700">Costo Mano de Obra:</span>
                <span className="font-semibold text-gray-900">
                  ${costoManoObra.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-300">
                <span className="text-sm text-gray-700">Costo Materiales:</span>
                <span className="font-semibold text-gray-900">
                  ${costoMateriales.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-white px-3 rounded border-2 border-gray-300">
                <span className="font-bold text-gray-900">Total Reporte:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${costoTotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="p-6 flex justify-end gap-3 bg-white border-t border-gray-200">
        <Button size="large">Cancelar</Button>
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleSubmit}
          style={{ minWidth: "150px" }}
        >
          Guardar Reporte
        </Button>
      </div>
    </div>
  );
}
