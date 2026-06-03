"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "antd";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { CategoriaItem, Categoria, MaterialCatalogo, UnidadDeMedida } from "@/types/inventario";
import { createMaterial, getUnidades, createUnidad, getCategorias, createCategoria } from "@/services/inventario";

interface AgregarMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onMaterialCreado: (material: MaterialCatalogo) => void;
}

export default function AgregarMaterialModal({
  open,
  onClose,
  onMaterialCreado,
}: AgregarMaterialModalProps) {
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [unidadId, setUnidadId] = useState<number | null>(null);
  const [stockMinimo, setStockMinimo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadDeMedida[]>([]);
  const [agregarCategoriaOpen, setAgregarCategoriaOpen] = useState(false);
  const [agregarUnidadOpen, setAgregarUnidadOpen] = useState(false);
  const [nuevaCategoriaEtiqueta, setNuevaCategoriaEtiqueta] = useState("");
  const [nuevaCategoriaDescripcion, setNuevaCategoriaDescripcion] = useState("");
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState("");
  const [nuevaUnidadAbreviatura, setNuevaUnidadAbreviatura] = useState("");

  useEffect(() => {
    if (open) {
      cargarCategorias();
      cargarUnidades();
    }
  }, [open]);

  const cargarCategorias = async () => {
    const c = await getCategorias();
    setCategorias(c);
  };

  const cargarUnidades = async () => {
    const u = await getUnidades();
    setUnidades(u);
  };

  const handleSubmit = async () => {
    try {
      if (!nombre.trim()) {
        toast.error("El nombre del material es requerido");
        return;
      }
      if (!categoriaId) {
        toast.error("La categoría es requerida");
        return;
      }
      if (!unidadId) {
        toast.error("La unidad de medida es requerida");
        return;
      }

      const categoriaSeleccionada = categorias.find((c) => c.id === categoriaId);
      const unidadSeleccionada = unidades.find((u) => u.id === unidadId);

      if (!categoriaSeleccionada) {
        toast.error("Categoría no encontrada");
        return;
      }
      if (!unidadSeleccionada) {
        toast.error("Unidad de medida no encontrada");
        return;
      }

      setLoading(true);
      const nuevoMaterial = await createMaterial(
        nombre,
        categoriaSeleccionada.nombre,
        unidadSeleccionada.nombre,
        stockMinimo || undefined,
        0 // precioPromedio inicial
      );

      toast.success("Material agregado al catálogo");
      onMaterialCreado(nuevoMaterial);

      // Limpiar formulario
      setNombre("");
      setCategoriaId(null);
      setUnidadId(null);
      setStockMinimo(null);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear material");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCategoria = async () => {
    try {
      if (!nuevaCategoriaEtiqueta.trim()) {
        toast.error("El nombre de la categoría es requerido");
        return;
      }

      setLoading(true);
      const nuevaCategoria = await createCategoria(
        nuevaCategoriaEtiqueta,
        nuevaCategoriaEtiqueta
      );

      setCategorias([...categorias, nuevaCategoria]);
      setCategoriaId(nuevaCategoria.id);
      setNuevaCategoriaEtiqueta("");
      setNuevaCategoriaDescripcion("");
      setAgregarCategoriaOpen(false);
      toast.success("Categoría creada");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear categoría");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUnidad = async () => {
    try {
      if (!nuevaUnidadNombre.trim()) {
        toast.error("El nombre de la unidad es requerido");
        return;
      }
      if (!nuevaUnidadAbreviatura.trim()) {
        toast.error("La abreviatura es requerida");
        return;
      }

      setLoading(true);
      const nuevaUnidad = await createUnidad(
        nuevaUnidadNombre,
        nuevaUnidadAbreviatura
      );

      setUnidades([...unidades, nuevaUnidad]);
      setUnidadId(nuevaUnidad.id);
      setNuevaUnidadNombre("");
      setNuevaUnidadAbreviatura("");
      setAgregarUnidadOpen(false);
      toast.success("Unidad de medida creada");
    } catch (error) {
      console.error(error);
      toast.error("Error al crear unidad");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNombre("");
    setCategoriaId(null);
    setUnidadId(null);
    setStockMinimo(null);
    onClose();
  };

  return (
    <Modal
      title="Agregar Material al Catálogo"
      open={open}
      onCancel={handleCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
        >
          Crear Material
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre del Material
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Cerámica piso 80x80"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Categoría
          </label>
          <div className="flex gap-2">
            <Select
              value={categoriaId}
              onChange={setCategoriaId}
              placeholder="Selecciona categoría"
              className="flex-1"
              options={categorias.map((c) => ({
                value: c.id,
                label: c.etiqueta,
              }))}
            />
            <Button
              type="dashed"
              onClick={() => setAgregarCategoriaOpen(true)}
              icon={<Plus size={14} />}
              title="Agregar nueva categoría"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Unidad de Medida
          </label>
          <div className="flex gap-2">
            <Select
              value={unidadId}
              onChange={setUnidadId}
              placeholder="Selecciona unidad"
              className="flex-1"
              options={unidades.map((u) => ({
                value: u.id,
                label: `${u.nombre} (${u.abreviatura})`,
              }))}
            />
            <Button
              type="dashed"
              onClick={() => setAgregarUnidadOpen(true)}
              icon={<Plus size={14} />}
              title="Agregar nueva unidad de medida"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Stock Mínimo (Opcional)
          </label>
          <Input
            type="number"
            value={stockMinimo ?? ""}
            onChange={(e) => setStockMinimo(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Dejar vacío si no necesita alarma"
            min={0}
          />
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          • Si dejas el stock mínimo vacío, este material no tendrá alarma de cantidad baja
          <br />
          • El precio promedio se calculará automáticamente cuando registres compras
        </p>
      </div>

      {/* Modal para agregar nueva categoría */}
      <Modal
        title="Agregar Categoría"
        open={agregarCategoriaOpen}
        onCancel={() => {
          setNuevaCategoriaEtiqueta("");
          setNuevaCategoriaDescripcion("");
          setAgregarCategoriaOpen(false);
        }}
        width={400}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setNuevaCategoriaEtiqueta("");
              setNuevaCategoriaDescripcion("");
              setAgregarCategoriaOpen(false);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCrearCategoria}
            loading={loading}
          >
            Crear Categoría
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre de la Categoría
            </label>
            <Input
              value={nuevaCategoriaEtiqueta}
              onChange={(e) => setNuevaCategoriaEtiqueta(e.target.value)}
              placeholder="Ej: Estructura, Acabados, Herramientas"
            />
          </div>

          <p className="text-xs text-gray-500">
            Las categorías ayudan a organizar y clasificar los materiales en el catálogo
          </p>
        </div>
      </Modal>

      {/* Modal para agregar nueva unidad de medida */}
      <Modal
        title="Agregar Unidad de Medida"
        open={agregarUnidadOpen}
        onCancel={() => {
          setNuevaUnidadNombre("");
          setNuevaUnidadAbreviatura("");
          setAgregarUnidadOpen(false);
        }}
        width={400}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setNuevaUnidadNombre("");
              setNuevaUnidadAbreviatura("");
              setAgregarUnidadOpen(false);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCrearUnidad}
            loading={loading}
          >
            Crear Unidad
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre de la Unidad
            </label>
            <Input
              value={nuevaUnidadNombre}
              onChange={(e) => setNuevaUnidadNombre(e.target.value)}
              placeholder="Ej: metro cúbico, kilogramo, galón"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Abreviatura
            </label>
            <Input
              value={nuevaUnidadAbreviatura}
              onChange={(e) => setNuevaUnidadAbreviatura(e.target.value)}
              placeholder="Ej: m³, kg, gal"
              maxLength={10}
            />
          </div>

          <p className="text-xs text-gray-500">
            La abreviatura se usará para mostrar de forma compacta en las tablas
          </p>
        </div>
      </Modal>
    </Modal>
  );
}
