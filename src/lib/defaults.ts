import { FileSystemNode } from "./types";
import { v4 as uuidv4 } from "uuid";

export const DEFAULT_FILES: FileSystemNode[] = [
  {
    id: uuidv4(),
    name: "main.dart",
    type: "file",
    language: "dart",
    content: `void main() {\n  print('Hello, DartPad style!');\n}`,
  },
  {
    id: uuidv4(),
    name: "main.py",
    type: "file",
    language: "python",
    content: `def main():\n    print("Hello from Python!")\n\nif __name__ == "__main__":\n    main()`,
  },
  {
    id: uuidv4(),
    name: "Main.java",
    type: "file",
    language: "java",
    content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`,
  },
  {
    id: uuidv4(),
    name: "main.ts",
    type: "file",
    language: "typescript",
    content: `function greet(name: string) {\n  console.log(\`Hello, \${name}!\`);\n}\n\ngreet("TypeScript");`,
  },
  {
    id: uuidv4(),
    name: "main.rs",
    type: "file",
    language: "rust",
    content: `fn main() {\n    println!("Hello from Rust!");\n}`,
  },
  {
    id: uuidv4(),
    name: "main.c",
    type: "file",
    language: "c",
    content: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}`,
  }
];
