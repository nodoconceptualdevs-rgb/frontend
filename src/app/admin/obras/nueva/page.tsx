"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, InputNumber, Select, DatePicker } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  createObra,
  getProyectosDisponiblesParaObra,
} from "@/services/obras";
import { getGerentes } from "@/services/usuarios";
import UserSelector from "@/components/proyectos/UserSelector";
import type { ObraFormValues, EstadoObra } from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function NuevaObraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoIdPrefill = searchParams.get("proyectoId");
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [gerentesDisponibles, setGerentesDisponibles] = useState<
    { id: number; username: string; email: string; name?: string }[]
  >([]);
  const [loadingGerentes, setLoadingGerentes] = useState(true);
  const [gerentesIds, setGerentesIds] = useState<number[]>([]);

  const [form, setForm] = useState<Partial<ObraFormValues>>({
    nombre: "",
    proyectoId: proyectoIdPrefill ? Number(proyectoIdPrefill) : undefined,
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
        const [pr, ger] = await Promise.all([
          getProyectosDisponiblesParaObra(),
          getGerentes(),
        ]);
        setProyectos(pr);
        setGerentesDisponibles(Array.isArray(ger) ? ger : []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoadingGerentes(false);
      }
    };
    cargarDatos();
  }, []);

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error("El nombre de la obra es requerido");
      return;
    }
    if (!form.presupuestoTotal || form.presupuestoTotal === 0) {
      toast.error("El presupuesto debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      const nueva = await createObra({ ...form, gerentesIds } as ObraFormValues);
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
              Proyecto
            </label>
            <Select
              placeholder="Sin proyecto (opcional)"
              allowClear
              value={form.proyectoId}
              onChange={(val) => setForm({ ...form, proyectoId: val })}
              options={proyectos.map((p) => ({ label: p.nombre, value: p.id }))}
              size="large"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Row: Gerentes */}
        <div>
          <UserSelector
            label="Gerentes con acceso a esta obra"
            availableUsers={gerentesDisponibles}
            selectedUsers={gerentesIds}
            onSelectionChange={setGerentesIds}
            loading={loadingGerentes}
            placeholder="Buscar gerentes..."
          />
        </div>

        {/* Row 2: Capataz | Estado */}
        <div className="grid grid-cols-2 gap-6">
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
