import type { MediaFile, MediaFilter, MediaTag } from "@/services/mediaLibrary";

export interface BibliotecaArchivosProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (files: MediaFile[]) => void;
  maxSelection?: number;
  defaultFilter?: MediaFilter;
}

export interface FileCardProps {
  file: MediaFile;
  isSelected: boolean;
  imageRotation: number;
  isRotating: boolean;
  onSelect: () => void;
  onRotate: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}

export interface TagsSidebarProps {
  allTags: MediaTag[];
  currentTag: number | null;
  allFilesCount: number;
  tagSearchQuery: string;
  onTagSelect: (tagId: number | null) => void;
  onCreateTag: () => void;
  onTagDrop: (tagId: number) => void;
  onTagSearchChange: (query: string) => void;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface CreateTagModalProps extends ModalProps {
  tagName: string;
  onTagNameChange: (name: string) => void;
  onCreate: () => void;
}

export interface EditTagModalProps extends ModalProps {
  tagId: number;
  tagName: string;
  onTagNameChange: (name: string) => void;
  onUpdate: () => void;
}

export interface DeleteConfirmModalProps extends ModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface TagSelectorModalProps extends ModalProps {
  allTags: MediaTag[];
  selectedTagIds: number[];
  onTagToggle: (tagId: number) => void;
  onUpload: () => void;
  uploading: boolean;
}
