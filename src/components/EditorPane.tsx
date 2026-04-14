"use client";

import { useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { FileSystemNode } from "@/lib/types";
import { Play, Copy, AlignLeft, Keyboard } from "lucide-react";
import { createHighlighter, bundledThemes } from 'shiki';
import { shikiToMonaco } from '@shikijs/monaco';

interface EditorPaneProps {
  file?: FileSystemNode;
  onChange: (value: string | undefined) => void;
  onRun: () => void;
  isRunning: boolean;
  isVimMode: boolean;
  setIsVimMode: React.Dispatch<React.SetStateAction<boolean>>;
}

let highlighter: any = null;

export default function EditorPane({ file, onChange, onRun, isRunning, isVimMode, setIsVimMode }: EditorPaneProps) {
  const monaco = useMonaco();
  const editorRef = useRef<unknown>(null);
  const vimModeRef = useRef<unknown>(null);

  useEffect(() => {
    if (monaco) {
      // @ts-expect-error monaco-editor types
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
      });
      // @ts-expect-error monaco-editor types
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
      });

      const initShiki = async () => {
        if (!highlighter) {
          // Load the base night-owl theme
          const rawTheme = await bundledThemes['night-owl']();
          
          // Clone it so we don't mutate the cached default
          const customTheme = JSON.parse(JSON.stringify(rawTheme.default));
          customTheme.name = 'night-owl-clean';
          
          // Strip out italics and bold
          if (customTheme.tokenColors) {
            customTheme.tokenColors.forEach((token: any) => {
              if (token.settings && token.settings.fontStyle) {
                delete token.settings.fontStyle;
              }
            });
          }

          // Remove distracting borders by making them transparent instead of deleting (which can trigger fallbacks)
          if (customTheme.colors) {
            customTheme.colors['editor.selectionHighlightBorder'] = '#00000000';
            customTheme.colors['editor.wordHighlightBorder'] = '#00000000';
            customTheme.colors['editor.wordHighlightStrongBorder'] = '#00000000';
            customTheme.colors['editor.findMatchBorder'] = '#00000000';
            customTheme.colors['editor.findMatchHighlightBorder'] = '#00000000';
          }

          highlighter = await createHighlighter({
            themes: [customTheme],
            langs: ['javascript', 'typescript', 'python', 'dart', 'java', 'c', 'rust'],
          });
        }
        
        ['javascript', 'typescript', 'python', 'dart', 'java', 'c', 'rust'].forEach((id) => {
          monaco.languages.register({ id });
        });

        shikiToMonaco(highlighter, monaco);
        monaco.editor.setTheme('night-owl-clean');
      };

      initShiki();
    }
  }, [monaco]);

  useEffect(() => {
    let active = true;
    const applyVimMode = async () => {
      if (!editorRef.current) return;
      if (isVimMode) {
        // Dynamically import to avoid SSR issues
        const { initVimMode } = await import("monaco-vim");
        const statusNode = document.getElementById("vim-status");
        if (statusNode && editorRef.current && active) {
           // @ts-expect-error monaco-vim types
           vimModeRef.current = initVimMode(editorRef.current, statusNode);
        }
      } else {
        if (vimModeRef.current) {
          (vimModeRef.current as { dispose: () => void }).dispose();
          vimModeRef.current = null;
        }
      }
    };
    applyVimMode();
    return () => {
      active = false;
      if (vimModeRef.current) {
        (vimModeRef.current as { dispose: () => void }).dispose();
        vimModeRef.current = null;
      }
    };
  }, [isVimMode]);

  const onRunRef = useRef(onRun);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const handleEditorWillMount = () => {
    // Theme is now managed by shiki
  };

  const handleEditorDidMount = async (editor: unknown, _monaco: unknown) => {
    editorRef.current = editor;
    
    if (editor && _monaco) {
      (editor as { addCommand: (key: number, handler: () => void) => void }).addCommand(
        (_monaco as { KeyMod: { CtrlCmd: number }, KeyCode: { Enter: number } }).KeyMod.CtrlCmd | (_monaco as { KeyMod: { CtrlCmd: number }, KeyCode: { Enter: number } }).KeyCode.Enter,
        () => {
          onRunRef.current();
        }
      );
      
      // Initialize vim mode immediately if it's supposed to be on by default
      if (isVimMode && !vimModeRef.current) {
        const { initVimMode } = await import("monaco-vim");
        const statusNode = document.getElementById("vim-status");
        if (statusNode) {
           // @ts-expect-error monaco-vim types
           vimModeRef.current = initVimMode(editor, statusNode);
        }
      }
    }
  };

  const handleCopy = () => {
    if (file?.content) {
      navigator.clipboard.writeText(file.content);
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      (editorRef.current as { getAction: (id: string) => { run: () => void } }).getAction("editor.action.formatDocument").run();
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-[#011627]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1d3b53] bg-[#0b2942]">
        <div className="flex items-center gap-4">
          <span className="text-gray-300 font-medium text-sm">{file?.name}</span>
          <button
            onClick={() => setIsVimMode(!isVimMode)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              isVimMode ? "bg-green-600/20 text-green-400" : "text-gray-400 hover:text-white"
            }`}
            title="Toggle Vim Mode"
          >
            <Keyboard size={14} />
            VIM
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#1d3b53] rounded transition-colors"
          >
            <AlignLeft size={14} /> Format
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#1d3b53] rounded transition-colors"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-colors"
          >
            <Play size={14} /> {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={file?.language || "plaintext"}
          value={file?.content || ""}
          theme="night-owl-clean"
          onChange={onChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            padding: { top: 16 },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: "off",
            tabCompletion: "off",
            wordBasedSuggestions: "off",
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            selectionHighlight: false,
            occurrencesHighlight: "off",
            renderLineHighlight: "none",
            matchBrackets: "never",
            bracketPairColorization: { enabled: false },
            renderValidationDecorations: "off",
            unicodeHighlight: {
              ambiguousCharacters: false,
              invisibleCharacters: false,
              nonBasicASCII: false,
            },
            renderWhitespace: "none",
            renderControlCharacters: false,
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
        />
        {/* Vim status line container */}
        <div
          id="vim-status"
          className={`absolute bottom-0 left-0 right-0 h-6 bg-green-900/40 text-green-300 text-xs px-4 flex items-center ${
            isVimMode ? "block" : "hidden"
          }`}
        ></div>
      </div>
    </div>
  );
}
