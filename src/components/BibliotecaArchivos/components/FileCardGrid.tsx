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
  IconRotate,
  IconEye,
  IconTrash,
  IconImage,
  IconVideo,
  IconDoc,
} from "../utils/icons";

interface FileCardGridProps {
  file: MediaFile;
  isSelected: boolean;
  imageRotation: number;
  isRotating: boolean;
  fileTag: MediaTag | null;
  onSelect: () => void;
  onRotate: () => void;
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

export default function FileCardGrid({
  file,
  isSelected,
  imageRotation,
  isRotating,
  fileTag,
  onSelect,
  onRotate,
  onPreview,
  onDelete,
  onDragStart,
}: FileCardGridProps) {
  const isImage = file.mime.startsWith("image/");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
        isSelected
          ? "border-red-500 ring-2 ring-red-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {isImage ? (
          <img
            src={getDisplayUrl(file, imageRotation)}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(file.mime)}`}
            >
              {getCategoryIcon(file.mime)}
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold text-white rounded ${getExtBadgeColor(file.ext)}`}
            >
              {file.ext.replace(".", "").toUpperCase()}
            </span>
          </div>
        )}

        {isSelected && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <IconCheck />
            </div>
          </div>
        )}

        {imageRotation > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow">
            {imageRotation}°
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate();
              }}
              disabled={isRotating}
              className={`p-1.5 rounded-lg shadow transition ${
                isRotating
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white/90 hover:bg-white text-gray-600"
              }`}
            >
              {isRotating ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <IconRotate />
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-white text-gray-600 transition"
          >
            <IconEye />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-red-50 text-red-500 transition"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="p-2.5">
        <p
          className="text-xs font-medium text-gray-800 truncate"
          title={file.name}
        >
          {file.name}
        </p>
        {fileTag && (
          <div className="flex items-center gap-1 mt-1">
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">
              {fileTag.name}
            </span>
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatSize(file.size)} &middot;{" "}
          {new Date(file.createdAt).toLocaleDateString("es-ES")}
        </p>
      </div>
    </div>
  );
}
