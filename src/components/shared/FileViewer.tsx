"use client";

import React from 'react';
import { getFileIcon, formatFileSize } from '@/lib/fileUtils';

interface FileViewerProps {
  files: any[];
  title: string;
  icon?: string;
  onView?: (file: any) => void;
  onDelete?: (fileId: number) => void;
  compact?: boolean;
}

export function FileViewer({ files, title, icon, onView, onDelete, compact = false }: FileViewerProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title} ({files.length})
      </h4>
      
      {/* Modo compacto para documentos */}
      {compact ? (
        <div className="space-y-2">
          {files.map((file: any, idx: number) => (
            <FileCard key={file.id || idx} file={file} onView={onView} onDelete={onDelete} compact />
          ))}
        </div>
      ) : (
        /* Modo grid para imágenes */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {files.map((file: any, idx: number) => (
            <FileCard key={file.id || idx} file={file} onView={onView} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ file, onView, onDelete, compact }: any) {
  const isImage = file.mime?.startsWith('image/') || file.tipo === 'imagen';
  const fileIcon = getFileIcon(file);

  if (!compact && isImage) {
    // Tarjeta de imagen con preview
    return (
      <div className="group relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
        <img
          src={file.url}
          alt={file.name || 'Archivo'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center gap-2">
          {onView && (
            <button
              onClick={() => onView(file)}
              className="opacity-0 group-hover:opacity-100 transition p-2 bg-white rounded-lg"
              title="Ver archivo"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(file.id)}
              className="opacity-0 group-hover:opacity-100 transition p-2 bg-red-500 rounded-lg"
              title="Eliminar archivo"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Nombre del archivo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <p className="text-white text-xs truncate opacity-0 group-hover:opacity-100 transition">
            {file.name}
          </p>
        </div>
      </div>
    );
  }

  // Tarjeta compacta para otros archivos
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition group">
      {/* Ícono */}
      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
        {fileIcon}
      </div>
      
      {/* Info del archivo */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate text-sm">
          {file.name || 'Archivo sin nombre'}
        </p>
        <p className="text-xs text-gray-500">
          {file.size ? formatFileSize(file.size) : 'Tamaño desconocido'}
        </p>
      </div>
      
      {/* Acciones */}
      <div className="flex items-center gap-1">
        {onView && (
          <button
            onClick={() => onView(file)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Ver archivo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(file.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Visor especializado para modelos 3D
 */
export function Model3DViewer({ files, onView, onDelete }: FileViewerProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>🎮</span>
        Modelos 3D ({files.length})
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file: any, idx: number) => (
          <div key={file.id || idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 hover:shadow-lg transition">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-indigo-500 rounded-lg flex items-center justify-center text-3xl">
                🎮
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-900">{file.name}</h5>
                <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                <div className="mt-3 flex gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(file)}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                    >
                      Ver 3D
                    </button>
                  )}
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-indigo-600 text-sm rounded-lg border border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    Descargar
                  </a>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(file.id)}
                      className="px-3 py-1 text-red-600 text-sm hover:bg-red-50 rounded-lg transition"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Visor para planos arquitectónicos
 */
export function PlanoViewer({ files, onView, onDelete }: FileViewerProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>📐</span>
        Planos Arquitectónicos ({files.length})
      </h4>
      
      <div className="grid grid-cols-1 gap-4">
        {files.map((file: any, idx: number) => (
          <div key={file.id || idx} className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 border-2 border-orange-200 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
                  📐
                </div>
                <div>
                  <h5 className="font-bold text-gray-900">{file.name}</h5>
                  <p className="text-sm text-gray-600">
                    Formato: {file.name.split('.').pop()?.toUpperCase()} • {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onView && (
                  <button
                    onClick={() => onView(file)}
                    className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    title="Ver plano"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                )}
                <a
                  href={file.url}
                  download
                  className="p-2 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition"
                  title="Descargar plano"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {onDelete && (
                  <button
                    onClick={() => onDelete(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
