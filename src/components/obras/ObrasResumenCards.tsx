import React from "react";
import {
  BuildOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import type { ObrasResumen } from "@/types/obras";

const StatCard = ({
  label,
  value,
  suffix,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase text-gray-600">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {value}
          {suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
        </p>
      </div>
      <Icon
        className={`text-2xl ${color}`}
        style={{ marginTop: "4px" }}
      />
    </div>
  </div>
);

interface Props {
  resumen: ObrasResumen;
}

export default function ObrasResumenCards({ resumen }: Props) {
  return (
    <div className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="Total Obras"
        value={resumen.totalObras}
        icon={BuildOutlined}
        color="text-blue-600"
      />
      <StatCard
        label="En Curso"
        value={resumen.enCurso}
        icon={CheckCircleOutlined}
        color="text-green-600"
      />
      <StatCard
        label="Completadas"
        value={resumen.completadas}
        icon={CheckCircleOutlined}
        color="text-emerald-600"
      />
      <StatCard
        label="Pausadas"
        value={resumen.pausadas}
        icon={PauseCircleOutlined}
        color="text-amber-600"
      />
      <StatCard
        label="Presupuesto Total"
        value={`$${(resumen.presupuestoTotal / 1000000).toFixed(1)}`}
        suffix="M"
        icon={DollarOutlined}
        color="text-purple-600"
      />
      <StatCard
        label="Consumido"
        value={`$${(resumen.presupuestoConsumido / 1000000).toFixed(1)}`}
        suffix="M"
        icon={PercentageOutlined}
        color="text-red-600"
      />
    </div>
  );
}
