import React from "react";
import { Tag } from "antd";
import type { EstadoObra } from "@/types/obras";
import { ESTADO_OBRA_LABEL, ESTADO_OBRA_COLOR } from "@/types/obras";

interface Props {
  estado: EstadoObra;
}

export default function ObraStatusTag({ estado }: Props) {
  return (
    <Tag color={ESTADO_OBRA_COLOR[estado]}>
      {ESTADO_OBRA_LABEL[estado]}
    </Tag>
  );
}
