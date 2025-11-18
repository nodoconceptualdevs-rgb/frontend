"use client";
import React, { useEffect, useState } from "react";
import CourseCard from "@/components/CourseCard";
import { getCursosCompradosByUsuario } from "@/services/compras";

export default function MisCursosPage() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    getCursosCompradosByUsuario(1, 20)
      .then((res) => {
        console.log("getCursosCompradosByUsuario", res);
        //   const arr = res?.data || [];
        //   // Mapear los cursos comprados
        //   const cursosComprados = arr.map((t: any) => {
        //     const curso = t.course;
        //     return {
        //       id: curso.id,
        //       image: curso.cover || "/image1.jpg",
        //       price: curso.price ? `$${curso.price}` : "-",
        //       title: curso.title,
        //       description: curso.description,
        //       lessons: curso.content_course?.length || 0,
        //       tests: 0,
        //       rating: curso.rating || 5,
        //     };
        //   });
        //   setCursos(cursosComprados);
        // })
        // .finally(() => setLoading(false));
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Mis Cursos — Privado</h1>
      <p>Ruta: /dashboard/mis-cursos</p>
      <p>Listado de cursos que el usuario ha comprado.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {loading ? (
          <div>Cargando cursos...</div>
        ) : cursos.length === 0 ? (
          <div>No has comprado ningún curso.</div>
        ) : (
          cursos.map((curso) => <CourseCard key={curso.id} {...curso} />)
        )}
      </div>
    </main>
  );
}
