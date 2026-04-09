"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Table, Button, Modal, Form, Input, Upload, message, Space, Card, Tabs } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  VideoCameraOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  CommentOutlined
} from "@ant-design/icons";
import { 
  createContentCourse, 
  updateContentCourse, 
  deleteContentCourse,
  ContentCourse 
} from "@/services/courses";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";
import type { UploadProps } from 'antd';
import CommentsSection from "@/components/comments/CommentsSection";

// Configuración de Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'course_videos';

interface ContentFormValues {
  lesson_title: string;
  order: number;
  video_url?: string;
}

export default function GerenteCourseContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = parseInt(params.id as string);
  
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<ContentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentCourse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [courseFromList, setCourseFromList] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ContentCourse | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [form] = Form.useForm();

  useEffect(() => {
    // Intentar obtener el curso de sessionStorage (si viene de la lista)
    if (typeof window !== 'undefined') {
      const cachedCourse = sessionStorage.getItem(`course_${courseId}`);
      if (cachedCourse) {
        try {
          const course = JSON.parse(cachedCourse);
          setCourseFromList(course);
          sessionStorage.removeItem(`course_${courseId}`);
        } catch (e) {
          console.error('Error parsing cached course:', e);
        }
      }
      setSessionChecked(true);
    }
  }, [courseId]);

  useEffect(() => {
    // Verificar que el usuario sea gerente
    if (user && user.role.type !== ROLES.GERENTE_PROYECTO) {
      message.warning("No tienes permisos para acceder a esta sección");
      router.push("/dashboard");
      return;
    }
    
    // Solo cargar datos si ya verificamos el sessionStorage
    if (sessionChecked) {
      loadCourseData();
    }
  }, [courseId, user, courseFromList, sessionChecked]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Usar SOLO los datos que vienen de la lista (sin petición HTTP)
      if (!courseFromList) {
        message.error('No se encontraron los datos del curso. Regresando...');
        router.push('/dashboard/gerente-cursos');
        return;
      }
      
      console.log('✅ Usando datos del curso desde la lista (sin petición HTTP)');
      setCourse(courseFromList);
      setContents(courseFromList.content_courses || []);
    } catch (error: any) {
      console.error("Error loading course:", error);
      message.error("Error al cargar el curso");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadVideo: UploadProps['customRequest'] = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        form.setFieldsValue({ video_url: data.secure_url });
        message.success('Video subido exitosamente');
        onSuccess(data);
      } else {
        throw new Error('Error al subir el video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      message.error('Error al subir el video');
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values: ContentFormValues) => {
    try {
      const payload = {
        ...values,
        course: courseId,
      };

      if (editingContent) {
        await updateContentCourse(editingContent.id, payload);
        message.success("Contenido actualizado exitosamente");
      } else {
        await createContentCourse(payload);
        message.success("Contenido creado exitosamente");
      }

      setModalVisible(false);
      form.resetFields();
      setEditingContent(null);
      loadCourseData();
    } catch (error) {
      console.error("Error saving content:", error);
      message.error("Error al guardar el contenido");
    }
  };

  const handleEdit = (content: ContentCourse) => {
    setEditingContent(content);
    form.setFieldsValue({
      lesson_title: content.lesson_title,
      order: content.order,
      video_url: (content as any).video_url,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteContentCourse(id);
      message.success("Contenido eliminado exitosamente");
      loadCourseData();
    } catch (error) {
      console.error("Error deleting content:", error);
      message.error("Error al eliminar el contenido");
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
      dataIndex: "video_url",
      key: "video_url",
      render: (url: string) => url ? (
        <VideoCameraOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />
      ) : (
        <span style={{ color: '#999' }}>Sin video</span>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 280,
      render: (_: unknown, record: ContentCourse) => (
        <Space size="small">
          <Button
            type="link"
            icon={<CommentOutlined />}
            onClick={() => {
              setSelectedLesson(record);
              setActiveTab("2");
            }}
          >
            Comentarios
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "1",
      label: "Lecciones y Contenido",
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contenido del Curso
              </h1>
              {course && (
                <p className="text-gray-600 mt-1">
                  {course.title}
                </p>
              )}
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingContent(null);
                form.resetFields();
                setModalVisible(true);
              }}
              style={{
                background: "#f5b940",
                borderColor: "#f5b940",
                color: "#222",
              }}
            >
              Agregar Contenido
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={contents}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: "Comentarios de Lección",
      children: selectedLesson ? (
        <div style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '16px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h3 style={{ margin: 0 }}>
              Comentarios de: {selectedLesson.lesson_title}
            </h3>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Lección {selectedLesson.order}
            </p>
          </div>
          <CommentsSection
            entityType="lesson"
            entityId={selectedLesson.id}
            userRole="gerente"
            height="calc(100vh - 400px)"
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <CommentOutlined style={{ fontSize: 48, color: '#d0d0d0' }} />
          <p style={{ marginTop: '16px', color: '#999' }}>
            Selecciona una lección desde la pestaña "Lecciones y Contenido" para ver sus comentarios
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      <Button 
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/dashboard/gerente-cursos')}
        className="mb-4"
      >
        Volver a Cursos
      </Button>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
          size="large"
        />
      </Card>

      {/* Modal para agregar/editar contenido */}
      <Modal
        title={editingContent ? "Editar Contenido" : "Agregar Contenido"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingContent(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="lesson_title"
            label="Título de la Lección"
            rules={[{ required: true, message: "Por favor ingrese el título" }]}
          >
            <Input placeholder="Ej: Introducción al curso" />
          </Form.Item>

          <Form.Item
            name="order"
            label="Orden"
            rules={[{ required: true, message: "Por favor ingrese el orden" }]}
          >
            <Input type="number" placeholder="1" />
          </Form.Item>

          <Form.Item
            name="video_url"
            label="Video de la Lección"
          >
            <div>
              <Input 
                placeholder="URL del video (se llenará automáticamente al subir)"
                disabled
                className="mb-2"
              />
              <Upload
                accept="video/*"
                customRequest={handleUploadVideo}
                showUploadList={false}
              >
                <Button 
                  icon={<UploadOutlined />}
                  loading={uploading}
                >
                  {uploading ? 'Subiendo...' : 'Subir Video'}
                </Button>
              </Upload>
              <p className="text-gray-500 text-sm mt-2">
                Formatos soportados: MP4, WebM, OGG
              </p>
            </div>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {editingContent ? "Actualizar" : "Crear"}
              </Button>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingContent(null);
                }}
              >
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
