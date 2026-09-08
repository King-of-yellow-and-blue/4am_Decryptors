"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SplineBackground } from "@/components/SplineBackground";
import { RedAlertOverlay } from "@/components/RedAlertOverlay";
import { GlassPanel } from "@/components/GlassPanel";
import { SimulateAttackButton } from "@/components/SimulateAttackButton";
import { LiveLogFeedPanel } from "@/components/panels/LiveLogFeedPanel";
import { MitreMapPanel } from "@/components/panels/MitreMapPanel";
import { AiInvestigatorPanel } from "@/components/panels/AiInvestigatorPanel";
import { mockThreatSource } from "@/lib/mockThreatEngine";
import { supabaseThreatSource } from "@/lib/supabaseThreatSource";

const threatSource =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? mockThreatSource : supabaseThreatSource;

export default function Home() {
  const [isThreatDetected, setIsThreatDetected] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = threatSource.onThreatEvent(() => {
      setIsThreatDetected(true);
      window.setTimeout(() => setIsThreatDetected(false), 4000);
    });
    return unsubscribe;
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Background stage — Spline + Red Alert overlay, isolated from the UI layer */}
      <div className="fixed inset-0 isolate">
        <SplineBackground />
        <RedAlertOverlay active={isThreatDetected} />
      </div>

      {/* UI layer */}
      <div className="relative z-10 flex min-h-screen flex-col gap-6 p-6">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">TraceGrid</h1>
          <span className="text-xs uppercase tracking-widest text-white/50 border-r border-white/20 pr-4">
            SOC Dashboard
          </span>
          <div className="ml-auto hidden md:block">
            <SimulateAttackButton threatSource={threatSource} />
          </div>
        </header>

        {/* Mobile controls */}
        <div className="md:hidden">
          <SimulateAttackButton threatSource={threatSource} />
        </div>

        <div className="grid flex-1 grid-cols-12 gap-6">
          {/* Left column — Live Log Feed */}
          <div className="col-span-12 lg:col-span-3">
            <GlassPanel active={isThreatDetected} className="h-[600px]">
              <LiveLogFeedPanel threatSource={threatSource} onLogClick={(logText) => setSelectedLog(logText)} />
            </GlassPanel>
          </div>

          {/* Center column — kept empty so the Spline sphere is 100% visible */}
          <div className="col-span-12 lg:col-span-6 flex items-center justify-center pointer-events-none min-h-[300px]">
            {isThreatDetected && (
              <div className="animate-bounce">
                <div className="flex items-center gap-2 rounded-full border border-red-400/50 bg-red-600/90 px-6 py-3 shadow-[0_0_40px_rgba(220,38,38,0.6)] backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold tracking-widest text-white">
                    CRITICAL ANOMALY DETECTED
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right column — MITRE map stacked above AI Investigator */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <GlassPanel active={isThreatDetected}>
              <MitreMapPanel threatSource={threatSource} />
            </GlassPanel>
            <GlassPanel active={isThreatDetected} className="flex-1">
              <AiInvestigatorPanel selectedLog={selectedLog} />
            </GlassPanel>
          </div>
        </div>
      </div>
    </main>
  );
}
