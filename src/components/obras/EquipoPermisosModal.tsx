"use client";

import React, { useState, useEffect } from "react";
import { Modal, Spin, Popconfirm, Select } from "antd";
import { X, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Usuario } from "@/types/proyecto.types";
import {
  getGerentesConPermisos,
  guardarPermisosGerente,
  actualizarGerentesObra,
  type GerenteConPermisos,
  type PermisosGerente,
  type PermisoModulo,
} from "@/services/obras";
import { getGerentes } from "@/services/usuarios";

interface Modulo {
  id: keyof PermisosGerente;
  label: string;
  operaciones: readonly (keyof PermisoModulo)[];
}

const MODULOS: Modulo[] = [
  { id: "partidas", label: "Partidas", operaciones: ["read", "create", "update", "delete"] },
  { id: "reportes", label: "Reportes", operaciones: ["read", "create"] },
  { id: "personal", label: "Personal", operaciones: ["read", "create", "update", "delete"] },
  { id: "valuaciones", label: "Valuaciones", operaciones: ["read", "create"] },
  { id: "analitica", label: "Analítica", operaciones: ["read"] },
  { id: "inventario", label: "Inventario/Facturas", operaciones: ["read", "create", "update", "delete"] },
  { id: "historial", label: "Historial", operaciones: ["read"] },
];

const ETIQUETAS_OPERACION: Record<string, string> = {
  read: "Ver",
  create: "Agregar",
  update: "Editar",
  delete: "Eliminar",
};

function permisosVacios(): PermisosGerente {
  return {
    partidas: { read: false, create: false, update: false, delete: false },
    reportes: { read: false, create: false },
    personal: { read: false, create: false, update: false, delete: false },
    valuaciones: { read: false, create: false },
    analitica: { read: false },
    inventario: { read: false, create: false, update: false, delete: false },
    historial: { read: false },
  };
}

function permisosCompletos(): PermisosGerente {
  return {
    partidas: { read: true, create: true, update: true, delete: true },
    reportes: { read: true, create: true },
    personal: { read: true, create: true, update: true, delete: true },
    valuaciones: { read: true, create: true },
    analitica: { read: true },
    inventario: { read: true, create: true, update: true, delete: true },
    historial: { read: true },
  };
}

function contarActivos(permisosModulo: PermisoModulo, operaciones: readonly (keyof PermisoModulo)[]): number {
  return operaciones.filter((op) => permisosModulo[op]).length;
}

interface EquipoPermisosModalProps {
  obraId: number;
  obraDocumentId: string;
  open: boolean;
  onClose: () => void;
  onGerentesChange: (gerentes: Usuario[]) => void;
}

export default function EquipoPermisosModal({
  obraId,
  obraDocumentId,
  open,
  onClose,
  onGerentesChange,
}: EquipoPermisosModalProps) {
  const [gerentes, setGerentes] = useState<GerenteConPermisos[]>([]);
  const [gerentesDisponibles, setGerentesDisponibles] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [celdaAbierta, setCeldaAbierta] = useState<{ gerenteId: number; modulo: string } | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [quitandoId, setQuitandoId] = useState<number | null>(null);
  // Solo puede haber una mutación de equipo (agregar o quitar) en vuelo a la
  // vez: actualizarGerentesObra reemplaza la lista completa de gerentes, así
  // que dos mutaciones concurrentes pisarían el resultado una de la otra.
  const equipoMutando = agregando || quitandoId !== null;

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setCargando(true);
    setCeldaAbierta(null);

    Promise.all([getGerentesConPermisos(obraId), getGerentes()])
      .then(([conPermisos, todos]) => {
        if (cancelado) return;
        setGerentes(conPermisos);
        const asignadosIds = new Set(conPermisos.map((g) => g.id));
        setGerentesDisponibles(
          (Array.isArray(todos) ? todos : []).filter((u: Usuario) => !asignadosIds.has(u.id))
        );
      })
      .catch((error) => {
        console.error("Error cargando equipo y permisos:", error);
        toast.error("No se pudieron cargar los gerentes de esta obra");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, obraId]);

  const handleAgregarGerente = async (usuario: Usuario) => {
    setAgregando(true);
    try {
      const idsActuales = gerentes.map((g) => g.id);
      const obraActualizada = await actualizarGerentesObra(obraDocumentId, [...idsActuales, usuario.id]);
      onGerentesChange(obraActualizada.gerentes ?? []);
      setGerentes((prev) => [
        ...prev,
        { id: usuario.id, username: usuario.username, email: usuario.email, permisos: permisosVacios() },
      ]);
      setGerentesDisponibles((prev) => prev.filter((u) => u.id !== usuario.id));
      toast.success(`${usuario.username} agregado al equipo`);
    } catch (error) {
      console.error("Error agregando gerente:", error);
      toast.error("No se pudo agregar al gerente");
    } finally {
      setAgregando(false);
    }
  };

  const handleQuitarGerente = async (gerente: GerenteConPermisos) => {
    setQuitandoId(gerente.id);
    try {
      const idsActuales = gerentes.filter((g) => g.id !== gerente.id).map((g) => g.id);
      const obraActualizada = await actualizarGerentesObra(obraDocumentId, idsActuales);
      onGerentesChange(obraActualizada.gerentes ?? []);
      setGerentes((prev) => prev.filter((g) => g.id !== gerente.id));
      setGerentesDisponibles((prev) => [
        ...prev,
        { id: gerente.id, username: gerente.username, email: gerente.email },
      ]);
      if (celdaAbierta?.gerenteId === gerente.id) setCeldaAbierta(null);
      toast.success(`${gerente.username} quitado del equipo`);
    } catch (error) {
      console.error("Error quitando gerente:", error);
      toast.error("No se pudo quitar al gerente");
    } finally {
      setQuitandoId(null);
    }
  };

  const handleTogglePermiso = async (
    gerente: GerenteConPermisos,
    moduloId: keyof PermisosGerente,
    operacion: keyof PermisoModulo
  ) => {
    const permisosOriginales = gerente.permisos;
    const valorAnterior = Boolean(permisosOriginales[moduloId][operacion]);
    const nuevoValor = !valorAnterior;

    // "Ver" es prerrequisito de las demás operaciones del módulo: si se
    // apaga, no tiene sentido dejar agregar/editar/eliminar prendidos.
    const moduloActualizado: PermisoModulo =
      operacion === "read" && !nuevoValor
        ? Object.fromEntries(
            (Object.keys(permisosOriginales[moduloId]) as (keyof PermisoModulo)[]).map((op) => [op, false])
          )
        : { ...permisosOriginales[moduloId], [operacion]: nuevoValor };

    const permisosActualizados: PermisosGerente = {
      ...permisosOriginales,
      [moduloId]: moduloActualizado,
    };

    setGerentes((prev) =>
      prev.map((g) => (g.id === gerente.id ? { ...g, permisos: permisosActualizados } : g))
    );

    try {
      await guardarPermisosGerente(obraId, gerente.id, permisosActualizados);
    } catch (error) {
      console.error("Error guardando permiso:", error);
      toast.error("No se pudo guardar el permiso");
      setGerentes((prev) =>
        prev.map((g) => (g.id === gerente.id ? { ...g, permisos: permisosOriginales } : g))
      );
    }
  };

  const handleDarTodosLosPermisos = async (gerente: GerenteConPermisos) => {
    const permisosOriginales = gerente.permisos;
    const nuevosPermisos = permisosCompletos();

    setGerentes((prev) =>
      prev.map((g) => (g.id === gerente.id ? { ...g, permisos: nuevosPermisos } : g))
    );

    try {
      await guardarPermisosGerente(obraId, gerente.id, nuevosPermisos);
      toast.success(`Todos los permisos otorgados a ${gerente.username}`);
    } catch (error) {
      console.error("Error otorgando todos los permisos:", error);
      toast.error("No se pudieron otorgar los permisos");
      setGerentes((prev) =>
        prev.map((g) => (g.id === gerente.id ? { ...g, permisos: permisosOriginales } : g))
      );
    }
  };

  return (
    <Modal
      title={
        <span className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>👥</span> Equipo y Permisos
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1040}
      destroyOnClose
    >
      {cargando ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <div className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-3 font-semibold">Gerente</th>
                  {MODULOS.map((modulo) => (
                    <th key={modulo.id} className="pb-2 px-1 text-center font-semibold">
                      {modulo.label}
                    </th>
                  ))}
                  <th className="pb-2 pl-1"></th>
                </tr>
              </thead>
              <tbody>
                {gerentes.length === 0 && (
                  <tr>
                    <td colSpan={MODULOS.length + 2} className="py-16 text-center text-sm text-gray-400 italic">
                      Todavía no hay gerentes asignados a esta obra
                    </td>
                  </tr>
                )}

                {gerentes.map((gerente) => {
                  const detalleModulo =
                    celdaAbierta?.gerenteId === gerente.id
                      ? MODULOS.find((m) => m.id === celdaAbierta.modulo)
                      : undefined;

                  return (
                    <React.Fragment key={gerente.id}>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {gerente.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                {gerente.username}
                              </p>
                              <p className="text-xs text-gray-500 leading-tight truncate">{gerente.email}</p>
                            </div>
                          </div>
                        </td>

                        {MODULOS.map((modulo) => {
                          const permisosModulo = gerente.permisos[modulo.id];
                          const activos = contarActivos(permisosModulo, modulo.operaciones);
                          const total = modulo.operaciones.length;
                          const estaAbierta = detalleModulo?.id === modulo.id;

                          return (
                            <td key={modulo.id} className="text-center py-2 px-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setCeldaAbierta(estaAbierta ? null : { gerenteId: gerente.id, modulo: modulo.id })
                                }
                                className={`w-14 h-8 rounded-md text-xs font-bold transition ${
                                  activos === 0
                                    ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    : activos === total
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                } ${estaAbierta ? "ring-2 ring-red-400" : ""}`}
                              >
                                {activos}/{total}
                              </button>
                            </td>
                          );
                        })}

                        <td className="text-center py-2 pl-1">
                          <div className="flex items-center justify-center gap-2">
                            <Popconfirm
                              title={`¿Dar todos los permisos a ${gerente.username}?`}
                              okText="Sí"
                              cancelText="No"
                              onConfirm={() => handleDarTodosLosPermisos(gerente)}
                            >
                              <button
                                type="button"
                                disabled={equipoMutando}
                                className="text-gray-400 hover:text-green-600 transition disabled:opacity-40"
                                title="Dar todos los permisos"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            </Popconfirm>
                            <Popconfirm
                              title={`¿Quitar a ${gerente.username} del equipo?`}
                              okText="Sí"
                              cancelText="No"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => handleQuitarGerente(gerente)}
                            >
                              <button
                                type="button"
                                disabled={equipoMutando}
                                className="text-gray-400 hover:text-red-600 transition disabled:opacity-40"
                                title="Quitar del equipo"
                              >
                                <X size={16} />
                              </button>
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>

                      {detalleModulo && (
                        <tr>
                          <td colSpan={MODULOS.length + 2} className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">{detalleModulo.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {detalleModulo.operaciones.map((operacion) => {
                                const activo = Boolean(gerente.permisos[detalleModulo.id][operacion]);
                                // "Ver" es prerrequisito: sin él, no tiene sentido
                                // poder agregar/editar/eliminar en el módulo.
                                const bloqueadoPorFaltaDeVer =
                                  operacion !== "read" && !gerente.permisos[detalleModulo.id].read;
                                return (
                                  <button
                                    key={operacion}
                                    type="button"
                                    disabled={bloqueadoPorFaltaDeVer}
                                    title={bloqueadoPorFaltaDeVer ? 'Primero activá "Ver" en este módulo' : undefined}
                                    onClick={() => handleTogglePermiso(gerente, detalleModulo.id, operacion)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                                      bloqueadoPorFaltaDeVer
                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                        : activo
                                        ? "bg-green-500 text-white hover:bg-green-600"
                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    }`}
                                  >
                                    {ETIQUETAS_OPERACION[operacion]}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                <tr>
                  <td colSpan={MODULOS.length + 2} className="pt-3">
                    <Select
                      showSearch
                      value={null}
                      placeholder="+ Agregar gerente..."
                      disabled={equipoMutando}
                      style={{ width: "100%" }}
                      notFoundContent="No se encontraron gerentes"
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={(userId: number) => {
                        const usuario = gerentesDisponibles.find((u) => u.id === userId);
                        if (usuario) handleAgregarGerente(usuario);
                      }}
                      options={gerentesDisponibles.map((u) => ({
                        value: u.id,
                        label: `${u.username} — ${u.email}`,
                      }))}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
