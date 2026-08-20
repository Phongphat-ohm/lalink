"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

interface CodeSnippetProps {
  language?: string;
  code: string;
  title?: string;
}

export function CodeSnippet({ language = "bash", code, title }: CodeSnippetProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2 text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          {title && <span className="ml-2 font-medium text-slate-300">{title}</span>}
        </div>
        <div className="flex items-center space-x-3">
          <span className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">{language}</span>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>คัดลอก</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
        <pre className="font-mono">{code}</pre>
      </div>
    </div>
  );
}
