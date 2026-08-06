"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, InputNumber, Spin } from "antd";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";
import BarcodeLabel from "./BarcodeLabel";

export interface ItemConCodigoBarra {
  id: number;
  nombre: string;
  codigo?: string;
  unidad?: string;
  cantidadSugerida?: number;
}

interface ImprimirCodigosBarraModalProps {
  items: ItemConCodigoBarra[];
  open: boolean;
  onClose: () => void;
  onCodigoGenerado?: (id: number, codigo: string) => void;
  generarCodigo: (id: number) => Promise<string | undefined>;
  itemLabel?: string;
}

const CANTIDAD_MAX = 500;

export default function ImprimirCodigosBarraModal({
  items,
  open,
  onClose,
  onCodigoGenerado,
  generarCodigo,
  itemLabel = "elemento",
}: ImprimirCodigosBarraModalProps) {
  const [codigos, setCodigos] = useState<Record<number, string>>({});
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [preparando, setPreparando] = useState(false);

  useEffect(() => {
    if (!open || items.length === 0) return;

    setCantidades((prev) => {
      const next = { ...prev };
      items.forEach((it) => {
        if (next[it.id] === undefined) {
          const sugerida = it.cantidadSugerida ?? 1;
          next[it.id] = Math.min(sugerida > 0 ? Math.round(sugerida) : 1, CANTIDAD_MAX);
        }
      });
      return next;
    });

    const faltantes = items.filter((it) => !it.codigo && !codigos[it.id]);
    if (faltantes.length === 0) {
      setCodigos((prev) => {
        const next = { ...prev };
        items.forEach((it) => {
          if (it.codigo) next[it.id] = it.codigo;
        });
        return next;
      });
      return;
    }

    setPreparando(true);
    Promise.all(
      faltantes.map((it) =>
        generarCodigo(it.id)
          .then((codigo) => ({ id: it.id, codigo: codigo || "" }))
          .catch(() => ({ id: it.id, codigo: "" }))
      )
    ).then((resultados) => {
      setCodigos((prev) => {
        const next = { ...prev };
        items.forEach((it) => {
          if (it.codigo) next[it.id] = it.codigo;
        });
        resultados.forEach(({ id, codigo }) => {
          if (codigo) {
            next[id] = codigo;
            onCodigoGenerado?.(id, codigo);
          }
        });
        return next;
      });
      const fallidos = resultados.filter((r) => !r.codigo);
      if (fallidos.length > 0) {
        toast.error(`No se pudo generar código para ${fallidos.length} ${itemLabel}(s)`);
      }
      setPreparando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items]);

  useEffect(() => {
    if (!open) {
      setCodigos({});
      setCantidades({});
    }
  }, [open]);

  const etiquetas = useMemo(() => {
    const resultado: { item: ItemConCodigoBarra; codigo: string }[] = [];
    items.forEach((it) => {
      const codigo = codigos[it.id];
      if (!codigo) return;
      const cantidad = Math.min(Math.max(cantidades[it.id] || 1, 1), CANTIDAD_MAX);
      for (let i = 0; i < cantidad; i++) {
        resultado.push({ item: it, codigo });
      }
    });
    return resultado;
  }, [items, codigos, cantidades]);

  const handleImprimir = () => {
    if (etiquetas.length === 0) {
      toast.error("No hay etiquetas para imprimir");
      return;
    }
    window.print();
  };

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <Printer size={18} />
          Imprimir códigos de barra
        </span>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancelar" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="imprimir"
          type="primary"
          danger
          icon={<Printer size={16} />}
          onClick={handleImprimir}
          disabled={preparando || etiquetas.length === 0}
        >
          Imprimir {etiquetas.length > 0 ? `(${etiquetas.length})` : ""}
        </Button>,
      ]}
    >
      {preparando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
          <Spin size="small" />
          Generando códigos faltantes...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600">
                  <th className="px-3 py-2">Elemento</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2 text-right">Etiquetas a imprimir</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{it.nombre}</td>
                    <td className="px-3 py-2 text-gray-500">{codigos[it.id] || "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <InputNumber
                        min={1}
                        max={CANTIDAD_MAX}
                        value={cantidades[it.id] ?? 1}
                        onChange={(val) =>
                          setCantidades((prev) => ({ ...prev, [it.id]: val || 1 }))
                        }
                        size="small"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            El código de barra se genera automáticamente si el elemento aún no tiene uno.
            Máximo {CANTIDAD_MAX} etiquetas por elemento.
          </p>
        </div>
      )}

      <div id="barcode-print-area" className="hidden">
        <div className="grid grid-cols-3 gap-2 p-4">
          {etiquetas.map(({ item, codigo }, idx) => (
            <BarcodeLabel
              key={`${item.id}-${idx}`}
              codigo={codigo}
              nombre={item.nombre}
              unidad={item.unidad}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
