import React from "react";
import styles from "./FooterCta.module.css";
import { RedButtonWithIcon } from "../CustomButtons";

export default function FooterCta() {
  const handleWhatsAppClick = () => {
    const phoneNumber = "584147254403";
    const message = "Hola, me gustaría agendar una reunión";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

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
        <RedButtonWithIcon onClick={handleWhatsAppClick}>
          Agenda una reunión
        </RedButtonWithIcon>
      </div>
      <div className={styles.topBar} />
    </section>
  );
}
