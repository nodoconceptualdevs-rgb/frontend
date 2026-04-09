import React from "react";
import styles from "./FooterCta.module.css";
import { RedButtonWithIcon } from "../CustomButtons";

export default function FooterCta() {
  return (
    <section className={styles.footerCtaSection}>
      <div className={styles.bgImage} />
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h2 className={styles.title}>
          Hagamos de <span className={styles.red}>tu idea</span>
          <br />
          un <span className={styles.red}>espacio real</span>
        </h2>
        <RedButtonWithIcon>Agenda una reunión</RedButtonWithIcon>
      </div>
      <div className={styles.topBar} />
    </section>
  );
}
