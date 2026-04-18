import { FileSystemNode } from "@/lib/types";
import {
  Plus,
  File as FileIcon,
  Folder as FolderIcon,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FilePlus,
  Image as ImageIcon,
} from "lucide-react";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiC,
  SiCplusplus,
  SiRust,
  SiDart,
  SiGo,
  SiMarkdown,
} from "react-icons/si";
import { FaJava, FaHtml5, FaCss3Alt } from "react-icons/fa";
import { VscJson } from "react-icons/vsc";
import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";

interface SidebarProps {
  files: FileSystemNode[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  setFiles: React.Dispatch<React.SetStateAction<FileSystemNode[]>>;
  onAddFile: (
    parentId: string | null,
    e?: React.MouseEvent | KeyboardEvent,
  ) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  dart: "dart",
  java: "java",
  c: "c",
  rs: "rust",
};

// Helper for dynamic file icons based on extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return { icon: SiJavascript, color: "text-yellow-400" };
    case "ts":
    case "tsx":
      return { icon: SiTypescript, color: "text-blue-400" };
    case "py":
      return { icon: SiPython, color: "text-blue-300" };
    case "java":
      return { icon: FaJava, color: "text-orange-400" };
    case "c":
      return { icon: SiC, color: "text-blue-500" };
    case "cpp":
      return { icon: SiCplusplus, color: "text-blue-600" };
    case "rs":
      return { icon: SiRust, color: "text-orange-600" };
    case "dart":
      return { icon: SiDart, color: "text-teal-400" };
    case "go":
      return { icon: SiGo, color: "text-cyan-400" };
    case "json":
      return { icon: VscJson, color: "text-yellow-200" };
    case "md":
      return { icon: SiMarkdown, color: "text-slate-300" };
    case "html":
      return { icon: FaHtml5, color: "text-orange-500" };
    case "css":
      return { icon: FaCss3Alt, color: "text-blue-400" };
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return { icon: ImageIcon, color: "text-purple-400" };
    default:
      return { icon: FileIcon, color: "text-[#5f7e97]" };
  }
};

// Helpers for nested tree
const findNode = (
  nodes: FileSystemNode[],
  id: string,
): FileSystemNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

const updateTree = (
  nodes: FileSystemNode[],
  id: string,
  updater: (node: FileSystemNode) => FileSystemNode,
): FileSystemNode[] => {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children)
      return { ...node, children: updateTree(node.children, id, updater) };
    return node;
  });
};

const deleteNode = (nodes: FileSystemNode[], id: string): FileSystemNode[] => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children)
        return { ...node, children: deleteNode(node.children, id) };
      return node;
    });
};

const addNode = (
  nodes: FileSystemNode[],
  parentId: string | null,
  newNode: FileSystemNode,
): FileSystemNode[] => {
  if (!parentId) return [...nodes, newNode];
  return updateTree(nodes, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children || []), newNode],
  }));
};

export default function Sidebar({
  files,
  activeFileId,
  setActiveFileId,
  setFiles,
  onAddFile,
}: SidebarProps) {
  const handleAddFile = async (
    parentId: string | null = null,
    e?: React.MouseEvent | KeyboardEvent,
  ) => {
    if (onAddFile) {
      onAddFile(parentId, e);
      return;
    }
    e?.preventDefault();
    e?.stopPropagation();
    const name = prompt("File name (e.g., test.js, main.py):");
    if (!name) return;
    const ext = name.split(".").pop() || "";
    const language = LANGUAGE_MAP[ext] || "plaintext";

    // Path calculation: if parentId is empty, it's root, so ID is just name. Otherwise it's parentId/name
    const id = parentId ? `${parentId}/${name}` : name;

    const newFile: FileSystemNode = {
      id,
      name,
      type: "file",
      language,
      content: "",
    };

    setFiles((prev) => addNode(prev, parentId, newFile));
    setActiveFileId(newFile.id);

    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        parentId,
        name,
        type: "file",
        content: "",
      }),
    });
  };

  // React.useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if ((e.ctrlKey || e.metaKey) && e.key === "n") {
  //       handleAddFile(null, e);
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [files]);

  const handleAddFolder = async (
    parentId: string | null = null,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();

    setTimeout(async () => {
      const name = prompt("Folder name:");
      if (!name) return;

      const id = parentId ? `${parentId}/${name}` : name;

      const newFolder: FileSystemNode = {
        id,
        name,
        type: "folder",
        children: [],
        isOpen: true,
      };

      setFiles((prev) => addNode(prev, parentId, newFolder));

      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          parentId,
          name,
          type: "folder",
        }),
      });
    }, 10);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if we are deleting the currently active file or its parent
    const activeNode = findNode(files, activeFileId);
    setFiles((prev) => {
      const nextFiles = deleteNode(prev, id);
      // Fallback active logic
      if (!findNode(nextFiles, activeFileId)) {
        const firstFile = nextFiles.find((n) => n.type === "file");
        if (firstFile) setActiveFileId(firstFile.id);
        else setActiveFileId("");
      }
      return nextFiles;
    });

    await fetch(`/api/files?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) =>
      updateTree(prev, id, (node) => ({ ...node, isOpen: !node.isOpen })),
    );
  };

  const renderTree = (nodes: FileSystemNode[], depth: number = 0) => {
    return nodes.map((node) => {
      if (node.type === "folder") {
        return (
          <div key={node.id}>
            <div
              onClick={(e) => toggleFolder(node.id, e)}
              className={`group flex items-center justify-between py-1.5 pr-2 cursor-pointer text-sm hover:bg-[#122d42]`}
              style={{ paddingLeft: `${depth * 12 + 16}px` }}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {node.isOpen ? (
                  <ChevronDown size={14} className="text-[#5f7e97] shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-[#5f7e97] shrink-0" />
                )}
                <FolderIcon
                  size={14}
                  className="text-[#5f7e97] shrink-0 fill-[#1d3b53]"
                />
                <span className="truncate">{node.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button
                  onClick={(e) => handleAddFile(node.id, e)}
                  className="hover:text-white"
                  title="New File"
                >
                  <FilePlus size={14} />
                </button>
                <button
                  onClick={(e) => handleAddFolder(node.id, e)}
                  className="hover:text-white"
                  title="New Folder"
                >
                  <FolderPlus size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(node.id, e)}
                  className="hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {node.isOpen && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const { icon: ActiveIcon, color: iconColor } = getFileIcon(node.name);

      return (
        <div
          key={node.id}
          onClick={() => setActiveFileId(node.id)}
          className={`group flex items-center justify-between py-1.5 pr-2 cursor-pointer text-sm ${
            activeFileId === node.id
              ? "bg-[#1d3b53] text-white"
              : "hover:bg-[#122d42]"
          }`}
          style={{ paddingLeft: `${depth * 12 + 16}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden pl-4">
            <ActiveIcon
              size={14}
              className={
                activeFileId === node.id ? iconColor : "text-[#5f7e97]"
              }
            />
            <span className="truncate">{node.name}</span>
          </div>
          <button
            onClick={(e) => handleDelete(node.id, e)}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full bg-[#0b2942] border-r border-[#1d3b53] flex flex-col text-[#d6deeb]">
      <div className="flex items-center justify-between px-4 py-3 uppercase text-xs font-bold tracking-wider text-[#5f7e97] border-b border-[#1d3b53]">
        <span>Explorer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleAddFile(null, e)}
            className="hover:text-white"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={(e) => handleAddFolder(null, e)}
            className="hover:text-white"
            title="New Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">{renderTree(files)}</div>
    </div>
  );
}
