import { useState } from "react";
import { 
  Scale, 
  Search, 
  Copy, 
  MessageSquare, 
  ArrowUpRight, 
  Sparkles, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  Building, 
  FileText, 
  Compass, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { motion } from "motion/react";
import { Language } from "../lib/translations";

interface IndianLawViewProps {
  language: Language;
  onNavigate: (view: string) => void;
  onSelectPrompt?: (promptText: string) => void;
}

interface StatutorySection {
  id: string;
  section: string;
  act: string;
  category: "contract" | "ip" | "msme" | "privacy" | "dispute";
  title: string;
  titleHindi: string;
  badge: "Critical Compliance" | "High Material Risk" | "Statutory Protection" | "Statutory Void Penalty" | "Bilateral Safeguard";
  badgeHindi: "गंभीर अनुपालन" | "उच्च आर्थिक जोखिम" | "वैधानिक संरक्षण" | "वैधानिक अमान्य जुर्माना" | "पारस्परिक सुरक्षा";
  explanation: string;
  hindiExplanation: string;
  relevance: string;
  relevanceHindi: string;
  suggestedWording: string;
  promptExample: string;
}

const STATUTORY_REGISTRY: StatutorySection[] = [
  {
    id: "sec-27",
    section: "Section 27",
    act: "Indian Contract Act, 1872",
    category: "contract",
    title: "Agreement in Restraint of Trade (Non-Competes)",
    titleHindi: "व्यापार में बाधा डालने वाले समझौते (गैर-प्रतिस्पर्धा अनुबंध)",
    badge: "Statutory Void Penalty",
    badgeHindi: "वैधानिक अमान्य जुर्माना",
    explanation: "Under Section 27, any agreement that restrains anyone from exercising a lawful profession, trade, or business is void. Unlike Delaware or English law, Indian jurisprudence has no 'rule of reason' to permit post-employment non-compete covenants. It is strictly unenforceable to restrict an employee's post-term employment.",
    hindiExplanation: "कानूनी तौर पर धारा 27 के तहत कोई भी ऐसा समझौता जो किसी व्यक्ति को वैध पेशे, व्यवसाय या व्यापार करने से रोकता है, स्वतः शून्य (void) माना जाता है। भारतीय कानूनी व्यवस्था में रोजगार के बाद काम पर पाबंदी लगाने वाले नियमों को अदालतों में अप्रवर्तनीय माना गया है।",
    relevance: "Examine restrictive employment NDAs or advisor agreements. Post-termination exclusivity cannot be legally mandated in standard circumstances, though confidentiality protection survives indefinitely.",
    relevanceHindi: "नौकरियों के समझौतों या परामर्शी एनडीए की जांच करें। नौकरी छोड़ने के बाद प्रतिस्पर्धा पर प्रतिबंध लगाना कानूनन अवैध है, हालांकि गोपनीयता सुरक्षा हमेशा लागू रहती है।",
    suggestedWording: "The executive shall protect confidential parameters post-term, but no clause herein shall restrict the right of the executive to pursue lawful trade, employment, or business under Sec 27.",
    promptExample: "Can you review my agreement's post-employment non-compete clause under Indian Contract Act Section 27 and rewrite it to protect confidentiality instead?"
  },
  {
    id: "sec-74",
    section: "Section 73 & 74",
    act: "Indian Contract Act, 1872",
    category: "contract",
    title: "Liquidated Damages & Liability Limitation Ceiling",
    titleHindi: "नुकसान का आकलन और देयता सीमा (Liability Limit)",
    badge: "High Material Risk",
    badgeHindi: "उच्च आर्थिक जोखिम",
    explanation: "Section 74 mandates that the courts will award reasonable compensation not exceeding the amount named as liquidated damages. If the specified damages are deemed penal and arbitrary rather than a genuine pre-estimate of loss, the courts will reduce the award. Uncapped liability exposes partners to unbounded claims.",
    hindiExplanation: "धारा 74 आदेश देती है कि न्यायालय निर्धारित नुकसान राशि से कम या वास्तविक उचित मुआवजा स्वीकृत करेंगे। यदि नुकसान की राशि को मनमाना या दंडात्मक माना जाता है, तो अदालत इसे कम कर देगी। असीमित देनदारी व्यावसायिक हितों को क्षति पहुँचाती है।",
    relevance: "All software and tech delivery contracts must include a bilateral liability cap. Ensure damages clauses do not feature unconscionable penalties to pass judicial review under Sec 74.",
    relevanceHindi: "सॉफ्टवेयर और तकनीकी अनुबंधों में पारस्परिक रूप से देयता सीमा (Liability Cap) होना अनिवार्य है। सुनिश्चित करें कि नुकसान की राशि मनमानी और एकपक्षीय न हो ताकि धारा 74 की कसौटी पर खरी उतरे।",
    suggestedWording: "Except for breaches of intellectual property or third-party indemnifications, neither party's aggregate liability under Section 74 shall exceed the total service fees paid in the trailing 12-month period.",
    promptExample: "Help me draft a balanced limitation of liability clause that acts as a reasonable pre-estimate of loss under Section 73 and 74 of the Indian Contract Act."
  },
  {
    id: "sec-15-msme",
    section: "Section 15",
    act: "MSME Development Act, 2006",
    category: "msme",
    title: "Payment Terms Protection for Registered Enterprises",
    titleHindi: "पंजीकृत एमएसएमई के लिए सुरक्षात्मक भुगतान शर्तें",
    badge: "Critical Compliance",
    badgeHindi: "गंभीर अनुपालन",
    explanation: "Section 15 overrides general contracts, establishing a statutory maximum limit of 45 days for paying micro/small suppliers from the date of acceptance. Any clause stretching payouts to Net-60 or Net-90 is invalid. Non-compliance triggers mandatory penal interest at three times (3x) the RBI rate, compounded monthly.",
    hindiExplanation: "धारा 15 के अनुसार, किसी भी पंजीकृत सूक्ष्म या लघु आपूर्तिकर्ता को किया जाने वाला भुगतान स्वीकृति की तिथि से 45 दिनों के भीतर अनिवार्य है। नेट-60 या नेट-90 के एकतरफा अनुबंध खंड अवैध माने जाएँगे, और केंद्रीय बैंक (RBI) की दर से तीन गुना (3x) चक्रवृद्धि ब्याज देय होगा।",
    relevance: "Crucial for all vendors registered as micro or small enterprises in India. Check payment clauses to match statutory mandates and avoid multi-fold interest overheads.",
    relevanceHindi: "भारत में पंजीकृत सभी सूक्ष्म और लघु उद्यमों (MSME) के लिए अत्यंत महत्वपूर्ण। अनुबंध भुगतान अवधि को वैधानिक मानदंडों के अनुसार समायोजित करना आवश्यक है।",
    suggestedWording: "The Customer shall pay all approved invoices within forty-five (45) days of receipt, in strict compliance with the statutory payment timeline mandated under Section 15 of the MSMED Act, 2006.",
    promptExample: "Check if my contract's Net-90 payment timeline violates Section 15 of the MSME Development Act and draft a compliant billing clause."
  },
  {
    id: "sec-19-copyright",
    section: "Section 19",
    act: "Indian Copyright Act, 1957",
    category: "ip",
    title: "Mandatory Framework for Copyright & Assignment",
    titleHindi: "कॉपीराइट और बौद्धिक संपदा हस्तांतरण ढांचा",
    badge: "Statutory Protection",
    badgeHindi: "वैधानिक संरक्षण",
    explanation: "Section 19 dictates that assignment of copyright is completely void unless executed in writing and explicitly signed. Crucially, if the agreement fails to specify the assignment duration, it is statutory capped at 5 years. If the territory is omitted, the assignment defaults solely to India, triggering immediate reversion risk.",
    hindiExplanation: "धारा 19 के अनुसार, लिखित और हस्ताक्षरित न होने पर कॉपीराइट का हस्तांतरण अवैध (void) माना जाता है। यदि हस्तांतरण की अवधि स्पष्ट रूप से नहीं लिखी गई है, तो यह स्वतः केवल 5 वर्षों के लिए सीमित हो जाती है। क्षेत्र न लिखे होने पर यह केवल भारत तक ही माना जाता है।",
    relevance: "Must be thoroughly addressed in all freelance development, software development, IP assignment, and creative consulting agreements. Explicitly state 'perpetual' and 'worldwide' domains.",
    relevanceHindi: "सभी फ्रीलांस विकास, सॉफ्टवेयर विकास और आईपी हस्तांतरण समझौतों में 'स्थायी' (perpetual) और 'वैश्विक' (worldwide) दायरे का स्पष्ट रूप से उल्लेख होना चाहिए।",
    suggestedWording: "Provider hereby permanently assigns to Customer all copyrights and intellectual property created hereunder, on a perpetual, royalty-free, irrevocable, and worldwide basis under Section 19 of the Copyright Act.",
    promptExample: "Help me check if my software development IP assignment clause includes perpetual and worldwide parameters under Indian Copyright Act Section 19 to prevent reversion risks."
  },
  {
    id: "sec-124-indemnity",
    section: "Section 124 & 125",
    act: "Indian Contract Act, 1872",
    category: "contract",
    title: "Indemnity Contracts and Recovery Mandates",
    titleHindi: "क्षतिपूर्ति अनुबंध और क्षतिपूर्ति वसूली प्रावधान",
    badge: "Bilateral Safeguard",
    badgeHindi: "पारस्परिक सुरक्षा",
    explanation: "Section 124 defines contracts of indemnity as promises to save the other party from loss caused by the promisor's conduct or third parties. Section 125 empowers the promisee to recover all damages, costs, and compromised sums. A loop-hole filled indemnity clause places the entire litigation burden on your business.",
    hindiExplanation: "धारा 124 क्षतिपूर्ति अनुबंध को एक ऐसे वादे के रूप में परिभाषित करती है जो दूसरे पक्ष को किसी भी नुकसान से बचाता है। धारा 125 क्षतिपूर्ति धारक को सभी अदालती खर्चों और मुकदमों के नुकसान के हर्जाने की वसूली का पूर्ण अधिकार देती है।",
    relevance: "Review carefully to establish bilateral constraints. Standardize liabilities to direct damages and limit negligence claims through specific notification procedures.",
    relevanceHindi: "दोनों पक्षों के लिए समान रूप से रक्षात्मक क्षतिपूर्ति खंड होने चाहिए। लापरवाही के दावों को विशिष्ट समयबद्ध सूचना प्रक्रियाओं से जोड़ें।",
    suggestedWording: "The Indemnifying Party shall defend and hold harmless the Indemnified Party against direct, third-party intellectual property infringement claims, provided prompt statutory written notice is served under Section 125.",
    promptExample: "Draft a mutual contract indemnity clause that conforms to Section 124 and 125 of the Indian Contract Act, restricting exposure strictly to direct, proven breaches."
  },
  {
    id: "dpdp-sec-4",
    section: "Sections 4 - 8",
    act: "DPDP Act, 2023",
    category: "privacy",
    title: "Digital Personal Data consent & Processor Obligation",
    titleHindi: "डिजिटल व्यक्तिगत डेटा संरक्षण और प्रसंस्करण सहमति नियम",
    badge: "Critical Compliance",
    badgeHindi: "गंभीर अनुपालन",
    explanation: "The Digital Personal Data Protection (DPDP) Act, 2023 requires explicit, granular, unconditional, and unambiguous consent before processing personal data. Organizations must serve a clear bilingual notice explaining the data classes collected, processing objectives, and data principal rights. Penalties for negligence range up to ₹250 Crores.",
    hindiExplanation: "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के तहत व्यक्तिगत डेटा संसाधित करने के लिए सुस्पष्ट, बिना शर्त और गैर-भ्रामक सहमति लेना अनिवार्य है। नियमों का उल्लंघन करने पर संगठनों पर ₹250 करोड़ तक का भारी वैधानिक जुर्माना लगाया जा सकता है।",
    relevance: "Essential for standard terms of services, customer agreements, cloud processing, and privacy policy sections. Ensure standard notification formats and local security provisions.",
    relevanceHindi: "क्लाउड डेटा प्रोसेसिंग, सर्विस समझौतों और गोपनीयता नीतियों में अति-आवश्यक। डेटा सुरक्षा और सहमति वापस लेने के कानूनी विकल्पों का उल्लेख होना चाहिए।",
    suggestedWording: "Data Processor shall process the data of Data Principals in strict compliance with sections 4, 5, and 6 of the DPDP Act 2023, based on clear notice and revocable consent, utilizing secure isolated infrastructure.",
    promptExample: "Can you analyze my cloud user service agreement privacy clause to ensure full compatibility with consent and notification mandates under DPDP Act 2023?"
  },
  {
    id: "sec-28-arbitration",
    section: "Section 28",
    act: "Indian Contract & Arbitration Act",
    category: "dispute",
    title: "Exemptions of Legal Bars & Seat of Arbitration",
    titleHindi: "कानूनी रोक के अपवाद और मध्यस्थता की सीट (Seat of Arbitration)",
    badge: "Bilateral Safeguard",
    badgeHindi: "पारस्परिक सुरक्षा",
    explanation: "Section 28 of the Contract Act voids agreements that completely restrict a party's right to enforce constitutional civil remedies. However, Arbitration is a statutory exception. Specifying a precise 'Seat' of arbitration under the Arbitration & Conciliation Act 1996 determines which supervisory court controls the proceedings, saving litigants from endless trial courts delay.",
    hindiExplanation: "अनुबंध अधिनियम की धारा 28 उन समझौतों को अमान्य ठहराती है जो किसी के कानूनी अधिकारों का पूरी तरह से हनन करते हैं, लेकिन मध्यस्थता (Arbitration) इसका कानूनी अपवाद है। मध्यस्थता का एक स्पष्ट स्थल (Seat) और प्रक्रिया तय करने से दशकों लंबे दीवानी मुकदमों से बचा जा सकता है।",
    relevance: "Must be structured to state both the 'Seat' and 'Venue' of arbitration. The Seat determines the jurisdiction, whereas Venue determines physical hearing locations.",
    relevanceHindi: "सभी तकनीकी और वाणिज्यिक समझौतों में अनिवार्य। मध्यस्थता की सीट और स्थल दोनों का साफ-साफ उल्लेख विवादों के त्वरित निष्पादन के लिए ज़रूरी है।",
    suggestedWording: "Any dispute arising hereunder shall be referred to binding arbitration in accordance with the Arbitration & Conciliation Act, 1996. The seat of arbitration shall be New Delhi, and hearings shall be in English.",
    promptExample: "Check if my dispute resolution section specifies a legitimate 'Seat of Arbitration' under the Indian Arbitration Act 1996 and draft a robust dispute clause."
  },
  {
    id: "rera-homebuyers",
    section: "RERA vs IBC Rules",
    act: "RERA Act, 2016 / Insolvency Code, 2016",
    category: "dispute",
    title: "Conflict of Laws on Financial Creditor Rights",
    titleHindi: "वित्तीय लेनदार अधिकारों पर कानूनों के बीच संघर्ष निवारण",
    badge: "High Material Risk",
    badgeHindi: "उच्च आर्थिक जोखिम",
    explanation: "Under Indian statutory precedents, homebuyers enjoy co-status as 'Financial Creditors' under the Insolvency and Bankruptcy Code (IBC) 2016. However, developer contracts often seek to limit buyer remedies using pre-RERA clauses. The Supreme Court has repeatedly held that RERA mandates take absolute priority over contrary contractual clauses.",
    hindiExplanation: "भारतीय वैधानिक मिसालों के अनुसार, दिवाला और दिवालियापन संहिता (IBC) 2016 के तहत घर खरीदारों को 'वित्तीय लेनदार' का दर्जा प्राप्त है। बिल्डर या डेवलपर समझौतों में पुराने नियमों का उपयोग करके खरीदार के राहत अधिकारों को कम नहीं किया जा सकता।",
    relevance: "Applies to real estate acquisitions, investment agreements, developer contracts, and partnership projects. Ensure full alignment with local authority guidelines under RERA Section 18.",
    relevanceHindi: "रियल एस्टेट अधिग्रहण, निवेश समझौतों और डेवलपर अनुबंधों पर लागू होता है। RERA की धारा 18 के तहत वैधानिक अधिकारों का संविदात्मक संरेखण आवश्यक है।",
    suggestedWording: "The rights and remedies of the Allottee hereunder shall be in addition to and in perfect harmony with the provisions of the Real Estate (Regulation and Development) Act, 2016.",
    promptExample: "Explain how developer contract remedies align with homebuyers financial creditor rights under RERA 2016 and IBC code."
  }
];

export default function IndianLawView({ language, onNavigate, onSelectPrompt }: IndianLawViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "contract" | "ip" | "msme" | "privacy" | "dispute">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [useHindiExplanation, setUseHindiExplanation] = useState<boolean>(language === "hi");

  const categories = [
    { id: "all", label: language === "hi" ? "सभी नियम" : "All Rules" },
    { id: "contract", label: language === "hi" ? "अनुबंध कानून" : "Contract Act" },
    { id: "ip", label: language === "hi" ? "बौद्धिक संपदा" : "IP & Copyright" },
    { id: "msme", label: language === "hi" ? "एमएसएमई कानून" : "MSME Payment" },
    { id: "privacy", label: language === "hi" ? "डेटा सुरक्षा (DPDP)" : "Data Privacy" },
    { id: "dispute", label: language === "hi" ? "विवाद समाधान" : "Dispute Res." }
  ];

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskAIClick = (promptText: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(promptText);
    } else {
      // Direct navigation to chat view with template instruction
      localStorage.setItem("legalLens_lawQuery", promptText);
      onNavigate("chat");
    }
  };

  const filteredSections = STATUTORY_REGISTRY.filter(item => {
    const matchesSearch = 
      item.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.act.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.titleHindi.includes(searchTerm) ||
      item.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hindiExplanation.includes(searchTerm);

    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
            {language === "hi" ? "संवैधानिक और वैधानिक निर्देशिका" : "Constitutional & Statutory Directory"}
          </span>
          <h2 className="text-3xl font-serif italic text-white tracking-wide mt-3">
            {language === "hi" ? "भारतीय कानून वैधानिक कोडेक्स" : "Indian Statutory Codex"}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            {language === "hi" 
              ? "भारतीय संविदा अधिनियम, कॉपीराइट अधिनियम, एमएसएमई नियमों और नवनिर्मित DPDP अधिनियम 2023 के तहत डिजिटल अनुपालन को सुव्यवस्थित करें।"
              : "Cross-check commercial risks, penalty clauses, data processing duties, and IP copyrights against authentic codifications of Indian jurisprudence."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Action button to switch interpretation language */}
          <button
            onClick={() => setUseHindiExplanation(!useHindiExplanation)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:border-indigo-500/30 text-xs font-semibold text-indigo-300 border border-white/5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{useHindiExplanation ? "English Version" : "हिंदी व्याख्या देखें"}</span>
          </button>
        </div>
      </div>

      {/* Overview Analytics Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              {language === "hi" ? "प्रमुख अधिनियम प्रविष्टियां" : "Monitored Enactments"}
            </h4>
            <p className="text-2xl font-bold font-serif italic text-slate-100 mt-1">6 Legislation Codes</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {language === "hi" ? "अनुबंध, आईटी, बौद्धिक संपदा अधिनियमों का समावेश।" : "Contract Act, MSMED Act, Copyright Act, DPDP 2023, and Arbitration frameworks."}
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              {language === "hi" ? "व्यावसायिक बहिष्करण" : "Unenforceable Covenants"}
            </h4>
            <p className="text-2xl font-bold font-serif italic text-slate-100 mt-1">Section 27 & 28</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {language === "hi" ? "गैर-प्रतिस्पर्धा समझौतों के स्वतः शून्य होने की वैधानिक चेतावनियाँ।" : "Statutory void penalties regarding covenants tied to trade constraints."}
            </p>
          </div>
        </div>

        <div className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              {language === "hi" ? "कस्टम कानूनी सहायता" : "Directed AI Consulting"}
            </h4>
            <p className="text-2xl font-bold font-serif italic text-slate-100 mt-1">1-Click Directed Chat</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {language === "hi" ? "सीधे चैट सहायक को सहेजें और वैधानिक मसौदा बनाना प्रारंभ करें।" : "Instantly load customized clauses and prompt guides into the AI co-pilot workstation."}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Control Workbench */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-905 border border-white/5 p-4 rounded-2xl gap-y-4">
        
        {/* Search Input bar */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === "hi" ? "अधिनियम धारा, नियम या व्याख्या खोजें..." : "Filter sections, statutory acts, or legal citations..."}
            className="w-full bg-slate-950/70 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Category filtering pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                selectedCategory === cat.id 
                  ? "bg-indigo-600 text-white border-indigo-500/30 font-bold" 
                  : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Bento Listings */}
      {filteredSections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSections.map((item, index) => {
            const isCopied = copiedId === item.id;
            const shownTitle = useHindiExplanation ? item.titleHindi : item.title;
            const shownExplanation = useHindiExplanation ? item.hindiExplanation : item.explanation;
            const shownRelevance = useHindiExplanation ? item.relevanceHindi : item.relevance;
            const shownBadge = useHindiExplanation ? item.badgeHindi : item.badge;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="bg-slate-900/30 hover:bg-slate-900/50 border border-white/5 hover:border-indigo-500/15 rounded-2xl p-6 flex flex-col relative overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-indigo-950/5 hover:scale-[1.01]"
              >
                {/* Visual subtle card pattern anchor */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Section Identifier & Act header details */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-indigo-400 tracking-wider bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded uppercase">
                      {item.section}
                    </span>
                    <h3 className="font-sans text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5 inline-block">
                      {item.act}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono border ${
                    item.badge.includes("Critical") || item.badge.includes("Void")
                      ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                      : item.badge.includes("Risk")
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  }`}>
                    {shownBadge}
                  </span>
                </div>

                {/* Main Legal Title */}
                <h4 className="font-serif italic text-lg text-slate-100 group-hover:text-indigo-300 transition-colors duration-250 mb-3.5">
                  {shownTitle}
                </h4>

                {/* Statutory Explanation */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4 border-l border-indigo-500/20 pl-3">
                  {shownExplanation}
                </p>

                {/* Business Relevance context block */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block font-bold">
                    {language === "hi" ? "व्यावसायिक रेलीवेंस (प्रभाव)" : "Contractual Relevance"}
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {shownRelevance}
                  </p>
                </div>

                {/* Playbook Compliance Standard Suggested wording block */}
                <div className="p-3 bg-slate-950/30 rounded-xl border border-white/5 space-y-2 text-xs mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] text-emerald-450 uppercase tracking-widest block font-bold text-emerald-400">
                      {language === "hi" ? "मानक अनुपालन शब्द (Playbook Model)" : "Model Playbook Wording"}
                    </span>
                    <pre className="text-slate-350 text-[10px] leading-normal font-mono whitespace-pre-wrap select-all cursor-text py-1.5 scrollbar-none max-h-[80px] overflow-y-auto bg-slate-950/20 rounded mt-1">
                      {item.suggestedWording}
                    </pre>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleCopyText(item.suggestedWording, item.id)}
                      className="text-[9px] px-2.5 py-1 hover:bg-slate-800 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400">{language === "hi" ? "कॉपी हो गया!" : "Copied!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 shrink-0" />
                          <span>{language === "hi" ? "शब्दावली कॉपी करें" : "Copy Wording"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Directed AI Actions panel */}
                <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between gap-2.5">
                  <span className="text-[9px] font-mono text-slate-500 italic max-w-[130px] sm:max-w-none truncate" title={item.promptExample}>
                    Prompt: "{item.promptExample}"
                  </span>
                  <button
                    onClick={() => handleAskAIClick(item.promptExample)}
                    className="shrink-0 text-[10px] px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/15 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans font-bold"
                  >
                    <span>{language === "hi" ? "पूछें AI से" : "Consult AI"}</span>
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-white/5 rounded-2xl py-14 text-center space-y-4 font-sans">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Scale className="w-6 h-6 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">No Statutory Sections Match Search</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
              Try adjusting your query or selecting another statutory category to find the correct compliance benchmark reference.
            </p>
          </div>
        </div>
      )}

      {/* Playbook Compliance Checklist / Regulatory Sandbox */}
      <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/60 border border-indigo-500/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-serif italic text-lg text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>{language === "hi" ? "भारतीय नियामक अनुपालन चेकलिस्ट" : "Indian Regulatory Compliance Checklist"}</span>
        </h3>
        <p className="text-xs text-slate-400 leading-normal max-w-3xl">
          {language === "hi"
            ? "सुनिश्चित करें कि नए अनुबंधित दायित्वों और कानूनी नोटिसों में निम्नलिखित पांच वैधानिक मानकों को सुदृढ़ता से शामिल किया गया है:"
            : "Before concluding negotiations for an agreement targeting India-bound services or registration, cross-verify compliance against these cardinal touchpoints:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          
          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <strong className="text-xs text-slate-200 font-bold font-sans">Bilateral Liabilities</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" ? "सभी संदावों के तहत देयता सीमा (Sec. 74) का द्विपक्षीय होना अतिआवश्यक है।" : "Liability caps are mutual and tied directly under Section 73 & 74 estimations."}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <strong className="text-xs text-slate-200 font-bold font-sans">Mandatory Net-45 Payouts</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" ? "पंजीकृत एमएसएमई के लिए 45 दिन की अनिवार्य भुगतान समय सीमा लागू करें।" : "Supplier terms feature explicit 45-day payment caps under MSMED Section 15 guidelines."}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <strong className="text-xs text-slate-200 font-bold font-sans">Perpetual Assignment Scope</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" ? "अधिकार हस्तांतरण को हमेशा 'स्थायी' और 'वैश्विक' रूप से चिह्नित किया जाए।" : "IP assignment includes explicit perpetual and worldwide parameters under Copyright Section 19."}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <strong className="text-xs text-slate-200 font-bold font-sans">Consent notices under DPDP</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" ? "डेटा संग्रहण खंड सुस्पष्ट, संदेहास्पद नोटिस व सहमति मानदंडों के अनुरूप हो।" : "Personal data flows feature granular notice protocols matching DPDP Act requirements."}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <strong className="text-xs text-slate-200 font-bold font-sans">Supervisory seat designation</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {language === "hi" ? "मध्यस्थता क्लॉज में सीट (Seat of Arbitration) की सही व्याख्या सुनिश्चित करें।" : "Arbitration terms highlight a specific legal 'Seat' under the 1996 Arbitration Act rules."}
            </p>
          </div>

          <div className="p-4 bg-slate-950/20 rounded-xl border border-emerald-500/10 flex flex-col justify-center gap-1.5 text-center">
            <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 font-bold">compliance checklist active</span>
            <span className="text-[8px] text-slate-500">{language === "hi" ? "सुरक्षित रूप से प्रमाणित" : "Digitally verified based on supreme statutory guidelines"}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
