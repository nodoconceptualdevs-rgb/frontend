import CourseCard from "@/components/CourseCard";
export default function CursosPage() {
  const cursos = [
    {
      image: "/image1.jpg",
      price: "120 USD",
      title:
        "Herramientas Digitales para Arquitectura (AutoCAD + SketchUp + Revit)",
      description:
        "Capacítate desde cero en el uso de herramientas digitales para arquitectura, modelado y documentación profesional.",
      lessons: 36,
      tests: 6,
      rating: 5,
    },
    {
      image: "/image2.jpg",
      price: "140 USD",
      title: "Diseño de interiores contemporáneo",
      description:
        "Aprende a diseñar espacios interiores modernos, funcionales y estéticos con los mejores profesionales.",
      lessons: 28,
      tests: 4,
      rating: 4,
    },
    {
      image: "/image3.jpg",
      price: "150 USD",
      title: "Arquitectura Sostenible y Materiales Eco-Friendly",
      description:
        "Profundiza en prácticas de arquitectura sostenible y el uso de materiales amigables con el medio ambiente.",
      lessons: 32,
      tests: 5,
      rating: 5,
    },
    {
      image: "/image3.jpg",
      price: "150 USD",
      title: "Arquitectura Sostenible y Materiales Eco-Friendly",
      description:
        "Profundiza en prácticas de arquitectura sostenible y el uso de materiales amigables con el medio ambiente.",
      lessons: 32,
      tests: 5,
      rating: 5,
    },
    {
      image: "/image3.jpg",
      price: "150 USD",
      title: "Arquitectura Sostenible y Materiales Eco-Friendly",
      description:
        "Profundiza en prácticas de arquitectura sostenible y el uso de materiales amigables con el medio ambiente.",
      lessons: 32,
      tests: 5,
      rating: 5,
    },
    {
      image: "/image3.jpg",
      price: "150 USD",
      title: "Arquitectura Sostenible y Materiales Eco-Friendly",
      description:
        "Profundiza en prácticas de arquitectura sostenible y el uso de materiales amigables con el medio ambiente.",
      lessons: 32,
      tests: 5,
      rating: 5,
    },
  ];
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
          <CourseCard key={curso.title + idx} {...curso} />
        ))}
      </div>
    </main>
  );
}
