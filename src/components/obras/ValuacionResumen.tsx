import React from "react";
import { Table } from "antd";
import type { ValuacionFinal } from "@/types/obras";
import PresupuestoProgress from "./PresupuestoProgress";
import dayjs from "dayjs";

interface Props {
  valuacion: ValuacionFinal;
}

export default function ValuacionResumen({ valuacion }: Props) {
  const columns = [
    {
      title: "Código",
      dataIndex: "codigo",
      key: "codigo",
      width: 80,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
    },
    {
      title: "Presupuestado",
      dataIndex: "montoPresupuestado",
      key: "montoPresupuestado",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 120,
      align: "right" as const,
    },
    {
      title: "Ejecutado",
      dataIndex: "montoEjecutado",
      key: "montoEjecutado",
      render: (val: number) =>
        `$${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      width: 120,
      align: "right" as const,
    },
    {
      title: "Variación",
      dataIndex: "variacion",
      key: "variacion",
      render: (val: number) => (
        <span
          className={val > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}
        >
          ${val.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
        </span>
      ),
      width: 120,
      align: "right" as const,
    },
    {
      title: "Avance",
      dataIndex: "avancePorcentaje",
      key: "avancePorcentaje",
      render: (val: number) => `${val.toFixed(1)}%`,
      width: 80,
      align: "right" as const,
    },
  ];

  const totalPresupuestado = valuacion.partidas.reduce(
    (sum, p) => sum + p.montoPresupuestado,
    0
  );
  const totalEjecutado = valuacion.partidas.reduce(
    (sum, p) => sum + p.montoEjecutado,
    0
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-gray-600 uppercase">Presupuesto Total</p>
          <p className="text-2xl font-bold text-purple-600">
            ${valuacion.presupuestoTotal.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-gray-600 uppercase">Costo Real</p>
          <p className="text-2xl font-bold text-orange-600">
            ${valuacion.costoReal.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            valuacion.variacionTotal > 0
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <p className="text-xs text-gray-600 uppercase">Variación Total</p>
          <p
            className={`text-2xl font-bold ${
              valuacion.variacionTotal > 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            ${valuacion.variacionTotal.toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>

      {/* Barra de progreso presupuestario */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Progreso de Presupuesto</h3>
        <PresupuestoProgress
          presupuestado={valuacion.presupuestoTotal}
          ejecutado={valuacion.costoReal}
        />
      </div>

      {/* Información temporal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-600 uppercase">% Ejecución</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.porcentajeEjecucion.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase">Días Planificados</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.diasPlanificados}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase">Días Transcurridos</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.diasTranscurridos}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase">Total Reportes</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.totalReportes}
          </p>
        </div>
      </div>

      {/* Tabla de partidas */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Desglose por Partida</h3>
        <Table
          columns={columns}
          dataSource={valuacion.partidas}
          rowKey="partidaId"
          size="small"
          bordered
          pagination={false}
          scroll={{ x: 600 }}
          footer={() => (
            <div className="flex flex-wrap justify-end gap-4 sm:gap-8 font-semibold">
              <span>
                Total Presup.: $
                {totalPresupuestado.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span>
                Total Ejecut.: $
                {totalEjecutado.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </span>
              <span
                className={
                  totalEjecutado > totalPresupuestado
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                Variación: $
                {(totalEjecutado - totalPresupuestado).toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          )}
        />
      </div>

      {/* Estadísticas finales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-600 uppercase">Total Registros Personal</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.totalPersonalRegistros}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase">Total Materiales Consumo</p>
          <p className="text-xl font-bold text-gray-900">
            {valuacion.totalMaterialesConsumo}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase">Costo Promedio Diario</p>
          <p className="text-xl font-bold text-gray-900">
            ${(
              valuacion.diasTranscurridos > 0
                ? valuacion.costoReal / valuacion.diasTranscurridos
                : 0
            ).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
