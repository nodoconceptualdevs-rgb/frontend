"use client";
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import styles from "./RenderCarousel.module.css";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function HouseModel({ model }: { model: "house1" | "house2" }) {
  const { scene } = useGLTF(model === "house1" ? "/House1.glb" : "/House2.glb");
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003; // Ajusta la velocidad aquí
    }
  });

  return <primitive ref={ref} object={scene} scale={1.2} />;
}

const slides = [
  {
    title: "Residencias Horizonte",
    subtitle: "Proyecto Residencial",
    description:
      "Lorem ipsum dolor sit amet consectetur. Nunc integer vel tincidunt orci sit adipiscing suscipit. Enim et euismod pharetra semper elit arcu non proin. Ut netus sed sed leo egestas urna nulla sed aliquet. Molestie ut consequat et orci arcu. Proin elementum sed amet et tor tor urna aliquet. Nunc sit enim neque ut ac odio auctor scelerisque. Maecenas accumsan mattis arcu aliquet in morbi arcu. Ornare pulvinar nulla et aliquet justo urna tellus sit. Placerat urna at tortor egestas nisi neque ultricies suspendisse eu.",
    cta: "Acceder a la galeria inmersiva",
    icon: "\u{1F5FA}",
    model: "house1",
  },
  {
    title: "Residencias Horizonte",
    subtitle: "Proyecto Residencial",
    description:
      "Lorem ipsum dolor sit amet consectetur. Nunc integer vel tincidunt orci sit adipiscing suscipit. Enim et euismod pharetra semper elit arcu non proin. Ut netus sed sed leo egestas urna nulla sed aliquet. Molestie ut consequat et orci arcu. Proin elementum sed amet et tor tor urna aliquet. Nunc sit enim neque ut ac odio auctor scelerisque. Maecenas accumsan mattis arcu aliquet in morbi arcu. Ornare pulvinar nulla et aliquet justo urna tellus sit. Placerat urna at tortor egestas nisi neque ultricies suspendisse eu.",
    cta: "Acceder a la galeria inmersiva",
    icon: "\u{1F5FA}",
    model: "house2",
  },
];

export default function RenderCarousel() {
  return (
    <div className={styles.carouselWrapper}>
      <Swiper
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        allowTouchMove={false}
        mousewheel={false}
        keyboard={false}
        pagination={false}
        modules={[Navigation]}
        className={styles.mySwiper}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.model + idx}>
            <div className={styles.carouselContainer}>
              <div className={styles.left3d}>
                <button className={styles.btn360} type="button">
                  <span className={styles.icon360}>⟳</span> Imagen 360°
                </button>
                <div className={styles.threeWrapper}>
                  <Canvas
                    camera={{ position: [2, 2, 4], fov: 40 }}
                    style={{ background: "#fff" }}
                  >
                    <ambientLight intensity={0.7} />
                    <Stage environment={null} intensity={0.8}>
                      <HouseModel model={slide.model as "house1" | "house2"} />
                    </Stage>
                    <OrbitControls enablePan={false} enableZoom={false} />
                  </Canvas>
                </div>
              </div>
              <div className={styles.rightText}>
                <div className={styles.subtitle}>{slide.subtitle}</div>
                <div className={styles.title}>{slide.title}</div>
                <div className={styles.description}>{slide.description}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        {/* Botones personalizados */}
        <button
          className="swiper-button-prev"
          type="button"
          aria-label="Anterior"
        >
          <FaArrowLeft color="#ffffff" className={styles.arrowIcon} />
        </button>
        <button
          className="swiper-button-next"
          type="button"
          aria-label="Siguiente"
        >
          <FaArrowRight color="#ffffff" className={styles.arrowIcon} />
        </button>
      </Swiper>
    </div>
  );
}
