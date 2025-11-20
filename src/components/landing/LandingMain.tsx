"use client";
import { useRouter } from "next/navigation";
import { Typography } from "antd";
import Footer from "@/components/footer/Footer";
import FooterCta from "@/components/footer/FooterCta";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";
import Menu from "../menu";
import SectionTitle from "../SectionTitle";
import BarStats from "./BarStats";
import Carousel from "./CarouselMain";
import CoursesCarousel from "@/components/landing/CoursesCarousel";
import ServiciosSelector from "./ServiciosSelector";
import RenderCarousel from "./RenderCarousel";
import TeamCarousel from "./TeamCarousel";
import ByNodoSection from "./ByNodoSection";
import { RedButtonWithIcon } from "../CustomButtons";
import styles from "./LandingMain.module.css";

export default function LandingMain() {
  const router = useRouter();
  return (
    <>
      <Menu />
      <div className={styles.containerPadding}>
        <Carousel />
        <div className={styles.carouselButtonWrapper}>
          <RedButtonWithIcon onClick={() => router.push("/portafolio")}>
            Ver portafolio
          </RedButtonWithIcon>
        </div>
        <div className={styles.desktopBarStats}>
          <BarStats />
        </div>
      </div>
      <div className={styles.backgroundWhite}>
        <div className={styles.containerPadding}>
          <div className={styles.mobileBarStats}>
            <BarStats />
          </div>
          <SectionTitle
            text="Nuestros servicios"
            highlightLast={1}
            buttonType="redOutlineBlack"
            buttonText="Mira como lo hacemos"
            onButtonClick={() => router.push("/portafolio")}
            hideButtonOnMobile={true}
          />
        </div>
        <ServiciosSelector />
      </div>
      <div className={styles.containerPadding}>
        <SectionTitle
          text="Proyectos Destacados"
          buttonType="redIcon"
          buttonText="Ver portafolio"
          onButtonClick={() => router.push("/portafolio")}
          hideButtonOnMobile={true}
        />
        <RenderCarousel />
      </div>
      {/* Sección ByNodo */}
      <ByNodoSection />
      {/* Carrusel de equipo */}
      <div className={styles.sectionSpacing} id="quienes-somos">
        <div className={styles.containerPadding}>
          <SectionTitle text="Quiénes Somos" alignRight={true} />
          <div className={styles.quienesSomosRight}>
            <Typography.Paragraph className={styles.quienesSomosText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl
              turpis egestas.
            </Typography.Paragraph>
          </div>
        </div>
        <TeamCarousel />
      </div>

      <div className={styles.containerPadding}>
        <SectionTitle text="Nuestros Cursos" alignRight={false} />
      </div>
      <CoursesCarousel />

      <div className={styles.backgroundWhite} style={{ marginBottom: '6rem' }}>
        <div className={styles.containerPadding}>
          <SectionTitle
            text="Experiencia de nuestros clientes"
            highlightLast={2}
            alignRight={false}
          />
        </div>
        <TestimonialsCarousel />
      </div>
      <FooterCta />
      <Footer />
    </>
  );
}
