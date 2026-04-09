'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { FaSync } from "react-icons/fa";
import styles from './TransitionOverlay.module.css';

interface TransitionOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function TransitionOverlay({ isVisible, onComplete }: TransitionOverlayProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${theme === 'bynodo' ? styles.dark : styles.light}`}>
      <div className={styles.content}>
        <FaSync className={styles.spinner} />
        <h2 className={styles.text}>
          {theme === 'nodo' ? 'Cargando BYNODO...' : 'Volviendo a Nodo Conceptual...'}
        </h2>
      </div>
    </div>
  );
}
