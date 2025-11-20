'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import RestaurantDetail from '@/components/bynodo/RestaurantDetail';
import styles from './page.module.css';

export default function RestaurantDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    // Aplicar tema oscuro al body
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  return (
    <main className={styles.main}>
      <RestaurantDetail slug={slug} />
    </main>
  );
}
