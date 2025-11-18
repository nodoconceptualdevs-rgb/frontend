"use client";
import React, { useEffect, useState } from "react";
import TransaccionesTable, {
  Transaccion,
} from "@/components/TransaccionesTable";
import { getTransaccionesByUsuario } from "@/services/compras";

export default function MisPagosPage() {
  const [data, setData] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    console.log("Fetching transactions for page", page, "pageSize", pageSize);

    setLoading(true);
    getTransaccionesByUsuario(page, pageSize)
      .then((res) => {
        console.log("getTransaccionesByUsuario", res);
        type TransactionResponse = { id: number; purchase_date: string; amount: number; payment_method: string; course: { title: string } };
        const arr = (res?.data || []) as TransactionResponse[];
        const transacciones = arr.map((t) => ({
          id: t.id,
          purchase_date: t.purchase_date,
          amount: t.amount,
          payment_method: t.payment_method,
          course: t.course,
        }));
        setData(transacciones);
        setTotal(res?.meta?.pagination?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Mis Pagos — Privado</h1>
      <p>Ruta: /dashboard/mis-pagos</p>
      <p>Listado de pagos realizados por el usuario.</p>
      <div className="mt-8">
        <TransaccionesTable
          data={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>
    </main>
  );
}
