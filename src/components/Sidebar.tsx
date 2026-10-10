import {
  Gavel,
  LayoutDashboard,
  BrainCircuit,
  Library,
  FileSearch,
  Handshake,
  Settings,
  ShieldCheck,
  Database,
  Scale,
  X,
  Zap,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language, translations } from "../lib/translations";

interface SidebarProps {
  currentView: string;
  language: Language;
  onViewChange: (view: string) => void;
  onNewAnalysis: () => void;
  onAskAI: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-mono font-bold mb-2">
    {children}
  </p>
);

export default function Sidebar({
  currentView,
  language,
  onViewChange,
  onNewAnalysis,
  onAskAI,
  isOpen,
  onClose,
}: SidebarProps) {
  const t = translations[language];

  const aiItems = [
    { id: "chat", label: t.chat, icon: BrainCircuit, tag: language === "hi" ? "लाइव" : "Live", accent: true },
  ];

  const suiteItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "analyzer", label: t.analyzer, icon: FileSearch },
    { id: "templates", label: t.templates, icon: Library },
  ];

  const auditItems = [
    { id: "vault", label: t.vault, icon: Database },
    { id: "handoff", label: t.handoff, icon: Handshake },
    { id: "indianlaw", label: t.indianLaw, icon: Scale },
  ];

  const handleLink = (id: string) => { onViewChange(id); onClose?.(); };

  const NavItem = ({
    id, label, icon: Icon, tag, accent = false,
  }: { id: string; label: string; icon: React.ElementType; tag?: string; accent?: boolean }) => {
    const isActive = currentView === id;
    return (
      <motion.button
        key={id}
        onClick={() => handleLink(id)}
        id={`nav-item-${id}`}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-300 ease-out text-left outline-none will-change-transform shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${
          isActive
            ? accent
              ? "bg-zinc-300/15 text-zinc-200 border border-zinc-300/25 font-semibold"
              : "bg-white/8 text-white font-semibold border border-white/10"
            : accent
              ? "text-slate-400 hover:text-zinc-200 hover:bg-zinc-300/8 border border-transparent"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${
            isActive
              ? accent ? "text-white" : "text-white"
              : accent ? "text-zinc-300" : "text-slate-500"
          }`} />
          <span className="uppercase tracking-[0.07em] font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {tag && (
            <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider rounded-md ${
              accent ? "bg-zinc-300/15 text-white border border-zinc-300/25" : "bg-white/10 text-white border border-white/15"
            }`}>
              {tag}
            </span>
          )}
          {isActive && !tag && (
            <span className={`w-1.5 h-1.5 rounded-full ${accent ? "bg-white animate-pulse" : "bg-white animate-pulse"}`} />
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 bottom-0 z-50 lg:z-40 flex flex-col w-64 h-full border-r border-white/[0.08] bg-zinc-950/40 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] shrink-0 transition-all duration-300 ease-out ${
          isOpen ? "left-0" : "-left-64"
        }`}
        style={{ willChange: "transform", boxShadow: 'inset -1px 0 0 0 rgba(255, 255, 255, 0.05)' }}
      >
        {/* Brand header */}
        <div className="py-6 px-5 flex flex-col gap-2 border-b border-white/[0.06] relative">
          {/* Subtle emerald top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-300/10 border border-zinc-300/25 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white">{t.appName}</h1>
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600 font-mono">
                  {language === "hi" ? "संस्थागत एआई" : "Institutional AI"}
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-white transition-colors lg:hidden outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* CTA New Analysis button */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => { onNewAnalysis(); onClose?.(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-300/10 border border-zinc-300/25 text-white text-xs font-semibold uppercase tracking-wider hover:bg-zinc-300/15 hover:border-zinc-300/40 transition-all spring-bounce outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            {language === "hi" ? "नया विश्लेषण" : "New Analysis"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <SectionLabel>{language === "hi" ? "एआई सहायक" : "AI Assistants"}</SectionLabel>
            {aiItems.map((item) => <NavItem key={item.id} {...item} />)}
          </div>

          <div className="space-y-1">
            <SectionLabel>{language === "hi" ? "कानूनी सुइट" : "Legal Suite"}</SectionLabel>
            {suiteItems.map((item) => <NavItem key={item.id} {...item} />)}
          </div>

          <div className="space-y-1">
            <SectionLabel>{language === "hi" ? "ऑडिट और एस्केलेशन" : "Audit & Escalation"}</SectionLabel>
            {auditItems.map((item) => <NavItem key={item.id} {...item} />)}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          <motion.button
            onClick={() => handleLink("settings")}
            id="nav-item-settings"
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left outline-none border ${
              currentView === "settings"
                ? "bg-white/8 text-white font-semibold border-white/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={`w-3.5 h-3.5 ${currentView === "settings" ? "text-white animate-spin" : "text-slate-500"}`} style={{ animationDuration: "8s" }} />
              <span className="uppercase tracking-[0.07em] font-medium">{t.settings}</span>
            </div>
            {currentView === "settings" && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          </motion.button>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-300/15 bg-zinc-300/[0.04]">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-semibold">{t.userAccount}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
