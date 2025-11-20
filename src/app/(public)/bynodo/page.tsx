'use client';

import { useEffect } from 'react';
import RestaurantsSection from '@/components/bynodo/RestaurantsSection';
import styles from './page.module.css';

export default function ByNodoPage() {
  useEffect(() => {
    // Aplicar tema oscuro al body
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  return (
    <main className={styles.main}>
      <RestaurantsSection />
    </main>
  );
}
