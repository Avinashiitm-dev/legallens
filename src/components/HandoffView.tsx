import { useState, FormEvent, useEffect } from "react";
import { 
  Star, 
  ArrowRight, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Grid,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  AlertOctagon,
  FileCheck,
  Award,
  Send,
  MessageSquare,
  Scale
} from "lucide-react";
import { Attorney, EscalationCase } from "../types";
import { VETTED_ATTORNEYS } from "../constants";
import { motion } from "motion/react";
import { Language } from "../lib/translations";
import { trpc } from "@/providers/trpc";

interface HandoffViewProps {
  language: Language;
  contractTitle: string;
  initialReason?: string;
  onClearInitialEscalation?: () => void;
}

export default function HandoffView({ 
  language, 
  contractTitle,
  initialReason,
  onClearInitialEscalation
}: HandoffViewProps) {
  // Escalations are persisted per-user in the database (no more hardcoded mock cases)
  const utils = trpc.useUtils();
  const escalationsQuery = trpc.legal.listEscalations.useQuery();
  const createEscalationMutation = trpc.legal.createEscalation.useMutation({
    onSuccess: () => utils.legal.listEscalations.invalidate(),
  });
  const escalations: EscalationCase[] = (escalationsQuery.data ?? []).map((row) => ({
    id: String(row.id),
    contractName: row.contractName,
    reason: row.reason,
    priority: row.priority,
    status: row.status,
    assignedAttorney: row.attorneyName ?? undefined,
  }));
  const [activeSpecialization, setActiveSpecialization] = useState("All Specializations");
  const chatMutation = trpc.legal.chat.useMutation();
  
  // Escalation flow state triggers
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);
  const [escalationReason, setEscalationReason] = useState(
    language === "hi" 
      ? "देयता सीमा और बौद्धिक संपदा सुरक्षा की समीक्षा की आवश्यकता है।" 
      : "Liability cap and IP limits review requirement."
  );
  const [escalationPriority, setEscalationPriority] = useState<"High" | "Medium" | "Low">("High");

  // Hook to handle incoming outside handoff triggers
  useEffect(() => {
    if (initialReason) {
      setEscalationReason(initialReason);
      setEscalationPriority("High");
      // Pre-select an attorney from vetted list (e.g., Adv. Avinash or Elena Rodriguez depending on context)
      const defaultAssignee = VETTED_ATTORNEYS.find(a => a.id === "att-4") || VETTED_ATTORNEYS[0];
      setSelectedAttorney(defaultAssignee);
      
      onClearInitialEscalation?.();
    }
  }, [initialReason, onClearInitialEscalation]);

  // State to track active selected case for Direct Attorney Chat
  const [activeChatCase, setActiveChatCase] = useState<EscalationCase | null>(null);

  // Auto-select the most recent persisted escalation once loaded
  useEffect(() => {
    if (!activeChatCase && escalations.length > 0) {
      setActiveChatCase(escalations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalationsQuery.data]);

  // Per-case message history for the live session (attorney replies are AI-drafted
  // in the attorney's persona; the global legal chat log is persisted server-side)
  const [chatsByCase, setChatsByCase] = useState<Record<string, Array<{ id: string; sender: 'user' | 'attorney'; text: string; time: string }>>>({});

  const [chatInputText, setChatInputText] = useState("");
  const [isAttorneyTyping, setIsAttorneyTyping] = useState(false);

  const handleSendAttorneyChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInputText;
    if (!textToSend.trim() || !activeChatCase) return;

    const currentCaseId = activeChatCase.id;
    const assignedAttorneyName = activeChatCase.assignedAttorney || "Adv. Avinash";
    const attorneyObj = VETTED_ATTORNEYS.find(a => a.name === assignedAttorneyName) || VETTED_ATTORNEYS[3];

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatsByCase(prev => ({
      ...prev,
      [currentCaseId]: [...(prev[currentCaseId] || []), userMsg]
    }));
    
    if (!presetText) {
      setChatInputText("");
    }
    setIsAttorneyTyping(true);

    try {
      const chatHistory = (chatsByCase[currentCaseId] || []).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      chatHistory.push({ role: 'user', content: textToSend });

      const data = await chatMutation.mutateAsync({
        messages: [
          {
            role: "user",
            content: `You are playing the role of Attorney ${attorneyObj.name} from firm ${attorneyObj.firm} (specializing in ${attorneyObj.specialization}, BCI rating ${attorneyObj.rating}). Welcome representing that attorney.
              Provide direct legal advice as that attorney to the client regarding this escalation case context:
              - Contract Name: ${activeChatCase.contractName}
              - Escalation Reason: ${activeChatCase.reason}
              - Case Priority: ${activeChatCase.priority}
              
              History of chat:
              ${chatHistory.map(h => `${h.role === 'assistant' ? 'Attorney' : 'Client'}: ${h.content}`).join('\n')}
              
              Respond with high law resolution in 2-3 short, helpful paragraphs to the client's latest query: "${textToSend}". Under Indian statutory acts (such as SEC 27 or 73/74 etc).
              Speak directly in the first person of the lawyer, in ${language === "hi" ? "Hindi (हिन्दी)" : "English"}, and maintain client-focused professional composure. Keep it short. Do not write generic AI disclaimers.`
          }
        ]
      });

      const attorneyMsg = {
        id: `attorney-${Date.now()}`,
        sender: 'attorney' as const,
        text: data.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatsByCase(prev => ({
        ...prev,
        [currentCaseId]: [...(prev[currentCaseId] || []), attorneyMsg]
      }));
    } catch (e) {
      let fallbackText = "";
      if (language === "hi") {
        fallbackText = `धन्यवाद। मैं आपके संविदात्मक संदर्भ को समझ गया हूँ। सुरक्षात्मक और संतुलित शर्तों (mutual caps) को शामिल करने के लिए मैं नया प्रारूप प्रस्ताव तैयार करूँगा ताकि आपके हित सुरक्षित रहें।`;
      } else {
        fallbackText = `I have received this. As your attorney, I advise we address this explicitly by pushing for a mutual limit. I will draft a formal compromise amendment matching this setup so that your liabilities remain legally guarded. Let's connect again soon.`;
      }

      const attorneyMsg = {
        id: `attorney-${Date.now()}`,
        sender: 'attorney' as const,
        text: fallbackText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatsByCase(prev => ({
        ...prev,
        [currentCaseId]: [...(prev[currentCaseId] || []), attorneyMsg]
      }));
    } finally {
      setIsAttorneyTyping(false);
    }
  };

  const specializations = [
    "All Specializations", 
    "IP & Tech", 
    "M&A", 
    "Data Privacy & Security", 
    "Indian Law & Constitution"
  ];

  const getSpecializationLabel = (spec: string) => {
    if (language !== "hi") return spec;
    switch (spec) {
      case "All Specializations": return "सभी विशेषज्ञताएं";
      case "IP & Tech": return "बौद्धिक सम्पदा और तकनीक";
      case "M&A": return "विलय और अधिग्रहण (M&A)";
      case "Data Privacy & Security": return "डेटा गोपनीयता और सुरक्षा";
      case "Indian Law & Constitution": return "भारतीय कानून और संविधान";
      default: return spec;
    }
  };

  const filteredAttorneys = VETTED_ATTORNEYS.filter(att => {
    if (activeSpecialization === "All Specializations") return true;
    if (activeSpecialization === "IP & Tech" && att.specialization.includes("IP")) return true;
    if (activeSpecialization === "M&A" && att.specialization.includes("Corporate")) return true;
    if (activeSpecialization === "Data Privacy & Security" && att.specialization.includes("Data")) return true;
    if (activeSpecialization === "Indian Law & Constitution" && att.specialization.includes("Indian")) return true;
    return false;
  });

  const handleEscalationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAttorney) return;

    // Persist the escalation case to the user's vault (database-backed)
    let newId: string;
    try {
      const created = await createEscalationMutation.mutateAsync({
        contractName: contractTitle || "Undisclosed Agreement.txt",
        reason: escalationReason,
        priority: escalationPriority,
        attorneyId: selectedAttorney.id,
        attorneyName: selectedAttorney.name,
      });
      newId = String(created.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to file the escalation. Please try again.");
      return;
    }

    const newEscalation: EscalationCase = {
      id: newId,
      contractName: contractTitle || "Undisclosed Agreement.txt",
      reason: escalationReason,
      priority: escalationPriority,
      status: language === "hi" ? `${selectedAttorney.name} को आवंटित` : `Assigned to ${selectedAttorney.name}`,
      assignedAttorney: selectedAttorney.name
    };

    // Pre-initialize a customized introductory chat session message matching current escalation reason
    const initText = language === "hi"
      ? `नमस्ते! मैं आपके '${contractTitle || "दस्तावेज़"}' मामले को देख रहा हूँ। समीक्षा का मुख्य कारण है: "${escalationReason}"। आपकी इस चिंता पर मैंने विश्लेषण शुरू कर दिया है। आप सीधे कोई भी प्रश्न यहाँ पूछ सकते हैं!`
      : `Hello! I have received your escalation request regarding "${contractTitle || "this document"}" for: "${escalationReason}". As your assigned counsel, I have initiated a detailed contractual check under relevant statutes. Please feel free to type any specific queries below.`;

    setChatsByCase(prev => ({
      ...prev,
      [newId]: [
        { 
          id: `init-${Date.now()}`, 
          sender: 'attorney', 
          text: initText, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]
    }));

    setActiveChatCase(newEscalation);
    setSelectedAttorney(null);

    const alertMsg = language === "hi"
      ? `मामला सफलतापूर्वक ${selectedAttorney.name} को सौंप दिया गया है। 'Direct Attorney Chat' अब आपके केस वेरिएबल्स के साथ सक्रिय है!`
      : `Case successfully escalated onto ${selectedAttorney.name}. 'Direct Attorney Chat' is now live with your escalation details!`;
    alert(alertMsg);
  };

  return (
    <div className="space-y-10 animate-fade-in-up-snappy">
      
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {language === "hi" ? "अधिवक्ता हैंडऑफ" : "Lawyer Marketplace"}
          </h2>
          <p className="text-slate-500 text-sm mt-1.5 max-w-xl leading-relaxed">
            {language === "hi"
              ? "हमारे सत्यापित बार काउंसिल अधिवक्ताओं से संपर्क करें या इस्केलेशन दाखिल करें।"
              : "Connect with verified Bar Council advocates or file escalations directly."}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-300/10 border border-zinc-300/20 shrink-0">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-white uppercase tracking-wider font-bold">
            {language === "hi" ? "सत्यापित" : "BCI Verified"}
          </span>
        </div>
      </div>

      {/* Tracker & Direct Chat Split Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Active Escalations Tracker table */}
        <section className="lg:col-span-7 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-white" />
            {language === "hi" ? "सक्रिय एस्केलेशन" : "Active Escalations"}
          </h3>

          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-mono font-medium tracking-wide">
                    <th className="py-3.5 px-4 uppercase">{language === "hi" ? "अनुबंध अनुबंध" : "Contract Name"}</th>
                    <th className="py-3.5 px-4 uppercase">{language === "hi" ? "समीक्षा विवरण" : "Reason For Review"}</th>
                    <th className="py-3.5 px-4 uppercase">{language === "hi" ? "प्राथमिकता" : "Priority"}</th>
                    <th className="py-3.5 px-4 uppercase">{language === "hi" ? "स्थिति" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {escalationsQuery.isLoading && (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {language === "hi" ? "एस्केलेशन रिकॉर्ड लोड हो रहे हैं…" : "Loading escalation records…"}
                      </td>
                    </tr>
                  )}
                  {!escalationsQuery.isLoading && escalations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-slate-500 text-[11px]">
                        {language === "hi"
                          ? "कोई सक्रिय एस्केलेशन नहीं — नीचे निर्देशिका से अधिवक्ता चुनें।"
                          : "No active escalations yet — pick an attorney from the directory below to file one."}
                      </td>
                    </tr>
                  )}
                  {escalations.map((esc) => {
                    const isSelected = activeChatCase?.id === esc.id;
                    return (
                      <tr 
                        key={esc.id} 
                        onClick={() => { setActiveChatCase(esc); }}
                        className={`hover:bg-white/[0.03] transition-all cursor-pointer group ${
                          isSelected ? "bg-zinc-300/[0.06] border-l-2 border-zinc-300" : ""
                        }`}
                      >
                        <td className="py-4 px-4 font-semibold text-slate-200 group-hover:text-zinc-200 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-white animate-pulse" : "bg-slate-500"}`} />
                            {esc.contractName}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-sans max-w-[140px] truncate">
                          {esc.reason}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                            esc.priority === "High" 
                              ? "badge-rose" 
                              : esc.priority === "Medium" 
                                ? "badge-amber" 
                                : "badge-blue"
                          }`}>
                            {esc.priority === "High" ? (language === "hi" ? "उच्च" : "High") : esc.priority === "Medium" ? (language === "hi" ? "मध्यम" : "Medium") : (language === "hi" ? "न्यून" : "Low")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            {esc.assignedAttorney ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                            ) : (
                              <RefreshCw className="w-3 h-3 text-slate-500 animate-spin shrink-0" />
                            )}
                            <span className={`truncate max-w-[120px] text-xs ${
                              esc.assignedAttorney ? "text-white font-semibold" : "text-slate-500"
                            }`}>
                              {esc.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-950/30 text-[10px] text-slate-400 border-t border-white/5 flex justify-between items-center">
              <span>{language === "hi" ? "💡 मामले पर क्लिक करके चैट सत्र खोलें" : "💡 Click on any row to open direct chat context"}</span>
              <span className="font-mono text-slate-500">{escalations.length} {language === "hi" ? "सक्रिय एस्केलेशन" : "Active Escalations"}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Direct Attorney Chat Widget */}
        <section className="lg:col-span-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-white" />
            {language === "hi" ? "सीधा वकील चैट" : "Direct Attorney Chat"}
          </h3>

          {activeChatCase ? (
            (() => {
              const assignedAttorneyName = activeChatCase.assignedAttorney || "Adv. Avinash";
              const attorneyObj = VETTED_ATTORNEYS.find(a => a.name === assignedAttorneyName) || VETTED_ATTORNEYS[3];
              const caseMessages = chatsByCase[activeChatCase.id] || [];
              
              return (
                <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px] shadow-lg border-zinc-300/15">
                  {/* Attorney Header */}
                  <div className="p-3 bg-slate-950/70 border-b border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-zinc-300/25 shrink-0">
                        <img 
                          referrerPolicy="no-referrer"
                          src={attorneyObj.avatar} 
                          alt={attorneyObj.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                          <span>{attorneyObj.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse shrink-0" />
                        </h4>
                        <p className="text-[10px] text-indigo-300 truncate font-medium">{attorneyObj.firm}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end flex-shrink-0 font-mono text-[9px] text-slate-400">
                      <span className="text-amber-400 font-bold">★ {attorneyObj.rating.toFixed(2)}</span>
                      <span className="text-[8px] bg-slate-800 text-slate-200 px-1 rounded mt-0.5">${attorneyObj.rate}/hr</span>
                    </div>
                  </div>

                  {/* Connected Case Sub-Header */}
                  <div className="px-3 py-1.5 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center justify-between gap-2 text-[9px]">
                    <span className="text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <span className="text-indigo-400 font-bold uppercase">Case:</span>
                      <strong className="text-slate-200 truncate max-w-[125px] inline" title={activeChatCase.contractName}>
                        {activeChatCase.contractName}
                      </strong>
                    </span>
                    <span className="text-slate-400 font-sans truncate max-w-[130px] italic" title={activeChatCase.reason}>
                      "{activeChatCase.reason}"
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-mono text-[8px] ${
                      activeChatCase.priority === "High" 
                        ? "bg-rose-550/15 text-rose-300 whitespace-nowrap" 
                        : "bg-amber-500/15 text-amber-300 whitespace-nowrap"
                    }`}>
                      {activeChatCase.priority}
                    </span>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-950/20">
                    {caseMessages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                          <div className={`p-2.5 rounded-xl max-w-[85%] text-[11px] leading-relaxed relative ${
                            isUser 
                              ? "bg-indigo-600/15 border border-indigo-500/15 text-slate-100 rounded-tr-none" 
                              : "bg-slate-950/80 border border-white/5 text-slate-300 rounded-tl-none"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <span className="block text-[8px] font-mono text-slate-500 mt-1 text-right">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })}

                    {isAttorneyTyping && (
                      <div className="flex justify-start animate-pulse">
                        <div className="bg-slate-950/40 border border-white/5 p-2 rounded-xl text-[10px] text-slate-400 font-mono">
                          {attorneyObj.name} is typing counsel...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Suggestions for Escalation */}
                  <div className="px-2 py-1.5 bg-slate-950/60 border-t border-white/5 flex gap-1.5 overflow-x-auto shrink-0 custom-scrollbar scrollbar-none font-sans">
                    <button 
                      onClick={() => handleSendAttorneyChatMessage(
                        language === "hi" 
                          ? "क्या आप इस मामले के लिए सुरक्षात्मक समाधान खंड का प्रस्ताव दे सकते हैं?" 
                          : "Can you help draft a protective mutual compromise clause for this specific risk?"
                      )}
                      disabled={isAttorneyTyping}
                      className="text-[9px] px-2 py-1 bg-slate-900 border border-white/10 hover:border-indigo-500/25 hover:bg-slate-850 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer hover:text-indigo-300 disabled:opacity-50 shrink-0"
                    >
                      💡 {language === "hi" ? "वैकल्पिक मसौदा" : "Propose Draft Alternative"}
                    </button>
                    <button 
                      onClick={() => handleSendAttorneyChatMessage(
                        language === "hi" 
                          ? "इस समीक्षा को पूरा करने में कितना समय और अनुमानित खर्च लगेगा?"
                          : "What is your estimated timeline & invoice structure for formalizing this review?"
                      )}
                      disabled={isAttorneyTyping}
                      className="text-[9px] px-2 py-1 bg-slate-900 border border-white/10 hover:border-indigo-500/25 hover:bg-slate-850 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer hover:text-indigo-300 disabled:opacity-50 shrink-0"
                    >
                      ⌛ {language === "hi" ? "समय सीमा व खर्च" : "Timeline & Costs"}
                    </button>
                    <button 
                      onClick={() => handleSendAttorneyChatMessage(
                        language === "hi" 
                          ? "क्या यह प्रावधान भारतीय अनुबंध अधिनियम धारा 27/74 के अनुकूल है?" 
                          : "Is this provision robust under relevant Supreme Court statutory precedents?"
                      )}
                      disabled={isAttorneyTyping}
                      className="text-[9px] px-2 py-1 bg-slate-900 border border-white/10 hover:border-indigo-500/25 hover:bg-slate-850 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer hover:text-indigo-300 disabled:opacity-50 shrink-0"
                    >
                      ⚖️ {language === "hi" ? "संबंधित मिसालें" : "Relevant Precedents"}
                    </button>
                  </div>

                  {/* Input form */}
                  <div className="p-2 border-t border-white/5 bg-slate-950/40 flex items-center gap-2">
                    <input 
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendAttorneyChatMessage();
                        }
                      }}
                      disabled={isAttorneyTyping}
                      placeholder={language === "hi" ? "वकील से सीधे सलाह लें..." : "Type message directly to attorney..."}
                      className="bg-slate-950 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button 
                      onClick={() => handleSendAttorneyChatMessage()}
                      disabled={isAttorneyTyping || !chatInputText.trim()}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50 disabled:bg-slate-800 transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-white font-bold" />
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 py-14 text-center space-y-4 font-sans">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">No Case Selected</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                  Hover & select any escalation case from the list on the left to initiate a Direct Attorney Chat session connecting the real case variables with premium legal experts.
                </p>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Section 2: Vetted Network Bento Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            {language === "hi" ? "सत्यापित अधिवक्ता निर्देशिका" : "Vetted Network Directory"}
          </h3>
          
          <select 
            value={activeSpecialization}
            onChange={(e) => setActiveSpecialization(e.target.value)}
            className="bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer shadow-sm"
          >
            {specializations.map(spec => (
              <option key={spec} value={spec}>{getSpecializationLabel(spec)}</option>
            ))}
          </select>
        </div>

        {/* Directory cards layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttorneys.map((att) => (
            <div
              key={att.id}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col group hover:shadow-2xl hover:border-indigo-500/20 hover:scale-[1.02] transition-all duration-200"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start gap-4 mb-5 relative z-10">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 bg-slate-800 shrink-0">
                  <img 
                    referrerPolicy="no-referrer"
                    src={att.avatar} 
                    alt={att.avatarAlt} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{att.name}</h4>
                  <p className="text-slate-500 text-xs mt-0.5">{att.firm}</p>
                  
                  {/* Dynamic Rating feedback */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-amber-400 font-mono text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold">{att.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Specialization list */}
              <div className="space-y-2.5 mb-6 flex-1 text-xs border-y border-white/5 py-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{language === "hi" ? "मुख्य ध्यान क्षेत्र" : "Focus Areas"}</span>
                  <span className="text-slate-200 font-semibold">{att.specialization}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{language === "hi" ? "संबद्धता" : "Affiliation"}</span>
                  <span className="text-slate-300 font-medium">{language === "hi" ? "मानक अधिकृत बार एसोसिएशन" : (att.affiliation || "Delaware State Bar")}</span>
                </div>
                {att.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{language === "hi" ? "संपर्क नंबर" : "Contact No"}</span>
                    <span className="text-slate-200 font-semibold font-mono">{att.phone}</span>
                  </div>
                )}
                {att.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{language === "hi" ? "ईमेल पता" : "Email Address"}</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[150px]" title={att.email}>{att.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">{language === "hi" ? "प्रति घंटा दर" : "Hourly Tariff"}</span>
                  <span className="text-indigo-300 font-bold font-mono text-sm">${att.rate}/hr</span>
                </div>
              </div>

              {/* Click to escalate button trigger */}
              <motion.button 
                onClick={() => setSelectedAttorney(att)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="w-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 relative z-10 spring-bounce cursor-pointer outline-none"
              >
                {language === "hi" ? "अधिवक्ता से परामर्श करें" : "Escalate Case"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

            </div>
          ))}
        </div>
      </section>

      {/* Escalation details Modal panel */}
      {selectedAttorney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleEscalationSubmit}
            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in-up-snappy"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white">{language === "hi" ? "परामर्श एस्केलेशन सेटअप करें" : "Setup Hand-Off Escalation"}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{language === "hi" ? `वकील का नाम: ${selectedAttorney.name}` : `Assigning case onto: ${selectedAttorney.name}`}</p>
              </div>
              <motion.button 
                type="button"
                onClick={() => setSelectedAttorney(null)}
                whileHover={{ scale: 1.1, color: "#fff" }}
                whileTap={{ scale: 0.9 }}
                className="text-slate-400 hover:text-white text-xs outline-none cursor-pointer"
              >
                {language === "hi" ? "बंद करें" : "Close"}
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-500">
                  {language === "hi" ? "समीक्षा दस्तावेज" : "Target Legal Record"}
                </label>
                <input
                  type="text"
                  readOnly
                  value={contractTitle || "Freelance_Agreement.pdf"}
                  className="w-full bg-slate-950 border border-white/5 text-slate-400 text-xs p-3 rounded-xl focus:outline-none focus:ring-1 cursor-default"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-500">
                  {language === "hi" ? "समीक्षा और परामर्श का कारण" : "Escalation Issue Reason"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder={language === "hi" ? "उन विशिष्ट खंडों का वर्णन करें जिन पर अधिवक्ता की विस्तृत टिप्पणी चाहिए..." : "Specify what parameters, liability caps, or IP exemptions require review..."}
                  className="w-full bg-slate-950 border border-white/5 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-500">
                    {language === "hi" ? "मामले की प्राथमिकता" : "Escalation Priority"}
                  </label>
                  <select
                    value={escalationPriority}
                    onChange={(e: any) => setEscalationPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none cursor-pointer text-slate-300 font-sans"
                  >
                    <option value="High">{language === "hi" ? "उच्च" : "High"}</option>
                    <option value="Medium">{language === "hi" ? "मध्यम" : "Medium"}</option>
                    <option value="Low">{language === "hi" ? "न्यून" : "Low"}</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex flex-col justify-center text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{language === "hi" ? "घंटे की दर" : "Hourly tariff"}</span>
                  <span className="text-indigo-300 font-bold font-mono py-0.5">${selectedAttorney.rate}/hr</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAttorney(null)}
                  className="px-4 py-2 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg outline-none cursor-pointer"
                >
                  {language === "hi" ? "रद्द करें" : "Cancel"}
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={createEscalationMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-lg spring-bounce outline-none cursor-pointer disabled:opacity-50"
                >
                  {createEscalationMutation.isPending
                    ? (language === "hi" ? "दर्ज हो रहा है…" : "Filing…")
                    : (language === "hi" ? "एस्केलेट पुष्टि करें" : "Confirm Escalate")}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
