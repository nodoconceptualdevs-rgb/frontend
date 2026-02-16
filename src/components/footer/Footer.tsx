import React from "react";
import FooterCta from "../footer/FooterCta";
import styles from "./Footer.module.css";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
  FaRegClock,
} from "react-icons/fa";

type FooterProps = {
  showCta?: boolean;
};

export default function Footer({ showCta = false }: FooterProps) {
  return (
    <>
      {showCta && <FooterCta />}
      <footer className={styles.footer}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <h3>Contáctanos</h3>
            <ul>
              <li>
                <FaPhoneAlt /> <span>+34 692 30 99 59</span>
              </li>
              <li>
                <FaEnvelope /> <span>comercial@nodo.com</span>
              </li>
              <li>
                <FaGlobe /> <span>www.nodoconceptual.com</span>
              </li>
              <li>
                <FaLinkedin /> <span>Nodo Conceptual</span>
              </li>
            </ul>
          </div>
          <div className={styles.col}>
            <h3>¿Cómo llegar?</h3>
            <ul>
              <li>
                <FaMapMarkerAlt />{" "}
                <span>
                  <b>Dirección</b>
                  <br />
                  Sit Amet. Edif. Consectetur
                </span>
              </li>
              <li>
                <FaRegClock />{" "}
                <span>
                  <b>Horario:</b>
                  <br />
                  Lunes a jueves: &nbsp;8:00 – 13:00 y 14:00 – 17:00
                  <br />
                  Viernes: 7:00 – 14:00
                </span>
              </li>
            </ul>
          </div>
          <div className={styles.col}>
            <h3>Acceso Directo</h3>
            <ul className={styles.links}>
              <li>Inicio</li>
              <li>Portafolio</li>
              <li>Quienes Somos</li>
              <li>Cursos y Formaciones</li>
              <li>Servicios</li>
              <li>Blog</li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>
          Copyright Nodo Conceptual | Todos los derechos reservados |{" "}
          <b>Política de calidad /Aviso Legal/ Política de cookies</b>
        </div>
      </footer>
    </>
  );
}
