import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import prettier from "prettier";

const execAsync = promisify(exec);

const WORKSPACE_DIR = path.join(process.cwd(), "workspace");

export async function POST(req: Request) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Code and language are required" },
        { status: 400 },
      );
    }

    // Try fast native Prettier for supported languages first
    if (
      ["javascript", "typescript", "json", "html", "css", "markdown"].includes(
        language,
      )
    ) {
      try {
        const formatted = await prettier.format(code, {
          parser:
            language === "javascript"
              ? "babel"
              : language === "typescript"
                ? "typescript"
                : language === "json"
                  ? "json"
                  : language === "html"
                    ? "html"
                    : language === "css"
                      ? "css"
                      : "markdown",
          semi: true,
          singleQuote: false,
          tabWidth: 2,
        });
        return NextResponse.json({ code: formatted });
      } catch (err: unknown) {
        console.error("Prettier formatting error:", err);
        return NextResponse.json({ code }); // fallback to original code on parse error
      }
    }

    // For other languages, use Docker environment
    const tempId = `format_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let extension = "txt";

    switch (language) {
      case "python":
        extension = "py";
        break;
      case "dart":
        extension = "dart";
        break;
      case "java":
        extension = "java";
        break;
      case "c":
        extension = "c";
        break;
      case "rust":
        extension = "rs";
        break;
    }

    const fileName = `${tempId}.${extension}`;
    const filePath = path.join(WORKSPACE_DIR, fileName);

    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    await fs.writeFile(filePath, code);

    let formatCommand = "";

    switch (language) {
      case "java":
        // npx prettier inside container with plugin
        formatCommand = `npx --yes prettier@3 --write /workspace/${fileName}`;
        break;
      case "dart":
        formatCommand = `dart format /workspace/${fileName}`;
        break;
      case "rust":
        formatCommand = `rustfmt /workspace/${fileName}`;
        break;
      case "python":
        formatCommand = `pip install --quiet autopep8 && autopep8 --in-place /workspace/${fileName}`;
        break;
      case "c":
        formatCommand = `apt-get update -qq && apt-get install -y -qq clang-format && clang-format -i /workspace/${fileName}`;
        break;
      default:
        await fs.unlink(filePath).catch(() => {});
        return NextResponse.json({ code });
    }

    const dockerCmd = `timeout 15s docker run --rm --network host --memory="256m" --cpus="1.0" -v "${WORKSPACE_DIR}":/workspace opencode-env sh -c "${formatCommand}"`;

    try {
      await execAsync(dockerCmd, { timeout: 20000 });
      const formattedCode = await fs.readFile(filePath, "utf-8");
      await fs.unlink(filePath).catch(() => {});
      return NextResponse.json({ code: formattedCode });
    } catch (execError: unknown) {
      await fs.unlink(filePath).catch(() => {});
      const err = execError as {
        killed?: boolean;
        stderr?: string;
        message?: string;
      };
      return NextResponse.json(
        { error: "Formatting failed: " + (err.stderr || err.message) },
        { status: 500 },
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error: " + errorMsg },
      { status: 500 },
    );
  }
}
