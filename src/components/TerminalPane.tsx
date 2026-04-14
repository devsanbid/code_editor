"use client";

import { useState, useRef, useEffect } from "react";

interface HistoryItem {
  id: number;
  type: "command" | "output" | "error";
  text: string;
}

interface TerminalPaneProps {
  fontSize: number;
}

export default function TerminalPane({ fontSize }: TerminalPaneProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() && !isExecuting) {
      const cmd = input.trim();
      setInput("");
      
      if (cmd === "clear") {
        setHistory([]);
        return;
      }
      
      const newId = Date.now();
      setHistory(prev => [...prev, { id: newId, type: "command", text: cmd }]);
      setIsExecuting(true);

      try {
        const res = await fetch("/api/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd }),
        });
        const data = await res.json();
        
        if (data.error) {
          setHistory(prev => [...prev, { id: Date.now() + 1, type: "error", text: data.error }]);
        } else {
          setHistory(prev => [...prev, { id: Date.now() + 2, type: "output", text: data.output || "" }]);
        }
      } catch (err: unknown) {
        setHistory(prev => [...prev, { id: Date.now() + 3, type: "error", text: String(err) }]);
      } finally {
        setIsExecuting(false);
        // refocus input
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#011627] overflow-hidden font-mono leading-relaxed cursor-text"
      style={{ fontSize: `${fontSize}px` }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap break-words">
            {item.type === "command" && (
              <div className="flex text-[#d6deeb] font-semibold">
                <span className="text-green-400 mr-2">➜</span>
                <span className="text-blue-400 mr-2">~/workspace</span>
                <span>$ {item.text}</span>
              </div>
            )}
            {item.type === "output" && (
              <div className="text-[#d6deeb] ml-2">{item.text || "(no output)"}</div>
            )}
            {item.type === "error" && (
              <div className="text-red-400 ml-2">{item.text}</div>
            )}
          </div>
        ))}
        {isExecuting && (
          <div className="text-gray-500 ml-2 animate-pulse">Running command...</div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="flex items-center px-4 pb-4">
        <span className="text-green-400 mr-2 font-semibold">➜</span>
        <span className="text-blue-400 mr-2 font-semibold">~/workspace</span>
        <span className="text-[#d6deeb] mr-2 font-semibold">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          disabled={isExecuting}
          className="flex-1 bg-transparent outline-none text-[#d6deeb] border-none placeholder-gray-600 disabled:opacity-50 font-mono"
          autoFocus
          spellCheck="false"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
