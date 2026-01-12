import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ProyectoCardProps {
  proyecto: {
    id: number;
    nombre_proyecto: string;
    estado_general: string;
    ultimo_avance?: string;
    fecha_inicio: string;
    token_nfc: string;
    progreso?: number;
    es_publico?: boolean;
    cliente?: {
      name?: string;
      username?: string;
      email?: string;
    };
    gerente_proyecto?: {
      name?: string;
      username?: string;
    };
    hitos?: Array<{
      estado_completado: boolean;
    }>;
  };
  isAdmin?: boolean;
  isGerente?: boolean;
  isCliente?: boolean;
  editRoute?: string;
}

export default function ProyectoCard({ proyecto, isAdmin, isGerente, isCliente, editRoute }: ProyectoCardProps) {
  const router = useRouter();
  const [showToken, setShowToken] = useState(false);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "En Planificación":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "En Ejecución":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Completado":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const calcularProgreso = () => {
    if (proyecto.progreso !== undefined) return proyecto.progreso;
    if (!proyecto.hitos || proyecto.hitos.length === 0) return 0;
    const completados = proyecto.hitos.filter((h) => h.estado_completado).length;
    return Math.round((completados / proyecto.hitos.length) * 100);
  };

  const progreso = calcularProgreso();
  const clienteNombre = proyecto.cliente?.name || proyecto.cliente?.username || proyecto.cliente?.email || "Sin cliente asignado";
  const gerenteNombre = proyecto.gerente_proyecto?.name || proyecto.gerente_proyecto?.username || "Sin gerente";

  const handleEdit = () => {
    // Si es cliente, abrir en nueva pestaña
    if (isCliente) {
      window.open(`/proyecto/${proyecto.token_nfc}`, "_blank");
      return;
    }
    
    if (editRoute) {
      router.push(editRoute);
    } else if (isAdmin || isGerente) {
      const route = isAdmin ? `/admin/proyectos/${proyecto.id}` : `/dashboard/mi-proyecto/${proyecto.id}`;
      router.push(route);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group cursor-pointer"
      onClick={handleEdit}
    >
      {/* Header del Card */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition line-clamp-2">
                {proyecto.nombre_proyecto}
              </h3>
              {/* Indicador de privacidad */}
              <span 
                className={`text-xs font-medium px-2 py-0.5 rounded ${proyecto.es_publico !== false ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-purple-100 text-purple-800 border border-purple-300'}`}
                title={proyecto.es_publico !== false ? "Proyecto público" : "Proyecto privado"}
              >
                {proyecto.es_publico !== false ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Público
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Privado
                  </span>
                )}
              </span>
            </div>
       
          </div>
        </div>

        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(
            proyecto.estado_general
          )}`}
        >
          {proyecto.estado_general}
        </span>
      </div>

      {/* Progress */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            Progreso
          </span>
          <span className="text-sm font-bold text-red-600">
            {progreso}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-6 py-4 space-y-3">

        {/* Token NFC - Visible para todos */}
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          {/* Título con icono */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h4 className="font-bold text-gray-900">Token del Proyecto</h4>
          </div>

          {/* Token con botón de copiar y toggle */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={showToken ? proyecto.token_nfc : "••••••••••••"}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(proyecto.token_nfc);
              }}
              className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
              title="Copiar token"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowToken(!showToken);
              }}
              className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
              title={showToken ? "Ocultar token" : "Mostrar token"}
            >
              {showToken ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Link de Vista del Cliente */}
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-900 mb-1">Link de Vista del Cliente:</p>
                <a
                  href={`${window.location.origin}/proyecto/${proyecto.token_nfc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {`${window.location.origin}/proyecto/${proyecto.token_nfc}`}
                </a>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/proyecto/${proyecto.token_nfc}`);
                }}
                className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition flex-shrink-0"
              >
                Copiar Link
              </button>
            </div>
            <p className="text-xs text-green-800 flex items-start gap-1">
              <span>👆</span>
              <span>Click en el link para probar la vista del cliente o copia el link completo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100">
        {isCliente ? (
          // Cliente: Un solo botón centrado
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="w-full px-6 py-3 bg-red-600 text-white text-base font-bold rounded-lg hover:bg-red-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Ver Mi Proyecto
          </button>
        ) : (
          // Admin y Gerente: Dos botones
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isAdmin) {
                  window.open(`/proyecto/${proyecto.token_nfc}`, "_blank");
                } else {
                  router.push(`/proyecto/${proyecto.token_nfc}`);
                }
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-red-600 hover:text-red-600 transition"
            >
              Vista Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
