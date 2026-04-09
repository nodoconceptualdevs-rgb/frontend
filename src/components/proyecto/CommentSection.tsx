"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { alerts } from "@/lib/alerts";
import { useAuth } from "@/context/AuthContext";

interface Respuesta {
  id: number;
  contenido: string;
  autor: string;
  fecha: string;
  es_cliente: boolean;
}

interface Comentario {
  id: number;
  contenido: string;
  autor: string | { id: number; name?: string; username: string; email: string; role?: { type: string } };
  fecha: string;
  es_cliente: boolean;
  rol_autor?: string;
  respuestas?: Respuesta[];
  createdAt?: string;
}

interface CommentSectionProps {
  proyectoId: number;
  comentarios: Comentario[];
  gerenteInfo: {
    nombre: string;
    email: string;
    telefono: string;
  };
}

export default function CommentSection({
  proyectoId,
  comentarios: comentariosIniciales,
  gerenteInfo,
}: CommentSectionProps) {
  const { user, isAuthenticated, isAdmin, isGerente, isCliente } = useAuth();
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comentarios, setComentarios] = useState<Comentario[]>(comentariosIniciales || []);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Determinar el rol y nombre del usuario actual
  const getCurrentUserInfo = () => {
    if (!isAuthenticated || !user) {
      return { rol: 'cliente', nombre: 'Cliente', esCliente: true, esGerente: false, esAdmin: false };
    }

    if (isAdmin) {
      return { rol: 'admin', nombre: user.username || 'Admin', esCliente: false, esGerente: false, esAdmin: true };
    }

    if (isGerente) {
      return { rol: 'gerente', nombre: user.username || 'Gerente', esCliente: false, esGerente: true, esAdmin: false };
    }

    // Cliente por defecto
    return { rol: 'cliente', nombre: user.username || 'Cliente', esCliente: true, esGerente: false, esAdmin: false };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) {
      alerts.warning('⚠️ Por favor escribe un comentario');
      return;
    }

    // Si no está autenticado, mostrar modal de confirmación
    if (!isAuthenticated) {
      setShowConfirmModal(true);
      return;
    }

    // Si está autenticado, enviar directamente
    await enviarComentario();
  };

  const enviarComentario = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    const loadingToast = alerts.loading('Enviando comentario...');
    
    try {
      const userInfo = getCurrentUserInfo();
      
      // Crear comentario en el backend con información del usuario
      const payload: any = {
        data: {
          contenido: nuevoComentario,
          proyecto: proyectoId,
          es_privado: false,
        }
      };

      // Solo agregar autor si está autenticado
      if (isAuthenticated && user) {
        payload.data.autor = user.id;
      }

      const response = await api.post('/comentarios-proyecto', payload);

      if (response.data && response.data.data) {
        // Agregar el nuevo comentario a la lista
        const nuevoComentarioData = {
          id: response.data.data.id,
          contenido: response.data.data.contenido,
          autor: isAuthenticated ? userInfo.nombre : 'Anónimo',
          fecha: response.data.data.createdAt || new Date().toISOString(),
          es_cliente: userInfo.esCliente,
          rol_autor: isAuthenticated ? userInfo.rol : 'anonimo',
          respuestas: []
        };
        
        setComentarios([nuevoComentarioData, ...comentarios]);
        setNuevoComentario("");
        alerts.dismiss();
        alerts.success('✅ Comentario enviado exitosamente');
      }
    } catch (error: any) {
      console.error('Error creando comentario:', error);
      alerts.dismiss();
      alerts.error('❌ Error al enviar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComment = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900">
          Comentarios y Consultas
        </h2>
      </div>

      {!isAuthenticated && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Nota:</strong> Estás comentando como cliente. Para identificarte mejor, inicia sesión.
          </p>
        </div>
      )}

      <p className="text-gray-600 mb-6">
        {isAuthenticated 
          ? `Comentando como: ${getCurrentUserInfo().nombre} (${getCurrentUserInfo().rol})`
          : 'Escribe tus dudas o comentarios sobre el proyecto.'}
      </p>

      {/* Formulario de nuevo comentario */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label
            htmlFor="comentario"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Escribe tu comentario:
          </label>
          <textarea
            id="comentario"
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition resize-none"
            placeholder="Ejemplo: ¿Cuándo instalarán la iluminación en la sala?"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {nuevoComentario.length} / 500 caracteres
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !nuevoComentario.trim()}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Enviando...
              </span>
            ) : (
              "Enviar Comentario"
            )}
          </button>
        </div>
      </form>

      {/* Lista de comentarios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Conversación ({comentarios.length})
        </h3>

        {comentarios.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500">
              Aún no hay comentarios. ¡Sé el primero en escribir!
            </p>
          </div>
        ) : (
          comentarios.map((comentario) => (
            <div
              key={comentario.id}
              className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition"
            >
              {/* Comentario principal */}
              <div
                className={`p-4 ${
                  comentario.es_cliente ? "bg-blue-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      comentario.es_cliente
                        ? "bg-blue-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {(() => {
                      if (typeof comentario.autor === 'string') {
                        return comentario.autor === 'Anónimo' ? '?' : comentario.autor.charAt(0).toUpperCase();
                      }
                      return (comentario.autor?.name?.charAt(0) || comentario.autor?.username?.charAt(0) || '?').toUpperCase();
                    })()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {typeof comentario.autor === 'string' 
                            ? comentario.autor 
                            : (comentario.autor?.name || comentario.autor?.username || (!comentario.autor ? 'Anónimo' : 'Usuario'))}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comentario.createdAt || comentario.fecha).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {/* Badge de rol */}
                      {(() => {
                        const autorObj = typeof comentario.autor !== 'string' ? comentario.autor : null;
                        const rolType = autorObj?.role?.type || (comentario as any).rol_autor;
                        
                        let badgeClass = 'bg-blue-100 text-blue-700';
                        let badgeText = 'Cliente';
                        
                        // Si es anónimo (sin autor)
                        if (!autorObj && typeof comentario.autor === 'string' && comentario.autor === 'Anónimo') {
                          badgeClass = 'bg-gray-100 text-gray-700';
                          badgeText = 'Anónimo';
                        } else if (rolType === 'anonimo') {
                          badgeClass = 'bg-gray-100 text-gray-700';
                          badgeText = 'Anónimo';
                        } else if (rolType === 'admin') {
                          badgeClass = 'bg-purple-100 text-purple-700';
                          badgeText = 'Admin';
                        } else if (rolType === 'gerente_de_proyecto' || rolType === 'gerente_proyecto' || rolType === 'gerente') {
                          badgeClass = 'bg-red-100 text-red-700';
                          badgeText = 'Gerente';
                        }
                        
                        return (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                            {badgeText}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-gray-700">{comentario.contenido}</p>
                  </div>
                </div>
              </div>

              {/* Respuestas */}
              {comentario.respuestas && comentario.respuestas.length > 0 && (
                <>
                  <button
                    onClick={() => toggleComment(comentario.id)}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 transition text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedComments.has(comentario.id) ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    {expandedComments.has(comentario.id) ? "Ocultar" : "Ver"}{" "}
                    {comentario.respuestas.length}{" "}
                    {comentario.respuestas.length === 1 ? "respuesta" : "respuestas"}
                  </button>

                  {expandedComments.has(comentario.id) && (
                    <div className="bg-white border-t-2 border-gray-200">
                      {comentario.respuestas.map((respuesta) => (
                        <div
                          key={respuesta.id}
                          className="p-4 pl-12 border-l-4 border-red-500"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                              {typeof respuesta.autor === 'string'
                                ? respuesta.autor.charAt(0).toUpperCase()
                                : 'G'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {respuesta.autor}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(respuesta.fecha).toLocaleDateString(
                                      "es-ES",
                                      {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </p>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  Gerente
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">
                                {respuesta.contenido}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación para usuarios no autenticados */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Confirmar Comentario
              </h3>
              <p className="text-gray-600">
                ¿Eres el cliente de este proyecto y deseas enviar este comentario?
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si eres el cliente, tu comentario será visible para el gerente del proyecto. Si prefieres identificarte mejor, puedes iniciar sesión.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarComentario}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? 'Enviando...' : 'Sí, Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
