"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Tabs, Spin, Empty, Button, Modal, DatePicker } from "antd";
import dayjs from "dayjs";
import { Plus, ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  getObra,
  updateEstadoObra,
  getPersonal,
  getMaterialesDisponibles,
  getValuacion,
  createPartida,
  deletePartida,
  createReporte,
  createPersonal,
} from "@/services/obras";
import {
  PartidasTable,
  ReportesTable,
  PersonalTable,
  ValuacionResumen,
  PartidaModal,
  PersonalModal,
  ReporteFormSection,
  ReporteDetalleModal,
  EstadoSegmented,
} from "@/components/obras";
import type {
  Obra,
  EstadoObra,
  Personal,
  MaterialDisponible,
  ValuacionFinal,
  PartidaFormValues,
  PersonalFormValues,
  ReporteFormValues,
} from "@/types/obras";
import toast from "react-hot-toast";

export default function ObraDetallePage() {
  const params = useParams();
  const router = useRouter();
  const obraId = Number(params.id);

  const [obra, setObra] = useState<Obra | null>(null);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [materiales, setMateriales] = useState<MaterialDisponible[]>([]);
  const [valuacion, setValuacion] = useState<ValuacionFinal | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para modales de edición
  const [partidaModalOpen, setPartidaModalOpen] = useState(false);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [personalEditable, setPersonalEditable] = useState<Personal | null>(null);
  const [activeTab, setActiveTab] = useState("partidas");

  // Filtro de fechas para reportes
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  // Modal de detalle de reporte
  const [reporteDetalleOpen, setReporteDetalleOpen] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<any>(null);

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [o, p, m, v] = await Promise.all([
        getObra(obraId),
        getPersonal(),
        getMaterialesDisponibles(),
        getValuacion(obraId),
      ]);
      setObra(o);
      setPersonal(p);
      setMateriales(m);
      setValuacion(v);
    } catch (error) {
      console.error("Error cargando obra:", error);
      toast.error("Error al cargar la obra");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handlers
  const handleEstadoChange = async (newEstado: EstadoObra) => {
    try {
      await updateEstadoObra(obraId, newEstado);
      await cargarDatos();
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleAgregarPartida = async (values: PartidaFormValues) => {
    try {
      await createPartida(obraId, values);
      setPartidaModalOpen(false);
      await cargarDatos();
      toast.success("Partida agregada");
    } catch (error) {
      console.error("Error creando partida:", error);
      toast.error("Error al agregar la partida");
    }
  };

  const handleEliminarPartida = async (partidaId: number) => {
    Modal.confirm({
      title: "Eliminar Partida",
      content: "¿Está seguro de que desea eliminar esta partida?",
      okText: "Eliminar",
      okType: "danger",
      onOk: async () => {
        try {
          await deletePartida(obraId, partidaId);
          await cargarDatos();
          toast.success("Partida eliminada");
        } catch (error) {
          console.error("Error eliminando partida:", error);
          toast.error("Error al eliminar la partida");
        }
      },
    });
  };

  const handleGuardarReporte = async (values: ReporteFormValues) => {
    try {
      await createReporte(values);
      await cargarDatos();
      setActiveTab("reportes");
      toast.success("Reporte registrado");
    } catch (error) {
      console.error("Error creando reporte:", error);
      toast.error("Error al guardar el reporte");
    }
  };

  const handleAgregarPersonal = async (values: PersonalFormValues) => {
    try {
      await createPersonal(values);
      setPersonalModalOpen(false);
      setPersonalEditable(null);
      await cargarDatos();
      toast.success("Personal agregado");
    } catch (error) {
      console.error("Error guardando personal:", error);
      toast.error("Error al guardar el personal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="space-y-6 px-6">
        <AdminHeader titulo="Obra no encontrada" mostrarVolver />
        <Empty description="La obra solicitada no existe" />
      </div>
    );
  }

  // Filtrar reportes por rango de fechas
  const reportesFiltrados = obra.reportes.filter((reporte) => {
    const fechaReporte = new Date(reporte.fecha).getTime();
    if (fechaInicio) {
      const inicio = new Date(fechaInicio).getTime();
      if (fechaReporte < inicio) return false;
    }
    if (fechaFin) {
      const fin = new Date(fechaFin).getTime();
      fin.setDate(fin.getDate() + 1); // Incluir todo el día fin
      if (fechaReporte >= fin) return false;
    }
    return true;
  });

  const tabItems = [
    {
      key: "partidas",
      label: "Partidas",
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => setPartidaModalOpen(true)}
            >
              Agregar Partida
            </Button>
          </div>
          <PartidasTable
            partidas={obra.partidas}
            onEditar={() => {}}
            onEliminar={handleEliminarPartida}
          />
        </div>
      ),
    },
    {
      key: "reportes",
      label: "Reportes",
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              allowClear
              placeholder={["Desde", "Hasta"]}
              value={[
                fechaInicio ? dayjs(fechaInicio) : null,
                fechaFin ? dayjs(fechaFin) : null,
              ]}
              onChange={(fechas) => {
                setFechaInicio(fechas?.[0]?.toISOString() || null);
                setFechaFin(fechas?.[1]?.toISOString() || null);
              }}
            />
            <Button
              type="primary"
              danger
              size="large"
              onClick={() => setReporteModalOpen(true)}
            >
              + Nuevo Reporte
            </Button>
          </div>
          <ReportesTable
            reportes={reportesFiltrados}
            onVerDetalle={(reporte) => {
              setReporteSeleccionado(reporte);
              setReporteDetalleOpen(true);
            }}
          />
        </div>
      ),
    },
    {
      key: "personal",
      label: "Personal",
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => {
                setPersonalEditable(null);
                setPersonalModalOpen(true);
              }}
            >
              Agregar Personal
            </Button>
          </div>
          <PersonalTable
            personal={personal}
            onEditar={(p) => {
              setPersonalEditable(p);
              setPersonalModalOpen(true);
            }}
          />
        </div>
      ),
    },
    {
      key: "valuacion",
      label: "Valuación",
      children: valuacion ? (
        <ValuacionResumen valuacion={valuacion} />
      ) : (
        <Empty description="No hay datos de valuación" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        titulo={obra.nombre}
        subtitulo={`${obra.proyectoNombre} · Estado: ${obra.estado}`}
        mostrarVolver
      />

      {/* Controles rápidos */}
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Estado:</span>
          <EstadoSegmented value={obra.estado} onChange={handleEstadoChange} />
        </div>
      </div>

      {/* Stat strip */}
      <div className="px-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Presupuesto Total
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${obra.presupuestoTotal.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Costo Real
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${obra.presupuestoConsumido.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            % Ejecución
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {valuacion
              ? Math.round(valuacion.porcentajeEjecucion)
              : 0}
            %
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-600">
            Total Reportes
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {obra.reportes.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Modales */}
      <PartidaModal
        open={partidaModalOpen}
        obraId={obraId}
        partida={null}
        onClose={() => setPartidaModalOpen(false)}
        onSubmit={handleAgregarPartida}
      />

      <PersonalModal
        open={personalModalOpen}
        personal={personalEditable}
        onClose={() => {
          setPersonalModalOpen(false);
          setPersonalEditable(null);
        }}
        onSubmit={handleAgregarPersonal}
      />

      <Modal
        title="Nuevo Reporte Diario"
        open={reporteModalOpen}
        onCancel={() => setReporteModalOpen(false)}
        width="90vw"
        style={{ maxWidth: "1400px" }}
        footer={null}
      >
        {obra && (
          <ReporteFormSection
            obra={obra}
            personal={personal}
            materiales={materiales}
            onSubmit={async (values) => {
              await handleGuardarReporte(values);
              setReporteModalOpen(false);
            }}
          />
        )}
      </Modal>

      <ReporteDetalleModal
        open={reporteDetalleOpen}
        reporte={reporteSeleccionado}
        onClose={() => {
          setReporteDetalleOpen(false);
          setReporteSeleccionado(null);
        }}
      />
    </div>
  );
}
