"use client";

import { useState, useMemo, useEffect } from "react";
import { message, Tabs } from "antd";
import { getMisCursosComprados } from "@/services/transactions";
import { getCourses, Course } from "@/services/courses";
import { useDataFetch } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ROLES } from "@/constants/roles";
import CourseCardSkeleton from "@/components/skeletons/CourseCardSkeleton";

export default function CursosClientePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("1");

  const handleAccessCourse = (documentId: string) => {
    router.push(`/dashboard/cursos/${documentId}`);
  };

  const handleBuyCourse = async (documentId: string) => {
    // TODO: Implementar lógica de compra
    message.info("Funcionalidad de compra próximamente");
  };

  // Renderizar card de curso
  const renderCourseCard = (course: Course, isPurchased: boolean) => (
    <div key={course.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-6xl relative">
        📚
        {isPurchased && (
          <div className="absolute top-3 right-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Comprado
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {course.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          {course.number_lessons && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              {course.number_lessons} lecciones
            </div>
          )}
          {!isPurchased && (
            <div className="text-lg font-bold text-gray-900">
              ${course.price}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        {isPurchased ? (
          <button
            onClick={() => handleAccessCourse(course.documentId)}
            className="w-full px-4 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-600 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Acceder al Curso
          </button>
        ) : (
          <button
            onClick={() => handleBuyCourse(course.documentId)}
            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Comprar Curso
          </button>
        )}
      </div>
    </div>
  );
  
  // Redirigir si el usuario es Gerente de Proyecto
  useEffect(() => {
    if (user && user.role.type === ROLES.GERENTE_PROYECTO) {
      message.warning("Esta sección es solo para clientes");
      router.push("/dashboard/mi-proyecto");
    }
  }, [user, router]);

  // Obtener cursos comprados
  const { data: purchasedCourses, loading: loadingPurchased } = useDataFetch(
    getMisCursosComprados,
    []
  );

  // Obtener todos los cursos disponibles
  const { data: allCourses, loading: loadingAll } = useDataFetch(
    getCourses,
    []
  );

  // Filtrar cursos comprados
  const filteredPurchasedCourses = useMemo(() => {
    if (!purchasedCourses) return [];
    return purchasedCourses.filter((course: { title: string; description?: string }) =>
      course.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [purchasedCourses, searchText]);

  // Filtrar cursos disponibles (excluir los que ya compró)
  const availableCourses = useMemo(() => {
    if (!allCourses || !purchasedCourses) return [];
    
    // Asegurarse de que allCourses es un array
    if (!Array.isArray(allCourses)) return [];
    
    const purchasedIds = new Set(purchasedCourses.map((c: any) => c.id));
    
    return allCourses
      .filter((course: any) => 
        course.isActive && 
        !purchasedIds.has(course.id) &&
        (course.title.toLowerCase().includes(searchText.toLowerCase()) ||
         (course.description && course.description.toLowerCase().includes(searchText.toLowerCase())))
      );
  }, [allCourses, purchasedCourses, searchText]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Cursos</h2>
        <p className="text-gray-600">
          {purchasedCourses?.length || 0} curso{purchasedCourses?.length !== 1 ? 's' : ''} comprado{purchasedCourses?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar curso..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
          />
          <svg
            className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: "1",
            label: (
              <span className="text-base font-semibold">
                Mis Cursos ({filteredPurchasedCourses.length})
              </span>
            ),
            children: (
              <div className="mt-6">
                {loadingPurchased ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <CourseCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredPurchasedCourses.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchText ? "No se encontraron cursos" : "Aún no has comprado ningún curso"}
                    </h3>
                    <p className="text-gray-600">
                      {searchText
                        ? "Intenta con otro término de búsqueda"
                        : "Los cursos que compres aparecerán aquí para que puedas acceder a ellos"}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPurchasedCourses.map((course: any) => renderCourseCard(course, true))}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "2",
            label: (
              <span className="text-base font-semibold">
                Cursos Disponibles ({availableCourses.length})
              </span>
            ),
            children: (
              <div className="mt-6">
                {loadingAll ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <CourseCardSkeleton key={i} />
                    ))}
                  </div>
                ) : availableCourses.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchText ? "No se encontraron cursos disponibles" : "No hay cursos disponibles"}
                    </h3>
                    <p className="text-gray-600">
                      {searchText
                        ? "Intenta con otro término de búsqueda"
                        : "Pronto agregaremos nuevos cursos"}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableCourses.map((course: any) => renderCourseCard(course, false))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
