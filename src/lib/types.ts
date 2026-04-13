export interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileSystemNode[];
  isOpen?: boolean; // For tracking folder expand/collapse state in the UI
}
