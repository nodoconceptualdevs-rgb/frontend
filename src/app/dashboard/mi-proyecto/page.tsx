"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Row, Col, Tag, Button, message, Empty, Progress } from "antd";
import {
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { getMisProyectos, Proyecto } from "@/services/proyectos";

export default function MiProyectoPage() {
  const router = useRouter();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyectos();
  }, []);

  const loadProyectos = async () => {
    try {
      setLoading(true);
      const response = await getMisProyectos() as { data: Proyecto[] };
      setProyectos(response.data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      message.error("Error al cargar tus proyectos");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completado":
        return "green";
      case "En Ejecución":
        return "blue";
      case "En Planificación":
        return "orange";
      default:
        return "default";
    }
  };

  const calcularProgreso = (proyecto: Proyecto) => {
    if (!proyecto.hitos || proyecto.hitos.length === 0) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completados = proyecto.hitos.filter((h: any) => h.estado_completado).length;
    return Math.round((completados / proyecto.hitos.length) * 100);
  };

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
          Mi Proyecto
        </h1>
        <p style={{ color: "#d1d5db", margin: "8px 0 0 0" }}>
          Seguimiento de tu proyecto en tiempo real
        </p>
      </div>

      {/* Proyectos */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ fontSize: "40px" }}>⏳</div>
          <p style={{ marginTop: "16px", color: "#666" }}>Cargando proyectos...</p>
        </div>
      ) : proyectos.length === 0 ? (
        <Empty
          description={
            <div>
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>
                No tienes proyectos asignados
              </p>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Cuando se te asigne un proyecto, aparecerá aquí
              </p>
            </div>
          }
          style={{ padding: "60px 0" }}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {proyectos.map((proyecto) => {
            const progreso = calcularProgreso(proyecto);
            
            return (
              <Col xs={24} lg={12} key={proyecto.id}>
                <Card
                  hoverable
                  style={{ height: "100%" }}
                  actions={[
                    <Button
                      key="ver"
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => router.push(`/proyecto/${proyecto.token_nfc}`)}
                      style={{
                        background: "#f5b940",
                        borderColor: "#f5b940",
                        color: "#222",
                        fontWeight: 600,
                      }}
                    >
                      Ver Detalles Completos
                    </Button>,
                  ]}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                        {proyecto.nombre_proyecto}
                      </h2>
                      <Tag color={getEstadoColor(proyecto.estado_general)}>
                        {proyecto.estado_general}
                      </Tag>
                    </div>

                    {proyecto.ultimo_avance && (
                      <p style={{
                        color: "#666",
                        fontSize: "14px",
                        marginBottom: "16px",
                        padding: "12px",
                        background: "#f5f5f5",
                        borderRadius: "6px",
                      }}>
                        <strong>Último Avance:</strong> {proyecto.ultimo_avance}
                      </p>
                    )}

                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#666" }}>Progreso del Proyecto</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#f5b940" }}>
                          {progreso}%
                        </span>
                      </div>
                      <Progress
                        percent={progreso}
                        strokeColor="#f5b940"
                        showInfo={false}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#666" }}>
                        <CalendarOutlined />
                        <span>Inicio: {new Date(proyecto.fecha_inicio).toLocaleDateString("es-ES")}</span>
                      </div>
                      
                      {proyecto.gerente_proyecto && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#666" }}>
                          <UserOutlined />
                          <span>
                            Gerente: {proyecto.gerente_proyecto.name || proyecto.gerente_proyecto.username}
                          </span>
                        </div>
                      )}

                      {proyecto.hitos && proyecto.hitos.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#666" }}>
                          <RocketOutlined />
                          <span>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {proyecto.hitos.filter((h: any) => h.estado_completado).length} de {proyecto.hitos.length} hitos completados
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Información adicional */}
      {proyectos.length > 0 && (
        <Card
          style={{
            marginTop: "24px",
            background: "#f0f9ff",
            borderColor: "#3b82f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
            <div style={{ fontSize: "24px" }}>💡</div>
            <div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
                ¿Cómo funciona el seguimiento?
              </h3>
              <p style={{ margin: 0, color: "#1e40af" }}>
                Haz clic en &quot;Ver Detalles Completos&quot; para acceder a la vista completa de tu proyecto
                con el timeline de hitos, multimedia, tours 360° y la sección de comentarios donde
                puedes comunicarte directamente con tu gerente de proyecto.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
