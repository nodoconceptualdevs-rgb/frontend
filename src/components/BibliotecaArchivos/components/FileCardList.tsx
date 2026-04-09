import type { MediaFile, MediaTag } from "@/services/mediaLibrary";
import {
  formatSize,
  getThumbnailUrl,
  getFileCategory,
} from "@/services/mediaLibrary";
import { rotateCloudinaryImage } from "@/lib/cloudinary";
import { getCategoryColor, getExtBadgeColor } from "../utils/helpers";
import {
  IconCheck,
  IconEye,
  IconTrash,
  IconImage,
  IconVideo,
  IconDoc,
} from "../utils/icons";

interface FileCardListProps {
  file: MediaFile;
  isSelected: boolean;
  imageRotation: number;
  fileTag: MediaTag | null;
  onSelect: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}

function getCategoryIcon(mime: string) {
  const cat = getFileCategory(mime);
  if (cat === "imagen") return <IconImage />;
  if (cat === "video") return <IconVideo />;
  return <IconDoc />;
}

function getDisplayUrl(file: MediaFile, rotation: number): string {
  const angle = rotation || 0;
  // Usar URL completa en lugar de thumbnail
  const baseUrl = file.url;
  if (angle === 0) return baseUrl;
  return rotateCloudinaryImage(baseUrl, angle);
}

export default function FileCardList({
  file,
  isSelected,
  imageRotation,
  fileTag,
  onSelect,
  onPreview,
  onDelete,
  onDragStart,
}: FileCardListProps) {
  const isImage = file.mime.startsWith("image/");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`group flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-red-500 bg-red-50/50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative">
        {isImage ? (
          <img
            src={getDisplayUrl(file, imageRotation)}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${getCategoryColor(file.mime)}`}
          >
            {getCategoryIcon(file.mime)}
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
              <IconCheck />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded ${getExtBadgeColor(file.ext)}`}
          >
            {file.ext.replace(".", "").toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
          <span className="text-xs text-gray-400">
            {new Date(file.createdAt).toLocaleDateString("es-ES")}
          </span>
          {fileTag && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">
              {fileTag.name}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
        >
          <IconEye />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}
