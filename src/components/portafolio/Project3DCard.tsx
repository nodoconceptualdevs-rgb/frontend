"use client";
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import styles from "../landing/RenderCarousel.module.css";

function HouseModel({ model }: { model: string }) {
  const { scene } = useGLTF(model);
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });
  return <primitive ref={ref} object={scene} scale={1.2} />;
}

export interface Project3DCardProps {
  title: string;
  subtitle: string;
  description: string;
  cta?: string;
  icon?: string;
  model: string;
  bgGray?: boolean;
  flip?: boolean;
}

export default function Project3DCard({
  title,
  subtitle,
  description,
  model,
  bgGray = false,
  flip = false,
}: Project3DCardProps) {
  return (
    <div
      className={styles.carouselContainer}
      style={
        bgGray
          ? {
              background: "#EFEFEF",
              borderRadius: 24,
              border: "1px solid #E0E0E0",
              paddingBottom: 60,
            }
          : undefined
      }
    >
      {flip ? (
        <>
          <div className={styles.rightText}>
            <div className={styles.subtitle}>{subtitle}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
          </div>
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
                  <HouseModel model={model} />
                </Stage>
                <OrbitControls enablePan={false} enableZoom={false} />
              </Canvas>
            </div>
          </div>
        </>
      ) : (
        <>
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
                  <HouseModel model={model} />
                </Stage>
                <OrbitControls enablePan={false} enableZoom={false} />
              </Canvas>
            </div>
          </div>
          <div className={styles.rightText}>
            <div className={styles.subtitle}>{subtitle}</div>
            <div className={styles.title}>{title}</div>
            <div className={styles.description}>{description}</div>
          </div>
        </>
      )}
    </div>
  );
}
