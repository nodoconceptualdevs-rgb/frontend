"use client";
import { useEffect, useState } from "react";
import CourseCard, { CourseCardProps } from "@/components/CourseCard";
import { getCourses, Course } from "@/services/courses";

export default function CursosPage() {
  const [cursos, setCursos] = useState<CourseCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCourses() {
      try {
        setLoading(true);
        const courses = await getCourses();

        if (!cancelled) {
          // Mapear los datos del API al formato esperado por CourseCard
          const mappedCourses = courses.map((course: Course) => ({
            image:
              course.cover?.url ||
              "https://via.placeholder.com/300x200?text=Curso",
            price: `$${course.price}`,
            title: course.title,
            description: course.description,
            lessons: course.number_lessons || 0,
            tests: 0,
            rating: 5,
          }));

          setCursos(mappedCourses);
          setError(null);
        }
      } catch (err) {
        console.error("Error al cargar cursos:", err);
        if (!cancelled) {
          setError("No se pudieron cargar los cursos. Intenta más tarde.");
          setCursos([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  // Estado de carga
  if (loading) {
    return (
      <main style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
        <h2
          className="font-serif text-gray-700 mb-1"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          Cursos y Formaciones
        </h2>
        <hr className="border-dotted border-t border-gray-400 mb-4" />
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500">Cargando cursos...</p>
        </div>
      </main>
    );
  }

  // Estado de error - mostrar el mismo mensaje que cuando no hay cursos
  if (error) {
    return (
      <main style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
        <h2
          className="font-serif text-gray-700 mb-1"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          Cursos y Formaciones
        </h2>
        <hr className="border-dotted border-t border-gray-400 mb-4" />
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="text-6xl">📚</div>
          <h3 className="text-xl font-semibold text-gray-700">
            Próximamente cursos
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Estamos preparando nuevos cursos para ti. ¡Vuelve pronto para
            descubrirlos!
          </p>
        </div>
      </main>
    );
  }

  // Estado vacío - sin cursos
  if (cursos.length === 0) {
    return (
      <main style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
        <h2
          className="font-serif text-gray-700 mb-1"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          Cursos y Formaciones
        </h2>
        <hr className="border-dotted border-t border-gray-400 mb-4" />
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="text-6xl">📚</div>
          <h3 className="text-xl font-semibold text-gray-700">
            Próximamente cursos
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Estamos preparando nuevos cursos para ti. ¡Vuelve pronto para
            descubrirlos!
          </p>
        </div>
      </main>
    );
  }

  // Estado normal - mostrar cursos
  return (
    <main style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
      <h2
        className="font-serif text-gray-700 mb-1"
        style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
      >
        Cursos y Formaciones
      </h2>
      <hr className="border-dotted border-t border-gray-400 mb-4" />
      <div
        className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-8"
        style={{ maxWidth: 1300, justifyItems: "center" }}
      >
        {cursos.map((curso, idx) => (
          <CourseCard key={`course-${idx}`} {...curso} />
        ))}
      </div>
    </main>
  );
}
