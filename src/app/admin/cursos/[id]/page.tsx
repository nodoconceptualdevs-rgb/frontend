"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  getCourseById,
  getContentCourses,
  createContentCourse,
  deleteContentCourse,
  Course,
  ContentCourse,
} from "@/services/courses";

export default function CursoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<ContentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseResponse, lessonsResponse] = await Promise.all([
        getCourseById(courseId),
        getContentCourses(courseId),
      ]) as [{ data: Course }, { data: ContentCourse[] }];
      setCourse(courseResponse.data);
      setLessons(lessonsResponse.data || []);
    } catch (err) {
      const error = err as Error;
      console.error("Error loading course:", error);
      message.error(error.message || "Error al cargar el curso");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (values: Partial<ContentCourse>) => {
    try {
      await createContentCourse({
        lesson_title: values.lesson_title || '',
        order: values.order || 1,
        course: courseId,
      });
      message.success("Lección creada correctamente");
      setModalVisible(false);
      form.resetFields();
      loadCourseData();
    } catch (err) {
      const error = err as Error;
      console.error("Error creating lesson:", error);
      message.error(error.message || "Error al crear la lección");
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await deleteContentCourse(lessonId);
      message.success("Lección eliminada correctamente");
      loadCourseData();
    } catch (err) {
      const error = err as Error;
      console.error("Error deleting lesson:", error);
      message.error(error.message || "Error al eliminar la lección");
    }
  };

  const columns = [
    {
      title: "Orden",
      dataIndex: "order",
      key: "order",
      width: 80,
      sorter: (a: ContentCourse, b: ContentCourse) => a.order - b.order,
    },
    {
      title: "Título de la Lección",
      dataIndex: "lesson_title",
      key: "lesson_title",
    },
    {
      title: "Video",
      dataIndex: "video_lesson_url",
      key: "video_lesson_url",
      render: (video: { id: number; url: string } | null) => (
        <Tag color={video ? "green" : "default"}>
          {video ? "Subido" : "Pendiente"}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      align: "center" as const,
      render: (_: unknown, record: ContentCourse) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => message.info("Edición de lecciones próximamente")}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar lección?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDeleteLesson(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading || !course) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "#1f2937",
        padding: "32px",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: "16px" }}
        >
          Volver
        </Button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 600, margin: 0 }}>
              {course.title}
            </h1>
            <Tag color={course.isActive ? "green" : "red"} style={{ marginTop: "8px" }}>
              {course.isActive ? "Activo" : "Inactivo"}
            </Tag>
          </div>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/cursos/${courseId}/editar`)}
            size="large"
          >
            Editar Curso
          </Button>
        </div>
      </div>

      {/* Información del Curso */}
      <Card title="Información del Curso" style={{ marginBottom: "24px" }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Precio">
            ${course.price.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="Número de Lecciones">
            {course.number_lessons || lessons.length}
          </Descriptions.Item>
          <Descriptions.Item label="Descripción" span={2}>
            {course.description}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha de Creación">
            {new Date(course.createdAt).toLocaleDateString("es-ES")}
          </Descriptions.Item>
          <Descriptions.Item label="Última Actualización">
            {new Date(course.updatedAt).toLocaleDateString("es-ES")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Lecciones */}
      <Card
        title="Lecciones del Curso"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{
              background: "#f5b940",
              borderColor: "#f5b940",
              color: "#222",
              fontWeight: 600,
            }}
          >
            Nueva Lección
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={lessons}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Modal para Nueva Lección */}
      <Modal
        title="Crear Nueva Lección"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLesson}
          initialValues={{ order: lessons.length + 1 }}
        >
          <Form.Item
            label="Título de la Lección"
            name="lesson_title"
            rules={[{ required: true, message: "El título es requerido" }]}
          >
            <Input placeholder="Ej: Introducción a componentes" />
          </Form.Item>

          <Form.Item
            label="Orden"
            name="order"
            rules={[{ required: true, message: "El orden es requerido" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Crear Lección
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
