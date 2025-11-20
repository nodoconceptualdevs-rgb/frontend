"use client";

import { useState, useMemo } from "react";
import { Card, Row, Col, Tag, Button, Input, message } from "antd";
import { SearchOutlined, PlayCircleOutlined, CheckCircleOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { getMisCursosComprados } from "@/services/transactions";
import { useDataFetch } from "@/hooks";
import { PageHeader, LoadingSpinner, EmptyState } from "@/components/common";

export default function CursosClientePage() {
  const [searchText, setSearchText] = useState("");
  
  const { data: courses, loading } = useDataFetch(
    getMisCursosComprados,
    []
  );

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((course: any) =>
      course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      course.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [courses, searchText]);

  return (
    <div>
      <PageHeader 
        title="Mis Cursos"
        subtitle={`${courses?.length || 0} ${courses?.length === 1 ? 'curso comprado' : 'cursos comprados'}`}
      />

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: "24px" }}>
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          size="large"
          style={{ maxWidth: 400 }}
          allowClear
        />
      </div>

      {/* Grid de Cursos */}
      {loading ? (
        <LoadingSpinner text="Cargando cursos..." />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={<ShoppingCartOutlined style={{ fontSize: "80px", color: "#d1d5db" }} />}
          title={searchText ? "No se encontraron cursos" : "Aún no has comprado ningún curso"}
          description={
            searchText 
              ? "Intenta con otro término de búsqueda"
              : "Los cursos que compres aparecerán aquí para que puedas acceder a ellos"
          }
        />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredCourses.map((course) => (
            <Col xs={24} sm={12} lg={8} key={course.id}>
              <Card
                hoverable
                cover={
                  <div style={{
                    height: 200,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "48px",
                    position: "relative",
                  }}>
                    📚
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                    }}>
                      <Tag color="success" style={{ margin: 0 }}>
                        <CheckCircleOutlined /> Comprado
                      </Tag>
                    </div>
                  </div>
                }
                actions={[
                  <Button
                    key="ver"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => message.info("Funcionalidad de ver curso próximamente")}
                    style={{
                      background: "#f5b940",
                      borderColor: "#f5b940",
                      color: "#222",
                      fontWeight: 600,
                    }}
                  >
                    Acceder al Curso
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={<span>{course.title}</span>}
                  description={
                    <>
                      <p style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        marginBottom: "12px",
                      }}>
                        {course.description}
                      </p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#666" }}>
                        {course.number_lessons && (
                          <span>
                            <CheckCircleOutlined /> {course.number_lessons} lecciones
                          </span>
                        )}
                      </div>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
