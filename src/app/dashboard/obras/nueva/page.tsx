"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, InputNumber, Select, DatePicker } from "antd";
import { createObra, getProyectosDisponiblesParaObra } from "@/services/obras";
import type { ObraFormValues, EstadoObra } from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export default function NuevaObraGerentePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoIdPrefill = searchParams.get("proyectoId");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<{ id: number; nombre: string }[]>([]);

  const [form, setForm] = useState<Partial<ObraFormValues>>({
    nombre: "",
    proyectoId: proyectoIdPrefill ? Number(proyectoIdPrefill) : undefined,
    estado: "PREPARACION" as EstadoObra,
    fechaInicio: dayjs().toISOString(),
    fechaFinPlanificada: dayjs().add(30, "days").toISOString(),
    presupuestoTotal: 0,
    notas: "",
  });

  useEffect(() => {
    getProyectosDisponiblesParaObra()
      .then(setProyectos)
      .catch((error) => {
        console.error("Error cargando proyectos:", error);
        toast.error("Error al cargar proyectos");
      });
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
      const nueva = await createObra({
        ...(form as ObraFormValues),
        gerentesIds: user?.id ? [user.id] : [],
      });
      toast.success("Obra creada exitosamente");
      router.push(`/dashboard/obras/${nueva.id}`);
    } catch (error) {
      console.error("Error creando obra:", error);
      toast.error("Error al crear la obra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Obra</h1>
          <p className="text-gray-600">Crea una obra independiente y vincúlala a un proyecto cuando quieras</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-8">
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

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <DatePicker
                value={form.fechaInicio ? dayjs(form.fechaInicio) : undefined}
                onChange={(val) => setForm({ ...form, fechaInicio: val ? val.toISOString() : undefined })}
                size="large"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Fin Planificada
              </label>
              <DatePicker
                value={form.fechaFinPlanificada ? dayjs(form.fechaFinPlanificada) : undefined}
                onChange={(val) => setForm({ ...form, fechaFinPlanificada: val ? val.toISOString() : undefined })}
                size="large"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Presupuesto Total *
              </label>
              <InputNumber
                placeholder="0"
                value={form.presupuestoTotal}
                onChange={(val) => setForm({ ...form, presupuestoTotal: val || 0 })}
                formatter={(value) => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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

          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => router.back()} size="large" style={{ width: "150px" }}>
              Cancelar
            </Button>
            <Button type="primary" loading={loading} onClick={handleSubmit} size="large" style={{ width: "150px" }}>
              Guardar Obra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
