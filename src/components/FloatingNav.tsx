import { useState } from "react";
import {
  LayoutDashboard,
  BrainCircuit,
  Library,
  FileSearch,
  Handshake,
  Database,
  Scale,
  Plus
} from "lucide-react";
import { Language, translations } from "../lib/translations";

interface FloatingNavProps {
  currentView: string;
  language: Language;
  onViewChange: (view: string) => void;
  onNewAnalysis: () => void;
  onAskAI: () => void;
}

export default function FloatingNav({
  currentView,
  language,
  onViewChange,
  onNewAnalysis,
  onAskAI,
}: FloatingNavProps) {
  const t = translations[language];
  const [isHovered, setIsHovered] = useState(false);

  const items = [
    { id: "new", label: language === "hi" ? "नया" : "New", icon: Plus, action: onNewAnalysis, highlight: true },
    { id: "chat", label: t.chat, icon: BrainCircuit, action: onAskAI, tag: "AI" },
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard, action: () => onViewChange("dashboard") },
    { id: "analyzer", label: t.analyzer, icon: FileSearch, action: () => onViewChange("analyzer") },
    { id: "templates", label: t.templates, icon: Library, action: () => onViewChange("templates") },
    { id: "vault", label: t.vault, icon: Database, action: () => onViewChange("vault") },
    { id: "handoff", label: t.handoff, icon: Handshake, action: () => onViewChange("handoff") },
    { id: "indianlaw", label: t.indianLaw, icon: Scale, action: () => onViewChange("indianlaw") },
  ];

  return (
    <>
      {/* Invisible hover trigger area at the top */}
      <div 
        className="fixed top-0 left-0 right-0 h-10 z-[100]" 
        onMouseEnter={() => setIsHovered(true)} 
      />
      
      {/* Floating nav */}
      <div 
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[99] transition-all duration-500 ease-out"
        style={{
          transform: isHovered ? "translate(-50%, 0)" : "translate(-50%, -150%)",
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none"
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-1.5 p-2 rounded-3xl bg-zinc-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          {items.map(item => (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 outline-none ${
                currentView === item.id 
                  ? "bg-white/10 text-white border border-white/15" 
                  : item.highlight
                    ? "bg-white/5 text-zinc-200 border border-white/10 hover:bg-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.tag && (
                <span className="px-1.5 py-0.5 text-[9px] bg-white/10 rounded-md font-mono text-zinc-300">
                  {item.tag}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
