"use client";

import React, { useState } from "react";

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
  autor: string;
  fecha: string;
  es_cliente: boolean;
  respuestas?: Respuesta[];
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
  comentarios,
  gerenteInfo,
}: CommentSectionProps) {
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setIsSubmitting(true);
    
    // TODO: Aquí iría la llamada al backend
    // await crearComentario(proyectoId, nuevoComentario);
    
    // Simulamos el envío
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    alert("¡Comentario enviado! El gerente de proyecto responderá pronto.");
    setNuevoComentario("");
    setIsSubmitting(false);
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

      <p className="text-gray-600 mb-6">
        Escribe tus dudas o comentarios sobre el proyecto. {gerenteInfo.nombre} te
        responderá lo antes posible.
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
                    {comentario.autor.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {comentario.autor}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comentario.fecha).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!comentario.es_cliente && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          Gerente
                        </span>
                      )}
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
                              {respuesta.autor.charAt(0).toUpperCase()}
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
    </div>
  );
}
