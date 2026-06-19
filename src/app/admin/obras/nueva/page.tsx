"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, InputNumber, Select, DatePicker, TextArea, Spin } from "antd";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  createObra,
  getPersonal,
  getProyectosParaObra,
} from "@/services/obras";
import type { ObraFormValues, Personal, EstadoObra } from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function NuevaObraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [proyectos, setProyectos] = useState<
    { id: number; nombre: string }[]
  >([]);

  const [form, setForm] = useState<Partial<ObraFormValues>>({
    nombre: "",
    proyectoId: undefined,
    capatazId: undefined,
    estado: "PREPARACION" as EstadoObra,
    fechaInicio: dayjs().toISOString(),
    fechaFinPlanificada: dayjs().add(30, "days").toISOString(),
    presupuestoTotal: 0,
    notas: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [p, pr] = await Promise.all([
          getPersonal(),
          getProyectosParaObra(),
        ]);
        setPersonal(p);
        setProyectos(pr);
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar datos");
      }
    };
    cargarDatos();
  }, []);

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error("El nombre de la obra es requerido");
      return;
    }
    if (!form.proyectoId) {
      toast.error("Debe seleccionar un proyecto");
      return;
    }
    if (!form.presupuestoTotal || form.presupuestoTotal === 0) {
      toast.error("El presupuesto debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      const nueva = await createObra(form as ObraFormValues);
      toast.success("Obra creada exitosamente");
      router.push(`/admin/obras/${nueva.id}`);
    } catch (error) {
      console.error("Error creando obra:", error);
      toast.error("Error al crear la obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        titulo="Nueva Obra"
        subtitulo="Crear un nuevo proyecto de construcción"
        mostrarVolver
      />

      <div className="max-w-4xl bg-white rounded-lg border border-gray-200 p-8 space-y-8">
        {/* Row 1: Nombre | Proyecto */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la Obra *
            </label>
            <Input
              placeholder="Ej: Casa García"
              value={form.nombre || ""}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              size="large"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proyecto *
            </label>
            <Select
              placeholder="Seleccionar proyecto"
              value={form.proyectoId}
              onChange={(val) => setForm({ ...form, proyectoId: val })}
              options={proyectos.map((p) => ({ label: p.nombre, value: p.id }))}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Row 2: Capataz | Estado */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Capataz (Opcional)
            </label>
            <Select
              placeholder="Seleccionar capataz"
              allowClear
              value={form.capatazId}
              onChange={(val) => setForm({ ...form, capatazId: val })}
              options={personal.map((p) => ({ label: p.nombre, value: p.id }))}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estado Inicial
            </label>
            <Select
              value={form.estado}
              onChange={(val) => setForm({ ...form, estado: val })}
              options={[
                { label: ESTADO_OBRA_LABEL.PREPARACION, value: "PREPARACION" },
                { label: ESTADO_OBRA_LABEL.EN_CURSO, value: "EN_CURSO" },
                { label: ESTADO_OBRA_LABEL.PAUSADA, value: "PAUSADA" },
              ]}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Row 3: Fechas */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Inicio
            </label>
            <DatePicker
              value={form.fechaInicio ? dayjs(form.fechaInicio) : undefined}
              onChange={(val) =>
                setForm({
                  ...form,
                  fechaInicio: val ? val.toISOString() : undefined,
                })
              }
              size="large"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha Fin Planificada
            </label>
            <DatePicker
              value={
                form.fechaFinPlanificada
                  ? dayjs(form.fechaFinPlanificada)
                  : undefined
              }
              onChange={(val) =>
                setForm({
                  ...form,
                  fechaFinPlanificada: val ? val.toISOString() : undefined,
                })
              }
              size="large"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Row 4: Presupuesto | Notas */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Presupuesto Total *
            </label>
            <InputNumber
              placeholder="0"
              value={form.presupuestoTotal}
              onChange={(val) =>
                setForm({ ...form, presupuestoTotal: val || 0 })
              }
              formatter={(value) =>
                `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, ""))}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas
            </label>
            <Input.TextArea
              placeholder="Observaciones generales de la obra"
              value={form.notas || ""}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={() => router.back()}
            size="large"
            style={{ width: "150px" }}
          >
            Cancelar
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            size="large"
            style={{ width: "150px" }}
          >
            Guardar Obra
          </Button>
        </div>
      </div>
    </div>
  );
}
