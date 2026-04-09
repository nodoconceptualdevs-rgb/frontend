import type { MediaTag } from "@/services/mediaLibrary";
import { useState } from "react";
import {
  IconTag,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDotsVertical,
} from "../utils/icons";

interface TagsSidebarProps {
  allTags: MediaTag[];
  currentTag: number | null;
  allFilesCount: number;
  onTagSelect: (tagId: number | null) => void;
  onCreateTag: () => void;
  onTagDrop: (tagId: number) => void;
  onEditTag?: (tag: MediaTag) => void;
  onDeleteTag?: (tagId: number) => void;
}

export default function TagsSidebar({
  allTags,
  currentTag,
  allFilesCount,
  onTagSelect,
  onCreateTag,
  onTagDrop,
  onEditTag,
  onDeleteTag,
}: TagsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-64 border-l border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <IconTag />
            Tags
          </h3>
          <button
            onClick={onCreateTag}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Nuevo tag"
          >
            <IconPlus />
          </button>
        </div>

        {/* Search Tags */}
        <div className="relative mb-3">
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Buscar tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition"
          />
        </div>

        <button
          onClick={() => onTagSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition mb-2 ${
            currentTag === null
              ? "bg-red-100 text-red-700 font-medium"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <IconTag />
          <span>Todos los archivos</span>
          <span className="ml-auto text-xs text-gray-500">{allFilesCount}</span>
        </button>

        <div className="space-y-1">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className="relative group"
              onDragOver={handleDragOver}
              onDrop={() => onTagDrop(tag.id)}
              onMouseLeave={() => setMenuOpen(null)}
            >
              <button
                onClick={() => onTagSelect(tag.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  currentTag === tag.id
                    ? "bg-red-100 text-red-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <IconTag />
                <span className="truncate flex-1 text-left">{tag.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {(tag.files || []).length}
                  </span>
                  {/* Menu de opciones */}
                  {(onEditTag || onDeleteTag) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === tag.id ? null : tag.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition opacity-0 group-hover:opacity-100"
                    >
                      <IconDotsVertical />
                    </button>
                  )}
                </div>
              </button>

              {/* Dropdown menu */}
              {menuOpen === tag.id && (onEditTag || onDeleteTag) && (
                <div className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[140px]">
                  {onEditTag && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTag(tag);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <IconEdit />
                      <span>Editar</span>
                    </button>
                  )}
                  {onDeleteTag && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(tag.id);
                        setMenuOpen(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <IconTrash />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
