import Project3DCard, { Project3DCardProps } from "./Project3DCard";

interface Project3DListProps {
  items: Project3DCardProps[];
  mode?: "carousel" | "list";
  bgGray?: boolean;
}

export default function Project3DList({
  items,
  mode = "carousel",
  bgGray = false,
}: Project3DListProps) {
  if (mode === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {items.map((item, idx) => (
          <Project3DCard
            key={item.model + idx}
            {...item}
            bgGray={bgGray}
            flip={idx % 2 === 1}
          />
        ))}
      </div>
    );
  }
  // El modo carousel se implementa en RenderCarousel (landing)
  return null;
}
