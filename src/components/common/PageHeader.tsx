import React from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
