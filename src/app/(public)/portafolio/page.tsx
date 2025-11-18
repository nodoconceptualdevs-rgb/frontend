import Project3DList from "@/components/portafolio/Project3DList";
export default function PortafolioPage() {
  const projects = [
    {
      title: "Residencias Horizonte",
      subtitle: "Proyecto Residencial",
      description:
        "Lorem ipsum dolor sit amet consectetur. Nunc integer vel tincidunt orci sit adipiscing suscipit. Enim et euismod pharetra semper elit arcu non proin. Ut netus sed sed leo egestas urna nulla sed aliquet. Molestie ut consequat et orci arcu. Proin elementum sed amet et tor tor urna aliquet. Nunc sit enim neque ut ac odio auctor scelerisque. Maecenas accumsan mattis arcu aliquet in morbi arcu. Ornare pulvinar nulla et aliquet justo urna tellus sit. Placerat urna at tortor egestas nisi neque ultricies suspendisse eu.",
      cta: "Acceder a la galeria inmersiva",
      icon: "\u{1F5FA}",
      model: "/House1.glb",
    },
    {
      title: "Santuario del Santísimo Rostro Sagrado",
      subtitle: "Proyecto Comunitario",
      description:
        "Lorem ipsum dolor sit amet consectetur. Nunc integer vel tincidunt orci sit adipiscing suscipit. Enim et euismod pharetra semper elit arcu non proin. Ut netus sed sed leo egestas urna nulla sed aliquet. Molestie ut consequat et orci arcu. Proin elementum sed amet et tor tor urna aliquet. Nunc sit enim neque ut ac odio auctor scelerisque. Maecenas accumsan mattis arcu aliquet in morbi arcu. Ornare pulvinar nulla et aliquet justo urna tellus sit. Placerat urna at tortor egestas nisi neque ultricies suspendisse eu.",
      cta: "Acceder a la galeria inmersiva",
      icon: "\u{1F5FA}",
      model: "/House2.glb",
    },
  ];
  return (
    <main className="flex flex-col gap-4" style={{ padding: "0 clamp(1rem, 5vw, 5rem)" }}>
      <div>
        <h2
          className="font-serif text-gray-700 mb-1"
          style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
        >
          Nuestro portafolio
        </h2>
        <hr className="border-dotted border-t border-gray-400 mb-4" />
      </div>
      <Project3DList items={projects} mode="list" bgGray />
    </main>
  );
}
