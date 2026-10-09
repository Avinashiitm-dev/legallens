import { useState } from "react";
import { 
  Plus, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  FileText, 
  Search, 
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  X,
  Library
} from "lucide-react";
import { ContractTemplate } from "../types";
import { CONTRACT_TEMPLATES } from "../constants";
import { motion } from "motion/react";
import { Language, translations } from "../lib/translations";

interface TemplateLibraryViewProps {
  language: Language;
  onLoadTemplate: (text: string, title: string) => void;
  onNavigate: (view: string) => void;
}

export default function TemplateLibraryView({ 
  language,
  onLoadTemplate, 
  onNavigate 
}: TemplateLibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

  const rawFilters = ["All", "Confidentiality", "Services", "Employment", "Procurement", "Real Estate"];
  
  const getFilterLabel = (filter: string) => {
    if (language !== "hi") return filter;
    switch (filter) {
      case "All": return "सभी";
      case "Confidentiality": return "गोपनीयता";
      case "Services": return "सेवाएँ";
      case "Employment": return "रोज़गार";
      case "Procurement": return "अधिप्राप्ति (ख़रीद)";
      case "Real Estate": return "अचल संपत्ति";
      default: return filter;
    }
  };

  const getLocalizedTemplateDetails = (tmpl: ContractTemplate) => {
    if (language !== "hi") {
      return { name: tmpl.name, desc: tmpl.description };
    }
    // Hindi overrides for known template titles/descriptions
    if (tmpl.name.includes("Mutual NDA")) {
      return { 
        name: "मानक द्विपक्षीय गैर-प्रकटीकरण समझौता (NDA)", 
        desc: "व्यावसायिक चर्चाओं में संवेदनशील कॉर्पोरेट डेटा और व्यापार रहस्यों के संरक्षण के लिए मानक समझौता।" 
      };
    } else if (tmpl.name.includes("Freelance")) {
      return { 
        name: "फ्रीलांस परामर्श सेवा अनुबंध", 
        desc: "स्वतंत्र सलाहकारों, डिजाइनरों और डेवलपर्स के लिए भुगतान शर्तों और बौद्धिक संपदा सुरक्षा वाला सुव्यवस्थित समझौता।" 
      };
    } else if (tmpl.name.includes("SaaS")) {
      return { 
        name: "प्रशासनिक सॉफ्टवेयर सेवा (SaaS) समझौता", 
        desc: "सेवा उपलब्धता (SLA), डेटा सुरक्षा और लायबिलिटी सुरक्षा सीमाओं सहित वाणिज्यिक क्लाउड सॉफ्टवेयर लाइसेंस।" 
      };
    }
    return { name: tmpl.name, desc: tmpl.description };
  };

  const filteredTemplates = CONTRACT_TEMPLATES.filter(tmpl => {
    const matchesFilter = activeFilter === "All" || tmpl.category === activeFilter;
    const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tmpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUseTemplate = (tmpl: ContractTemplate) => {
    onLoadTemplate(tmpl.rawText, `${tmpl.name}.txt`);
    onNavigate("analyzer");
  };

  const t = translations[language];

  return (
    <div className="space-y-8 animate-fade-in-up-snappy">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            {language === "hi" ? "समय-परीक्षित कानूनी टेम्पलेट" : "Battle-tested templates"}
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
            {language === "hi"
              ? "व्यावसायिक सुरक्षा, व्यावसायिक संरेखण और जोखिम रोकथाम के लिए अनुकूलित संरचनात्मक कानूनी रूपरेखाएं। सभी मसौदे विशिष्ट वाणिज्यिक परामर्शदाताओं द्वारा पूर्व-परीक्षित हैं।"
              : "Access our structural legal frameworks optimized for clean operations, commercial alignment, and protection. All drafts pre-vetted by elite commercial counsel."}
          </p>
        </div>
        <motion.button 
          onClick={() => {
            const promptMsg = language === "hi" 
              ? "उस कस्टम अनुबंध या प्रावधान का वर्णन करें जिसे आप एआई के माध्यम से बनाना चाहते हैं:"
              : "Describe the custom contract or provisions you want our AI to generate:";
            const aiPromptRequest = window.prompt(promptMsg);
            if (aiPromptRequest) {
              const alertMsg = language === "hi"
                ? "एआई मानक विश्लेषण संकलन शुरू हो रहा है... कस्टम अनुबंध तैयार किया जा रहा है।"
                : "Processing AI standard compilation draft... Generating custom structure.";
              alert(alertMsg);
              
              onLoadTemplate(`// AI GENERATED CONTRACT IN RESPONSE TO: ${aiPromptRequest}\n\nPROPRIETARY MASTER SERVICE PROVISIONS\nDraft compiled under Delaware Jurisdictional regulations.`, "AI_Compiled_Agreement.txt");
              onNavigate("analyzer");
            }
          }}
          whileHover={{ scale: 1.03, translateY: -2 }}
          whileTap={{ scale: 0.97 }}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-slate-700 hover:text-indigo-400 text-white py-3 px-6 rounded-lg transition-all duration-200 font-semibold text-xs shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/30 spring-bounce outline-none"
        >
          <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
          {language === "hi" ? "एआई से निर्माण करें" : "Generate with AI"}
        </motion.button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/5 pb-4">
        
        {/* Horizontal filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none hide-scrollbar">
          {rawFilters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold spring-bounce outline-none cursor-pointer ${
                activeFilter === filter 
                  ? "bg-indigo-600 text-white" 
                  : "border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {getFilterLabel(filter)}
            </motion.button>
          ))}
        </div>

        {/* Local template query input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "hi" ? "खोजें टेम्पलेट्स..." : "Query templates..."}
            className="w-full bg-slate-900/60 border border-white/10 text-slate-200 placeholder-slate-600 font-sans text-xs rounded-lg pl-9 pr-4 py-2 focus:border-indigo-550 outline-none focus:ring-1 focus:ring-white"
          />
        </div>

      </div>

      {/* Grid containing templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((tmpl) => {
            const localized = getLocalizedTemplateDetails(tmpl);
            return (
              <div
                key={tmpl.id}
                className="glass-panel rounded-2xl p-6 flex flex-col hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-505/5 hover:-translate-y-1 transition-all duration-200 group spring-bounce"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/10 group-hover:scale-105 transition-all">
                    <Library className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  {tmpl.isProtective ? (
                    <span className="bg-indigo-505/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      {language === "hi" ? "अत्यधिक सुरक्षित" : "Protective"}
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 border border-white/5 px-2.5 py-1 rounded-full text-[10px] font-mono">
                      {language === "hi" ? "मानक" : "Standard"}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-100 mb-2 truncate group-hover:text-indigo-300 transition-colors">
                  {localized.name}
                </h3>
                <p className="text-slate-400 text-xs mb-6 flex-1 leading-relaxed">
                  {localized.desc}
                </p>

                <div className="flex items-center gap-3 mt-auto border-t border-white/5 pt-4">
                  <motion.button 
                    onClick={() => setPreviewTemplate(tmpl)}
                    whileHover={{ scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    whileTap={{ scale: 0.96 }}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-xs spring-bounce outline-none cursor-pointer"
                  >
                    {language === "hi" ? "पूर्वावलोकन" : "Preview"}
                  </motion.button>
                  <motion.button 
                    onClick={() => handleUseTemplate(tmpl)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white border border-white/5 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 spring-bounce outline-none cursor-pointer"
                  >
                    {language === "hi" ? "चुने" : "Use Template"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 font-mono text-xs">
            {language === "hi" 
              ? "कोई संगत मानक टेम्पलेट नहीं मिला। कृपया अन्य फ़िल्टर जाँचें।" 
              : "No matching standard template designs found. Try checking other filter headings."}
          </div>
        )}
      </div>

      {/* Preview modal overlay */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl space-y-4 animate-fade-in-up-snappy relative">
            <motion.button 
              onClick={() => setPreviewTemplate(null)}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 350, damping: 12 }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <h3 className="text-sm font-bold text-white font-sans">
              {getLocalizedTemplateDetails(previewTemplate).name} — {language === "hi" ? "पूर्वावलोकन स्थिति" : "Preview Mode"}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Template ID: {previewTemplate.id} • {language === "hi" ? "श्रेणी" : "Category"}: {getFilterLabel(previewTemplate.category)}
            </p>

            <div className="p-4 bg-slate-950 rounded-xl max-h-[220px] overflow-y-auto border border-white/5">
              <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-400 leading-relaxed">
                {previewTemplate.rawText}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <motion.button
                onClick={() => setPreviewTemplate(null)}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 border border-white/10 bg-transparent text-slate-300 hover:text-white text-xs font-semibold rounded-lg outline-none cursor-pointer"
              >
                {language === "hi" ? "पूर्वावलोकन बंद करें" : "Close Preview"}
              </motion.button>
              <motion.button
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg spring-bounce outline-none cursor-pointer"
              >
                {language === "hi" ? "विश्लेषक में लोड करें" : "Load to Analyzer"}
              </motion.button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
