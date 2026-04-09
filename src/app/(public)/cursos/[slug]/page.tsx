type Props = { params: { slug: string } };

export default function CursoDetallePage({ params }: Props) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Detalle del Curso — Público</h1>
      <p>Ruta: /cursos/{params.slug}</p>
      <p>Muestra la información del curso y botón de compra.</p>
    </main>
  );
}
