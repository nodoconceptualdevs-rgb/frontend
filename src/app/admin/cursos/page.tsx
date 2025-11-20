"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Tag, Space, Popconfirm, message, Input } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getCourses, deleteCourse, Course } from "@/services/courses";

export default function CursosPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response: any = await getCourses();
      setCourses(response.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      message.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCourse(id);
      message.success("Curso eliminado correctamente");
      loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      message.error("Error al eliminar el curso");
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchText.toLowerCase()) ||
    course.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
      sorter: (a: Course, b: Course) => a.title.localeCompare(b.title),
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => text.substring(0, 100) + (text.length > 100 ? "..." : ""),
    },
    {
      title: "Precio",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `$${price.toFixed(2)}`,
      sorter: (a: Course, b: Course) => a.price - b.price,
    },
    {
      title: "Lecciones",
      dataIndex: "number_lessons",
      key: "number_lessons",
      align: "center" as const,
    },
    {
      title: "Estado",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Activo" : "Inactivo"}
        </Tag>
      ),
      filters: [
        { text: "Activo", value: true },
        { text: "Inactivo", value: false },
      ],
      onFilter: (value: any, record: Course) => record.isActive === value,
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Course) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/cursos/${record.id}`)}
            title="Ver detalles"
          >
            Ver
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/cursos/${record.id}/editar`)}
            title="Editar"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar curso?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar"
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          Gestión de Cursos
        </h1>
        <p style={{ color: "#d1d5db", margin: "8px 0 0 0" }}>
          {courses.length} cursos en total
        </p>
      </div>

      {/* Barra de acciones */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/admin/cursos/nuevo")}
          size="large"
          style={{
            background: "#f5b940",
            borderColor: "#f5b940",
            color: "#222",
            fontWeight: 600,
          }}
        >
          Nuevo Curso
        </Button>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        dataSource={filteredCourses}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} cursos`,
        }}
        bordered
      />
    </div>
  );
}
