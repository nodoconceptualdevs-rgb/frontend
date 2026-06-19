import React from "react";
import { Progress } from "antd";

interface Props {
  porcentaje: number;
  size?: "sm" | "md";
}

export default function AvanceGauge({ porcentaje, size = "md" }: Props) {
  if (size === "sm") {
    return (
      <div className="flex items-center justify-center">
        <Progress type="circle" percent={porcentaje} size={50} strokeWidth={5} />
      </div>
    );
  }

  return (
    <Progress percent={porcentaje} strokeColor={porcentaje > 100 ? "#ef4444" : "#10b981"} />
  );
}
