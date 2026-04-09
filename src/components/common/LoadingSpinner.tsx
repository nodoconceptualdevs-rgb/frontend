import React from "react";
import { Spin } from "antd";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = "Cargando..." }: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <Spin size="large" />
      <p className={styles.text}>{text}</p>
    </div>
  );
}
