"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Empty, Card, Statistic, Row, Col, message } from "antd";
import { DollarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { getTransactionsByUser, Transaction } from "@/services/transactions";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ROLES } from "@/constants/roles";

export default function MisPagosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirigir si el usuario es Gerente de Proyecto
  useEffect(() => {
    if (user && user.role.type === ROLES.GERENTE_PROYECTO) {
      message.warning("Esta sección es solo para clientes");
      router.push("/dashboard/mi-proyecto");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.id && user.role.type !== ROLES.GERENTE_PROYECTO) {
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await getTransactionsByUser(user.id) as { data: Transaction[] };
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      message.error("Error al cargar tus pagos");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Fecha",
      dataIndex: "purchase_date",
      key: "purchase_date",
      render: (date: string) => new Date(date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      sorter: (a: Transaction, b: Transaction) =>
        new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime(),
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
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: "#f5b940", fontSize: "16px" }}>
          ${amount.toFixed(2)}
        </span>
      ),
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
    },
  ];

  const totalGastado = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCompras = transactions.length;

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
          Mis Pagos
        </h1>
        <p style={{ color: "#d1d5db", margin: "8px 0 0 0" }}>
          Historial completo de tus compras
        </p>
      </div>

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Gastado"
              value={totalGastado}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="USD"
              valueStyle={{ color: "#f5b940" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total de Compras"
              value={totalCompras}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Transacciones */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ fontSize: "40px" }}>⏳</div>
          <p style={{ marginTop: "16px", color: "#666" }}>Cargando pagos...</p>
        </div>
      ) : transactions.length === 0 ? (
        <Empty
          description="No tienes pagos registrados"
          style={{ padding: "60px 0" }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} pagos`,
          }}
          bordered
        />
      )}
    </div>
  );
}
