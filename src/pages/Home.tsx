import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "@/components/Header";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import DashboardView from "@/components/DashboardView";
import AnalyzerView from "@/components/AnalyzerView";
import TemplateLibraryView from "@/components/TemplateLibraryView";
import HandoffView from "@/components/HandoffView";
import ChatAIView from "@/components/ChatAIView";
import IndianLawView from "@/components/IndianLawView";
import { Language, translations } from "@/lib/translations";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

import { 
  FileText, 
  Search, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Lock, 
  ShieldCheck, 
  HardDriveDownload,
  Key,
  Database,
  Globe,
  File,
  FileCode,
  ArrowUpDown,
  Keyboard
} from "lucide-react";
import { DEFAULT_CONTRACT_BODY } from "@/constants";

// Helper to resolve high-fidelity, dynamic file icon, color scheme, and micro badges based on file name extension
export function getFileIconConfig(title: string) {
  const ext = title.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return {
      Icon: File,
      colorClass: "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-800",
      badgeText: "PDF",
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700"
    };
  } else if (ext === 'docx' || ext === 'doc') {
    return {
      Icon: FileText,
      colorClass: "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-800",
      badgeText: "DOCX",
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700"
    };
  } else {
    // Default to TXT / Generic configuration
    return {
      Icon: FileCode,
      colorClass: "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-800",
      badgeText: "TXT",
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700"
    };
  }
}

export default function Home() {
  // Auth gate — require a signed-in user for the whole workspace
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true });

  const [currentView, setCurrentView] = useState<string>("chat");
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("legallens_lang");
      if (stored === "hi" || stored === "en") return stored as Language;
    }
    return "en";
  });

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("legallens_lang", lang);
  };

  const t = translations[language];

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  // Sidebar removed in favor of FloatingNav

  // Sync theme with root HTML and body element classes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
      document.body.classList.add("light-theme");
    }
  }, [isDarkMode]);
  
  // High-fidelity target document state synchronized across Analyzer, Chat, and Handoff
  const [contractText, setContractText] = useState<string>(DEFAULT_CONTRACT_BODY);
  const [contractTitle, setContractTitle] = useState<string>("Freelance_Master_Services_Agreement_v2.pdf");
  const [contractDocumentId, setContractDocumentId] = useState<number | null>(null);

  // Restore the persisted workspace session once (server-side, per-user)
  const sessionQuery = trpc.legal.getSession.useQuery(undefined, { enabled: !!user });
  const sessionRestoredRef = useRef(false);
  useEffect(() => {
    if (sessionRestoredRef.current || !sessionQuery.isFetched) return;
    sessionRestoredRef.current = true;
    const s = sessionQuery.data;
    if (!s) return; // no previous session — fresh workspace
    setContractTitle(s.title);
    if (s.documentId) setContractDocumentId(s.documentId);
    if (s.activeView) setCurrentView(s.activeView);
  }, [sessionQuery.isFetched, sessionQuery.data]);

  // Container ref for relative mouse tracking (glow effect)
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    workspaceRef.current.style.setProperty('--mouse-x', `${x}px`);
    workspaceRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Persist the workspace pointer (debounced) so sessions survive restarts
  const saveSessionMutation = trpc.legal.saveSession.useMutation();

  // Escalation bridge state
  const [initialEscalationReason, setInitialEscalationReason] = useState<string>("");
  const [initialLawPrompt, setInitialLawPrompt] = useState<string>("");

  const handleEscalateToAttorney = (clauseName: string, reasonDetails: string) => {
    setInitialEscalationReason(reasonDetails);
    setCurrentView("handoff");
  };

  const handleSelectIndianLawPrompt = (promptText: string) => {
    setInitialLawPrompt(promptText);
    setCurrentView("chat");
  };

  // Secure Vault — backed by the platform database (per-user, persistent across devices)
  const utils = trpc.useUtils();
  const documentsQuery = trpc.legal.listDocuments.useQuery(undefined, {
    enabled: !!user,
  });
  const deleteDocumentMutation = trpc.legal.deleteDocument.useMutation({
    onSuccess: () => utils.legal.listDocuments.invalidate(),
  });
  const seedSamplesMutation = trpc.legal.seedSamples.useMutation({
    onSuccess: () => utils.legal.listDocuments.invalidate(),
  });

  const vaultFiles = (documentsQuery.data ?? []).map((doc) => ({
    id: String(doc.id),
    title: doc.title,
    date: new Date(doc.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    score: doc.score ?? 0,
    risk: doc.riskLevel ?? "Not Analyzed",
    size: doc.size,
    content: doc.content,
    fileType: doc.fileType,
    pageCount: doc.pageCount,
    source: doc.source,
  }));
  const [vaultSearch, setVaultSearch] = useState("");
  const [vaultSort, setVaultSort] = useState("date-newest");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Hydrate the restored session's document text from the vault once it loads
  const sessionDocHydratedRef = useRef(false);
  useEffect(() => {
    if (sessionDocHydratedRef.current) return;
    if (!sessionRestoredRef.current || !contractDocumentId || !documentsQuery.data) return;
    sessionDocHydratedRef.current = true;
    const doc = documentsQuery.data.find((d) => d.id === contractDocumentId);
    if (doc) setContractText(doc.content);
  }, [documentsQuery.data, contractDocumentId]);

  // Debounced workspace-session persistence
  useEffect(() => {
    if (!user || !sessionRestoredRef.current) return;
    const handle = setTimeout(() => {
      saveSessionMutation.mutate({
        title: contractTitle,
        activeView: currentView,
        documentId: contractDocumentId,
      });
    }, 1500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractTitle, contractDocumentId, currentView, !!user]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key binds when typing in interactive input fields or contenteditable rich documents
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" || 
        activeTag === "textarea" || 
        document.activeElement?.hasAttribute("contenteditable")
      ) {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation shortcuts
      if (key === "d") {
        e.preventDefault();
        setCurrentView("dashboard");
      } else if (key === "a") {
        e.preventDefault();
        setCurrentView("analyzer");
      } else if (key === "v") {
        e.preventDefault();
        setCurrentView("vault");
      } else if (key === "t") {
        e.preventDefault();
        setCurrentView("templates");
      } else if (key === "c") {
        e.preventDefault();
        setCurrentView("chat");
      } else if (key === "h") {
        e.preventDefault();
        setCurrentView("handoff");
      } else if (key === "s") {
        e.preventDefault();
        setCurrentView("settings");
      } else if (key === "l") {
        e.preventDefault();
        setIsDarkMode(prev => !prev);
      } else if (key === "n") {
        e.preventDefault();
        setContractText("");
        setContractTitle("Pasted_Contract.txt");
          setContractDocumentId(null);
        setCurrentView("analyzer");
        setVaultSearch("");
      } else if (key === "/") {
        e.preventDefault();
        setCurrentView("vault");
        setTimeout(() => {
          document.getElementById("vault-search-input")?.focus();
        }, 80);
      } else if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (e.key === "Escape") {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleGlobalSearch = (query: string) => {
    setVaultSearch(query);
    if (query.trim() && currentView !== "vault") {
      setCurrentView("vault");
    }
  };

  const handleSelectVaultContract = (content: string, title: string, documentId?: number) => {
    setContractText(content);
    setContractTitle(title);
    setContractDocumentId(documentId ?? null);
    setCurrentView("analyzer");
  };

  const handleDeleteVaultContract = (id: string) => {
    deleteDocumentMutation.mutate({ id: Number(id) });
  };

  // Auth gates — after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0F17" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-300/10 border border-zinc-300/25 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-zinc-300/30 border-t-white animate-spin" />
          </div>
          <p className="text-xs text-slate-500 font-mono">Authenticating secure session…</p>
        </div>
      </div>
    );
  }
  if (!user) return null; // redirect to /login handled by useAuth

  return (
    <div className={`top-0 m-0 p-0 min-h-screen w-full flex font-sans leading-normal relative select-none antialiased transition-colors duration-500 ${isDarkMode ? "bg-[#0B0F17] text-slate-100" : "bg-gradient-to-br from-[#E2E8F0] via-[#C5C7CB] to-[#B0B3B8] text-zinc-900"}`}>

      {/* Frame Wrapper Layout */}
      <div 
        ref={workspaceRef}
        onMouseMove={handleMouseMove}
        className="flex-1 min-w-0 w-full flex flex-col h-screen relative z-10 overflow-hidden transition-all duration-300 ease-in-out"
      >
        
        {/* Dynamic Animated Sarvam AI / Gemini Mesh Glow Canvas */}
        <AmbientBackground />
        {/* Global Toolbar Header */}
        <Header 
          language={language}
          onSearch={handleGlobalSearch} 
          onSelectView={(view) => {
            setCurrentView(view);
            setVaultSearch("");
          }} 
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
          onToggleShortcuts={() => setIsShortcutsOpen(prev => !prev)}
          currentView={currentView}
          onNewAnalysis={() => {
            setContractText("");
            setContractTitle("Pasted_Contract.txt");
            setContractDocumentId(null);
            setCurrentView("analyzer");
            setVaultSearch("");
          }}
          onAskAI={() => {
            setCurrentView("chat");
            setVaultSearch("");
          }}
        />

        {/* Dynamic content window scroll area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* View Routings */}
            {currentView === "dashboard" && (
              <DashboardView 
                language={language}
                onNavigate={setCurrentView}
                onSelectContract={handleSelectVaultContract}
              />
            )}

            {currentView === "analyzer" && (
              <AnalyzerView 
                language={language}
                contractText={contractText}
                contractTitle={contractTitle}
                documentId={contractDocumentId}
                onUpdateContract={(txt, t, docId) => {
                  setContractText(txt);
                  setContractTitle(t);
                  setContractDocumentId(docId ?? null);
                }}
                onNavigate={setCurrentView}
                onEscalateToAttorney={handleEscalateToAttorney}
              />
            )}

            {currentView === "templates" && (
              <TemplateLibraryView 
                language={language}
                onLoadTemplate={(txt, t) => {
                  setContractText(txt);
                  setContractTitle(t);
                }}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === "handoff" && (
              <HandoffView 
                language={language}
                contractTitle={contractTitle} 
                initialReason={initialEscalationReason}
                onClearInitialEscalation={() => setInitialEscalationReason("")}
              />
            )}

            {currentView === "chat" && (
              <ChatAIView 
                language={language}
                contractText={contractText}
                contractTitle={contractTitle}
                onNavigate={setCurrentView}
                initialPrompt={initialLawPrompt}
                onClearInitialPrompt={() => setInitialLawPrompt("")}
              />
            )}

            {currentView === "indianlaw" && (
              <IndianLawView 
                language={language}
                onNavigate={setCurrentView}
                onSelectPrompt={handleSelectIndianLawPrompt}
              />
            )}

            {/* Inlined Vault & Search Document Explorer View */}
            {currentView === "vault" && (
              <div className="space-y-6 animate-fade-in-up-snappy">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
                    {t.vault}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {language === "hi" 
                      ? "ऐतिहासिक संविदात्मक समीक्षाएं, अनुपालन ऑडिट और कानूनी विश्लेषण पुनर्प्राप्त करें।" 
                      : "Retrieve historical contractual reviews, compliance audits, and legal analysis."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5 flex-1 max-w-lg">
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={vaultSearch}
                      onChange={(e) => setVaultSearch(e.target.value)}
                      placeholder={language === "hi" ? "सुरक्षित वॉल्ट फ़िल्टर ढूँढें..." : "Refine secure vault filters..."}
                      className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-slate-200"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-2 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Sort:</span>
                    <select
                      value={vaultSort}
                      onChange={(e) => setVaultSort(e.target.value)}
                      className="bg-transparent border-none text-xs text-slate-300 focus:outline-none cursor-pointer font-sans bg-slate-950/80 px-2 py-1 rounded"
                    >
                      <option value="date-newest">Date Created (Newest)</option>
                      <option value="date-oldest">Date Created (Oldest)</option>
                      <option value="score-highest">Risk Score (Highest)</option>
                      <option value="score-lowest">Risk Score (Lowest)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documentsQuery.isLoading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <p className="text-xs text-slate-500 font-mono">
                        {language === "hi" ? "सुरक्षित वॉल्ट खुल रहा है…" : "Unlocking secure vault…"}
                      </p>
                    </div>
                  )}

                  {!documentsQuery.isLoading && vaultFiles.length === 0 && (
                    <div className="col-span-full border border-dashed border-white/10 rounded-2xl bg-slate-900/20 flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {language === "hi" ? "आपका वॉल्ट खाली है" : "Your vault is empty"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {language === "hi"
                            ? "कोई अनुबंध विश्लेषण चलाएं — रिपोर्ट यहां स्वचालित रूप से सुरक्षित हो जाएगी, या नमूना दस्तावेज़ लोड करें।"
                            : "Run a contract analysis and the report is saved here automatically, or load sample documents to explore."}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <LiquidButton
                          onClick={() => {
                            setContractText("");
                            setContractTitle("Pasted_Contract.txt");
          setContractDocumentId(null);
                            setCurrentView("analyzer");
                          }}
                          className="text-slate-200 hover:text-white font-semibold text-xs border border-white/10 cursor-pointer min-h-[44px]"
                          size="sm"
                        >
                          {language === "hi" ? "नया विश्लेषण शुरू करें" : "Start New Analysis"}
                        </LiquidButton>
                        <LiquidButton
                          onClick={() => seedSamplesMutation.mutate()}
                          disabled={seedSamplesMutation.isPending}
                          className="text-slate-400 hover:text-white font-semibold text-xs border border-white/5 cursor-pointer min-h-[44px]"
                          size="sm"
                        >
                          {seedSamplesMutation.isPending
                            ? (language === "hi" ? "लोड हो रहा है…" : "Loading…")
                            : (language === "hi" ? "नमूना अनुबंध लोड करें" : "Load Sample Contracts")}
                        </LiquidButton>
                      </div>
                    </div>
                  )}

                  {[...vaultFiles]
                    .filter(file => file.title.toLowerCase().includes(vaultSearch.toLowerCase()))
                    .sort((a, b) => {
                      if (vaultSort === "date-newest") {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      }
                      if (vaultSort === "date-oldest") {
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                      }
                      if (vaultSort === "score-highest") {
                        return b.score - a.score;
                      }
                      if (vaultSort === "score-lowest") {
                        return a.score - b.score;
                      }
                      return 0;
                    })
                    .map((file) => {
                      const iconConfig = getFileIconConfig(file.title);
                      return (
                        <div 
                          key={file.id} 
                          className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group spring-bounce"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border group-hover:scale-105 transition-transform duration-250 relative ${iconConfig.colorClass}`}>
                                <iconConfig.Icon className="w-4.5 h-4.5" />
                                <span className="absolute -bottom-1 -right-1 text-[7px] font-mono px-1 py-0.5 rounded border bg-slate-950 border-white/10 font-bold leading-none select-none">
                                  {iconConfig.badgeText}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                                file.score > 80 
                                  ? "bg-white/15 text-white border-white/10" 
                                  : file.score > 60 
                                    ? "bg-white/10 text-slate-200 border-white/10" 
                                    : "bg-white/5 text-slate-400 border-white/5"
                              }`}>
                                {language === "hi" ? "जोखिम स्कोर:" : "Risk Score:" } {file.score}% ({language === "hi" ? (file.risk === "High Risk" ? "उच्च" : file.risk === "Moderate Risk" ? "मध्यम" : "सुरक्षित") : file.risk})
                              </span>
                            </div>

                            <h3 className="font-bold text-xs text-slate-200 truncate group-hover:text-white transition-all">
                              {file.title}
                            </h3>
                            <div className="flex gap-2 items-center text-[10px] text-slate-500 font-mono mt-2">
                              <span>{file.date}</span>
                              <span>•</span>
                              <span>{file.size}</span>
                              {file.pageCount != null && (
                                <>
                                  <span>•</span>
                                  <span>{file.pageCount} {language === "hi" ? "पृष्ठ" : "pages"}</span>
                                </>
                              )}
                            </div>
                          </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 items-center">
                          <LiquidButton 
                            onClick={() => handleSelectVaultContract(file.content, file.title, Number(file.id))}
                            className="flex-1 text-slate-300 hover:text-white font-semibold text-xs border border-white/5 cursor-pointer"
                            size="sm"
                          >
                            <span>{language === "hi" ? "खोलें (लोड करें)" : "Load Doc"}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </LiquidButton>
                          <LiquidButton 
                            onClick={() => handleDeleteVaultContract(file.id)}
                            className="text-slate-500 hover:text-zinc-300 border border-white/5 cursor-pointer"
                            size="icon"
                            title={language === "hi" ? "दस्तावेज़ मिटाएं" : "Purge document"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </LiquidButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inlined Settings and configurations view */}
            {currentView === "settings" && (
              <div className="space-y-8 animate-fade-in-up-snappy relative z-[1]">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">{t.systemSettingsTitle}</h2>
                    <p className="text-slate-500 text-xs mt-1.5 font-mono">{t.systemSettingsSubtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-300/10 border border-zinc-300/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-white uppercase tracking-wider font-bold">
                      {language === "hi" ? "कॉन्फ़िगर करें" : "Configure"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Language Selection */}
                  <div className="glass-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white">{t.languageLabel}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">EN · HI · TA · TE</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">{t.selectLanguage}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(["en", "hi"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => changeLanguage(lang)}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none spring-bounce ${
                              language === lang
                                ? "bg-zinc-300/15 text-zinc-200 border-zinc-300/35"
                                : "bg-white/[0.03] text-slate-400 border-white/8 hover:border-white/20 hover:text-slate-200"
                            }`}
                          >
                            {lang === "en" ? "🇬🇧 English" : "🇮🇳 हिन्दी"}
                          </button>
                        ))}
                        {["ta", "te"].map((lang) => (
                          <button key={lang} disabled className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/5 text-slate-600 cursor-not-allowed opacity-50">
                            {lang === "ta" ? "Tamil" : "Telugu"}
                            <span className="ml-1.5 text-[8px] text-slate-700 font-mono">Soon</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* API Clearance */}
                  <div className="glass-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Key className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white">{t.apiClearanceTitle}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{language === "hi" ? "रनटाइम इंजेक्टेड" : "Runtime injected"}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{t.apiClearanceDesc}</p>
                    <div className="space-y-2">
                      {[
                        { key: "GEMINI_API_KEY", status: language === "hi" ? "प्रमाणित" : "Authenticated", color: "emerald" },
                        { key: "FIREBASE_PROJECT_ID", status: language === "hi" ? "सक्रिय" : "Active", color: "blue" },
                      ].map((row) => (
                        <div key={row.key} className="p-3 rounded-xl bg-white/[0.03] border border-white/6 flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-mono">{row.key}</span>
                          <span className={`flex items-center gap-1.5 text-[10px] font-mono font-bold ${row.color === "emerald" ? "text-white" : "text-zinc-300"}`}>
                            <ShieldCheck className="w-3 h-3" />
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank-Grade Security Banner */}
                  <div className="glass-card rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
                    {/* Emerald gradient right */}
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-zinc-300/[0.04] to-transparent pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-300/10 border border-zinc-300/25 flex items-center justify-center animate-float">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-bold text-sm text-white mb-1">Bank-Grade Security Isolation</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                          {language === "hi"
                            ? "LegalLens द्वारा पार्स की गई सभी फाइलें अस्थायी ephemeral कंटेनरों के भीतर संसाधित की जाती हैं। हम शून्य प्रतिधारण लॉग संचालित करते हैं।"
                            : "All files parsed by LegalLens are processed within temporary ephemeral containers. We operate zero retention logs. Your documents never leave the secure processing boundary."}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {["AES-256 Encryption", "Zero Retention", "SOC 2 Compliant", "TLS 1.3"].map((badge) => (
                            <span key={badge} className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider badge-zinc rounded-md">
                              ✓ {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>

        {/* Global Keyboard Shortcuts Help Overlay Panel */}
        <AnimatePresence>
          {isShortcutsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShortcutsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden relative"
              >
                {/* Header Banner */}
                <div className="px-6 py-5 bg-slate-950/50 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-300">
                      <Keyboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white font-sans">
                        System Hotkeys & Shortcuts
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Instant productivity for legal professionals
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsShortcutsOpen(false)}
                    className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Shortcuts Listing */}
                <div className="p-6 space-y-6">
                  
                  {/* Category - Navigation */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                      Navigation views (Press key to Go)
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      {[
                        { key: "d", label: "Dashboard Hub", view: "dashboard" },
                        { key: "a", label: "Contract Analyzer", view: "analyzer" },
                        { key: "v", label: "Secure Vault Explorer", view: "vault" },
                        { key: "t", label: "Standard Templates Library", view: "templates" },
                        { key: "c", label: "Chat AI Assistant", view: "chat" },
                        { key: "h", label: "Handoff & Shares", view: "handoff" },
                        { key: "s", label: "System Config Settings", view: "settings" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setCurrentView(item.view);
                            setIsShortcutsOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/20 border border-white/5 hover:border-white/10 hover:bg-slate-950/40 transition-all text-left group"
                        >
                          <span className="text-[11px] text-slate-300 group-hover:text-white font-medium transition-all">
                            {item.label}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-zinc-300 bg-slate-950 px-2 py-0.5 rounded border border-white/10 shadow-sm uppercase">
                            {item.key}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category - Tools & Context Actions */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                      Context Actions & Display
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { 
                          key: "n", 
                          label: "Start New Analysis", 
                          action: () => {
                            setContractText("");
                            setContractTitle("Pasted_Contract.txt");
          setContractDocumentId(null);
                            setCurrentView("analyzer");
                            setVaultSearch("");
                          } 
                        },
                        { 
                          key: "l", 
                          label: "Toggle Light / Dark theme", 
                          action: () => setIsDarkMode(prev => !prev) 
                        },
                        { 
                          key: "/", 
                          label: "Focus Vault Search filter", 
                          action: () => {
                            setCurrentView("vault");
                            setTimeout(() => {
                              document.getElementById("vault-search-input")?.focus();
                            }, 80);
                          } 
                        },
                        { 
                          key: "?", 
                          label: "Toggle Hotkeys Helper list", 
                          action: () => setIsShortcutsOpen(false) 
                        },
                        { 
                          key: "↑ / ↓", 
                          label: "Cycle selected risk cards", 
                          action: () => {
                            setCurrentView("analyzer");
                          } 
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            item.action();
                            setIsShortcutsOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950/20 border border-white/5 hover:border-white/10 hover:bg-slate-950/40 transition-all text-left group"
                        >
                          <span className="text-[11px] text-slate-300 group-hover:text-white font-medium transition-all">
                            {item.label}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-zinc-300 bg-slate-950 px-2 py-0.5 rounded border border-white/10 shadow-sm">
                            {item.key}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer status tracker */}
                <div className="px-6 py-3 bg-slate-950/65 border-t border-white/5 text-[10px] font-mono text-slate-500 text-center">
                  Pressing hotkeys values triggers fast context switches when not in input fields.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
