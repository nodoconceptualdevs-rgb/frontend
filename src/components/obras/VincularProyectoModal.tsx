"use client";

import { useEffect, useState } from "react";
import { Modal, Select, Button } from "antd";
import { getProyectosDisponiblesParaObra, vincularProyectoAObra } from "@/services/obras";
import toast from "react-hot-toast";

interface VincularProyectoModalProps {
  open: boolean;
  obraDocumentId: string;
  onClose: () => void;
  onVinculado: () => void;
}

export default function VincularProyectoModal({
  open,
  obraDocumentId,
  onClose,
  onVinculado,
}: VincularProyectoModalProps) {
  const [proyectos, setProyectos] = useState<{ id: number; nombre: string }[]>([]);
  const [proyectoId, setProyectoId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setProyectoId(undefined);
      getProyectosDisponiblesParaObra()
        .then(setProyectos)
        .catch((error) => console.error("Error cargando proyectos:", error));
    }
  }, [open]);

  const handleVincular = async () => {
    if (!proyectoId) {
      toast.error("Selecciona un proyecto");
      return;
    }
    try {
      setLoading(true);
      await vincularProyectoAObra(obraDocumentId, proyectoId);
      toast.success("Proyecto vinculado");
      onVinculado();
      onClose();
    } catch (error) {
      console.error("Error vinculando proyecto:", error);
      toast.error("Error al vincular el proyecto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Vincular Proyecto" open={open} onCancel={onClose} footer={null}>
      <div className="space-y-4 pt-2">
        <Select
          placeholder="Selecciona un proyecto sin obra"
          value={proyectoId}
          onChange={setProyectoId}
          options={proyectos.map((p) => ({ label: p.nombre, value: p.id }))}
          style={{ width: "100%" }}
        />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={loading} onClick={handleVincular}>
            Vincular
          </Button>
        </div>
      </div>
    </Modal>
  );
}
