"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, InputNumber, Select, DatePicker } from "antd";
import { createObra, getProyectosDisponiblesParaObra } from "@/services/obras";
import type { ObraFormValues, EstadoObra } from "@/types/obras";
import { ESTADO_OBRA_LABEL } from "@/types/obras";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import dayjs from "dayjs";

function NuevaObraGerentePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoIdPrefill = searchParams.get("proyectoId");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<{ id: number; nombre: string }[]>(
    []
  );

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
        // Proyecto totalmente opcional (se envía null si no se selecciona)
        proyectoId: form.proyectoId ?? undefined,
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
          <p className="text-gray-600">
            Crea una obra y vincúlala a un proyecto cuando quieras
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6">
          {/* Nombre | Proyecto */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Obra <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ej: Casa García"
                value={form.nombre || ""}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                size="large"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre identificativo de la obra
              </p>
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
                options={proyectos.map((p) => ({
                  label: p.nombre,
                  value: p.id,
                }))}
                size="large"
                style={{ width: "100%" }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes vincular la obra a un proyecto ahora o más tarde
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="grid md:grid-cols-2 gap-6">
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

          {/* Fechas */}
          <div className="grid md:grid-cols-2 gap-6">
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

          {/* Presupuesto | Notas */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Presupuesto Total <span className="text-red-500">*</span>
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
              <p className="text-xs text-gray-500 mt-1">
                Monto total del contrato de obra
              </p>
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

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  ¿Qué sucede al crear la obra?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Se registrará la obra con su <strong>presupuesto</strong> y
                    estado inicial
                  </li>
                  <li>
                    • Quedarás asignado como <strong>gerente</strong> con acceso
                    para gestionarla
                  </li>
                  <li>
                    • Podrás cargar <strong>partidas</strong> y{" "}
                    <strong>reportes diarios</strong> de avance
                  </li>
                  <li>
                    • Podrás vincularla a un <strong>proyecto</strong> en
                    cualquier momento
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? "Guardando..." : "Guardar Obra"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NuevaObraGerentePage() {
  return (
    <Suspense fallback={null}>
      <NuevaObraGerentePageContent />
    </Suspense>
  );
}
