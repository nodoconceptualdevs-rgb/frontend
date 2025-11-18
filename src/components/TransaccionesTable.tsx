import React from "react";
import { Table } from "antd";

export interface Transaccion {
  id: number;
  purchase_date: string;
  amount: number;
  payment_method: string;
  course: { title: string };
}

interface TransaccionesTableProps {
  data: Transaccion[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

const columns = [
  {
    title: "Curso",
    dataIndex: ["course", "title"],
    key: "course",
    filterSearch: true,
    // Puedes agregar filtros dinámicos si lo necesitas
  },
  {
    title: "Fecha de compra",
    dataIndex: "purchase_date",
    key: "purchase_date",
    sorter: (a: Transaccion, b: Transaccion) =>
      new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime(),
  },
  {
    title: "Monto",
    dataIndex: "amount",
    key: "amount",
    sorter: (a: Transaccion, b: Transaccion) => a.amount - b.amount,
  },
  {
    title: "Método de pago",
    dataIndex: "payment_method",
    key: "payment_method",
    filters: [
      { text: "Tarjeta", value: "card" },
      { text: "Paypal", value: "paypal" },
      // Agrega más métodos si los tienes
    ],
    onFilter: (value: boolean | React.Key, record: Transaccion) =>
      record.payment_method === value,
  },
];

const TransaccionesTable: React.FC<TransaccionesTableProps> = ({
  data,
  loading,
  pagination,
}) => {
  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={pagination}
    />
  );
};

export default TransaccionesTable;
