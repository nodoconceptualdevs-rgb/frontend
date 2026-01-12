"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, Button, Tag, Space, Popconfirm, message, Input, Card } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getCourses, updateCourse, Course } from "@/services/courses";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";

export default function GerenteCursosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // Verificar que el usuario sea gerente
    if (user && user.role.type !== ROLES.GERENTE_PROYECTO) {
      message.warning("No tienes permisos para acceder a esta sección");
      router.push("/dashboard");
      return;
    }
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await getCourses() as { data: Course[] };
      setCourses(response.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      message.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (courseId: number, currentStatus: boolean) => {
    try {
      await updateCourse(courseId, { isActive: !currentStatus });
      message.success(currentStatus ? "Curso deshabilitado" : "Curso habilitado");
      loadCourses();
    } catch (err) {
      const error = err as Error;
      console.error("Error toggling course status:", error);
      message.error(error.message || "Error al cambiar el estado del curso");
    }
  };

  const handleSoftDelete = async (courseId: number) => {
    try {
      await updateCourse(courseId, { isActive: false });
      message.success("Curso eliminado correctamente");
      loadCourses();
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting course:", error);
      message.error(error.message || "Error al eliminar el curso");
    }
  };

  const handleManageContent = (course: Course) => {
    // Guardar curso en sessionStorage para evitar petición extra
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`course_${course.id}`, JSON.stringify(course));
    }
    router.push(`/dashboard/gerente-cursos/${course.id}/contenido`);
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
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
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
      render: (lessons: number) => lessons || 0,
      sorter: (a: Course, b: Course) => (a.number_lessons || 0) - (b.number_lessons || 0),
    },
    {
      title: "Estado",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Activo" : "Inactivo"}
        </Tag>
      ),
      filters: [
        { text: "Activo", value: true },
        { text: "Inactivo", value: false },
      ],
      onFilter: (value: unknown, record: Course) => record.isActive === value,
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      width: 420,
      render: (_: unknown, record: Course) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/gerente-cursos/${record.id}/editar`)}
            title="Editar curso y gestionar contenido"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar curso?"
            description="El curso será marcado como inactivo y no será visible"
            onConfirm={() => handleSoftDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="Eliminar curso"
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Cursos
        </h1>
        <p className="text-gray-600">
          Administra todos los cursos disponibles en la plataforma
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <div className="flex justify-between items-center gap-4">
          <Input
            placeholder="Buscar cursos..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md"
            size="large"
          />
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/dashboard/gerente-cursos/nuevo")}
              size="large"
            >
              Crear Curso
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCourses}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} cursos`,
          }}
        />
      </Card>
    </div>
  );
}
