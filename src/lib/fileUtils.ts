// Utilidades para manejo de archivos

export type TipoArchivo = 'imagen' | 'video' | 'documento' | 'modelo3d' | 'plano' | 'audio';

// Extensiones y MIME types soportados
const FILE_TYPES = {
  imagen: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
    mimes: ['image/']
  },
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'],
    mimes: ['video/']
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac'],
    mimes: ['audio/']
  },
  modelo3d: {
    extensions: ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds', '.stl', '.ply'],
    mimes: ['model/', 'application/octet-stream'] // Para archivos 3D
  },
  plano: {
    extensions: ['.dwg', '.dxf', '.rvt', '.skp', '.ifc'], // Archivos CAD/BIM
    mimes: ['application/acad', 'application/x-dwg', 'application/dxf']
  },
  documento: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
    mimes: ['application/pdf', 'application/msword', 'application/vnd.', 'text/']
  }
};

/**
 * Determina el tipo de archivo basándose en MIME type y extensión
 */
export function determinarTipoArchivo(file: { mime?: string; name?: string }): TipoArchivo {
  const mime = file.mime?.toLowerCase() || '';
  const extension = file.name ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';

  // Verificar por MIME type
  if (mime) {
    for (const [tipo, config] of Object.entries(FILE_TYPES)) {
      if (config.mimes.some(m => mime.startsWith(m))) {
        return tipo as TipoArchivo;
      }
    }
  }

  // Verificar por extensión si no se encontró por MIME
  if (extension) {
    for (const [tipo, config] of Object.entries(FILE_TYPES)) {
      if (config.extensions.includes(extension)) {
        return tipo as TipoArchivo;
      }
    }
  }

  // Por defecto es documento
  return 'documento';
}

/**
 * Determina el tipo de archivo desde una URL o nombre de archivo
 */
export function determinarTipoDesdeURL(url: string): TipoArchivo {
  if (!url) return 'documento';

  const urlLower = url.toLowerCase();
  const extension = urlLower.match(/\.([^.]+)$/)?.[1];
  
  if (!extension) return 'documento';

  // Buscar en las extensiones configuradas
  for (const [tipo, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.some(ext => ext === `.${extension}`)) {
      return tipo as TipoArchivo;
    }
  }

  return 'documento';
}

/**
 * Obtiene el icono apropiado para el tipo de archivo
 */
export function getFileIcon(file: File | { name: string; mime?: string }): string {
  // Type guard para distinguir entre File y objeto personalizado
  const mime = 'type' in file ? file.type : file.mime;
  const tipo = determinarTipoArchivo({ 
    mime: mime, 
    name: file.name 
  });
  
  switch (tipo) {
    case 'imagen': return '📸';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'modelo3d': return '🎮';
    case 'plano': return '📐';
    default: return '📄';
  }
}

/**
 * Formatea el tamaño del archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Clasifica archivos por categoría para el backend de Strapi
 */
export function clasificarArchivos(archivos: any[]): {
  galeria_fotos: any[];
  videos_walkthrough: any[];
  documentacion: any[];
} {
  const resultado = {
    galeria_fotos: [] as any[],
    videos_walkthrough: [] as any[],
    documentacion: [] as any[]
  };

  archivos.forEach(archivo => {
    const tipo = determinarTipoArchivo(archivo);
    
    switch (tipo) {
      case 'imagen':
        resultado.galeria_fotos.push(archivo);
        break;
      case 'video':
        resultado.videos_walkthrough.push(archivo);
        break;
      default:
        // Audio, documentos, modelos 3D y planos van a documentación
        resultado.documentacion.push(archivo);
        break;
    }
  });

  return resultado;
}

/**
 * Valida si un archivo es válido para subir
 */
export function isValidFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `El archivo ${file.name} excede el tamaño máximo de 100MB` 
    };
  }
  
  // Aquí podrías agregar más validaciones
  
  return { valid: true };
}

/**
 * Agrupa archivos por tipo para mostrarlos organizados
 */
export function agruparArchivosPorTipo(archivos: any[]) {
  const grupos: Record<TipoArchivo, any[]> = {
    imagen: [],
    video: [],
    audio: [],
    modelo3d: [],
    plano: [],
    documento: []
  };

  archivos.forEach(archivo => {
    const tipo = determinarTipoArchivo(archivo);
    grupos[tipo].push(archivo);
  });

  return grupos;
}
