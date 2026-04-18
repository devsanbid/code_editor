import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const SUPPORTED_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "dart",
  "java",
  "c",
  "rust",
];
const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

export async function POST(req: Request) {
  try {
    const { code, language, id, stdin } = await req.json();

    if (!code || !language || !id) {
      return NextResponse.json(
        { error: "Code, language, and file ID are required" },
        { status: 400 },
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 },
      );
    }

    // Ensure workspace exists
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });

    // Save the code to the persistent workspace before running
    const filePath = path.join(WORKSPACE_DIR, id);
    await fs.writeFile(filePath, code);

    // Save stdin to a file so we can pipe it into the command safely
    const stdinPath = path.join(WORKSPACE_DIR, ".stdin.txt");
    await fs.writeFile(stdinPath, stdin || "");

    const image = "opencode-env"; // Universal Ubuntu container

    const fileName = path.basename(filePath);
    const relativeDir = path.dirname(id);
    const workDir =
      relativeDir === "." ? "/workspace" : `/workspace/${relativeDir}`;

    let runCommand = "";
    switch (language) {
      case "python":
        runCommand = `python3 ${fileName} < /workspace/.stdin.txt`;
        break;
      case "javascript":
        runCommand = `node ${fileName} < /workspace/.stdin.txt`;
        break;
      case "typescript":
        runCommand = `tsx ${fileName} < /workspace/.stdin.txt`;
        break;
      case "dart":
        runCommand = `dart run ${fileName} < /workspace/.stdin.txt`;
        break;
      case "java":
        // Use Java 11+ single-file execution to skip javac overhead
        // Use -XX:TieredStopAtLevel=1 for fast startup (disables slow C2 compiler)
        runCommand = `java -XX:TieredStopAtLevel=1 ${fileName} < /workspace/.stdin.txt`;
        break;
      case "c":
        runCommand = `gcc ${fileName} -o main && ./main < /workspace/.stdin.txt`;
        break;
      case "rust":
        runCommand = `rustc ${fileName} && ./main < /workspace/.stdin.txt`;
        break;
    }

    // Docker command to run securely:
    // -v mounts the persistent workspace
    // -w sets the working directory to the file's directory inside workspace
    const hostWorkspaceDir = process.env.HOST_WORKSPACE_DIR || WORKSPACE_DIR;

    // Give containers 1.0 CPU instead of 0.5. The JVM and compilers (rustc, gcc, tsx) struggle on 0.5 CPU
    const cpus = language === "java" ? "1.5" : "1.0";
    const memory = language === "java" ? "512m" : "256m";

    const dockerCmd = `timeout 5s docker run --rm --network none --memory="${memory}" --cpus="${cpus}" -v "${hostWorkspaceDir}":/workspace -w "${workDir}" ${image} sh -c "${runCommand}"`;

    try {
      const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 10000 });
      return NextResponse.json({ output: stdout || stderr });
    } catch (execError: unknown) {
      const err = execError as {
        killed?: boolean;
        stderr?: string;
        message?: string;
      };
      if (err.killed) {
        return NextResponse.json({ error: "Execution timed out (5s limit)." });
      }
      return NextResponse.json({
        error: err.stderr || err.message || "Execution failed.",
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error: " + errorMsg },
      { status: 500 },
    );
  }
}
