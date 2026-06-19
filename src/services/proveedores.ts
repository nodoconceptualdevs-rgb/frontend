import api from "@/lib/api";
import type { Proveedor, ProveedorFormValues } from "@/types/inventario";

function mapProveedor(raw: any): Proveedor & { documentId?: string } {
  return {
    id: raw.id,
    documentId: raw.documentId,
    nombre: raw.nombre,
    rut: raw.rut ?? undefined,
    email: raw.email ?? undefined,
    telefono: raw.telefono ?? undefined,
    contacto: raw.contacto ?? undefined,
    notas: raw.notas ?? undefined,
    activo: raw.activo ?? true,
  };
}

export async function getProveedores(soloActivos = true): Promise<Proveedor[]> {
  const filtro = soloActivos ? "&filters[activo][$eq]=true" : "";
  const res = await api.get(`/proveedores?sort=nombre:asc${filtro}`);
  return (res.data.data as any[]).map(mapProveedor);
}

export async function getProveedor(id: number): Promise<Proveedor> {
  const res = await api.get(`/proveedores/${id}`);
  return mapProveedor(res.data.data);
}

export async function createProveedor(values: ProveedorFormValues): Promise<Proveedor> {
  const res = await api.post("/proveedores", { data: values });
  return mapProveedor(res.data.data);
}

export async function updateProveedor(id: number, values: Partial<ProveedorFormValues>): Promise<Proveedor> {
  const res = await api.put(`/proveedores/${id}`, { data: values });
  return mapProveedor(res.data.data);
}

export async function toggleActivoProveedor(id: number): Promise<Proveedor> {
  const res = await api.patch(`/proveedores/${id}/toggle-activo`);
  return mapProveedor(res.data.data);
}

export async function deleteProveedor(documentId: string): Promise<void> {
  await api.delete(`/proveedores/${documentId}`);
}
