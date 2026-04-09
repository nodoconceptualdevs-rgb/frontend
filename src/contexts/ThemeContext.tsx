'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type ThemeType = 'nodo' | 'bynodo';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeType>('nodo');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sincronizar tema con la ruta actual
  useEffect(() => {
    if (pathname?.startsWith('/bynodo')) {
      setTheme('bynodo');
    } else {
      setTheme('nodo');
    }
  }, [pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'nodo' ? 'bynodo' : 'nodo');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning, setIsTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
