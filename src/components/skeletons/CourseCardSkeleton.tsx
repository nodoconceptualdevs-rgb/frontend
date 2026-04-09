/**
 * Skeleton para tarjeta de curso
 * Se muestra mientras carga la lista de cursos
 */
export default function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Skeleton Cover */}
      <div className="h-48 bg-gray-200"></div>
      
      {/* Skeleton Content */}
      <div className="p-6 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      
      {/* Skeleton Button */}
      <div className="px-6 pb-6">
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
}
