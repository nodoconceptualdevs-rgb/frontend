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
                <FaPhoneAlt /> <span>+58 414-7254403</span>
              </li>
              <li>
                <FaEnvelope /> <span>nodo.conceptual@gmail.com</span>
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
                  Venezuela Tachira, Barrio Obrero. Torre Profesional Pirineos
                  Piso 4 oficina 4-1
                </span>
              </li>
              <li>
                <FaRegClock />{" "}
                <span>
                  <b>Horario:</b>
                  <br />
                  Lunes a Domingo: &nbsp;9:00 – 18:00 –
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
          © 2026 Nodo Conceptual. Todos los derechos reservados
        </div>
      </footer>
    </>
  );
}
