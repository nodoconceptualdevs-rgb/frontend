"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import styles from "./CarouselMain.module.css";

import Image from "next/image";
import { RedButtonWithIcon } from "../CustomButtons";

export default function Carousel() {
  const router = useRouter();
  const slides = [
    {
      image: "/image1.jpg",
      title: "Diseñamos espacios que inspiran",
      content:
        "Lorem ipsum dolor sit amet consectetur. Nunc integer vel tincidunt erat sit adipiscing suscipit. Enim et euismod pharetra semper elit arcu non porta. Un metus sed sed leo egestas nulla nulla odio aliquet. Morbi et consectetur.",
    },
    {
      image: "/image2.jpg",
      title: "Creamos proyectos a tu medida",
      content:
        "Aliquam erat volutpat. Etiam euismod, urna eu tincidunt consectetur, nisi nisl aliquam enim, nec dictum nisi nisl eget sapien. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    },
    {
      image: "/image3.jpg",
      title: "Innovación y calidad en cada detalle",
      content:
        "Suspendisse potenti. Praesent euismod, justo vitae laoreet dictum, enim erat facilisis urna, nec dictum enim enim nec urna. Integer euismod, urna eu tincidunt consectetur, nisi nisl aliquam enim, nec dictum nisi nisl eget sapien.",
    },
  ];

  return (
    <div className={styles.carouselWrapper}>
      <Swiper
        cssMode={true}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        pagination={true}
        mousewheel={true}
        keyboard={true}
        loop={true}
        modules={[Navigation, Pagination, Mousewheel, Keyboard]}
        className={styles.mySwiper}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.image}>
            <div className={styles.slideContainer}>
              <Image
                src={slide.image}
                alt={`Imagen ${idx + 1}`}
                fill
                className={styles.slideImage}
                priority={idx === 0}
              />
              <div className={styles.slideOverlay} />
              <div className={styles.slideContent}>
                <h2 className={styles.slideTitle}>{slide.title}</h2>
                <p className={styles.slideText}>{slide.content}</p>
                <div className={styles.desktopButton}>
                  <RedButtonWithIcon onClick={() => router.push("/portafolio")}>
                    Ver portafolio
                  </RedButtonWithIcon>
                </div>
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
          <FaArrowLeft color="#ffffff" size={32} />
        </button>
        <button
          className="swiper-button-next"
          type="button"
          aria-label="Siguiente"
        >
          <FaArrowRight color="#ffffff" />
        </button>
      </Swiper>
    </div>
  );
}
