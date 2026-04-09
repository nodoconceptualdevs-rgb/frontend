import type { MediaFile } from "@/services/mediaLibrary";
import { rotateCloudinaryImage } from "@/lib/cloudinary";
import { IconX } from "../../utils/icons";

interface PreviewModalProps {
  file: MediaFile | null;
  imageRotation: number;
  onClose: () => void;
}

function getDisplayUrl(file: MediaFile, rotation: number): string {
  const angle = rotation || 0;
  // Usar URL completa en lugar de thumbnail
  const baseUrl = file.url;
  if (angle === 0) return baseUrl;
  return rotateCloudinaryImage(baseUrl, angle);
}

export default function PreviewModal({
  file,
  imageRotation,
  onClose,
}: PreviewModalProps) {
  if (!file) return null;

  const isImage = file.mime.startsWith("image/");
  const isPDF = file.mime === "application/pdf";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-7xl max-h-[95vh] flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
        >
          <IconX />
        </button>

        {isImage ? (
          <img
            src={getDisplayUrl(file, imageRotation)}
            alt={file.name}
            className="max-w-full max-h-[95vh] rounded-xl shadow-2xl object-contain"
          />
        ) : isPDF ? (
          <iframe
            src={file.url}
            title={file.name}
            className="w-full h-[95vh] rounded-xl shadow-2xl bg-white"
          />
        ) : (
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
            <p className="text-gray-600 mb-4">
              No se puede previsualizar este tipo de archivo
            </p>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Abrir archivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
