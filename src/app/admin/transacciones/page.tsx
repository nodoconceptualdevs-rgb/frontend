"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Input, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getTransactions, Transaction } from "@/services/transactions";

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
      const response: any = await getTransactions();
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
      render: (_: any, record: Transaction) => record.user?.username || record.user?.email || "N/A",
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
      onFilter: (value: any, record: Transaction) => record.payment_method === value,
    },
  ];

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "#1f2937",
        padding: "32px",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 600, margin: 0 }}>
          Transacciones
        </h1>
        <p style={{ color: "#d1d5db", margin: "8px 0 0 0" }}>
          {transactions.length} transacciones • Total: ${totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: "24px" }}>
        <Input
          placeholder="Buscar por usuario, curso o método de pago..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
      </div>

      {/* Tabla */}
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
  );
}
