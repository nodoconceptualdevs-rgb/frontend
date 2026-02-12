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
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getCourses, updateCourse, Course } from "@/services/courses";
import AdminHeader from "@/components/admin/AdminHeader";

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
      const response = await getCourses() as any;
      
      // Manejar ambos formatos: { data: Course[] } o directamente Course[]
      const coursesData = response?.data || response;
      
      console.log('📚 Response completa:', response);
      console.log('📚 Cursos recibidos:', coursesData);
      console.log('📚 IDs de cursos:', coursesData?.map?.((c: Course) => c.id));
      
      setCourses(Array.isArray(coursesData) ? coursesData : []);
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
      // Por ahora solo deshabilita el curso, puedes implementar un campo isDeleted si prefieres
      await updateCourse(courseId, { isActive: false });
      message.success("Curso eliminado correctamente");
      loadCourses();
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting course:", error);
      message.error(error.message || "Error al eliminar el curso");
    }
  };

  const handleManageContent = (courseId: number) => {
    router.push(`/admin/cursos/${courseId}/contenido`);
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
            onClick={() => {
              // Usar el ID del curso para la URL y sessionStorage
              const courseIdentifier = record.id;
              // Guardar curso en sessionStorage para evitar petición extra
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(`course_${courseIdentifier}`, JSON.stringify(record));
                console.log('💾 Curso guardado en sessionStorage con ID:', courseIdentifier, 'ID real:', record.id);
              }
              router.push(`/admin/cursos/${courseIdentifier}/editar`);
            }}
            title="Editar curso y gestionar contenido"
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar curso?"
            description="El curso será marcado como inactivo y no será visible para los usuarios"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader
        titulo="Gestión de Cursos"
        subtitulo={`${courses.length} cursos en total`}
      />

      <main className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* Barra de acciones */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          <Input
            placeholder="Buscar curso..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 300, flex: 1, minWidth: 0 }}
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
              flexShrink: 0,
            }}
          >
            Nuevo Curso
          </Button>
        </div>

        {/* Tabla con scroll responsive */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table
            columns={columns}
            dataSource={filteredCourses}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} cursos`,
              responsive: true,
            }}
            scroll={{ x: 800 }}
            bordered
            size="middle"
          />
        </div>
      </main>
    </div>
  );
}
