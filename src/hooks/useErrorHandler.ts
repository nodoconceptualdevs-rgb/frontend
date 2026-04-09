import { useCallback } from "react";
import { message } from "antd";

interface ErrorHandlerOptions {
  showMessage?: boolean;
  defaultMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { showMessage = true, defaultMessage = "Ha ocurrido un error" } = options;

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    // En producción, enviaríamos el error a un servicio de logging
    // Por ahora, solo mostramos el mensaje al usuario
    
    const errorMessage = customMessage || 
      (error instanceof Error ? error.message : defaultMessage);
    
    if (showMessage) {
      message.error(errorMessage);
    }
    
    // En desarrollo, podrías mantener un log silencioso
    if (process.env.NODE_ENV === "development") {
      // Solo en desarrollo, no en producción
    }
    
    return errorMessage;
  }, [showMessage, defaultMessage]);

  return { handleError };
}
