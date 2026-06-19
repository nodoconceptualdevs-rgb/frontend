"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button, InputNumber, Divider, Spin, Popconfirm } from "antd";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { MaterialCatalogo } from "@/types/inventario";
import { createMaterial, updateMaterial, getCategorias, createCategoria, deleteCategoria, getUnidades, createUnidad, deleteUnidad } from "@/services/inventario";

interface AgregarMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onMaterialCreado: (material: MaterialCatalogo) => void;
  materialEditar?: MaterialCatalogo;
}

export default function AgregarMaterialModal({ open, onClose, onMaterialCreado, materialEditar }: AgregarMaterialModalProps) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | undefined>();
  const [unidadId, setUnidadId] = useState<number | undefined>();
  const [stockMinimo, setStockMinimo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [categorias, setCategorias] = useState<{ id: number; documentId: string; nombre: string; etiqueta: string }[]>([]);
  const [unidades, setUnidades] = useState<{ id: number; documentId: string; nombre: string; abreviatura: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  // Inputs inline para crear nuevas opciones
  const [nuevaCat, setNuevaCat] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("");
  const [guardandoCat, setGuardandoCat] = useState(false);
  const [guardandoUnidad, setGuardandoUnidad] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCargando(true);
    Promise.all([getCategorias(), getUnidades()])
      .then(([cats, unis]) => {
        setCategorias(cats);
        setUnidades(unis);

        // Si es edición, cargar los datos
        if (materialEditar) {
          setCodigo(materialEditar.codigo || "");
          setNombre(materialEditar.nombre);
          const cat = cats.find((c) => c.nombre === materialEditar.categoria);
          if (cat) setCategoriaId(cat.id);
          const uni = unis.find((u) => u.nombre === materialEditar.unidad);
          if (uni) setUnidadId(uni.id);
          setStockMinimo(materialEditar.stockMinimo ?? null);
        } else {
          // Reset si es nuevo
          setCodigo("");
          setNombre("");
          setCategoriaId(undefined);
          setUnidadId(undefined);
          setStockMinimo(null);
        }
      })
      .catch(() => toast.error("Error al cargar categorías y unidades"))
      .finally(() => setCargando(false));
  }, [open, materialEditar]);

  const handleSubmit = async () => {
    if (!nombre.trim()) { toast.error("El nombre del material es requerido"); return; }
    if (!categoriaId) { toast.error("La categoría es requerida"); return; }
    if (!unidadId) { toast.error("La unidad de medida es requerida"); return; }

    const cat = categorias.find((c) => c.id === categoriaId);
    const uni = unidades.find((u) => u.id === unidadId);
    if (!cat || !uni) return;

    try {
      setLoading(true);
      let material;

      if (materialEditar) {
        material = await updateMaterial(materialEditar.documentId!, nombre.trim(), cat.nombre, uni.nombre, stockMinimo || undefined, materialEditar.precioPromedio, codigo || undefined);
        toast.success("Material actualizado");
      } else {
        material = await createMaterial(nombre.trim(), cat.nombre, uni.nombre, stockMinimo || undefined, 0, codigo || undefined);
        toast.success("Material agregado al catálogo");
      }

      onMaterialCreado(material);
      handleReset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(materialEditar ? "Error al actualizar material" : "Error al crear material");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCodigo("");
    setNombre("");
    setCategoriaId(undefined);
    setUnidadId(undefined);
    setStockMinimo(null);
    setNuevaCat("");
    setNuevaUnidad("");
  };

  const handleEliminarCategoria = async (id: number, documentId: string) => {
    try {
      await deleteCategoria(documentId);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      if (categoriaId === id) setCategoriaId(undefined);
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  const handleEliminarUnidad = async (id: number, documentId: string) => {
    try {
      await deleteUnidad(documentId);
      setUnidades((prev) => prev.filter((u) => u.id !== id));
      if (unidadId === id) setUnidadId(undefined);
      toast.success("Unidad eliminada");
    } catch {
      toast.error("Error al eliminar unidad");
    }
  };

  const handleAgregarCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try {
      setGuardandoCat(true);
      const nueva = await createCategoria(nuevaCat.trim());
      setCategorias((prev) => [...prev, nueva]);
      setCategoriaId(nueva.id);
      setNuevaCat("");
      toast.success("Categoría creada");
    } catch {
      toast.error("Error al crear categoría");
    } finally {
      setGuardandoCat(false);
    }
  };

  const handleAgregarUnidad = async () => {
    if (!nuevaUnidad.trim()) return;
    try {
      setGuardandoUnidad(true);
      const nueva = await createUnidad(nuevaUnidad.trim());
      setUnidades((prev) => [...prev, nueva]);
      setUnidadId(nueva.id);
      setNuevaUnidad("");
      toast.success("Unidad creada");
    } catch {
      toast.error("Error al crear unidad");
    } finally {
      setGuardandoUnidad(false);
    }
  };

  return (
    <Modal
      title="Agregar Material al Catálogo"
      open={open}
      onCancel={() => { handleReset(); onClose(); }}
      width={480}
      footer={[
        <Button key="cancel" onClick={() => { handleReset(); onClose(); }} disabled={loading}>Cancelar</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={loading}>Crear Material</Button>,
      ]}
    >
      <Spin spinning={cargando}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código (opcional)</label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: MAT-001" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Material</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cerámica piso 80x80" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
            <Select
              value={categoriaId}
              onChange={setCategoriaId}
              placeholder="Selecciona categoría"
              className="w-full"
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={categorias.map((c) => ({ value: c.id, label: c.etiqueta }))}
              optionRender={(option) => {
                const cat = categorias.find((c) => c.id === option.value);
                return (
                  <div className="flex items-center justify-between group">
                    <span>{option.label}</span>
                    <Popconfirm
                      title="¿Eliminar esta categoría?"
                      okText="Sí"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      onConfirm={(e) => { e?.stopPropagation(); if (cat) handleEliminarCategoria(cat.id, cat.documentId); }}
                      onPopupClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 size={13} />
                      </button>
                    </Popconfirm>
                  </div>
                );
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "6px 0" }} />
                  <div className="flex gap-2 px-2 pb-2">
                    <Input
                      size="small"
                      placeholder="Nueva categoría"
                      value={nuevaCat}
                      onChange={(e) => setNuevaCat(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleAgregarCategoria(); }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={14} />}
                      loading={guardandoCat}
                      onClick={handleAgregarCategoria}
                    />
                  </div>
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad de Medida</label>
            <Select
              value={unidadId}
              onChange={setUnidadId}
              placeholder="Selecciona unidad"
              className="w-full"
              showSearch
              allowClear
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={unidades.map((u) => ({ value: u.id, label: `${u.nombre}${u.abreviatura !== u.nombre ? ` (${u.abreviatura})` : ""}` }))}
              optionRender={(option) => {
                const uni = unidades.find((u) => u.id === option.value);
                return (
                  <div className="flex items-center justify-between group">
                    <span>{option.label}</span>
                    <Popconfirm
                      title="¿Eliminar esta unidad?"
                      okText="Sí"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      onConfirm={(e) => { e?.stopPropagation(); if (uni) handleEliminarUnidad(uni.id, uni.documentId); }}
                      onPopupClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 size={13} />
                      </button>
                    </Popconfirm>
                  </div>
                );
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "6px 0" }} />
                  <div className="flex gap-2 px-2 pb-2">
                    <Input
                      size="small"
                      placeholder="Nueva unidad (ej: litro)"
                      value={nuevaUnidad}
                      onChange={(e) => setNuevaUnidad(e.target.value)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") handleAgregarUnidad(); }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={14} />}
                      loading={guardandoUnidad}
                      onClick={handleAgregarUnidad}
                    />
                  </div>
                </>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Stock Mínimo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <InputNumber
              value={stockMinimo}
              onChange={(val) => setStockMinimo(val)}
              placeholder="Dejar vacío si no necesita alarma"
              min={0}
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            • Si dejas el stock mínimo vacío, este material no tendrá alarma de cantidad baja<br />
            • El precio promedio se calculará automáticamente cuando registres compras
          </p>
        </div>
      </Spin>
    </Modal>
  );
}
