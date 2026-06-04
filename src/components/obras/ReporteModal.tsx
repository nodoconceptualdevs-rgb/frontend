import React, { useState, useMemo } from "react";
import {
  Modal,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Table,
  Empty,
  Tag,
  Divider,
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
  open: boolean;
  obra: Obra;
  personal: Personal[];
  materiales: MaterialDisponible[];
  onClose: () => void;
  onSubmit: (values: ReporteFormValues) => Promise<void>;
}

export default function ReporteModal({
  open,
  obra,
  personal,
  materiales,
  onClose,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Info general
  const [fecha, setFecha] = useState<string>(dayjs().toISOString());
  const [partidaId, setPartidaId] = useState<number | undefined>(undefined);
  const [avanceLogrado, setAvanceLogrado] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>("");

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

  // Cálculos
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
    if (!partidaId) {
      toast.error("Debe seleccionar una partida");
      return;
    }
    if (avanceLogrado <= 0 || avanceLogrado > 100) {
      toast.error("El avance debe estar entre 0 y 100%");
      return;
    }

    try {
      setLoading(true);
      const values: ReporteFormValues = {
        obraId: obra.id,
        partidaId,
        fecha,
        avanceLogrado,
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
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFecha(dayjs().toISOString());
    setPartidaId(undefined);
    setAvanceLogrado(0);
    setObservaciones("");
    setPersonasAgregar([]);
    setMaterialesAgregar([]);
    onClose();
  };

  const personalColumns = [
    {
      title: "Personal",
      dataIndex: "personalId",
      key: "personalId",
      render: (val: number | undefined, record: any) => (
        <Select
          placeholder="Seleccionar personal"
          value={val}
          onChange={(v) => {
            const idx = personasAgregar.findIndex((p) => p.id === record.id);
            const newPersonas = [...personasAgregar];
            newPersonas[idx].personalId = v;
            setPersonasAgregar(newPersonas);
          }}
          options={personal.map((p) => ({ label: p.nombre, value: p.id }))}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Horas",
      dataIndex: "horasTrabajadas",
      key: "horasTrabajadas",
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
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 60,
      render: (_, record: any) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={16} />}
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
              placeholder="Seleccionar material"
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
              style={{ width: "150px" }}
            />
            {mat && (
              <Tag color={
                mat.estadoStock === "NORMAL" ? "green" :
                mat.estadoStock === "BAJO" ? "orange" :
                mat.estadoStock === "CRITICO" ? "red" : "red"
              }>
                {mat.estadoStock}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 100,
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
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Precio Unit.",
      dataIndex: "precioUnitario",
      key: "precioUnitario",
      width: 110,
      render: (val: number, record: any) => (
        <InputNumber
          value={val}
          onChange={(v) => {
            const idx = materialesAgregar.findIndex((m) => m.id === record.id);
            const newMateriales = [...materialesAgregar];
            newMateriales[idx].precioUnitario = v || 0;
            setMaterialesAgregar(newMateriales);
          }}
          formatter={(value) =>
            `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ""))}
          min={0}
          step={1000}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      width: 60,
      render: (_, record: any) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={16} />}
          onClick={() => handleEliminarMaterial(record.id)}
        />
      ),
    },
  ];

  return (
    <Modal
      title="Nuevo Reporte Diario"
      open={open}
      onCancel={handleClose}
      width="90vw"
      style={{ maxWidth: "1400px" }}
      footer={null}
      destroyOnHidden
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Sección 1: Info General */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Información General</h3>
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
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
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Partida *
              </label>
              <Select
                placeholder="Seleccionar"
                value={partidaId}
                onChange={setPartidaId}
                options={obra.partidas.map((p) => ({
                  label: `${p.codigo} - ${p.descripcion}`,
                  value: p.id,
                }))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Avance % *
              </label>
              <InputNumber
                value={avanceLogrado}
                onChange={(val) => setAvanceLogrado(val || 0)}
                min={0}
                max={100}
                step={5}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Observaciones
              </label>
              <Input
                placeholder="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* Sección 2: Personal */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Personal</h3>
            <Button
              type="dashed"
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
              bordered
            />
          ) : (
            <Empty description="Sin personal agregado" />
          )}
        </div>

        <Divider />

        {/* Sección 3: Materiales */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Materiales Consumidos</h3>
            <Button
              type="dashed"
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
              bordered
            />
          ) : (
            <Empty description="Sin materiales agregados" />
          )}
        </div>

        <Divider />

        {/* Sección 4: Resumen */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Resumen de Costos</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 uppercase">Costo Mano de Obra</p>
              <p className="text-2xl font-bold text-blue-600">
                ${costoManoObra.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <p className="text-xs text-gray-600 uppercase">Costo Materiales</p>
              <p className="text-2xl font-bold text-cyan-600">
                ${costoMateriales.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600 uppercase">Costo Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${costoTotal.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <Button onClick={handleClose} size="large" style={{ width: "150px" }}>
            Cancelar
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            size="large"
            style={{ width: "150px" }}
          >
            Guardar Reporte
          </Button>
        </div>
      </div>
    </Modal>
  );
}
