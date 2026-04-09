"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, List, Button, Input, Avatar, message, Spin, Empty, Tabs, Tag, Progress } from "antd";
import { 
  PlayCircleOutlined, 
  CommentOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LockOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { getCourseByDocumentId, ContentCourse } from "@/services/courses";
import { getMisCursosComprados } from "@/services/transactions";
import { useAuth } from "@/context/AuthContext";
import CommentsSection from "@/components/comments/CommentsSection";
import { 
  getCommentsByContent, 
  createComment, 
  replyToComment,
  Comment 
} from "@/services/comments";

interface ExtendedContentCourse extends ContentCourse {
  video_url?: string;
  comments?: Comment[];
  completed?: boolean;
  video_duration?: number;
}

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseDocumentId = params.id as string;
  
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<ExtendedContentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ExtendedContentCourse | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    checkAccessAndLoadCourse();
  }, [courseDocumentId, user]);

  const checkAccessAndLoadCourse = async () => {
    if (!user) {
      message.error("Debes iniciar sesión");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      
      // Verificar si el usuario ha comprado el curso
      const purchasedCourses = await getMisCursosComprados();
      const hasPurchased = purchasedCourses.some((c: any) => c.documentId === courseDocumentId);
      
      if (!hasPurchased) {
        setHasAccess(false);
        message.warning("No tienes acceso a este curso");
        return;
      }

      setHasAccess(true);
      
      // Cargar datos del curso
      const response = await getCourseByDocumentId(courseDocumentId) as any;
      
      // Manejar ambos formatos: { data: Course } o directamente Course
      const courseData = response?.data || response;
      
      if (!courseData || !courseData.id) {
        throw new Error('Curso no encontrado');
      }
      
      setCourse(courseData);
      
      // Ordenar contenidos por orden
      const sortedContents = (courseData.content_courses || []).sort(
        (a: ExtendedContentCourse, b: ExtendedContentCourse) => a.order - b.order
      );
      setContents(sortedContents);
      
      // NO seleccionar automáticamente - mostrar overview primero
    } catch (error: any) {
      console.error("Error loading course:", error);
      
      if (error?.response?.status === 404) {
        message.error("El curso no existe o fue eliminado");
        router.push('/dashboard/cursos');
      } else if (error?.response?.status === 403) {
        message.error("No tienes permisos para ver este curso");
      } else {
        message.error("Error al cargar el curso");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectContent = async (content: ExtendedContentCourse) => {
    setSelectedContent(content);
    await loadComments(content.id);
  };

  const loadComments = async (contentId: number) => {
    try {
      setLoadingComments(true);
      const response = await getCommentsByContent(contentId) as any;
      const commentsData = response.data || [];
      
      // Filtrar solo comentarios principales (sin parent_comment)
      const mainComments = commentsData.filter((c: Comment) => !c.parent_comment);
      setComments(mainComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      // No mostrar error para no interrumpir la experiencia
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) {
      message.warning("Por favor escribe un comentario");
      return;
    }

    if (!selectedContent) return;

    try {
      setSendingComment(true);
      
      await createComment({
        content: commentText,
        content_course: selectedContent.id,
      });
      
      message.success("Comentario enviado");
      setCommentText("");
      
      // Recargar comentarios
      await loadComments(selectedContent.id);
    } catch (error) {
      console.error("Error sending comment:", error);
      message.error("Error al enviar el comentario");
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <Empty
            image={<LockOutlined style={{ fontSize: 64, color: '#999' }} />}
            description={
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  No tienes acceso a este curso
                </h3>
                <p className="text-gray-600">
                  Debes comprar este curso para ver su contenido
                </p>
              </div>
            }
          >
            <Button 
              type="primary"
              onClick={() => router.push("/dashboard/cursos")}
            >
              Ver mis cursos
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  // Vista de Overview (sin lección seleccionada)
  if (!selectedContent) {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ maxWidth: '100%', padding: 'clamp(12px, 3vw, 24px)' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/dashboard/cursos")}
            style={{ marginBottom: '24px' }}
          >
            Volver a mis cursos
          </Button>

          {/* Hero Section */}
          <Card style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 'bold', marginBottom: '16px', color: '#222' }}>
              {course?.title}
            </h1>
            
            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <Tag icon={<BookOutlined />} color="blue">
                {contents.length} clases
              </Tag>
              
              <Tag icon={<ClockCircleOutlined />} color="green">
                {Math.floor((contents.length * 10) / 60)} horas de contenido
              </Tag>
            </div>

            {/* Descripción */}
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#666', marginBottom: '0' }}>
              {course?.description}
            </p>
          </Card>

          {/* Portada */}
          {course?.cover && (
            <Card style={{ marginBottom: '24px', padding: 0 }} bodyStyle={{ padding: 0 }}>
              <img 
                src={`https://backend-production-2ce7.up.railway.app${course.cover.url || course.cover}`}
                alt={course.title}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </Card>
          )}

          {/* Lista de Clases */}
          <Card>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#222' }}>
              Clases del curso
            </h2>
            
            <List
              dataSource={contents}
              renderItem={(content, index) => (
                <Card
                  key={content.id}
                  hoverable
                  onClick={() => selectContent(content)}
                  style={{
                    marginBottom: '12px',
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: content.completed ? '#10b981' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: content.completed ? 'white' : '#666'
                      }}
                    >
                      {content.completed ? <CheckCircleOutlined /> : index + 1}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '500', color: '#222', marginBottom: '4px' }}>
                        {content.lesson_title}
                      </div>
                      {content.completed && (
                        <Tag color="success" style={{ fontSize: '11px' }}>Completado</Tag>
                      )}
                    </div>
                    
                    {content.video_duration && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
                        <ClockCircleOutlined />
                        <span>{Math.floor(content.video_duration / 60)}:{(content.video_duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    )}
                    
                    <PlayCircleOutlined style={{ fontSize: '24px', color: '#f5b940' }} />
                  </div>
                </Card>
              )}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Vista de Player (con lección seleccionada)
  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header fijo */}
      <div style={{ 
        background: 'white', 
        padding: '12px clamp(12px, 3vw, 24px)', 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setSelectedContent(null)}
            size="small"
          >
            Volver
          </Button>
          <span style={{ color: '#222', fontSize: '13px', fontWeight: '500' }}>
            Clase {selectedContent.order} de {contents.length}
          </span>
          <span style={{ color: '#999', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>• {course?.title}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={<BookOutlined />}
            onClick={() => setSelectedContent(null)}
            size="small"
          >
            Ver clases
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              const currentIndex = contents.findIndex(c => c.id === selectedContent.id);
              if (currentIndex < contents.length - 1) {
                selectContent(contents[currentIndex + 1]);
              }
            }}
            disabled={contents.findIndex(c => c.id === selectedContent.id) === contents.length - 1}
            style={{ background: '#f5b940', borderColor: '#f5b940' }}
          >
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Contenido Principal - Layout responsive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) min(450px, 100%)', flex: 1, minHeight: 0, gap: '1px', background: '#e0e0e0' }} className="course-player-grid">
        <style>{`
          @media (max-width: 1024px) {
            .course-player-grid {
              grid-template-columns: 1fr !important;
              height: auto !important;
            }
          }
        `}</style>
        {/* Columna 1: Video Player + Descripción */}
        <div style={{ background: 'white', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Video Player */}
          <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedContent?.video_url ? (
              <video
                controls
                style={{ width: '100%', height: '100%' }}
                key={selectedContent.video_url}
              >
                <source src={selectedContent.video_url} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>
                <VideoCameraOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                <div>Video no disponible</div>
              </div>
            )}
          </div>

          {/* Título y Descripción */}
          <div style={{ padding: 'clamp(12px, 3vw, 24px)' }}>
            <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', marginBottom: '16px', color: '#222' }}>
              {selectedContent.lesson_title}
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              En esta lección aprenderás sobre {selectedContent.lesson_title.toLowerCase()}. 
              Sigue el video paso a paso y no olvides hacer las prácticas correspondientes.
            </p>
          </div>
        </div>

        {/* Columna 2: Tabs con Contenido y Comentarios */}
        <div style={{ background: 'white', display: 'flex', flexDirection: 'column' }}>
          <Tabs
            defaultActiveKey="content"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            items={[
              {
                key: 'content',
                label: (
                <span style={{ marginLeft: 12 }}>Contenido del curso</span>),
                children: (
                  <div style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                    <List
                      dataSource={contents}
                      renderItem={(content) => (
                        <div
                          key={content.id}
                          onClick={() => selectContent(content)}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            background: selectedContent?.id === content.id ? '#f0f9ff' : 'transparent',
                            borderLeft: selectedContent?.id === content.id ? '3px solid #f5b940' : '3px solid transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedContent?.id !== content.id) {
                              e.currentTarget.style.background = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedContent?.id !== content.id) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: content.completed ? '#10b981' : '#e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              color: content.completed ? 'white' : '#666',
                              flexShrink: 0
                            }}>
                              {content.completed ? <CheckCircleOutlined /> : content.order}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                color: selectedContent?.id === content.id ? '#222' : '#666',
                                fontSize: '14px',
                                fontWeight: selectedContent?.id === content.id ? '600' : '400',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {content.lesson_title}
                              </div>
                              {content.video_duration && (
                                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                  {Math.floor(content.video_duration / 60)}:{(content.video_duration % 60).toString().padStart(2, '0')} min
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )
              },
              {
                key: 'comments',
                label: 'Comentarios',
                children: selectedContent ? (
                  <div style={{ paddingLeft: '16px' }}>
                    <CommentsSection
                      entityType="lesson"
                      entityId={selectedContent.id}
                      userRole="client"
                      height="calc(100vh - 160px)"
                    />
                  </div>
                ) : null
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
