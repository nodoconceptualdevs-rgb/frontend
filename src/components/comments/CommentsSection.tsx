"use client";

import React, { useState, useEffect } from 'react';
import { List, Avatar, Empty, Spin, Input, Button, Tag, message } from 'antd';
import { SendOutlined, UserOutlined, CommentOutlined } from '@ant-design/icons';
import api from '@/lib/api';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  is_admin_reply?: boolean;
  user?: {
    username: string;
    id: number;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  entityType: 'course' | 'lesson';
  entityId: number;
  userRole: 'admin' | 'gerente' | 'client';
  height?: string;
}

export default function CommentsSection({ 
  entityType, 
  entityId, 
  userRole,
  height = 'calc(100vh - 300px)'
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadComments();
    }
  }, [entityId]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      
      // Construir query según el tipo de entidad
      const filterField = entityType === 'course' ? 'course' : 'content_course';
      const response = await api.get(
        `/comments?filters[${filterField}][id][$eq]=${entityId}&populate=*&sort=createdAt:desc`
      );
      
      setComments((response.data as any).data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      message.error("Error al cargar comentarios");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) {
      message.warning("Escribe un comentario");
      return;
    }

    try {
      setSendingComment(true);
      
      // Preparar datos según tipo de entidad
      const commentData: any = {
        content: commentText,
      };
      
      if (entityType === 'course') {
        commentData.course = entityId;
      } else {
        commentData.content_course = entityId;
      }
      
      // Si es admin o gerente, marcar como respuesta de instructor
      if (userRole === 'admin' || userRole === 'gerente') {
        commentData.is_admin_reply = true;
      }
      
      const response = await api.post('/comments', { data: commentData });

      if (response.status === 200 || response.status === 201) {
        message.success("Comentario enviado");
        setCommentText("");
        loadComments();
      } else {
        console.error("Error response:", response.data);
        message.error("Error al enviar comentario");
      }
    } catch (error) {
      console.error("Error sending comment:", error);
      message.error("Error al enviar comentario");
    } finally {
      setSendingComment(false);
    }
  };

  const getPlaceholder = () => {
    if (userRole === 'admin' || userRole === 'gerente') {
      return "Responde a los estudiantes...";
    }
    return "Escribe tu comentario o pregunta...";
  };

  const renderComment = (comment: Comment) => (
    <div 
      key={comment.id} 
      style={{ 
        marginBottom: '16px', 
        background: 'white', 
        padding: '16px', 
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
            <span style={{ color: '#222', fontSize: '14px', fontWeight: '500' }}>
              {comment.user?.username || 'Usuario'}
            </span>
            {comment.is_admin_reply && (
              <Tag color="red" style={{ fontSize: '10px', margin: 0 }}>Instructor</Tag>
            )}
            <span style={{ color: '#999', fontSize: '12px' }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            {comment.content}
          </div>
          
          {/* Respuestas anidadas */}
          {comment.replies && comment.replies.length > 0 && (
            <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '3px solid #e0e0e0' }}>
              {comment.replies.map((reply) => (
                <div 
                  key={reply.id} 
                  style={{ 
                    marginBottom: '8px', 
                    background: '#f9f9f9', 
                    padding: '8px', 
                    borderRadius: '6px' 
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#dc2626' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#222', fontSize: '13px', fontWeight: '500' }}>
                          {reply.user?.username || 'Usuario'}
                        </span>
                        {reply.is_admin_reply && (
                          <Tag color="red" style={{ fontSize: '10px', margin: 0 }}>Instructor</Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {reply.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Lista de comentarios */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px', 
        background: '#fafafa', 
        borderRadius: '8px 8px 0 0',
        border: '1px solid #e0e0e0'
      }}>
        {loadingComments ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : comments.length > 0 ? (
          <List dataSource={comments} renderItem={renderComment} />
        ) : (
          <Empty
            description="No hay comentarios aún"
            image={<CommentOutlined style={{ fontSize: 48, color: '#d0d0d0' }} />}
            style={{ marginTop: '40px' }}
          />
        )}
      </div>

      {/* Input para comentar - fijo abajo */}
      <div style={{ 
        padding: '16px', 
        background: 'white', 
        borderRadius: '0 0 8px 8px',
        border: '1px solid #e0e0e0',
        borderTop: '1px solid #e0e0e0'
      }}>
        <Input.TextArea
          placeholder={getPlaceholder()}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          style={{ marginBottom: '8px', resize: 'none' }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendComment();
            }
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendComment}
          loading={sendingComment}
          block
          style={{ 
            background: '#f5b940', 
            borderColor: '#f5b940', 
            color: '#222', 
            fontWeight: '600' 
          }}
        >
          Enviar Comentario
        </Button>
      </div>
    </div>
  );
}
