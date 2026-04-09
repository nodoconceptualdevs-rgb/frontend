'use client';

import { useParams } from 'next/navigation';
import RestaurantDetail from '@/components/bynodo/RestaurantDetail';
import styles from './page.module.css';

export default function RestaurantDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <main className={styles.main}>
      <RestaurantDetail slug={slug} />
    </main>
  );
}
