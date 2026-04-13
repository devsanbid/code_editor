import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);
const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    // Ensure workspace exists
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });

    // We use execFile with args to prevent command injection on the host machine.
    // The command is executed INSIDE the docker container via 'sh -c'.
    const args = [
      "run",
      "--rm",
      // Network is NOT 'none' here so users can reach npm, pip, etc.
      "-v", `${WORKSPACE_DIR}:/workspace`,
      "-w", "/workspace",
      "opencode-env",
      "sh", "-c", command
    ];

    try {
      const { stdout, stderr } = await execFileAsync("docker", args, { timeout: 60000 }); // 60s timeout for installs
      return NextResponse.json({ output: stdout || stderr });
    } catch (execError: unknown) {
      const err = execError as { killed?: boolean, stderr?: string, message?: string };
      if (err.killed) {
        return NextResponse.json({ error: "Execution timed out (60s limit)." });
      }
      return NextResponse.json({ error: err.stderr || err.message || "Command failed" });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Internal server error: " + errorMsg }, { status: 500 });
  }
}
