import { useState, useRef, useEffect, ChangeEvent } from "react";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Lock, 
  BrainCircuit, 
  Copy, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown,
  FolderOpen,
  FileCode,
  Loader2,
  Trash2,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Bolt,
  Scale,
  ArrowUpRight,
  Sparkles,
  Plus
} from "lucide-react";
import { Message } from "../types";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Language, translations } from "../lib/translations";
import { trpc } from "@/providers/trpc";

interface ChatAIViewProps {
  language: Language;
  contractText: string;
  contractTitle: string;
  onNavigate: (view: string) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export default function ChatAIView({ 
  language,
  contractText, 
  contractTitle, 
  onNavigate,
  initialPrompt,
  onClearInitialPrompt
}: ChatAIViewProps) {
  const t = translations[language];

  // Helper to get translated start message text
  const getStartupMessage = () => {
    if (language === "hi") {
      return `### ⚖️ नमस्ते! स्वतंत्र भारतीय कानूनी सहायक और संवैधानिक सह-पायलट में आपका स्वागत है
  
मै **भारत के संविधान, संसदीय संहिताओं, राज्य के नियमों और भारत के सर्वोच्च न्यायालय के ऐतिहासिक निर्णयों** पर गहन रूप से प्रशिक्षित हूँ।
  
आप कानूनी या संवैधानिक विषयों पर मुझसे स्वतंत्र रूप से चर्चा कर सकते हैं। **फ़ाइल संलग्न करना पूरी तरह से वैकल्पिक है।**
  
कुछ मुख्य विषय जिन पर हम चर्चा कर सकते हैं:
1. **भारतीय अनुबंध अधिनियम, 1872**: वैधता मानक, गैर-प्रकटीकरण समझौते (NDA), क्षतिपूर्ति दायित्व, देयता क्षति (धारा 73/74) और अनुचित शर्तें।
2. **संवैधानिक अधिकार**: मौलिक अधिकार सुरक्षा (अनुच्छेद 14, 19, 21) और रिट याचिका तंत्र (अनुच्छेद 32 और 226)।
3. **डेटा सुरक्षा और साइबर अनुपालन**: डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 और सूचना प्रौद्योगिकी अधिनियम, 2000।
4. **नए आपराधिक कानून**: भारतीय न्याय संहिता (BNS) के प्रावधान और नागरिक देनदारियां।
5. **कॉर्पोरेट प्रशासन**: कंपनी अधिनियम, 2013 और स्टार्टअप/MSME नियामक बुरादा।
  
---
💡 *इस बातचीत के संदर्भ के रूप में सक्रिय अनुबंध या केस फ़ाइल को शामिल करने के लिए, नीचे "Include Active Workspace Contract" टॉगल करें या साइड पैनल में कस्टमाइज़्ड विवरण पेस्ट करें।*`;
    } else {
      return `### ⚖️ Pranam! Welcome to the Independent Indian Legal Assistant & Constitutional Co-Pilot
  
I am thoroughly trained in the **Constitution of India, parliamentary codifications, state regulations, and landmark Supreme Court of India precedents**.
  
You can chat with me freely regarding any statutory or constitutional topic. **Attaching files is completely optional.** 
  
Here are some core areas we can cover:
1. **The Indian Contract Act, 1872**: Validity standards, mutual NDAs, indemnity obligations, liquidated damages (Sec 73/74), and unfair clauses.
2. **Constitutional Rights**: Fundamental Rights protections (Articles 14, 19, 21) and Writ Petition mechanisms (Articles 32 and 226).
3. **Data Protection & Cyber Compliance**: Digital Personal Data Protection (DPDP) Act, 2023, and the Information Technology Act, 2000.
4. **New Criminal Codes**: Bharatiya Nyaya Sanhita (BNS) provisions and civil liabilities.
5. **Corporate Governance**: Companies Act, 2013 and Startup/MSME regulatory filings.
  
---
💡 *To include the active workspace contract/case file as context for this conversation, toggle "Include Active Workspace Contract" below or paste/type custom text in the side panel.*`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Backend: persistent chat mutation + stored history
  const chatMutation = trpc.legal.chat.useMutation();
  const historyQuery = trpc.legal.chatHistory.useQuery();
  const historyLoadedRef = useRef(false);

  // Restore persisted conversation history (once per mount)
  useEffect(() => {
    if (historyLoadedRef.current || !historyQuery.data) return;
    historyLoadedRef.current = true;
    if (historyQuery.data.length > 0) {
      setMessages(
        historyQuery.data.map((m) => ({
          id: `msg-db-${m.id}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          privileged: true,
        }))
      );
    }
  }, [historyQuery.data]);

  // Optional contextual toggle for the current workspace contract
  const [useContractContext, setUseContractContext] = useState(false);
  
  // Custom manual appended text context for independent legal analysis
  const [customFileText, setCustomFileText] = useState("");
  const [isCustomTextOpen, setIsCustomTextOpen] = useState(false);
  const [attachedCustomTitle, setAttachedCustomTitle] = useState("");

  // Populate first welcome message on language change or mounts
  useEffect(() => {
    setMessages([
      {
        id: "msg-welcome",
        role: "assistant",
        content: getStartupMessage(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        privileged: true
      }
    ]);
  }, [language]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Handle incoming initial prompts from Indian Law reference guide
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      privileged: true
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setTyping(true);

    try {
      // Build conversation history starting after welcome message or full list
      const queryHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Establish context bounds based on user's selected choice
      let selectedContext = "";
      if (useContractContext && contractText) {
        selectedContext += `[CONTEXT FROM SYSTEM APP FILE: ${contractTitle}]\n${contractText}\n`;
      }
      if (customFileText) {
        selectedContext += `[CONTEXT FROM USER MANUAL ATTACHMENT: ${attachedCustomTitle || "User_Uploaded_Case_Context.txt"}]\n${customFileText}`;
      }

      const data = await chatMutation.mutateAsync({
        messages: queryHistory.slice(-20),
        currentContractText: selectedContext || undefined
      });

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        privileged: true
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errHeaderStr = language === "hi" ? "भारतीय कानूनी एआई नोड से संपर्क विफल रहा:" : "Connection failed with the Indian Legal AI node:";
      const errMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `⚠️ **[SYS_ALERT_ERROR]** ${errHeaderStr} ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    if (action === "nda") {
      prompt = language === "hi" 
        ? "भारतीय अनुबंध अधिनियम, 1872 के अनुकूल कस्टमाइज़्ड द्विपक्षीय एनडीए ड्राफ्ट करें, जिसमें मुंबई में विवाद निपटान मध्यस्थता खंड शामिल हो।"
        : "Draft a bilateral Non-Disclosure Agreement (NDA) complying with the Indian Contract Act, 1872, containing a clause for dispute arbitration in Mumbai.";
    } else if (action === "dpdp") {
      prompt = language === "hi"
        ? "डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम, 2023 के तहत डेटा फिड्यूशियरी के मुख्य दायित्व और डेटा प्रिंसिपल के अधिकारों की व्याख्या करें।"
        : "What are the core obligations of a Data Fiduciary and key rights of a Data Principal under the Digital Personal Data Protection (DPDP) Act, 2023?";
    } else if (action === "article21") {
      prompt = language === "hi"
        ? "भारत के सर्वोच्च न्यायालय द्वारा निजता के अधिकार सहित जीवन और व्यक्तिगत स्वतंत्रता के अधिकार (अनुच्छेद 21) के न्यायिक विस्तार का विवरण दें।"
        : "Detail the jurisprudential expansion of Article 21 (Right to Life and Personal Liberty) by the Supreme Court of India, including the Right to Privacy.";
    } else if (action === "ibcrera") {
      prompt = language === "hi"
        ? "रेरा (RERA) बनाम दिवाला और दिवालियापन संहिता (IBC) के तहत रियल-एस्टेट खरीदारों के पास उपलब्ध उपचारों की तुलना करें।"
        : "Contrast the remedies available to Indian home-buyers under RERA (Real Estate Regulation Act) versus the Insolvency and Bankruptcy Code (IBC).";
    }
    handleSendMessage(prompt);
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <div className="whitespace-pre-wrap font-sans space-y-2">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong 
                key={i} 
                className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400"
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i} className="text-zinc-300">{part}</span>;
        })}
      </div>
    );
  };


  const handleCustomFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedCustomTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultText = event.target?.result as string;
      setCustomFileText(resultText);
      const notifyStr = language === "hi"
        ? `दस्तावेज़ "${file.name}" सफलतापूर्वक संलग्न हो गया है। यह विश्लेषण में संदर्भ के रूप में जोड़ा जाएगा।`
        : `Manual Case document "${file.name}" attaches successfully. It will be combined into your chat prompts.`;
      alert(notifyStr);
    };
    reader.readAsText(file);
  };

  const clearManualAttachment = () => {
    setCustomFileText("");
    setAttachedCustomTitle("");
    const clearStr = language === "hi" ? "संलग्न संदर्भ हटा दिया गया है।" : "Manual attachment context removed.";
    alert(clearStr);
  };

  return (
    <div className="flex flex-col xl:flex-row min-h-[620px] w-full border border-white/[0.06] rounded-2xl bg-zinc-950/40 backdrop-blur-2xl overflow-hidden shadow-2xl animate-fade-in-up-snappy relative z-0">
      
      {/* Ambient Sarvam AI Animated Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-violet-600/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Left/Center Interactive Chat Canvas */}
      <div className="flex-1 flex flex-col justify-between bg-zinc-950/20 relative min-w-0 z-10">
        
        {/* Dynamic Context Custom Header Bar */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-md shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="flex gap-1 items-center mr-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.3s' }} />
              </span>
              <span className="text-[10px] uppercase font-mono text-white tracking-[0.15em] font-semibold">
                {language === "hi" ? "भारतीय कानून सलाहकार" : "Indian Jurisprudence Advisor"}
              </span>
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white truncate max-w-sm sm:max-w-md">
              {language === "hi" ? "संवैधानिक एवं नियामक कानून विशेषज्ञ" : "Supreme Court & Parliamentary Law Expert"}
            </h2>
          </div>

          {/* Active Optional Context State Indicators */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full badge-zinc">
              {language === "hi" ? "🇮🇳 संविधान सक्रिय" : "🇮🇳 Constitution & Statutes Active"}
            </span>
          </div>
        </div>

        {/* Optional Active Workspace Toggle Bar */}
        <div className="px-6 py-2.5 border-b border-zinc-300/10 bg-zinc-300/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="toggle-context"
              checked={useContractContext}
              onChange={(e) => setUseContractContext(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-zinc-300 focus:ring-0 cursor-pointer w-4 h-4"
            />
            <label htmlFor="toggle-context" className="text-xs text-slate-400 font-sans cursor-pointer select-none">
              {language === "hi" ? (
                <>संदर्भ: <span className="text-white italic">{contractTitle}</span></>
              ) : (
                <>Include active contract: <span className="text-white italic">{contractTitle}</span></>
              )}
            </label>
          </div>
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 font-bold">
            {useContractContext 
              ? (language === "hi" ? "प्रासंगिक मोड" : "Contextual Mode")
              : (language === "hi" ? "स्वतंत्र मोड" : "Independent Mode")}
          </span>
        </div>

        {/* Chat Feed Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-950/5">
          <div className="flex justify-center my-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 bg-slate-900/40 border border-white/[0.05] px-4 py-1.5 rounded-full text-center">
              🔒 {language === "hi" ? "विशेषाधिकार सुरक्षित — भारत गणराज्य" : "Attorney-Client Privileged — Republic of India"}
            </span>
          </div>

          {/* Quick-Prompt Chips — shown only when chat is empty */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4 mb-2">
              {[
                { key: "rent", labelEn: "📄 Explain my Rent Agreement", labelHi: "📄 मेरा किराया समझौता समझाएं", prompt: language === "hi" ? "मेरे किराया समझौते की प्रमुख शर्तें और जोखिम समझाएं।" : "Explain the key terms and risks in my Rent Agreement under the Transfer of Property Act." },
                { key: "fir", labelEn: "🚔 How to file an FIR", labelHi: "🚔 FIR कैसे दर्ज करें", prompt: language === "hi" ? "भारत में FIR दर्ज करने की प्रक्रिया क्या है?" : "What is the step-by-step process to file an FIR in India under the BNSS?" },
                { key: "consumer", labelEn: "⚖️ Consumer Protection Rights", labelHi: "⚖️ उपभोक्ता अधिकार", prompt: language === "hi" ? "उपभोक्ता संरक्षण अधिनियम, 2019 के तहत मुख्य अधिकार क्या हैं?" : "What are my key rights under the Consumer Protection Act, 2019?" },
                { key: "nda", labelEn: "📝 Draft an NDA", labelHi: "📝 NDA ड्राफ्ट करें", prompt: language === "hi" ? "भारतीय अनुबंध अधिनियम के अनुकूल द्विपक्षीय NDA ड्राफ्ट करें।" : "Draft a bilateral NDA compliant with the Indian Contract Act, 1872." },
                { key: "article21", labelEn: "🏛️ Article 21 Rights", labelHi: "🏛️ अनुच्छेद 21 अधिकार", prompt: language === "hi" ? "अनुच्छेद 21 के तहत जीवन और स्वतंत्रता के अधिकार क्या हैं?" : "Explain Article 21 rights — Right to Life and Personal Liberty under the Constitution." },
              ].map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-300 transition-all px-4 py-2"
                >
                  {language === "hi" ? chip.labelHi : chip.labelEn}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => {
            const isAI = msg.role === "assistant";
            return (
              <div 
                key={msg.id} 
                className={`flex w-full gap-3.5 ${isAI ? "justify-start" : "justify-end"} animate-fade-in-up-snappy transition-all duration-300 ease-out`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <Sparkles className="w-4 h-4 text-zinc-100" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[75%] space-y-1.5 flex flex-col">
                  {isAI ? (
                    <div className="p-1 text-sm leading-relaxed text-zinc-100 font-sans tracking-wide">
                      {renderFormattedText(msg.content)}
                      
                      {/* Copier Actions */}
                      {msg.id !== "msg-welcome" && (
                        <div className="mt-4 flex gap-2 pt-3">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              const copyStr = language === "hi" ? "कानूनी राय ड्राफ्ट सफलतापूर्वक क्लिपबोर्ड पर कॉपी हो गया है।" : "Opinion drafted successfully and copied to clipboard.";
                              alert(copyStr);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 border border-white/5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{language === "hi" ? "समीक्षा कॉपी करें" : "Copy Legal Opinion"}</span>
                          </button>
                          <button 
                            onClick={() => {
                              const saveStr = language === "hi" ? "सलाह को संस्थागत पुरालेख तिजोरी में सुरक्षित किया गया है।" : "Opinion marked & saved to institutional archival vault.";
                              alert(saveStr);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 border border-white/5"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{language === "hi" ? "सुरक्षित सहेजें" : "Save Opinion"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white/10 border border-white/15 text-white rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm">
                      {renderFormattedText(msg.content)}
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-[10px] text-zinc-500 font-medium ${isAI ? "justify-start pl-2" : "justify-end pr-2"}`}>
                    <span className="uppercase tracking-wider">
                      {isAI ? (language === "hi" ? "जेमिनी एआई" : "Gemini AI") : (language === "hi" ? "आप" : "You")}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {isAI && msg.id !== "msg-welcome" && (
                      <div className="flex ml-1 gap-1.5">
                        <button className="hover:text-zinc-300 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                        <button className="hover:text-zinc-300 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Advisor Typing simulator */}
          {typing && (
            <div className="flex w-full gap-3.5 justify-start animate-fade-in-up-snappy">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <Sparkles className="w-4 h-4 text-zinc-100 animate-pulse" />
              </div>
              <div className="p-2 text-sm text-zinc-400 font-sans animate-pulse">
                {language === "hi" 
                  ? "विचार कर रहा है..." 
                  : "Thinking..."}
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Floating Prompt Input Box */}
        <div className="p-6 shrink-0 z-10 bg-transparent flex flex-col items-center justify-end">
          
          {/* Active Optional Custom Attachment Banner */}
          {attachedCustomTitle && (
            <div className="max-w-3xl w-full mx-auto mb-3 text-xs flex justify-between items-center bg-zinc-800/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
              <span className="flex items-center gap-2 text-zinc-300">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>Context: <b className="font-medium text-white">{attachedCustomTitle}</b></span>
              </span>
              <button 
                onClick={clearManualAttachment}
                className="text-zinc-500 hover:text-rose-400 text-[10px] font-bold uppercase cursor-pointer transition-colors"
              >
                {language === "hi" ? "हटाएं" : "Remove"}
              </button>
            </div>
          )}

          <div className="relative group max-w-3xl w-full mx-auto">
            <div className="relative bg-zinc-900/80 border border-white/15 rounded-3xl overflow-hidden focus-within:border-white/40 transition-all duration-300 flex flex-col p-2 backdrop-blur-xl shadow-2xl">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={language === "hi" 
                  ? "यहाँ मैसेज टाइप करें..."
                  : "Ask anything..."}
                rows={1}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-100 text-sm px-4 py-3 shrink-0 resize-none font-sans custom-scrollbar min-h-[52px] max-h-[200px]"
                style={{ height: inputMessage.split('\n').length > 1 ? 'auto' : '52px' }}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1 shrink-0">
                  {/* Plus Attachment Button */}
                  <label className="p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                    <input 
                      type="file" 
                      accept=".txt,.doc,.docx,.pdf" 
                      onChange={handleCustomFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  {/* Voice Input */}
                  <button 
                    onClick={() => {
                      alert(language === "hi" ? "वॉयस डिक्टेशन मॉड्यूल जल्द आ रहा है।" : "Voice dictation module coming soon.");
                    }}
                    className="p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center" title="Voice Input"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center">
                  <button 
                    onClick={() => handleSendMessage()}
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center ${inputMessage.trim() ? 'bg-white text-zinc-900 hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-zinc-500'}`}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar: Shortcuts, Code & Precedents context */}
      <aside className="w-full xl:w-80 flex flex-col bg-slate-950/45 border-l border-white/5 z-10 shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            {language === "hi" ? "कानूनी संसाधन" : "Indian Law Resources"}
          </h3>
          <span className="px-2 py-0.5 text-[8px] font-mono leading-none bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded">AI CODE</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Pre-designed shortcut queries */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {language === "hi" ? "सुझाव" : "Suggestions"}
            </h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleQuickAction("nda")}
                className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-300 transition-all px-4 py-2 cursor-pointer"
              >
                {language === "hi" ? "एनडीए अनुबंध का प्रारूप बनाएं" : "Draft Indian Contract Act NDA"}
              </button>
              <button 
                onClick={() => handleQuickAction("dpdp")}
                className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-300 transition-all px-4 py-2 cursor-pointer"
              >
                {language === "hi" ? "DPDP अधिनियम 2023 समझें" : "Explain DPDP Act 2023 Rules"}
              </button>
              <button 
                onClick={() => handleQuickAction("article21")}
                className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-300 transition-all px-4 py-2 cursor-pointer"
              >
                {language === "hi" ? "अनुच्छेद 21 सुरक्षा समझें" : "Explain Article 21 Protections"}
              </button>
              <button 
                onClick={() => handleQuickAction("ibcrera")}
                className="rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-zinc-300 transition-all px-4 py-2 cursor-pointer"
              >
                <span>{language === "hi" ? "रेरा बनाम आईबीसी तुलना" : "Compare RERA v/s IBC Remedies"}</span>
              </button>
            </div>
          </div>

          {/* Quick paste text container block */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              {language === "hi" ? "केस संदर्भ कार्यक्षेत्र" : "Interactive Case Workspace"}
            </h4>
            
            <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl space-y-3">
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                {language === "hi" 
                  ? "गहन विश्लेषण और कानूनी राय के लिए रिट याचिका, नोटिस या अनुबंध का विवरण यहाँ पेस्ट करें।"
                  : "Paste complex petition details, statutory clauses, or notice files here to merge them as prompt inputs."}
              </p>
              <textarea
                value={customFileText}
                onChange={(e) => {
                  setCustomFileText(e.target.value);
                  if (!attachedCustomTitle) {
                    setAttachedCustomTitle("Custom_Copied_Draft.txt");
                  }
                }}
                rows={3}
                placeholder={language === "hi" ? "कस्टमाइज़्ड अनुबंध की शर्तें या वकालतनामा यहाँ पेस्ट करें..." : "Paste customized contract clauses or legal notice briefs to analyze optional contexts..."}
                className="w-full bg-slate-950/80 border border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 p-2 text-slate-300 font-mono custom-scrollbar"
              />
              {customFileText && (
                <div className="flex justify-between items-center bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                  <span className="text-[9px] font-mono text-indigo-300 uppercase">{language === "hi" ? "परामर्श सक्रिय" : "Input Context Active"}</span>
                  <button 
                    onClick={clearManualAttachment}
                    className="text-rose-450 text-[9px] uppercase tracking-wider font-extrabold hover:text-rose-400 text-rose-400 cursor-pointer"
                  >
                    {language === "hi" ? "साफ़ करें" : "Clear Text"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Key landmarks statutory citations for reference */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              {language === "hi" ? "संवैधानिक और कानूनी कोडेक्स" : "Indian Law Codex"}
            </h4>
            
            <div className="p-4 bg-gradient-to-br from-indigo-950/30 to-slate-900/60 border border-indigo-500/10 rounded-xl space-y-3 text-[11px] text-slate-350">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
                <Scale className="w-4 h-4 text-indigo-400" style={{ transform: 'none' }} />
                <span>{language === "hi" ? "समर्पित वैधानिक कोडेक्स" : "Dedicated Statutory Codex"}</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                {language === "hi" 
                  ? "हमने भारतीय संविदा अधिनियम, कॉपीराइट विनियमों, एमएसएमई भुगतानों और 2023 के DPDP व्यक्तिगत डेटा नियमों को एक स्वतंत्र, समृद्ध संदर्भ मार्गदर्शिका (Page) में स्थान दिया है।"
                  : "We have compiled the full collection of Contract Act codes, MSME payout guidelines, Copyright rules, and DPDP personal data protections into a dedicated reference page."}
              </p>
              <button
                type="button"
                onClick={() => onNavigate("indianlaw")}
                className="w-full bg-slate-950/80 hover:bg-indigo-600 hover:text-white text-indigo-300 font-bold border border-white/5 py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{language === "hi" ? "पूर्ण कोडेक्स गाइड देखें" : "Explore Full Codex"}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </aside>

    </div>
  );
}
