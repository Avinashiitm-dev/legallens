import {
  FileText,
  CheckCircle,
  ShieldCheck,
  FolderOpen,
  FileCode,
  File,
  Cpu,
  Lock,
  Zap,
  Users,
  Globe,
  TrendingUp,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Language, translations } from "../lib/translations";
import { trpc } from "@/providers/trpc";

function getFileIconConfig(title: string) {
  const ext = title.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf")
    return { Icon: File, colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20", badgeText: "PDF" };
  if (ext === "docx" || ext === "doc")
    return { Icon: FileText, colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20", badgeText: "DOCX" };
  return { Icon: FileCode, colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20", badgeText: "TXT" };
}

interface DashboardViewProps {
  language: Language;
  onNavigate: (view: string) => void;
  onSelectContract: (contractText: string, title: string, documentId?: number) => void;
}

function relativeTime(date: Date | string, language: Language): string {
  const diffHrs = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 3_600_000));
  if (language === "hi")
    return diffHrs < 1 ? "अभी-अभी" : diffHrs < 24 ? `${diffHrs}h पहले` : `${Math.round(diffHrs / 24)}d पहले`;
  return diffHrs < 1 ? "Just now" : diffHrs < 24 ? `${diffHrs}h ago` : `${Math.round(diffHrs / 24)}d ago`;
}

const PLATFORM_STATS = [
  { label: "Potential Users", labelHi: "संभावित उपयोगकर्ता", value: "1.4M+", icon: Users, color: "emerald" },
  { label: "End-to-End Encrypted", labelHi: "एन्क्रिप्टेड", value: "100%", icon: Lock, color: "blue" },
  { label: "Zero Retention Logs", labelHi: "शून्य लॉग", value: "0KB", icon: ShieldCheck, color: "emerald" },
  { label: "AI Accuracy", labelHi: "सटीकता", value: "99.8%", icon: Zap, color: "amber" },
];

export default function DashboardView({ language, onNavigate, onSelectContract }: DashboardViewProps) {
  const t = translations[language];
  const documentsQuery = trpc.legal.listDocuments.useQuery();
  const recentFiles = (documentsQuery.data ?? []).slice(0, 3).map((doc) => {
    const report = doc.report as { risks?: unknown[] } | null;
    const riskCount = Array.isArray(report?.risks) ? report.risks.length : 0;
    const isClean = (doc.score ?? 100) > 75;
    return {
      id: doc.id,
      title: doc.title,
      time: relativeTime(doc.createdAt, language),
      risks: riskCount,
      risksText: riskCount > 0 ? `${riskCount} ${language === "hi" ? "जोखिम" : "Risks"}` : (language === "hi" ? "परिशुद्ध" : "Clean"),
      status: isClean ? "clean" : "unfavorable",
      rawText: doc.content,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in-up-snappy">

      {/* ── Hero Banner ── */}
      <section className="relative w-full rounded-2xl overflow-hidden glass-panel min-h-[420px] flex flex-col lg:flex-row shadow-2xl">
        <div className="spotlight" />
        {/* Decorative grid bg */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Left — brand pitch */}
        <div className="relative z-10 flex-1 p-8 lg:p-12 flex flex-col justify-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-emerald-pulse" />
            <span className="font-mono text-[9px] font-bold text-emerald-400 tracking-[0.2em] uppercase">
              {language === "hi" ? "सिस्टम ऑनलाइन" : "SYSTEM ONLINE"}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl leading-[1.1] font-bold tracking-tight text-white">
              {language === "hi" ? (
                <>भारत का <span className="gradient-text-brand">सबसे स्मार्ट</span><br />कानूनी एआई</>
              ) : (
                <>India's <span className="gradient-text-brand">Smartest</span><br />Legal AI Co-Pilot</>
              )}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md font-sans">
              {language === "hi"
                ? "बैंक-ग्रेड इंटेलिजेंस के साथ अनुबंध समीक्षाएं त्वरित करें। हिंदी, Tamil, Telugu समर्थित।"
                : "Accelerate contract reviews with bank-grade intelligence. Multi-language support for EN, HI, TA, TE."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <LiquidButton onClick={() => onNavigate("analyzer")} id="btn-hero-analyze" className="px-6 py-2.5 text-xs uppercase tracking-widest font-bold" size="default">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {language === "hi" ? "समीक्षा शुरू करें" : "Start Analysis"}
            </LiquidButton>
            <LiquidButton onClick={() => onNavigate("chat")} id="btn-hero-chat" className="px-6 py-2.5 text-xs uppercase tracking-widest font-semibold border border-white/10" size="default">
              {language === "hi" ? "AI से पूछें" : "Ask the AI"}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </LiquidButton>
          </div>
        </div>

        {/* Right — visual scanner */}
        <div className="flex-1 relative min-h-[240px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-white/5 flex items-center justify-center p-8">
          <div className="relative w-full max-w-[300px] space-y-3 animate-float">
            {/* Scanner card */}
            <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-emerald-400 tracking-wider">LEGAL_SCAN v3.1</span>
                <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div className="space-y-2">
                {["Clause extraction", "Risk scoring", "Compliance check"].map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        style={{ width: `${[92, 87, 100][i]}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{[92, 87, 100][i]}%</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Precision Rating</span>
                <span className="text-xs font-mono font-bold text-emerald-400">99.84%</span>
              </div>
            </div>
            {/* Mini trust badge */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-white/5 bg-slate-900/40 p-2.5 flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-slate-400 font-mono">E2E Encrypted</span>
              </div>
              <div className="flex-1 rounded-lg border border-white/5 bg-slate-900/40 p-2.5 flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-400" />
                <span className="text-[9px] text-slate-400 font-mono">4 Languages</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Stats Row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORM_STATS.map((stat) => {
          const Icon = stat.icon;
          const isEmerald = stat.color === "emerald";
          const isBlue = stat.color === "blue";
          const isAmber = stat.color === "amber";
          return (
            <div key={stat.label} className="glass-card rounded-xl p-4 flex flex-col gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isEmerald ? "bg-emerald-500/10 border border-emerald-500/20" :
                isBlue    ? "bg-blue-500/10 border border-blue-500/20" :
                            "bg-amber-500/10 border border-amber-500/20"
              }`}>
                <Icon className={`w-4 h-4 ${isEmerald ? "text-emerald-400" : isBlue ? "text-blue-400" : "text-amber-400"}`} />
              </div>
              <div>
                <p className={`text-xl font-bold font-mono tracking-tight ${
                  isEmerald ? "stat-number-emerald" : "stat-number"
                }`}>{stat.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  {language === "hi" ? stat.labelHi : stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Bento Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Recent Analyses */}
        <div className="col-span-1 md:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">{language === "hi" ? "हालिया विश्लेषण" : "Recent Analyses"}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{language === "hi" ? "आपके नवीनतम दस्तावेज़" : "Your latest scanned documents"}</p>
            </div>
            <button
              onClick={() => onNavigate("vault")}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center gap-1 spring-bounce"
            >
              {language === "hi" ? "सभी देखें" : "View All"}
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {documentsQuery.isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 rounded-xl animate-shimmer" />
                ))}
              </div>
            )}
            {!documentsQuery.isLoading && recentFiles.length === 0 && (
              <div
                onClick={() => onNavigate("analyzer")}
                className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] cursor-pointer transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-500/10 transition-colors">
                  <FileText className="w-4.5 h-4.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors text-center">
                  {language === "hi" ? "अभी तक कोई विश्लेषण नहीं — पहला अनुबंध स्कैन करें" : "No analyses yet — scan your first contract"}
                </p>
                <span className="mt-3 text-[10px] text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {language === "hi" ? "क्लिक करें →" : "Click to start →"}
                </span>
              </div>
            )}
            {recentFiles.map((file) => {
              const iconConfig = getFileIconConfig(file.title);
              return (
                <div
                  key={file.id}
                  onClick={() => { onSelectContract(file.rawText, file.title, file.id); onNavigate("analyzer"); }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-emerald-500/20 hover:bg-slate-900/40 transition-all cursor-pointer group spring-bounce"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border relative ${iconConfig.colorClass}`}>
                      <iconConfig.Icon className="w-3.5 h-3.5" />
                      <span className="absolute -bottom-1 -right-1 text-[7px] font-mono px-1 py-0.5 rounded border bg-slate-950 border-white/10 font-bold leading-none">{iconConfig.badgeText}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors max-w-[200px] truncate">{file.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{file.time}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border shrink-0 ${
                    file.status === "clean" ? "badge-emerald" : "badge-amber"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${file.status === "clean" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    {file.risksText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100 mb-1">{language === "hi" ? "सिस्टम स्थिति" : "System Status"}</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed mb-5">
              {language === "hi" ? "बैंक-ग्रेड 256-बिट एन्क्रिप्शन सक्रिय।" : "Bank-grade 256-bit encryption active."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-emerald-500/15 transition-all">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400 mb-2" />
              <p className="text-xl font-bold font-mono stat-number">{(documentsQuery.data ?? []).length}</p>
              <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500 mt-1">{language === "hi" ? "स्कैन डॉक्स" : "Docs Scanned"}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mb-2" />
              <p className="text-xl font-bold font-mono stat-number-emerald">100%</p>
              <p className="text-[9px] uppercase font-mono tracking-wider text-emerald-600 mt-1">{language === "hi" ? "सुरक्षित" : "Secure"}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: language === "hi" ? "AI मॉडल" : "AI Model", value: "Gemini Pro", color: "emerald" },
              { label: language === "hi" ? "डेटा अवधारण" : "Data Retention", value: language === "hi" ? "शून्य" : "Zero", color: "blue" },
              { label: language === "hi" ? "एन्क्रिप्शन" : "Encryption", value: "AES-256", color: "emerald" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center px-3 py-2 rounded-lg bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 font-mono">{row.label}</span>
                <span className={`text-[10px] font-mono font-bold ${row.color === "emerald" ? "text-emerald-400" : "text-blue-400"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Actions Row ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: "analyzer", title: language === "hi" ? "अनुबंध विश्लेषण" : "Contract Analyzer", desc: language === "hi" ? "AI-संचालित जोखिम स्कैन" : "AI-powered risk scan", icon: FileText, color: "emerald" },
          { id: "chat", title: language === "hi" ? "कानूनी Q&A" : "Legal Q&A", desc: language === "hi" ? "भारतीय कानून का AI सहायक" : "Indian law AI assistant", icon: TrendingUp, color: "blue" },
          { id: "handoff", title: language === "hi" ? "वकील मिलाएं" : "Find Lawyers", desc: language === "hi" ? "सत्यापित वकीलों से जुड़ें" : "Connect with verified advocates", icon: Users, color: "amber" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="glass-card rounded-xl p-5 flex items-center gap-4 text-left spring-bounce outline-none"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                item.color === "emerald" ? "bg-emerald-500/10 border border-emerald-500/20" :
                item.color === "blue" ? "bg-blue-500/10 border border-blue-500/20" :
                "bg-amber-500/10 border border-amber-500/20"
              }`}>
                <Icon className={`w-4.5 h-4.5 ${
                  item.color === "emerald" ? "text-emerald-400" : item.color === "blue" ? "text-blue-400" : "text-amber-400"
                }`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-auto" />
            </button>
          );
        })}
      </section>

    </div>
  );
}
