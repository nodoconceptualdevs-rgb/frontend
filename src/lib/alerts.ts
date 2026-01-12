/**
 * Sistema estándar de alertas para toda la aplicación
 * Usa react-hot-toast para notificaciones
 */

import toast from 'react-hot-toast';

export const alerts = {
  /**
   * Alerta de éxito
   */
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    });
  },

  /**
   * Alerta de error
   */
  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  },

  /**
   * Alerta de advertencia
   */
  warning: (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Alerta informativa
   */
  info: (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Alerta de carga (promesa)
   */
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Actualizar alerta de carga a éxito
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: 'top-right',
        style: {
          padding: '16px',
          borderRadius: '8px',
        },
        success: {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        },
      }
    );
  },

  /**
   * Cerrar todas las alertas
   */
  dismiss: () => {
    toast.dismiss();
  },
};

// Ejemplos de uso:
// alerts.success('Proyecto creado exitosamente');
// alerts.error('Error al guardar los cambios');
// alerts.warning('Este campo es requerido');
// alerts.info('Los cambios se guardarán automáticamente');
// 
// const loadingId = alerts.loading('Guardando...');
// // hacer algo
// toast.dismiss(loadingId);
// alerts.success('Guardado!');
//
// alerts.promise(
//   guardarProyecto(),
//   {
//     loading: 'Guardando proyecto...',
//     success: 'Proyecto guardado exitosamente',
//     error: 'Error al guardar el proyecto'
//   }
// );
