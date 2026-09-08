"use client";

import { Brain } from "lucide-react";


export function AiInvestigatorPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/50"><Brain className="h-4 w-4" /></span>
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          AI Investigator
        </h2>
      </div>
      <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center gap-6">
        {/* Shimmer skeleton */}
        <div className="w-full space-y-3">
          <div className="h-4 w-3/4 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-full rounded-lg bg-white/[0.07] animate-pulse delay-75" />
          <div className="h-4 w-5/6 rounded-lg bg-white/[0.05] animate-pulse delay-150" />
          <div className="h-4 w-2/3 rounded-lg bg-white/[0.07] animate-pulse delay-75" />
          <div className="h-4 w-4/5 rounded-lg bg-white/[0.05] animate-pulse delay-150" />
        </div>

        {/* Decorative brain icon */}
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-purple-500/20 rounded-full" />
          <Brain className="relative h-12 w-12 text-purple-400/30" />
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-white/40 italic">
            Awaiting AI analysis — connect Gemini in Phase 3.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 font-mono uppercase tracking-widest">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400/40 animate-pulse" />
            Standby
          </div>
        </div>

        {/* More shimmer */}
        <div className="w-full space-y-2 opacity-50">
          <div className="h-3 w-1/2 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-white/[0.03] animate-pulse delay-75" />
          <div className="h-3 w-1/3 rounded bg-white/[0.04] animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}
