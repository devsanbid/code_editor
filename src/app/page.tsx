"use client";

import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";

const EditorPane = dynamic(() => import("@/components/EditorPane"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#011627] text-gray-500">
      Loading editor...
    </div>
  ),
});
const TerminalPane = dynamic(() => import("@/components/TerminalPane"), {
  ssr: false,
});
const OutputPane = dynamic(() => import("@/components/OutputPane"), {
  ssr: false,
});
import { FileSystemNode } from "@/lib/types";
import { DEFAULT_FILES } from "@/lib/defaults";

export default function Home() {
  const [files, setFiles] = useState<FileSystemNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"console" | "terminal">("console");
  const [isRunning, setIsRunning] = useState(false);
  const [isVimMode, setIsVimMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(16);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [stdin, setStdin] = useState<string>("");

  const handleAddFile = async (
    parentId: string | null = null,
    e?: React.MouseEvent | KeyboardEvent,
  ) => {
    e?.preventDefault();
    e?.stopPropagation();
    const name = prompt("File name (e.g., test.js, main.py):");
    if (!name) return;

    // Quick language map
    const ext = name.split(".").pop() || "";
    const LANGUAGE_MAP: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      dart: "dart",
      java: "java",
      c: "c",
      rs: "rust",
    };
    const language = LANGUAGE_MAP[ext] || "plaintext";

    const id = parentId ? `${parentId}/${name}` : name;
    const newFile: FileSystemNode = {
      id,
      name,
      type: "file",
      language,
      content: "",
    };

    setFiles((prev) => {
      // Replicate the addNode logic
      const updateTreeAdd = (
        nodes: FileSystemNode[],
        parentId: string | null,
        newNode: FileSystemNode,
      ): FileSystemNode[] => {
        if (!parentId) return [...nodes, newNode];
        return nodes.map((node) => {
          if (node.id === parentId)
            return { ...node, children: [...(node.children || []), newNode] };
          if (node.children)
            return {
              ...node,
              children: updateTreeAdd(node.children, parentId, newNode),
            };
          return node;
        });
      };
      return updateTreeAdd(prev, parentId, newFile);
    });

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        handleAddFile(null, e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await fetch("/api/files");
        const data = await res.json();

        if (data.files && data.files.length > 0) {
          setFiles(data.files);

          // Try to find the first file
          const findFirstFile = (nodes: FileSystemNode[]): string => {
            for (const node of nodes) {
              if (node.type === "file") return node.id;
              if (node.children) {
                const childId = findFirstFile(node.children);
                if (childId) return childId;
              }
            }
            return "";
          };
          setActiveFileId(findFirstFile(data.files));
        }
      } catch (err) {
        console.error("Failed to load workspace files", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFiles();
  }, []);

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

  const activeFile = findNode(files, activeFileId);

  const updateTree = (
    nodes: FileSystemNode[],
    id: string,
    content: string,
  ): FileSystemNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, content };
      if (node.children)
        return { ...node, children: updateTree(node.children, id, content) };
      return node;
    });
  };

  const handleUpdateFile = async (id: string, content: string) => {
    setFiles((prev) => updateTree(prev, id, content));

    // Save to persistent storage
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, content }),
    });
  };

  const handleRun = async () => {
    if (!activeFile || activeFile.type !== "file") return;
    setIsRunning(true);
    setOutput("Running...");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          id: activeFile.id,
          stdin,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setOutput(`Error:\n${data.error}`);
      } else {
        setOutput(data.output);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutput(`Execution failed:\n${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#011627] text-white">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#011627] text-[#d6deeb] font-sans overflow-hidden">
      <PanelGroup direction="horizontal">
        {isSidebarOpen && (
          <>
            <Panel defaultSize={11} minSize={10} maxSize={30}>
              <Sidebar
                files={files}
                activeFileId={activeFileId}
                setActiveFileId={setActiveFileId}
                setFiles={setFiles}
                onAddFile={handleAddFile}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#1d3b53] hover:bg-blue-500 transition-colors cursor-col-resize" />
          </>
        )}

        <Panel defaultSize={isSidebarOpen ? 50 : 61} minSize={30}>
          <div className="flex flex-col h-full border-r border-[#1d3b53]">
            <EditorPane
              file={activeFile}
              onChange={(val) => handleUpdateFile(activeFileId, val || "")}
              onRun={handleRun}
              isRunning={isRunning}
              isVimMode={isVimMode}
              setIsVimMode={setIsVimMode}
              fontSize={fontSize}
              setFontSize={setFontSize}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-[#1d3b53] hover:bg-blue-500 transition-colors cursor-col-resize" />

        <Panel defaultSize={18} minSize={20}>
          <div className="flex flex-col h-full bg-[#011627]">
            <div className="flex items-center px-4 py-2 border-b border-[#1d3b53] bg-[#0b2942] text-sm text-gray-400 font-semibold tracking-wide uppercase gap-6">
              <button
                onClick={() => setActiveTab("console")}
                className={`transition-colors ${activeTab === "console" ? "text-white" : "hover:text-gray-300"}`}
              >
                Console
              </button>
              <button
                onClick={() => setActiveTab("terminal")}
                className={`transition-colors ${activeTab === "terminal" ? "text-white" : "hover:text-gray-300"}`}
              >
                Terminal
              </button>
            </div>
            {activeTab === "console" ? (
              <OutputPane
                output={output}
                stdin={stdin}
                setStdin={setStdin}
                fontSize={fontSize}
              />
            ) : (
              <TerminalPane fontSize={fontSize} />
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
