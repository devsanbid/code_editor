interface OutputPaneProps {
  output: string;
  stdin: string;
  setStdin: (val: string) => void;
  fontSize: number;
}

export default function OutputPane({ output, stdin, setStdin, fontSize }: OutputPaneProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#011627] overflow-hidden">
      <div className="flex-1 overflow-auto border-b border-[#1d3b53]">
        <pre 
          className="p-4 font-mono text-[#d6deeb] whitespace-pre-wrap leading-relaxed break-words"
          style={{ fontSize: `${fontSize}px` }}
        >
          {output || "Output will appear here..."}
        </pre>
      </div>
      <div className="h-32 bg-[#011627] flex flex-col">
        <div className="px-4 py-1 text-xs text-[#5f7e97] font-semibold uppercase tracking-wider bg-[#0b2942] border-b border-[#1d3b53]">
          Standard Input (stdin)
        </div>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Enter input here before clicking run..."
          className="flex-1 w-full bg-transparent text-[#d6deeb] font-mono p-2 resize-none outline-none focus:ring-1 focus:ring-[#1d3b53]"
          style={{ fontSize: `${fontSize}px` }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
