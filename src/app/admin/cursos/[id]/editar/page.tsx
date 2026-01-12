"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Upload,
  message,
  notification,
  Switch,
  Space,
  Tabs,
  Table,
  Modal,
  Popconfirm,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  CommentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile } from 'antd';
import {
  updateCourse,
  getContentCourses,
  createContentCourse,
  updateContentCourse,
  deleteContentCourse,
  getCourseWithPopulate,
  Course,
  ContentCourse,
} from "@/services/courses";
import {
  getCommentsByContent,
  getCommentsCountByContent,
  replyToComment,
} from "@/services/comments";
import AdminHeader from "@/components/admin/AdminHeader";
import { Avatar, Empty, Spin } from "antd";
import { UserOutlined, SendOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { TextArea } = Input;

interface LessonFormValues {
  lesson_title: string;
  order?: number; // Opcional - se calcula automáticamente
  video_url?: string;
  video_duration?: number;
}

export default function EditarCursoPage() {
  const router = useRouter();
  const params = useParams();
  const courseIdFromUrl = params.id as string; // Puede ser documentId o id numérico

  const [generalForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [courseFromList, setCourseFromList] = useState<Course | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [realCourseId, setRealCourseId] = useState<number | null>(null); // ID real del curso
  const [courseDocumentId, setCourseDocumentId] = useState<string | null>(null); // DocumentId del curso
  
  // Estados para lecciones
  const [lessons, setLessons] = useState<ContentCourse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLesson, setEditingLesson] = useState<ContentCourse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lessonComments, setLessonComments] = useState<{[key: number]: any[]}>({});
  const [loadingLessonComments, setLoadingLessonComments] = useState<{[key: number]: boolean}>({});
  const [replyText, setReplyText] = useState<{[key: number]: string}>({});
  const [sendingReply, setSendingReply] = useState<{[key: number]: boolean}>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');

  useEffect(() => {
    // Intentar obtener el curso de sessionStorage (si viene de la lista)
    if (typeof window !== 'undefined') {
      const cachedCourse = sessionStorage.getItem(`course_${courseIdFromUrl}`);
      if (cachedCourse) {
        try {
          const course = JSON.parse(cachedCourse);
          setCourseFromList(course);
          setRealCourseId(course.id); // Guardar el ID real del curso
          setCourseDocumentId(course.documentId); // Guardar el documentId del curso
          console.log('💾 DocumentId del curso capturado:', course.documentId);
          // Limpiar después de usar para no mantener datos viejos
          sessionStorage.removeItem(`course_${courseIdFromUrl}`);
        } catch (e) {
          console.error('Error parsing cached course:', e);
        }
      }
      setSessionChecked(true);
    }
  }, [courseIdFromUrl]);

  useEffect(() => {
    // Solo cargar datos si ya verificamos el sessionStorage
    if (sessionChecked) {
      loadCourseData();
    }
  }, [courseIdFromUrl, courseFromList, sessionChecked]);

  const loadCourseData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      let courseData;
      
      // Si es refresh forzado, hacer petición al backend
      if (forceRefresh) {
        console.log('🔄 Recargando lecciones desde el backend...');
        
        // Usar servicio en lugar de fetch directo
        const response = await getCourseWithPopulate(courseIdFromUrl, 'content_courses,cover') as any;
        courseData = response.data;
        setRealCourseId(courseData.id); // Guardar el ID real del curso
        setCourseDocumentId(courseData.documentId); // Guardar el documentId del curso
        
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log('%c✅ CURSO CARGADO', 'color: #4CAF50; font-size: 16px; font-weight: bold');
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log(`%c📌 ID REAL del curso: ${courseData.id}`, 'color: #2196F3; font-size: 14px; font-weight: bold');
        console.log(`%c🔑 DocumentId del curso: ${courseData.documentId}`, 'color: #9C27B0; font-size: 14px; font-weight: bold');
        console.log(`%c📝 Título: "${courseData.title}"`, 'color: #2196F3; font-size: 14px');
        console.log(`%c🔗 ID en URL: ${courseIdFromUrl}`, 'color: #FF9800; font-size: 14px');
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
      } else {
        // Usar datos del sessionStorage en la primera carga
        if (!courseFromList) {
          message.error('No se encontraron los datos del curso. Regresando...');
          router.push('/admin/cursos');
          return;
        }
        courseData = courseFromList;
        setRealCourseId(courseData.id); // Guardar el ID real del curso
        setCourseDocumentId(courseData.documentId); // Guardar el documentId del curso
        
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log('%c✅ CURSO CARGADO (desde caché)', 'color: #4CAF50; font-size: 16px; font-weight: bold');
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
        console.log(`%c📌 ID REAL del curso: ${courseData.id}`, 'color: #2196F3; font-size: 14px; font-weight: bold');
        console.log(`%c🔑 DocumentId del curso: ${courseData.documentId}`, 'color: #9C27B0; font-size: 14px; font-weight: bold');
        console.log(`%c📝 Título: "${courseData.title}"`, 'color: #2196F3; font-size: 14px');
        console.log(`%c🔗 ID en URL: ${courseIdFromUrl}`, 'color: #FF9800; font-size: 14px');
        console.log('%c========================================', 'color: #4CAF50; font-weight: bold');
      }
      
      // Establecer valores en el formulario
      generalForm.setFieldsValue({
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        isActive: courseData.isActive,
      });
      
      // Cargar lecciones
      const lessonsData = courseData.content_courses || [];
      setLessons(lessonsData);

      // Cargar conteo de comentarios para cada lección
      lessonsData.forEach((lesson: ContentCourse) => {
        loadLessonCommentsCount(lesson.id);
      });

      // Si hay una imagen de portada, mostrarla
      if (courseData.cover) {
        const coverUrl = courseData.cover?.url || courseData.cover;
        setFileList([
          {
            uid: '-1',
            name: 'Portada actual',
            status: 'done',
            url: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${coverUrl}`,
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error loading course:", error);
      
      if (error?.response?.status === 404) {
        message.error(`El curso con ID ${courseIdFromUrl} no existe o no está publicado`);
      } else if (error?.response?.status === 403) {
        message.error("No tienes permisos para ver este curso");
      } else {
        message.error(error?.message || "Error al cargar el curso");
      }
      
      // No redirigir si es un refresh, solo en carga inicial
      if (!forceRefresh) {
        router.push('/admin/cursos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      
      // Preparar los datos para actualizar
      const updateData = {
        title: values.title,
        description: values.description,
        price: values.price,
        isActive: values.isActive,
      };

      // IMPORTANTE: Usar documentId para la petición HTTP (Strapi v5)
      const docIdToUse = courseDocumentId || courseIdFromUrl;
      console.log('📝 Actualizando curso con documentId:', docIdToUse);
      
      await updateCourse(docIdToUse, updateData);
      message.success("Curso actualizado correctamente");
      await loadCourseData(true);
    } catch (error) {
      console.error("Error updating course:", error);
      message.error("Error al actualizar el curso");
    } finally {
      setSaving(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: `${process.env.NEXT_PUBLIC_API_URL}/upload`,
    headers: {
      authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} subido correctamente`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} falló al subir.`);
      }
    },
    onRemove() {
      setFileList([]);
    },
  };

  const handleVideoSelect = (file: File) => {
    // Guardar el archivo para subirlo luego
    setVideoFile(file);
    
    // Crear URL local para preview
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    
    // Obtener duración del video automáticamente
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const durationInSeconds = Math.floor(video.duration);
      
      console.log('⏱️ Duración del video capturada:', durationInSeconds, 'segundos');
      
      // Actualizar el formulario con la duración
      lessonForm.setFieldsValue({
        video_duration: durationInSeconds
      });
      
      message.success(`Video seleccionado (${Math.floor(durationInSeconds / 60)}:${(durationInSeconds % 60).toString().padStart(2, '0')})`);
    };
    
    video.onerror = () => {
      console.error('❌ Error al obtener duración del video');
      message.warning('Video seleccionado. No se pudo obtener la duración automáticamente.');
    };
    
    video.src = previewUrl;
    
    // No subir el archivo aún, solo guardarlo
    return false;
  };

  const handleSubmitLesson = async (values: LessonFormValues) => {
    try {
      setUploading(true);
      let videoData = {
        url: values.video_url,
        duration: values.video_duration,
      };

      // Si hay un nuevo video seleccionado, subirlo primero
      if (videoFile) {
        message.loading({ content: 'Subiendo video...', key: 'upload' });
        
        try {
          const formData = new FormData();
          formData.append('files', videoFile);

          const uploadResponse = await api.post<any[]>('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (uploadResponse.data && Array.isArray(uploadResponse.data) && uploadResponse.data.length > 0) {
            const uploadedFile = uploadResponse.data[0];
            videoData = {
              url: uploadedFile.url,
              duration: values.video_duration || 0, // Mantener la duración capturada automáticamente
            };
            message.success({ content: 'Video subido exitosamente', key: 'upload', duration: 2 });
          } else {
            throw new Error('No se recibió la URL del video');
          }
        } catch (uploadError: any) {
          message.error({ content: 'Error al subir el video. Intenta de nuevo.', key: 'upload' });
          console.error('Error uploading video:', uploadError);
          throw uploadError;
        }
      }

      // Crear o actualizar la lección
      message.loading({ content: editingLesson ? 'Actualizando lección...' : 'Creando lección...', key: 'save' });

      // Usar el documentId del curso (Strapi v5)
      const courseIdentifier = courseDocumentId || courseIdFromUrl;
      
      console.log('🔑 ID del curso desde URL:', courseIdFromUrl);
      console.log('🔑 ID real del curso:', realCourseId);
      console.log('🔑 DocumentId del curso:', courseDocumentId);
      console.log('🔑 Identificador a usar (documentId):', courseIdentifier);
      
      // Verificación de seguridad
      if (!courseIdentifier) {
        message.error('Error: No se pudo determinar el identificador del curso. Intenta recargar la página.');
        throw new Error('courseIdentifier inválido');
      }
      
      const payload = {
        lesson_title: values.lesson_title,
        video_url: videoData.url,
        video_duration: videoData.duration,
        course: courseIdentifier, // ENVIAR DOCUMENTID, no ID numérico
      };
      
      // Log de depuración para verificar el payload
      console.log('📤 Payload a enviar:', payload);
      console.log('📝 Course Identifier (documentId):', courseIdentifier, 'Tipo:', typeof courseIdentifier);
      console.log('✅ Enviando documentId del curso para que el backend lo convierta al ID real');

      try {
        if (editingLesson) {
          await updateContentCourse(editingLesson.id, payload);
          
          // NOTIFICACIÓN GRANDE Y VISIBLE DE ÉXITO
          notification.success({
            message: '✅ ¡Éxito!',
            description: 'La lección se actualizó correctamente',
            placement: 'topRight',
            duration: 4,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            style: {
              width: 400,
              backgroundColor: '#f6ffed',
              border: '2px solid #52c41a'
            }
          });
        } else {
          await createContentCourse(payload);
          
          // NOTIFICACIÓN GRANDE Y VISIBLE DE ÉXITO
          notification.success({
            message: '✅ ¡Lección Creada!',
            description: 'La lección se creó exitosamente y ya está disponible',
            placement: 'topRight',
            duration: 4,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            style: {
              width: 400,
              backgroundColor: '#f6ffed',
              border: '2px solid #52c41a'
            }
          });
        }

        // Cerrar modal y limpiar formulario
        setModalVisible(false);
        lessonForm.resetFields();
        setEditingLesson(null);
        if (videoPreview && videoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(videoPreview);
        }
        setVideoPreview(null);
        setVideoFile(null);
        
        // Agregar la nueva lección a la lista sin recargar la página
        // Esto permite que la notificación sea visible
        if (!editingLesson) {
          // Para nueva lección, hacer una petición rápida para obtener la lista actualizada
          // IMPORTANTE: SIEMPRE usar documentId, NO ID numérico (Strapi v5)
          const docIdToUse = courseDocumentId || courseIdFromUrl;
          try {
            console.log('🔄 Actualizando lista de lecciones usando DOCUMENTID:', docIdToUse);
            
            // Usar servicio en lugar de fetch directo
            const response = await getCourseWithPopulate(docIdToUse, 'content_courses') as any;
            console.log('✅ Lecciones actualizadas:', response.data.content_courses?.length || 0);
            console.log('✅ Número de lecciones en el curso:', response.data.number_lessons);
            setLessons(response.data.content_courses || []);
          } catch (error) {
            console.error('❌ Error al actualizar lista de lecciones:', error);
          }
        } else {
          // Si es edición, actualizar la lección en la lista local
          setLessons(lessons.map(lesson => 
            lesson.id === editingLesson.id 
              ? { ...lesson, ...payload }
              : lesson
          ));
        }
      } catch (saveError: any) {
        console.error('❌ Error completo al guardar lección:', saveError);
        console.error('❌ Response:', saveError?.response);
        console.error('❌ Response data:', saveError?.response?.data);
        
        // Intentar extraer el mensaje de error de diferentes formatos posibles
        let errorMsg = "Error desconocido al guardar la lección";
        
        if (saveError?.response?.data?.error?.message) {
          // Formato Strapi v4/v5: { error: { message: "..." } }
          errorMsg = saveError.response.data.error.message;
        } else if (saveError?.response?.data?.message) {
          // Formato alternativo: { message: "..." }
          errorMsg = saveError.response.data.message;
        } else if (typeof saveError?.response?.data === 'string') {
          // Mensaje de error directo como string
          errorMsg = saveError.response.data;
        } else if (saveError?.message) {
          // Mensaje de error de axios
          errorMsg = saveError.message;
        }
        
        console.error('❌ Mensaje de error extraído:', errorMsg);
        
        // NOTIFICACIÓN GRANDE Y VISIBLE DE ERROR
        notification.error({
          message: '❌ Error al Guardar',
          description: `No se pudo ${editingLesson ? 'actualizar' : 'crear'} la lección: ${errorMsg}`,
          placement: 'topRight',
          duration: 8,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          style: {
            width: 500,
            backgroundColor: '#fff2f0',
            border: '2px solid #ff4d4f'
          }
        });
        
        throw saveError;
      }
    } catch (error: any) {
      console.error("Error in handleSubmitLesson:", error);
      // El error ya fue manejado arriba con mensajes específicos
    } finally {
      setUploading(false);
    }
  };

  const handleEditLesson = (lesson: ContentCourse) => {
    setEditingLesson(lesson);
    const videoUrl = (lesson as any).video_url;
    lessonForm.setFieldsValue({
      lesson_title: lesson.lesson_title,
      video_url: videoUrl,
      video_duration: (lesson as any).video_duration,
    });
    if (videoUrl) {
      setVideoPreview(videoUrl);
    }
    setModalVisible(true);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await deleteContentCourse(lessonId);
      message.success("Lección eliminada exitosamente");
      await loadCourseData(true);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      message.error("Error al eliminar la lección");
    }
  };

  // Cargar solo el conteo de comentarios (para los badges)
  const loadLessonCommentsCount = async (lessonId: number) => {
    try {
      // Usar servicio en lugar de fetch directo
      const count = await getCommentsCountByContent(lessonId);
      // Mantener compatibilidad con estado actual
      setLessonComments(prev => ({
        ...prev,
        [lessonId]: prev[lessonId] || Array(count).fill({})
      }));
    } catch (error) {
      console.error("Error loading comments count:", error);
    }
  };

  // Cargar comentarios de una lección específica
  const loadLessonComments = async (lessonId: number) => {
    setLoadingLessonComments(prev => ({ ...prev, [lessonId]: true }));
    try {
      // Usar servicio en lugar de fetch directo
      const response = await getCommentsByContent(lessonId) as any;
      setLessonComments(prev => ({ ...prev, [lessonId]: response.data || [] }));
    } catch (error) {
      console.error("Error loading comments:", error);
      message.error("Error al cargar comentarios");
    } finally {
      setLoadingLessonComments(prev => ({ ...prev, [lessonId]: false }));
    }
  };

  // Enviar respuesta a una lección
  const handleSendReply = async (lessonId: number) => {
    if (!replyText[lessonId]?.trim()) {
      message.warning("Escribe una respuesta");
      return;
    }

    setSendingReply(prev => ({ ...prev, [lessonId]: true }));
    try {
      // Usar servicio en lugar de fetch directo
      await replyToComment(
        0, // parentCommentId - 0 significa que es un comentario nuevo, no respuesta
        replyText[lessonId],
        lessonId
      );
      
      message.success("Respuesta enviada");
      setReplyText(prev => ({ ...prev, [lessonId]: "" }));
      
      // Recargar comentarios para actualizar la UI y el contador
      await loadLessonComments(lessonId);
      await loadLessonCommentsCount(lessonId);
    } catch (error) {
      console.error("Error sending reply:", error);
      message.error("Error al enviar respuesta");
    } finally {
      setSendingReply(prev => ({ ...prev, [lessonId]: false }));
    }
  };

  // Renderizar fila expandida con comentarios
  const expandedRowRender = (record: ContentCourse) => {
    const comments = lessonComments[record.id] || [];
    const isLoading = loadingLessonComments[record.id];
    const isSending = sendingReply[record.id];
    const text = replyText[record.id] || "";

    return (
      <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '16px', color: '#666' }}>
          Comentarios de la lección
        </h4>
        
        {/* Lista de comentarios */}
        <div style={{ marginBottom: '16px', maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment: any) => (
              <div 
                key={comment.id} 
                style={{ 
                  marginBottom: '12px', 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Avatar 
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: comment.is_admin_reply ? '#dc2626' : '#1890ff',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>
                        {comment.user?.username || 'Usuario'}
                      </span>
                      {comment.is_admin_reply && (
                        <Tag color="red" style={{ fontSize: '10px', margin: 0 }}>Instructor</Tag>
                      )}
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty 
              description="No hay comentarios aún"
              image={<CommentOutlined style={{ fontSize: 32, color: '#d0d0d0' }} />}
            />
          )}
        </div>

        {/* Input para responder */}
        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
          <Input.TextArea
            placeholder="Responde a los estudiantes..."
            value={text}
            onChange={(e) => setReplyText(prev => ({ ...prev, [record.id]: e.target.value }))}
            rows={2}
            style={{ marginBottom: '8px', resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSendReply(record.id)}
            loading={isSending}
            style={{ 
              background: '#f5b940', 
              borderColor: '#f5b940', 
              color: '#222',
              fontWeight: '600'
            }}
          >
            Enviar Respuesta
          </Button>
        </div>
      </div>
    );
  };

  const lessonColumns = [
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
      key: "video_status",
      width: 150,
      render: (_: unknown, record: any) => {
        const videoUrl = record.video_url || record.video_lesson_url?.url;
        const duration = record.video_duration;
        return (
          <Space direction="vertical" size="small">
            {videoUrl ? (
              <>
                <Button
                  type="primary"
                  icon={<VideoCameraOutlined />}
                  size="small"
                  onClick={() => {
                    setCurrentVideoUrl(videoUrl);
                    setCurrentVideoTitle(record.lesson_title);
                    setVideoModalVisible(true);
                  }}
                  style={{
                    background: '#8b5cf6',
                    borderColor: '#8b5cf6',
                  }}
                >
                  Ver Video
                </Button>
              
              </>
            ) : (
              <Tag>Sin video</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: 250,
      render: (_: unknown, record: ContentCourse) => {
        const commentsCount = lessonComments[record.id]?.length || 0;
        const isExpanded = expandedRowKeys.includes(record.id);
        
        return (
          <Space>
            <Button
              type="text"
              icon={<CommentOutlined />}
              onClick={() => {
                if (isExpanded) {
                  setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
                } else {
                  setExpandedRowKeys([...expandedRowKeys, record.id]);
                  loadLessonComments(record.id);
                }
              }}
              style={{ padding: '4px 8px' }}
            >
              ({commentsCount})
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditLesson(record)}
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
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: "Información General",
      children: (
        <Form
          form={generalForm}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
            <Form.Item
              name="title"
              label="Título del Curso"
              rules={[
                { required: true, message: "El título es requerido" },
                { min: 3, message: "El título debe tener al menos 3 caracteres" },
              ]}
            >
              <Input
                placeholder="Ej: Curso de React Avanzado"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Descripción"
              rules={[
                { required: true, message: "La descripción es requerida" },
                { min: 10, message: "La descripción debe tener al menos 10 caracteres" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe el contenido y objetivos del curso..."
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="price"
                label="Precio ($)"
                rules={[
                  { required: true, message: "El precio es requerido" },
                  { type: 'number', min: 0, message: "El precio no puede ser negativo" },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                  placeholder="0.00"
                  size="large"
                />
              </Form.Item>

            </div>

            <Form.Item
              name="isActive"
              label="Estado del Curso"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Activo"
                unCheckedChildren="Inactivo"
              />
            </Form.Item>

            <Form.Item
              label="Imagen de Portada"
            >
              <Upload
                {...uploadProps}
                listType="picture"
                fileList={fileList}
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>
                  Cambiar Portada
                </Button>
              </Upload>
              <p className="text-gray-500 text-sm mt-2">
                Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
              </p>
            </Form.Item>

          <Form.Item style={{ marginTop: "32px" }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
              style={{
                background: "#f5b940",
                borderColor: "#f5b940",
                color: "#222",
                fontWeight: 600,
              }}
            >
              Guardar Cambios
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: "Lecciones y Contenido",
      children: (
        <div>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
            <h3>Gestiona las lecciones y videos del curso</h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingLesson(null);
                lessonForm.resetFields();
                setVideoPreview(null);
                setVideoFile(null);
                setModalVisible(true);
              }}
              style={{
                background: "#f5b940",
                borderColor: "#f5b940",
                color: "#222",
              }}
            >
              Nueva Lección
            </Button>
          </div>
          <Table
            columns={lessonColumns}
            dataSource={lessons}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpand: (expanded, record) => {
                if (expanded) {
                  setExpandedRowKeys([...expandedRowKeys, record.id]);
                  loadLessonComments(record.id);
                } else {
                  setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
                }
              },
              showExpandColumn: false,
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        titulo="Editar Curso"
        subtitulo="Gestiona toda la información y contenido del curso"
      />

      <main className="px-8 py-8">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/cursos')}
          style={{ marginBottom: "24px" }}
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

        {/* Modal para Crear/Editar Lección */}
        <Modal
          title={editingLesson ? "Editar Lección" : "Nueva Lección"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            lessonForm.resetFields();
            setEditingLesson(null);
            if (videoPreview && videoPreview.startsWith('blob:')) {
              URL.revokeObjectURL(videoPreview);
            }
            setVideoPreview(null);
            setVideoFile(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={lessonForm}
            layout="vertical"
            onFinish={handleSubmitLesson}
          >
            <Form.Item
              name="lesson_title"
              label="Título de la Lección"
              rules={[{ required: true, message: "El título es requerido" }]}
            >
              <Input placeholder="Ej: Introducción al curso" size="large" />
            </Form.Item>

            {/* Campos ocultos para datos automáticos */}
            <Form.Item name="video_url" hidden>
              <Input type="hidden" />
            </Form.Item>
            <Form.Item name="video_duration" hidden>
              <Input type="hidden" />
            </Form.Item>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Subir Video
              </label>
              <Upload
                accept="video/*"
                beforeUpload={handleVideoSelect}
                showUploadList={false}
              >
                <Button 
                  icon={<UploadOutlined />}
                  loading={uploading}
                  block
                  size="large"
                >
                  {uploading ? 'Guardando...' : 'Seleccionar Video'}
                </Button>
              </Upload>
              <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                Formatos soportados: MP4, WebM, OGG. El video se subirá al guardar la lección.
              </p>
              
              {videoPreview && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontWeight: '500', marginBottom: '8px' }}>Previsualización:</p>
                  <video 
                    src={videoPreview} 
                    controls 
                    style={{ 
                      width: '100%', 
                      maxHeight: '300px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                </div>
              )}
            </div>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={uploading}
                  disabled={uploading}
                >
                  {uploading ? (videoFile ? 'Subiendo video y creando...' : 'Creando...') : (editingLesson ? "Actualizar" : "Crear")}
                </Button>
                <Button 
                  onClick={() => {
                    setModalVisible(false);
                    lessonForm.resetFields();
                    setEditingLesson(null);
                    if (videoPreview && videoPreview.startsWith('blob:')) {
                      URL.revokeObjectURL(videoPreview);
                    }
                    setVideoPreview(null);
                    setVideoFile(null);
                  }}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal para visualizar video */}
        <Modal
          title={currentVideoTitle || "Video de la Lección"}
          open={videoModalVisible}
          onCancel={() => {
            setVideoModalVisible(false);
            setCurrentVideoUrl(null);
            setCurrentVideoTitle('');
          }}
          footer={null}
          width={800}
          centered
        >
          {currentVideoUrl && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <video
                src={currentVideoUrl}
                controls
                autoPlay
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
