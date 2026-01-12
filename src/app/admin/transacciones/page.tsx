"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Input, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getTransactions, Transaction } from "@/services/transactions";
import AdminHeader from "@/components/admin/AdminHeader";

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions() as { data: Transaction[] };
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      message.error("Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchText.toLowerCase();
    const userName = t.user?.username || "";
    const courseName = t.course?.title || "";
    return (
      userName.toLowerCase().includes(searchLower) ||
      courseName.toLowerCase().includes(searchLower) ||
      t.payment_method.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "Fecha",
      dataIndex: "purchase_date",
      key: "purchase_date",
      render: (date: string) => new Date(date).toLocaleDateString("es-ES"),
      sorter: (a: Transaction, b: Transaction) =>
        new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime(),
    },
    {
      title: "Usuario",
      dataIndex: ["user", "username"],
      key: "user",
      render: (_: unknown, record: Transaction) => record.user?.username || record.user?.email || "N/A",
    },
    {
      title: "Curso",
      dataIndex: ["course", "title"],
      key: "course",
      ellipsis: true,
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount,
    },
    {
      title: "Método de Pago",
      dataIndex: "payment_method",
      key: "payment_method",
      align: "center" as const,
      render: (method: string) => {
        const colors: Record<string, string> = {
          "Paypal": "blue",
          "Stripe": "purple",
          "Pago movil": "green",
        };
        return <Tag color={colors[method] || "default"}>{method}</Tag>;
      },
      filters: [
        { text: "Paypal", value: "Paypal" },
        { text: "Stripe", value: "Stripe" },
        { text: "Pago móvil", value: "Pago movil" },
      ],
      onFilter: (value: unknown, record: Transaction) => record.payment_method === value,
    },
  ];

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Transacciones"
        subtitulo={`${transactions.length} transacciones • Total: $${totalAmount.toFixed(2)}`}
      />

      <main className="px-8 py-8">
        {/* Barra de búsqueda */}
        <div style={{ marginBottom: "24px" }}>
          <Input
            placeholder="Buscar por usuario, curso o método de pago..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
            allowClear
          />
        </div>

        {/* Tabla con scroll responsive */}
        <div style={{ overflowX: "auto" }}>
          <Table
            columns={columns}
            dataSource={filteredTransactions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} transacciones`,
            }}
            scroll={{ x: 800 }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#f5f5f5" }}>
                  <Table.Summary.Cell index={0} colSpan={3} align="right">
                    <strong>Total General:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong style={{ color: "#f5b940", fontSize: "16px" }}>
                      ${totalAmount.toFixed(2)}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
            bordered
          />
        </div>
      </main>
    </div>
  );
}
