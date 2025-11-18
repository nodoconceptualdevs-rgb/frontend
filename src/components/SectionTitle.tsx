"use client";
import React from "react";
import styles from "./SectionTitle.module.css";

import { RedButtonWithIcon, RedOutlineBlackButton } from "./CustomButtons";

interface SectionTitleProps {
  text: string;
  highlightLast?: number; // cuántas palabras pintar en rojo (por defecto 1)
  alignRight?: boolean; // si true, el texto va a la derecha
  buttonType?: "redIcon" | "redOutlineBlack";
  buttonText?: string;
  onButtonClick?: () => void;
  hideButtonOnMobile?: boolean; // si true, oculta el botón en móvil
}

export default function SectionTitle({
  text,
  highlightLast = 1,
  alignRight,
  buttonType,
  buttonText,
  onButtonClick,
  hideButtonOnMobile = false,
}: SectionTitleProps) {
  const words = text.trim().split(" ");

  let normal = words.slice(0, -highlightLast).join(" ");
  let highlight = words.slice(-highlightLast).join(" ");

  const renderButton = () => {
    if (buttonType === "redIcon") {
      return (
        <RedButtonWithIcon onClick={onButtonClick}>
          {buttonText || "Ver más"}
        </RedButtonWithIcon>
      );
    }
    if (buttonType === "redOutlineBlack") {
      return (
        <RedOutlineBlackButton onClick={onButtonClick}>
          {buttonText || "Ver más"}
        </RedOutlineBlackButton>
      );
    }
    return null;
  };

  return (
    <>
      {alignRight && <div className={styles.topDash} aria-hidden />}
      <div className={styles.sectionTitleRow}>
        <h2
          className={
            alignRight
              ? `${styles.sectionTitle} ${styles.right}`
              : styles.sectionTitle
          }
        >
          <span className={styles.textBlock}>
            {normal && <span>{normal} </span>}
            <span className={styles.redText}>{highlight}</span>
          </span>
          <span className={styles.dash} aria-hidden />
        </h2>
        <span className={`${styles.buttonWrapper} ${hideButtonOnMobile ? styles.hideOnMobile : ''}`}>
          {renderButton()}
        </span>
      </div>
    </>
  );
}
