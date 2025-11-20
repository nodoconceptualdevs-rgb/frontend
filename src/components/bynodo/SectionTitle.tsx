import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className={styles.titleSection}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
