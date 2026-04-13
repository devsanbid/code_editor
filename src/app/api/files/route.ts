import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FileSystemNode } from "@/lib/types";

const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

// Helper to recursively read directory
async function readDirRecursive(dirPath: string, relativePath: string = ""): Promise<FileSystemNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileSystemNode[] = [];

  for (const entry of entries) {
    if (entry.name === ".keep" || entry.name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, entry.name);
    const nodeRelativePath = path.posix.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      const children = await readDirRecursive(fullPath, nodeRelativePath);
      nodes.push({
        id: nodeRelativePath, // Use relative path as ID for simplicity
        name: entry.name,
        type: "folder",
        children,
        isOpen: false,
      });
    } else {
      const content = await fs.readFile(fullPath, "utf-8");
      const ext = entry.name.split(".").pop() || "";
      
      const LANGUAGE_MAP: Record<string, string> = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        dart: "dart",
        java: "java",
        c: "c",
        rs: "rust",
      };

      nodes.push({
        id: nodeRelativePath,
        name: entry.name,
        type: "file",
        language: LANGUAGE_MAP[ext] || "plaintext",
        content,
      });
    }
  }
  
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });
}

export async function GET() {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    const files = await readDirRecursive(WORKSPACE_DIR);
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, id, name, type, content, parentId } = await req.json();
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });

    if (action === "create") {
      const dirPath = parentId ? path.join(WORKSPACE_DIR, parentId) : WORKSPACE_DIR;
      const targetPath = path.join(dirPath, name);
      
      if (type === "folder") {
        await fs.mkdir(targetPath, { recursive: true });
      } else {
        await fs.writeFile(targetPath, content || "");
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update" && id) {
      const targetPath = path.join(WORKSPACE_DIR, id);
      await fs.writeFile(targetPath, content || "");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    
    const targetPath = path.join(WORKSPACE_DIR, id);
    await fs.rm(targetPath, { recursive: true, force: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
