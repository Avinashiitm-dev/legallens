import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CloudUpload,
  FileText,
  ZoomIn,
  ZoomOut,
  Eye,
  Brain,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Edit3,
  History,
  Copy,
  CheckCircle,
  Flag,
  Pin,
  FileCode,
  AlertOctagon,
  X,
  Mail,
  Loader2,
  Download,
  Printer,
  CheckSquare,
  Square,
  Search,
  ArrowLeftRight,
  Scale,
  HelpCircle
} from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { AnalysisReport, ContractRisk } from "../types";
import { DEFAULT_CONTRACT_BODY } from "../constants";
import { trpc } from "@/providers/trpc";

// Tooltip Legal Terms for Indian Commercial Standards
const highlightLegalTerms = (htmlText: string) => {
  const termsDictionary = [
    {
      terms: ["indemnification", "indemnify", "indemnity", "indemnified"],
      title: "INDEMNIFICATION (Sec. 124, Indian Contract Act)",
      meaning: "Governed by Sections 124 & 125. Indian contracts heavily inspect indemnity clauses. Indemnifying against indirect/consequential loss must raise special attention as standard rules restrict automatic recovery."
    },
    {
      terms: ["net 90", "net-90", "ninety (90) days", "90 days", "within ninety (90) days"],
      title: "PAYMENT TERMS (MSMED Act, 2006 Compliance)",
      meaning: "Section 15 of MSMED Act prohibits registered micro/small vendor payouts exceeding 45 days. Net 90 options are legally invalid here, triggering mandatory compound interest at 3x the RBI Rate."
    },
    {
      terms: ["limitation of liability", "liability limitation", "liability cap", "sole remedy"],
      title: "LIABILITY CAPS (Section 74, Contract Act)",
      meaning: "Section 74 demands liability limits present a realistic pre-estimate of loss. Arbitrary caps/restrictions might be set aside under Sec. 23 of the Act if found unconscionable or contrary to public interest."
    },
    {
      terms: ["non-competition", "non-compete", "restrictive covenant"],
      title: "RESTRAINT OF TRADE (Section 27)",
      meaning: "Section 27 renders any contract restricting professional or commercial engagement void. Any post-employment/post-termination non-compete is legally unenforceable in India."
    },
    {
      terms: ["arbitration", "arbitral tribunal", "arbitrate"],
      title: "ARBITRATION Hub (Arbitration Act, 1996)",
      meaning: "Governed by the Arbitration & Conciliation Act, 1996. To avoid international complications, designating New Delhi, Mumbai, or Bengaluru as seated courts ensures fast-tracked local hearings."
    },
    {
      terms: ["governing law", "exclusive jurisdiction", "jurisdiction of"],
      title: "DISPUTE JURISDICTION (CPC, 1908)",
      meaning: "Aligns with Code of Civil Procedure, 1908. Standard contracts limit exclusive jurisdiction to major corporate circles (Delhi/Mumbai/Bengaluru) to guarantee rapid resolution."
    },
    {
      terms: ["force majeure", "act of god"],
      title: "FORCE MAJEURE (Sections 32 & 56)",
      meaning: "Contractual relief under Sec. 32 or Sec. 56 (doctrine of frustration). Where a pandemic or disaster occurs, Indian tribunals demand proof of absolute commercial/physical impossibility."
    }
  ];

  // Split into segments to avoid replacing inside HTML attributes/tags
  const segments = htmlText.split(/(<[^>]+>)/g);

  const processedSegments = segments.map((seg, sIdx) => {
    // If it's an odd index, it is an HTML tag (like <span class="...">) -> Skip it!
    if (sIdx % 2 === 1) return seg;

    let text = seg;
    const tokens: { id: string; markup: string }[] = [];
    let tokenCounter = 0;

    // Gather all matching word patterns
    const allMatches: { term: string; pattern: RegExp; title: string; meaning: string }[] = [];
    termsDictionary.forEach(entry => {
      entry.terms.forEach(term => {
        const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");
        allMatches.push({
          term,
          pattern: regex,
          title: entry.title,
          meaning: entry.meaning
        });
      });
    });

    // Sort terms by match length descending to handle compound phrases first
    allMatches.sort((a, b) => b.term.length - a.term.length);

    // Replace terms with temporary tokens to prevent double-replacing
    allMatches.forEach(item => {
      const replacer = (match: string) => {
        const tokenId = `___LEGAL_TOKEN_MARKER_${tokenCounter++}___`;
        const tooltipStr = `${item.title}: ${item.meaning}`;
        const markup = `<span class="legal-term-tooltip inline-block" data-tooltip="${tooltipStr}">${match}</span>`;
        tokens.push({ id: tokenId, markup });
        return tokenId;
      };

      text = text.replace(item.pattern, replacer);
    });

    // Restore tokens with actual HTML markups
    tokens.forEach(tk => {
      text = text.replace(tk.id, tk.markup);
    });

    return text;
  });

  return processedSegments.join("");
};

// Map contract clause names/categories to respective Indian Statutory Acts, Sections, and Explanations
const getIndianLawContext = (clauseName: string) => {
  const name = (clauseName || "").toLowerCase();

  if (name.includes("liability") || name.includes("cap") || name.includes("limit")) {
    return {
      title: "Limitation of Liability (Sec. 73 & 74, Contract Act)",
      act: "Indian Contract Act, 1872",
      badge: "High Legal Impact",
      explanation: "Under Indian law, consequential or remote damages are generally not recoverable unless specifically agreed or foreseeable at drafting. Uncapped liabilities expose you to astronomical claims. Clear bilateral ceilings protect commercial assets from indefinite litigation.",
      hindiExplanation: "भारतीय कानून के तहत, सामान्यतः दूरस्थ या अप्रत्यक्ष नुकसान की वसूली नहीं की जा सकती जब तक कि विशेष रूप से सहमति न हो। असीमित देनदारी आपको भारी दावों के जोखिम में डालती है। स्पष्ट द्विपक्षीय सीमाएं वाणिज्यिक संपत्तियों की रक्षा करती हैं।"
    };
  }

  if (name.includes("payment") || name.includes("net") || name.includes("invoice") || name.includes("billing") || name.includes("latency")) {
    return {
      title: "Payment Compliance (MSMED Act, 2006)",
      act: "MSME Development Act, 2006",
      badge: "Statutory Directive",
      explanation: "Section 15 mandates that payments to MSME-registered suppliers cannot exceed 45 days. Any clause stretching beyond this duration is legally void, triggering mandatory interest at three times (3x) the RBI rate on all delayed amounts.",
      hindiExplanation: "एमएसएमई विकास अधिनियम की धारा 15 आदेश देती है कि पंजीकृत आपूर्तिकर्ताओं को भुगतान 45 दिनों से अधिक नहीं हो सकता। इससे अधिक समय लेने वाला कोई भी खंड कानूनी रूप से अमान्य है, जिससे रिजर्व बैंक की दर से तीन गुना (3x) ब्याज देय होता है।"
    };
  }

  if (name.includes("non-compete") || name.includes("competes") || name.includes("competition") || name.includes("restraint")) {
    return {
      title: "Covenants in Restraint of Trade (Sec. 27, Contract Act)",
      act: "Indian Contract Act, 1872",
      badge: "Strict Enforceability Bar",
      explanation: "Section 27 declares any agreement restraining someone from exercising a lawful profession, trade, or business as void. Post-employment non-compete restrictions are completely unenforceable in Indian courts, safeguarding individual freedom of trade.",
      hindiExplanation: "धारा 27 किसी भी ऐसे समझौते को अमान्य घोषित करती है जो किसी को वैध पेशे, व्यापार या व्यवसाय करने से रोकता है। भारतीय न्यायालयों में रोजगार के बाद गैर-प्रतिस्पर्धा प्रतिबंध पूरी तरह से अप्रवर्तनीय हैं।"
    };
  }

  if (name.includes("indemnity") || name.includes("indemnification") || name.includes("indemnify")) {
    return {
      title: "Contracts of Indemnity (Sec. 124 & 125, Contract Act)",
      act: "Indian Contract Act, 1872",
      badge: "Heavy Financial Exposure",
      explanation: "Sections 124 and 125 define and govern indemnity rights in India. Broad, one-sided indemnity clauses require you to pay damages for third-party claims or negligence, causing direct exposure. Ensure mutual terms tied to specific breaches.",
      hindiExplanation: "धारा 124 और 125 भारत में क्षतिपूर्ति अधिकारों को नियंत्रित करती हैं। एकतरफा क्षतिपूर्ति प्रावधान आपको तीसरे पक्ष के नुकसान का भुगतान करने के लिए मजबूर कर सकते हैं। सुनिश्चित करें कि ये पारस्परिक और विशिष्ट उल्लोंघनों से जुड़े हों।"
    };
  }

  if (name.includes("intellectual") || name.includes("ip") || name.includes("copyright") || name.includes("license") || name.includes("patent")) {
    return {
      title: "Copyright & IP Assignment Rules (Sec. 19, Copyright Act)",
      act: "Indian Copyright Act, 1957",
      badge: "Statutory Reversion Risk",
      explanation: "Under Section 19, assignment of copyright is void unless in writing and signed. By default, if the duration is not specified, it is statutory capped at 5 years. If the territory is omitted, assignment is limited to India, causing unintended reversion risks.",
      hindiExplanation: "धारा 19 के तहत, कॉपीराइट का हस्तांतरण लिखित और हस्ताक्षरित न होने पर अमान्य है। यदि समय सीमा निर्दिष्ट नहीं है, तो यह स्वतः 5 वर्ष के लिए सीमित हो जाती है। यदि क्षेत्र का उल्लेख नहीं है, तो यह केवल भारत तक सीमित रहती है।"
    };
  }

  if (name.includes("governing") || name.includes("governed") || name.includes("jurisdiction") || name.includes("arbitration") || name.includes("dispute") || name.includes("venue")) {
    return {
      title: "Arbitration & Legal Bar exemptions (Sec. 28, Contract Act)",
      act: "Arbitration Act, 1996 / Sec. 28",
      badge: "Jurisdiction & Seat Setup",
      explanation: "While restricting legal remedies is void under Section 28, Arbitration provides a legitimate statutory exception. Specifying a precise 'Seat' of arbitration under the 1996 Act defines the supervisory court, preventing dragging disputes into standard local civil courts for decades.",
      hindiExplanation: "धारा 28 के तहत कानूनी उपचारों को रोकना अमान्य है, लेकिन मध्यस्थता (Arbitration) इसका अपवाद है। मध्यस्थता का एक सटीक 'सीट' (Seat) निर्दिष्ट करने से पर्यवेक्षी न्यायालय स्पष्ट होता है, जिससे मामले दशकों लंबे सामान्य दीवानी मुकदमों में नहीं फंसते।"
    };
  }

  if (name.includes("confidential") || name.includes("nda") || name.includes("secrecy") || name.includes("secrets")) {
    return {
      title: "Protection of Trade Secrets & Breach of Confidence",
      act: "Indian Contract & Equity Precedents",
      badge: "Injunction & Equity remedy",
      explanation: "India lacks a specific code for trade secrets, so cases rely on breach of contract and common law equity. Clearly defining what constitutes proprietary data and the specific duration of post-term survival is crucial to obtain court injunctions.",
      hindiExplanation: "भारत में ट्रेड सीक्रेट के लिए कोई अलग अधिनियम नहीं है, अतः मामले अनुबंध उल्लंघन और सामान्य कानून सिद्धांतों पर चलते हैं। अदालतों से अंतरिम रोक (Injunction) प्राप्त करने के लिए गोपनीय जानकारी की स्पष्ट परिभाषा आवश्यक है।"
    };
  }

  if (name.includes("termination") || name.includes("convenience") || name.includes("terminate") || name.includes("notice")) {
    return {
      title: "Termination for Convenience (Commercial Equity Laws)",
      act: "Indian Contract & Specific Relief Act",
      badge: "Damages & Restitution",
      explanation: "Indian courts examine whether unilateral terminations for convenience lead to unjust enrichment, especially if a vendor made heavy pre-operational investments. Specifying reciprocal notice structures and proportional termination fees reduces exposure.",
      hindiExplanation: "भारतीय न्यायालय वाणिज्यिक निष्पक्षता की जांच करते हैं, खासकर जब एकतरफा समाप्ति से विक्रेता द्वारा किए गए भारी अग्रिम निवेश पर नुकसान हो। पारस्परिक नोटिस और समाप्ति शुल्क तय करना जोखिम को कम करता है।"
    };
  }

  // Default fallback for any category
  return {
    title: "General Indian Commercial Legal Policy",
    act: "Indian Contract Act, 1872",
    badge: "General Compliance Guidelines",
    explanation: "Indian business transactions are predominantly guided by the robust rules of the Indian Contract Act, 1872. Imbalance or severely asymmetric contracting provisions are assessed for direct relevance to statutory fairness, making mutual, balanced terms highly defensible under Indian adjudications.",
    hindiExplanation: "भारतीय व्यापारिक लेनदेन मुख्य रूप से भारतीय अनुबंध अधिनियम, 1872 के नियमों द्वारा निर्देशित होते हैं। पारस्परिक और संतुलित शर्तें भारतीय न्यायिक व्यवस्था में अत्यधिक सुदृढ़ और मान्य मानी जाती हैं।"
  };
};

import { Language, translations } from "../lib/translations";

interface AnalyzerViewProps {
  language: Language;
  contractText: string;
  contractTitle: string;
  /** Vault document id backing the current workspace (null for ad-hoc pasted text). */
  documentId?: number | null;
  onUpdateContract: (text: string, title: string, documentId?: number | null) => void;
  onNavigate?: (view: string) => void;
  onEscalateToAttorney?: (clauseName: string, reasonDetails: string) => void;
}

export default function AnalyzerView({
  language,
  contractText,
  contractTitle,
  documentId,
  onUpdateContract,
  onNavigate,
  onEscalateToAttorney
}: AnalyzerViewProps) {
  const t = translations[language];
  const [inputText, setInputText] = useState(contractText || DEFAULT_CONTRACT_BODY);
  const [inputTitle, setInputTitle] = useState(contractTitle || "Freelance_Agreement.pdf");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress tracking states
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("Initializing Core AI Node...");

  // Sync animation loops for progress status simulation
  useEffect(() => {
    let interval: any;
    if (analyzing) {
      setScanProgress(0);
      setScanStatus("Initializing Secure Core AI Node...");
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.floor(Math.random() * 8) + 2;
          const next = Math.min(prev + increment, 98);

          if (next < 20) {
            setScanStatus("Initializing Secure Core AI Node...");
          } else if (next < 45) {
            setScanStatus("Scanning Agreement for Liability Thresholds...");
          } else if (next < 70) {
            setScanStatus("Evaluating Indemnification & Jurisdiction Clauses...");
          } else if (next < 90) {
            setScanStatus("Calculating Risk Severity Scores...");
          } else {
            setScanStatus("Formatting Recommendations & Alternatives...");
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  // Current loaded analysis representation
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // Focus helper to tie highlighted text with list scroll offsets
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);

  // States to facilitate copy feedback for individual risk clauses
  const [copiedRiskIndex, setCopiedRiskIndex] = useState<number | null>(null);

  // State for reviewed clauses tracker
  const [reviewedClauses, setReviewedClauses] = useState<Record<number, string | null>>({});

  // PDF report section configuration modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [printSections, setPrintSections] = useState({
    includeHeader: true,
    includeScoreSummary: true,
    includeKeyEntities: true,
    includeRisks: true,
    severityCritical: true,
    severityUnfavorable: true,
    severityProtective: true,
    includeOriginalContract: true
  });

  // Risk cards search query state
  const [riskSearchQuery, setRiskSearchQuery] = useState("");

  // Pinned risk cards state
  const [pinnedRiskIds, setPinnedRiskIds] = useState<number[]>([]);

  const togglePinRisk = (index: number) => {
    setPinnedRiskIds(prev =>
      prev.includes(index)
        ? prev.filter(id => id !== index)
        : [...prev, index]
    );
  };

  // Active dynamic drafting custom draft
  const [customDraftText, setCustomDraftText] = useState("");
  const [copiedDraftType, setCopiedDraftType] = useState<"original" | "standard" | "custom" | null>(null);

  // Active playbook selection for side-by-side standard list
  const [selectedStandardPreset, setSelectedStandardPreset] = useState<"neutral" | "pro-client" | "pro-provider">("neutral");
  const [showDiffHighlight, setShowDiffHighlight] = useState(true);
  const [explainLawIndex, setExplainLawIndex] = useState<number | null>(null);

  // Sync alternative draft in comparison desk whenever selectedRiskId changes
  useEffect(() => {
    if (selectedRiskId !== null && report?.risks && report.risks[selectedRiskId]) {
      setCustomDraftText(report.risks[selectedRiskId].suggestedAlternative);
      setSelectedStandardPreset("neutral");
    } else {
      setCustomDraftText("");
    }
    setCopiedDraftType(null);
    setExplainLawIndex(null);
  }, [selectedRiskId, report]);

  // Reset reviewed clauses when report changes
  useEffect(() => {
    setReviewedClauses({});
    setRiskSearchQuery("");
    setPinnedRiskIds([]);
  }, [report]);

  const getStandardPresetText = (activeRisk: any, type: "neutral" | "pro-client" | "pro-provider") => {
    const clauseLower = (activeRisk.clauseName || "").toLowerCase();

    if (clauseLower.includes("payment") || clauseLower.includes("latency") || clauseLower.includes("invoice") || clauseLower.includes("net 90") || clauseLower.includes("net 60")) {
      if (type === "pro-client") {
        return "Contractor shall pay undisputed invoices within forty-five (45) days of receipt in accordance with standard business procedures, with no interest on late disbursements.";
      }
      if (type === "pro-provider") {
        return "Client shall pay all invoices within fifteen (15) days of receipt. Overdue invoices shall accrue interest at 1.5% per month compounded daily.";
      }
      return activeRisk.suggestedAlternative || "Client shall settle undisputed invoices within thirty (30) days from verification.";
    }

    if (clauseLower.includes("non-compete") || clauseLower.includes("competes") || clauseLower.includes("non-competition")) {
      if (type === "pro-client") {
        return "Contractor shall not directly or indirectly compete with Client globally during the contract term and for a period of twelve (12) months after termination.";
      }
      if (type === "pro-provider") {
        return "No post-employment non-compete restraint of any kind shall restrict the Contractor. Protection of proprietary trade secrets shall cover the customer database only.";
      }
      return activeRisk.suggestedAlternative || "Contractor recognizes the necessity to shield confidential data and intellectual assets without entering covenants restricting standard employment post-termination.";
    }

    if (clauseLower.includes("liability") || clauseLower.includes("cap") || clauseLower.includes("sole remedy")) {
      if (type === "pro-client") {
        return "Except for breaches of confidentiality and third party intellectual property claims, each party's aggregate economic liability under this Agreement shall be limited to twice (2x) the total fees paid.";
      }
      if (type === "pro-provider") {
        return "Provider's sole liability for any direct damages hereunder is capped strictly at fifty percent (50%) of the actual fees received under the SOW preceding the claim.";
      }
      return activeRisk.suggestedAlternative || "Each party's maximum aggregate liability shall be limited to direct damages up to the total fees paid under the active statement of work.";
    }

    if (clauseLower.includes("intellectual property") || clauseLower.includes("license") || clauseLower.includes("copyright")) {
      if (type === "pro-client") {
        return "Upon payment, Contractor assigns and conveys to the Client throughout the universe all major copyrights, patents, and work products developed under this SOW.";
      }
      if (type === "pro-provider") {
        return "Contractor retains all pre-existing IP and merely grants Client a non-exclusive, non-transferable, revocable license to use deliverables solely for ordinary internal systems.";
      }
      return activeRisk.suggestedAlternative || "Upon payment in full, Contractor hereby assigns and conveys to Client all global proprietary copyrights in and to the custom deliverables.";
    }

    // Default fallbacks
    if (type === "pro-client") {
      return "All obligations of compliance and warranties are strictly resolved in favor of the customer, including Delaware litigation venue and statutory interest limits.";
    }
    if (type === "pro-provider") {
      return "All claims must be initiated within twelve months, with local Indian arbitration venue, and standard limits of general indemnities for provider staff.";
    }
    return activeRisk.suggestedAlternative || "Standard mutual reciprocal clause protects both contract parties equally.";
  };

  const getDiffHighlightedText = (originalText: string, standardText: string, isOriginal: boolean) => {
    if (!showDiffHighlight) {
      return isOriginal ? originalText : standardText;
    }

    const clean = (w: string) => w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'’“]/g, "");

    const originalWords = originalText.split(/\s+/);
    const standardWords = standardText.split(/\s+/);

    const originalCleanWords = originalWords.map(clean);
    const standardCleanWords = standardWords.map(clean);

    if (isOriginal) {
      return (
        <>
          {originalWords.map((word, idx) => {
            const cleanWord = clean(word);
            const existsInStandard = standardCleanWords.includes(cleanWord);
            // Highlight terms that are absent from standard (meaning they are risky/deviating)
            const isRisky = ["ninety", "90", "sixty", "60", "compete", "competitor", "globally", "unlimited", "restricted", "retains", "non-exclusive", "sole"].includes(cleanWord);

            if (cleanWord && (!existsInStandard || isRisky)) {
              return (
                <span
                  key={idx}
                  className="bg-rose-500/15 text-rose-300 font-medium px-1 py-0.5 rounded border border-rose-500/10 cursor-help"
                  title="This phrasing is absent in standard or contains elevated compliance risks"
                >
                  {word}{" "}
                </span>
              );
            }
            return <span key={idx}>{word}{" "}</span>;
          })}
        </>
      );
    } else {
      return (
        <>
          {standardWords.map((word, idx) => {
            const cleanWord = clean(word);
            const existsInOriginal = originalCleanWords.includes(cleanWord);

            if (cleanWord && !existsInOriginal) {
              return (
                <span
                  key={idx}
                  className="bg-zinc-300/20 text-zinc-200 font-semibold px-1 py-0.5 rounded border border-zinc-300/15 cursor-help"
                  title="Standardized or Protective improvements inserted"
                >
                  {word}{" "}
                </span>
              );
            }
            return <span key={idx}>{word}{" "}</span>;
          })}
        </>
      );
    }
  };

  const toggleReviewed = (index: number) => {
    setReviewedClauses(prev => {
      if (prev[index]) {
        const next = { ...prev };
        delete next[index];
        return next;
      } else {
        const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return {
          ...prev,
          [index]: timeString
        };
      }
    });
  };

  // Keyboard Arrow Navigation for Risk Cards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        document.activeElement?.hasAttribute("contenteditable")
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!report || !report.risks || report.risks.length === 0) return;

        // Only run if we actually have a card focused or selected
        const isSomeCardFocused = !!document.activeElement?.id?.startsWith("risk-card-");
        if (selectedRiskId === null && !isSomeCardFocused) {
          return; // No card is currently selected or focused, don't hijack general scrolling
        }

        e.preventDefault();

        let currentIdx = selectedRiskId;
        if (currentIdx === null && isSomeCardFocused) {
          const matched = document.activeElement?.id?.match(/risk-card-(\d+)/);
          if (matched) {
            currentIdx = parseInt(matched[1], 10);
          }
        }

        let nextIndex = 0;
        if (currentIdx === null) {
          nextIndex = e.key === "ArrowDown" ? 0 : report.risks.length - 1;
        } else {
          if (e.key === "ArrowDown") {
            nextIndex = (currentIdx + 1) % report.risks.length;
          } else {
            nextIndex = (currentIdx - 1 + report.risks.length) % report.risks.length;
          }
        }

        setSelectedRiskId(nextIndex);
        const element = document.getElementById(`risk-card-${nextIndex}`);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [report, selectedRiskId]);

  const handleCopyQuote = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedRiskIndex(index);
    setTimeout(() => {
      setCopiedRiskIndex(null);
    }, 2000);
  };

  // Modal displays
  const [modalType, setModalType] = useState<"alternative" | "email" | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [generatingCta, setGeneratingCta] = useState(false);

  // Backend mutations (tRPC)
  const utils = trpc.useUtils();
  const analyzeMutation = trpc.legal.analyzeContract.useMutation();
  const uploadMutation = trpc.legal.uploadDocument.useMutation();
  const emailMutation = trpc.legal.draftEmail.useMutation();
  const alternativeMutation = trpc.legal.suggestAlternative.useMutation();

  // Server-side extraction state (multi-page PDF/DOCX uploads)
  const [extracting, setExtracting] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(documentId ?? null);

  // Keep the local pointer in sync when the workspace loads a vault document
  useEffect(() => {
    setCurrentDocumentId(documentId ?? null);
  }, [documentId]);

  // Load baseline report when component loads
  useEffect(() => {
    triggerAnalysis();
  }, [contractText]);

  const triggerAnalysis = async (customTextToSubmit?: string, customTitleToSubmit?: string, docId?: number | null) => {
    setAnalyzing(true);
    setError(null);
    const text = customTextToSubmit || inputText;
    const title = customTitleToSubmit || inputTitle;
    const effectiveDocId = docId !== undefined ? docId : currentDocumentId;

    try {
      const reportData = await analyzeMutation.mutateAsync({
        title,
        contractText: text,
        ...(effectiveDocId ? { documentId: effectiveDocId } : {}),
      });

      setScanProgress(100);
      setScanStatus("Analyzing complete! Finalizing report layout...");
      await new Promise(resolve => setTimeout(resolve, 600));

      const resolvedDocId = reportData.documentId ?? effectiveDocId ?? null;
      setCurrentDocumentId(resolvedDocId);
      const { documentId: _ignored, ...reportView } = reportData;
      setReport(reportView as AnalysisReport);
      onUpdateContract(text, title, resolvedDocId);
      // The analysis is persisted server-side — refresh the vault list
      utils.legal.listDocuments.invalidate();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during evaluation.");
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Server-side document processing: PDF/DOCX binaries are base64-encoded and
   * sent to the extraction engine (multi-page safe); plain text formats are
   * read locally.
   */
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file
    e.target.value = "";
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isPlainText = [".txt", ".md", ".json"].some((ext) => fileNameLower.endsWith(ext));
    const isBinaryDoc = [".pdf", ".docx"].some((ext) => fileNameLower.endsWith(ext));

    if (!isPlainText && !isBinaryDoc) {
      setError("Supported formats: PDF, Word DOCX, or raw text (.txt, .md, .json).");
      return;
    }

    setInputTitle(file.name);
    setError(null);

    if (isPlainText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const val = event.target?.result as string;
        setInputText(val);
        setCurrentDocumentId(null);
        triggerAnalysis(val, file.name, null);
      };
      reader.readAsText(file);
      return;
    }

    // Binary document → server-side extraction engine
    setExtracting(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const contentBase64 = btoa(binary);

      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        contentBase64,
      });

      setInputText(result.text);
      setCurrentDocumentId(result.documentId);
      utils.legal.listDocuments.invalidate();
      if (result.truncated) {
        setError(
          language === "hi"
            ? `दस्तावेज़ बहुत लंबा है — विश्लेषण के लिए पहले ${Math.round(result.text.length / 1000)}K वर्ण लिए गए हैं।`
            : `Large document — the first ~${Math.round(result.text.length / 1000)}K characters were extracted for analysis.`,
        );
      }
      triggerAnalysis(result.text, file.name, result.documentId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The document could not be processed on the server.");
    } finally {
      setExtracting(false);
    }
  };

  // Generate Email renegotiation proposal
  const handleDraftEmail = async (risk: ContractRisk) => {
    setModalTitle(`Renegotiation Draft: ${risk.clauseName}`);
    setModalContent("");
    setModalType("email");
    setGeneratingCta(true);

    try {
      const data = await emailMutation.mutateAsync({
        clauseName: risk.clauseName,
        exactQuote: risk.exactQuote,
        suggestedAlternative: risk.suggestedAlternative
      });
      setModalContent(data.email);
    } catch (err: any) {
      setModalContent(`Error making draft: ${err.message}`);
    } finally {
      setGeneratingCta(false);
    }
  };

  // Request advanced replacement clause
  const handleSuggestAlternative = async (risk: ContractRisk) => {
    setModalTitle(`Fair Draft Alternative: ${risk.clauseName}`);
    setModalContent("");
    setModalType("alternative");
    setGeneratingCta(true);

    try {
      const data = await alternativeMutation.mutateAsync({
        clauseName: risk.clauseName,
        exactQuote: risk.exactQuote,
        summaryOfRisk: risk.summaryOfRisk
      });
      setModalContent(data.alternative);
    } catch (err: any) {
      setModalContent(`Error formulizing clause: ${err.message}`);
    } finally {
      setGeneratingCta(false);
    }
  };

  const handleDownloadPdfReport = () => {
    setIsPrintModalOpen(true);
  };

  const generatePdfReport = () => {
    if (!report) return;

    // Create a printable window with professional, high-fidelity styled layout
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to compile and download your PDF Report.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // Filtering risks according to the selected severities in the print modal
    const selectedRisksList = report.risks.filter(risk => {
      if (risk.severity === "Critical" && !printSections.severityCritical) return false;
      if (risk.severity === "Unfavorable" && !printSections.severityUnfavorable) return false;
      if (risk.severity === "Protective" && !printSections.severityProtective) return false;
      return true;
    });

    const risksHtml = printSections.includeRisks
      ? selectedRisksList.map((risk, idx) => {
        const isCritical = risk.severity === "Critical";
        const isUnfavorable = risk.severity === "Unfavorable";
        const badgeBg = isCritical ? "#fef2f2" : isUnfavorable ? "#fffbeb" : "#f0fdf4";
        const badgeText = isCritical ? "#991b1b" : isUnfavorable ? "#92400e" : "#166534";
        const badgeBorder = isCritical ? "#fca5a5" : isUnfavorable ? "#fcd34d" : "#86efac";
        const riskColor = isCritical ? "#b91c1c" : isUnfavorable ? "#d97706" : "#059669";

        return `
            <div style="margin-bottom: 24px; padding: 20px; border-left: 4px solid ${riskColor}; background: #fafafa; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                  <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 4px; background: ${badgeBg}; color: ${badgeText}; border: 1px solid ${badgeBorder};">
                    ${risk.severity} Provision
                  </span>
                  <span style="font-size: 11px; font-family: 'Courier New', monospace; color: #666; margin-left: 10px;">
                    ${risk.section}
                  </span>
                </div>
              </div>
              <h4 style="font-family: Georgia, serif; font-size: 16px; margin: 0 0 8px 0; color: #111;">
                ${risk.clauseName}
              </h4>
              <p style="font-size: 13px; line-height: 1.5; color: #444; margin: 0 0 12px 0;">
                ${risk.summaryOfRisk}
              </p>
              ${risk.exactQuote ? `
                <div style="font-family: 'Courier New', monospace; font-size: 11px; background: #f3f4f6; padding: 10px 14px; border-radius: 4.5px; border: 1px solid #e5e7eb; color: #555; margin: 8px 0;">
                  "${risk.exactQuote.trim()}"
                </div>
              ` : ""}
              ${risk.suggestedAlternative ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
                  <p style="font-size: 11px; font-weight: bold; color: #c5a368; text-transform: uppercase; margin: 0 0 4px 0; display: flex; align-items: center; gap: 4px;">
                    💡 REVISED REMEDIAL PROVISION (PROPOSED):
                  </p>
                  <p style="font-size: 12px; font-family: Georgia, serif; font-style: italic; color: #222; margin: 0; background: #fffcf5; padding: 10px; border-radius: 4px; border: 1px solid #f6eeda;">
                    ${risk.suggestedAlternative}
                  </p>
                </div>
              ` : ""}
            </div>
          `;
      }).join("")
      : "";

    const scoreColor = report.overallScore > 75 ? "#059669" : report.overallScore > 50 ? "#d97706" : "#b91c1c";
    const scoreBg = report.overallScore > 75 ? "#ecfdf5" : report.overallScore > 50 ? "#fffbeb" : "#fef2f2";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LegalLens AI Scan Report - ${inputTitle.replace(".txt", "").replace(".pdf", "")}</title>
          <style>
            @media print {
              body { background: white; color: black; margin: 20px; }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1a1a1a;
              background-color: #ffffff;
              line-height: 1.6;
              margin: 40px;
              font-size: 14px;
            }
            .header {
              border-bottom: 2px solid #c5a368;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .logo-title {
              font-family: Georgia, serif;
              font-size: 28px;
              font-style: italic;
              color: #c5a368;
              margin: 0;
              letter-spacing: 1.5px;
              text-transform: uppercase;
            }
            .subtitle {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #666666;
              margin-top: 4px;
            }
            .doc-info {
              text-align: right;
              font-size: 12px;
              color: #555;
            }
            .score-box {
              background: ${scoreBg};
              border: 1px solid ${scoreColor}40;
              border-radius: 12px;
              padding: 24px;
              display: flex;
              align-items: center;
              gap: 20px;
              margin-bottom: 30px;
            }
            .score-circle {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              border: 5px solid ${scoreColor};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              font-weight: bold;
              font-family: monospace;
              color: ${scoreColor};
              background: white;
            }
            .summary-title {
              font-family: Georgia, serif;
              font-size: 18px;
              margin-top: 0;
              margin-bottom: 6px;
              color: #111;
            }
            .summary-text {
              font-size: 13px;
              color: #444;
              margin: 0;
            }
            .entities-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            .entities-table th {
              background: #f8fafc;
              text-align: left;
              padding: 10px 14px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
            .entities-table td {
              padding: 12px 14px;
              border: 1px solid #e2e8f0;
              font-size: 13px;
              color: #334155;
            }
            .section-title {
              font-family: Georgia, serif;
              font-size: 20px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              margin-top: 40px;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #0f172a;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #888;
              display: flex;
              justify-content: space-between;
            }
            .btn-print {
              background: #c5a368;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-radius: 6px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              transition: background 0.2s;
            }
            .btn-print:hover {
              background: #b29054;
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;" class="no-print">
            <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
          </div>

          ${printSections.includeHeader ? `
          <div class="header">
            <div>
              <h1 class="logo-title">LegalLens AI</h1>
              <div class="subtitle">Institutional Compliance Risk Audit</div>
            </div>
            <div class="doc-info">
              <div><strong>Document:</strong> ${inputTitle}</div>
              <div><strong>Audit Date:</strong> ${todayStr}</div>
              <div><strong>Privilege Level:</strong> Protected Draft</div>
            </div>
          </div>
          ` : ""}

          ${printSections.includeScoreSummary ? `
          <div class="score-box">
            <div class="score-circle">${report.overallScore}</div>
            <div style="flex: 1;">
              <h3 class="summary-title">Risk Level: ${report.riskLevel}</h3>
              <p class="summary-text">${report.summary}</p>
            </div>
          </div>
          ` : ""}

          ${printSections.includeKeyEntities ? `
          <h2 class="section-title">Critical Key Entities</h2>
          <table class="entities-table">
            <thead>
              <tr>
                <th style="width: 33.33%;">Counterparty</th>
                <th style="width: 33.33%;">Jurisdiction</th>
                <th style="width: 33.33%;">Liability Cap Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${report.keyEntities.counterparty || "Not resolved"}</strong></td>
                <td>${report.keyEntities.jurisdiction || "Not resolved"}</td>
                <td style="color: #b91c1c;"><strong>${report.keyEntities.liabilityCap || "Not resolved"}</strong></td>
              </tr>
            </tbody>
          </table>
          ` : ""}

          ${printSections.includeRisks ? `
          <h2 class="section-title">Statutory Assessed Provisions & Findings</h2>
          <div style="margin-top: 20px;">
            ${risksHtml || `<div style="padding: 20px; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b;">No matching severity provisions selected to print.</div>`}
          </div>
          ` : ""}

          ${printSections.includeRisks && printSections.includeOriginalContract ? `
          <div class="page-break"></div>
          ` : ""}

          ${printSections.includeOriginalContract ? `
          <h2 class="section-title">Original Scanned Contract</h2>
          <div style="font-family: Georgia, serif; font-size: 13px; line-height: 1.6; color: #333; white-space: pre-wrap; background: #fafafa; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; page-break-inside: avoid;">
            ${inputText}
          </div>
          ` : ""}

          <div class="footer">
            <span>© 2026 LEGALLENS COMMERCIAL SERVICES</span>
            <span>AUTO-GENERATED COMPILED SYSTEM COMPLIANCE REPORT</span>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setIsPrintModalOpen(false);
  };

  // Helper function to colorize exact triggering citations in document view
  const renderHighlightedDocument = () => {
    if (!report || !report.risks || report.risks.length === 0) {
      const parsedWithTerms = highlightLegalTerms(inputText);
      return (
        <div
          className="font-serif text-slate-100 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base select-text"
          dangerouslySetInnerHTML={{ __html: parsedWithTerms }}
        />
      );
    }

    let htmlText = inputText;

    // Sort quotes by length descending to avoid nested replacement errors
    const sortedRisks = [...report.risks].sort((a, b) => b.exactQuote.length - a.exactQuote.length);

    sortedRisks.forEach((risk, idx) => {
      const quoteString = risk.exactQuote.trim();
      if (!quoteString || quoteString.length < 5) return;

      // Find quote and wrap with highlighting (using our theme-aware CSS custom colors)
      const sevColor =
        risk.severity === "Critical"
          ? "bg-critical-bg text-critical-text-val font-medium border-b border-rose-400"
          : risk.severity === "Unfavorable"
            ? "bg-unfavorable-bg text-unfavorable-text-val font-medium border-b border-amber-400"
            : "bg-protective-bg text-protective-text-val font-medium border-b border-white";

      // Re-escape regex specials
      const escapedQuote = quoteString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuote})`, "g");

      htmlText = htmlText.replace(regex, `<span class="${sevColor} px-1 rounded cursor-pointer hover:opacity-80 transition-all" id="highlight-node-${idx}">${quoteString}</span>`);
    });

    const parsedWithTerms = highlightLegalTerms(htmlText);

    return (
      <div
        className="font-serif text-slate-100 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base select-text"
        dangerouslySetInnerHTML={{ __html: parsedWithTerms }}
      />
    );
  };

  const filteredRisks = (report?.risks || [])
    .map((risk, idx) => ({ risk, originalIndex: idx }))
    .filter(({ risk }) =>
      risk.clauseName.toLowerCase().includes(riskSearchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6">

      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
            {t.analyzer}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === "hi"
              ? "वाणिज्यिक प्रलेखन सुरक्षा मूल्यांकन और गहन एआई-संचालित जोखिम विश्लेषण।"
              : "End-to-end encrypted high-fidelity scanning of commercial records."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LiquidButton
            onClick={() => setIsHelpOpen(true)}
            id="btn-risk-help-guide"
            className="text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer bg-slate-900/50 hover:bg-slate-800"
            size="sm"
          >
            <Scale className="w-4 h-4 text-white" />
            <span>{t.riskHelpBtn}</span>
          </LiquidButton>

          {report && (
            <LiquidButton
              onClick={handleDownloadPdfReport}
              id="btn-download-pdf-report"
              className="text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer"
              size="sm"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{language === "hi" ? "पीडीएफ रिपोर्ट डाउनलोड करें" : "Download PDF Report"}</span>
            </LiquidButton>
          )}
        </div>
      </div>

      {/* Drag & Paste Upload Zone block */}
      <div className="w-full border border-dashed border-white/10 rounded-2xl bg-slate-900/20 hover:bg-slate-900/40 hover:border-emerald-505/50 transition-all duration-200 flex flex-col items-center justify-center py-10 px-6 group cursor-pointer relative overflow-hidden">
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".pdf,.docx,.txt,.md,.json"
          className="absolute inset-0 opacity-0 cursor-pointer"
          title={language === "hi" ? "वाणिज्यिक समझौतों का दस्तावेज़ लोड करें" : "Drag and Drop legal agreement records"}
        />
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200 border border-white/5">
          {extracting
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <CloudUpload className="w-6 h-6 text-white animate-pulse" />}
        </div>
        <h3 className="font-semibold text-sm text-slate-200 tracking-tight">
          {extracting
            ? (language === "hi" ? "सर्वर पर दस्तावेज़ संसाधित हो रहा है…" : "Extracting document on server…")
            : (language === "hi" ? "दस्तावेज़ यहाँ खींचें और छोड़ें" : "Drag & Drop Documents")}
        </h3>
        <p className="text-[11px] text-slate-500 text-center max-w-sm mb-4 mt-1 font-sans">
          {language === "hi"
            ? "समर्थित प्रारूप: PDF (बहु-पृष्ठ), Word DOCX, TXT/MD। अधिकतम आकार 15MB। पार्सिंग सर्वर पर सुरक्षित रूप से होती है।"
            : "Supports multi-page PDF, Word DOCX, TXT/MD up to 15MB. Parsing runs securely server-side."}
        </p>
        <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-4 rounded-lg font-medium text-xs hover:scale-[1.02] transition-transform flex items-center gap-2 border border-white/10 relative z-10 pointer-events-none">
          {language === "hi" ? "स्थानीय फ़ाइलें चुनें" : "Browse Locally"}
        </button>
      </div>

      {/* Custom manual pasted text zone option */}
      <div className="glass-panel rounded-xl p-4 border-white/5 bg-slate-900/30 flex items-center gap-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={language === "hi" ? "या सीधे यहाँ अन्य अनुबंध की शर्तें या खंड पेस्ट करके विश्लेषण प्रारंभ करें..." : "Or paste custom agreement clause logs here directly..."}
          className="w-full bg-slate-950/60 text-slate-300 placeholder-slate-600 font-sans text-xs p-3 rounded-lg border border-white/5 focus:border-zinc-300 focus:outline-none min-h-[70px] resize-y"
        />
        <LiquidButton
          onClick={() => triggerAnalysis()}
          disabled={analyzing}
          className="text-white font-semibold text-xs shrink-0 cursor-pointer"
          size="sm"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {language === "hi" ? "एआई विश्लेषण" : "AI Analyze"}
        </LiquidButton>
      </div>

      {/* Evaluation loader feedback */}
      {analyzing && (
        <div className="p-5 sm:p-8 lg:p-12 text-center space-y-6 glass-panel rounded-2xl border-white/5 bg-slate-950/80 animate-breathe">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-zinc-300/10 rounded-full border border-zinc-300/20 animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Quantifying Legal Risks...</h3>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white font-medium transition-all duration-300">
                {scanStatus}
              </span>
              <span className="text-slate-200 font-semibold">{scanProgress}%</span>
            </div>

            {/* Smooth Progress Track */}
            <div className="w-full bg-slate-900 border border-white/5 rounded-full h-3 overflow-hidden p-[2px]">
              <motion.div
                className="bg-gradient-to-r from-zinc-300 to-white h-full rounded-full"
                style={{ width: `${scanProgress}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-mono tracking-wider max-w-sm mx-auto">
            [SYS_ALERT] Scanning for liability thresholds, jurisdiction constraints, and Net-disbursement compliance thresholds...
          </p>
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-300 rounded-xl text-xs font-mono">
          [CRITICAL_FAIL] {error}
        </div>
      )}

      {/* Core Split Screen layout when analyzed findings exist */}
      {report && !analyzing && (
        <div className="space-y-6">

          {/* Active Review Deck (Persistent Pinning Workspace) */}
          {pinnedRiskIds.length > 0 && (
            <div className="bg-slate-900/50 border border-zinc-300/20 rounded-2xl p-5 shadow-xl space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-300/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-zinc-300/10 rounded-lg border border-zinc-300/20">
                    <Pin className="w-4 h-4 text-white fill-white/30" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-sans text-slate-100 flex items-center gap-2">
                      <span>{t.pinboardTitle}</span>
                      <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-zinc-300/10 text-zinc-200 border border-zinc-300/20">
                        {pinnedRiskIds.length} {language === "hi" ? "पिन किया हुआ" : "Pinned"}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.pinboardDesc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPinnedRiskIds([])}
                  className="text-[10px] font-mono text-slate-400 hover:text-rose-400 hover:underline transition-colors cursor-pointer outline-none self-start sm:self-auto"
                >
                  {t.unpinAll}
                </button>
              </div>

              {/* Horizontal scrollable or bento grid of pinned items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {pinnedRiskIds.map(pinnedId => {
                  const risk = report.risks[pinnedId];
                  if (!risk) return null;
                  const isCritical = risk.severity === "Critical";
                  const isUnfavorable = risk.severity === "Unfavorable";
                  const isSelected = selectedRiskId === pinnedId;
                  const isReviewed = !!reviewedClauses[pinnedId];

                  return (
                    <motion.div
                      key={pinnedId}
                      layoutId={`pinned-card-${pinnedId}`}
                      onClick={() => {
                        setSelectedRiskId(pinnedId);
                        const element = document.getElementById(`risk-card-${pinnedId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          element.focus();
                        }
                      }}
                      className={`p-3.5 rounded-xl border relative transition-all duration-200 cursor-pointer text-left select-none group/pinned ${isSelected
                        ? "border-zinc-300 bg-emerald-950/20 ring-2 ring-zinc-300/30 shadow-lg"
                        : isReviewed
                          ? "border-zinc-300/20 bg-emerald-950/10 opacity-70 hover:opacity-100"
                          : isCritical
                            ? "bg-rose-950/5 border-rose-500/15 hover:border-rose-500/30"
                            : isUnfavorable
                              ? "bg-amber-950/5 border-amber-500/15 hover:border-amber-500/30"
                              : "bg-slate-900/30 border-white/5 hover:border-white/10"
                        }`}
                    >
                      {/* Accent highlight strip */}
                      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${isReviewed
                        ? "bg-zinc-300"
                        : isCritical
                          ? "bg-rose-500"
                          : isUnfavorable
                            ? "bg-amber-500"
                            : "bg-zinc-300"
                        }`} />

                      <div className="flex justify-between items-center gap-2 mb-1.5 pl-1.5">
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${isReviewed
                          ? "bg-zinc-300/10 text-white"
                          : isCritical
                            ? "bg-rose-500/10 text-rose-300"
                            : isUnfavorable
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-zinc-300/10 text-white"
                          }`}>
                          {isReviewed ? (language === "hi" ? "संशोधित" : "Cleared") : risk.severity}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinRisk(pinnedId);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors outline-none cursor-pointer"
                          title="Unpin"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1 pl-1.5 group-hover/pinned:text-white transition-colors">
                        {risk.clauseName}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal pl-1.5">
                        {risk.summaryOfRisk}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 min-h-[660px]">

            {/* Left Panel: Real-time highlights container */}
            <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-lg">

              {/* Agreement details header toolbar */}
              <div className="px-5 py-4 bg-slate-950/40 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">{inputTitle}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{inputText.split("\n\n").length} Sections • {report.risks.length} Clauses Assessed</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white outline-none"
                    title="Shrink view"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </motion.button>
                  <span className="text-[10px] font-mono text-slate-500 px-1">100%</span>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white outline-none"
                    title="Magnify view"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Simulated legal paper with highlighter tags */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[580px] bg-slate-950/20 custom-scrollbar">
                <div className="max-w-[720px] mx-auto bg-slate-900/30 p-4 sm:p-6 lg:p-8 rounded-xl border border-white/5 hover:shadow-xl transition-shadow">
                  {renderHighlightedDocument()}
                </div>
              </div>

              {/* Interactive Side-by-Side Clause Comparison Workspace */}
              {selectedRiskId !== null && report && report.risks[selectedRiskId] && (
                (() => {
                  const activeRisk = report.risks[selectedRiskId];
                  const isCritical = activeRisk.severity === "Critical";
                  const isUnfavorable = activeRisk.severity === "Unfavorable";
                  const standardPresetText = getStandardPresetText(activeRisk, selectedStandardPreset);

                  return (
                    <div className="border-t border-white/5 bg-slate-950/85 p-5 sm:p-6 space-y-4 animate-fade-in" id="side-by-side-comparison-desk">

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-300/10 rounded-xl border border-zinc-300/20 shadow-md shadow-zinc-300/5">
                            <ArrowLeftRight className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              <span>{t.compareTitle}</span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-855 text-zinc-200 border border-zinc-300/15 font-semibold">
                                {activeRisk.section}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t.compareDesc} Comparing <strong className="text-slate-300">{activeRisk.clauseName}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isCritical
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                            : isUnfavorable
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                              : "bg-zinc-300/15 text-zinc-200 border border-zinc-300/20"
                            }`}>
                            Risk Impact: {isCritical ? (language === "hi" ? "गंभीर जोखिम" : "Critical Flag") : isUnfavorable ? (language === "hi" ? "प्रतिकूल जोखिम" : "Unfavorable Draft") : (language === "hi" ? "सुरक्षित प्रावधान" : "Protective Clause")}
                          </span>
                        </div>
                      </div>

                      {/* Playbook Preset & Diff Controls Selector */}
                      <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 label-container">
                          <span className="text-xs text-slate-400 mr-1 font-medium">{language === "hi" ? "प्लेबुक प्रीसेट:" : "Playbook Preset:"}</span>
                          <button
                            onClick={() => setSelectedStandardPreset("neutral")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer border transition-all ${selectedStandardPreset === "neutral"
                              ? "bg-zinc-300/15 text-zinc-200 border-zinc-300/30 shadow-emerald-505/5 shadow-md"
                              : "bg-slate-950/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                          >
                            {t.standardNeutral}
                          </button>
                          <button
                            onClick={() => setSelectedStandardPreset("pro-client")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer border transition-all ${selectedStandardPreset === "pro-client"
                              ? "bg-zinc-300/15 text-zinc-200 border-zinc-300/30 shadow-emerald-505/5 shadow-md"
                              : "bg-slate-950/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                          >
                            {t.standardProClient}
                          </button>
                          <button
                            onClick={() => setSelectedStandardPreset("pro-provider")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer border transition-all ${selectedStandardPreset === "pro-provider"
                              ? "bg-zinc-300/15 text-zinc-200 border-zinc-300/30 shadow-emerald-505/5 shadow-md"
                              : "bg-slate-950/40 text-slate-400 border-transparent hover:text-slate-300"
                              }`}
                          >
                            {t.standardProProvider}
                          </button>
                        </div>

                        {/* Diff Toggle Switch */}
                        <div className="flex items-center gap-3 self-end md:self-auto label-container">
                          <button
                            onClick={() => setShowDiffHighlight(!showDiffHighlight)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${showDiffHighlight
                              ? "bg-zinc-300/10 text-zinc-200 border-zinc-300/20"
                              : "bg-slate-900 border-white/5 text-slate-400"
                              }`}
                          >
                            <div className={`w-3 h-3 rounded-full transition-all ${showDiffHighlight ? "bg-white scale-100 animate-pulse" : "bg-slate-600 scale-90"
                              }`} />
                            <span>{t.diffHighlightToggle}</span>
                          </button>
                        </div>

                      </div>

                      {/* Columns Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Left: Original Draft Clause with highlights */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${isCritical
                          ? "bg-rose-950/5 border-rose-500/10"
                          : isUnfavorable
                            ? "bg-amber-950/5 border-amber-500/10"
                            : "bg-slate-900/40 border-white/5"
                          }`}>
                          <div>
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-1.5">
                              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                                {t.originalTab}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isCritical ? "bg-rose-500/25 text-rose-300" : isUnfavorable ? "bg-amber-500/25 text-amber-300" : "bg-zinc-300/25 text-zinc-200"
                                }`}>
                                {activeRisk.severity}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono leading-relaxed text-slate-300 italic whitespace-pre-wrap rounded bg-slate-1000/30 p-2.5">
                              "{getDiffHighlightedText(activeRisk.exactQuote || "", standardPresetText, true)}"
                            </p>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 text-[9px]">{language === "hi" ? "असंगत या जोखिम भरा पाठ हाइलाइट किया गया" : "Inconsistent or risky phrased content highlighted"}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(activeRisk.exactQuote || "");
                                setCopiedDraftType("original");
                                setTimeout(() => setCopiedDraftType(null), 2505);
                              }}
                              className="flex items-center gap-1 text-[10px] text-white hover:text-zinc-200 cursor-pointer outline-none transition-colors font-medium"
                            >
                              {copiedDraftType === "original" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-white" />
                                  <span>{language === "hi" ? "कॉपी हुआ!" : "Copied!"}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{language === "hi" ? "मूल कॉपी करें" : "Copy Original"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Right: Industry Standard Alternative with dynamic highlights */}
                        <div className="p-4 rounded-xl border border-zinc-300/15 bg-emerald-950/5 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-3 border-b border-zinc-300/10 pb-1.5">
                              <span className="text-[10px] font-mono uppercase text-white tracking-wider font-semibold">
                                {t.standardTab}
                              </span>
                              <span className="text-[9px] px-2 py-0.5 rounded font-mono bg-zinc-300/20 text-zinc-200 border border-zinc-300/20">
                                {selectedStandardPreset === "neutral" ? (language === "hi" ? "संतुलित और सुरक्षित" : "Balanced Neutral") : selectedStandardPreset === "pro-client" ? (language === "hi" ? "ग्राहक समर्थक" : "Pro-Customer") : (language === "hi" ? "विशिष्ट प्रदाता समर्थक" : "Pro-Provider")}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono leading-relaxed text-emerald-200 whitespace-pre-wrap rounded bg-slate-1000/40 p-2.5">
                              {getDiffHighlightedText(activeRisk.exactQuote || "", standardPresetText, false)}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-emerald-900/35 flex justify-between items-center text-[10px]">
                            <span className="text-zinc-400 text-[9px]">{language === "hi" ? "सुधार और सुरक्षित पाठ जोड़े गए" : "Protective additions highlighted"}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setCustomDraftText(standardPresetText);
                                }}
                                className="text-[10px] text-white hover:text-zinc-200 font-semibold flex items-center gap-1.5 outline-none cursor-pointer border border-zinc-300/20 bg-zinc-300/10 hover:bg-zinc-300/15 px-2 py-0.5 rounded hover:scale-101 active:scale-99 transition-all"
                                title="Adopt this specific playbook preset in your drafting sandbox below"
                              >
                                <Sparkles className="w-3 h-3 text-white" />
                                <span>{t.adoptWording}</span>
                              </button>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(standardPresetText);
                                  setCopiedDraftType("standard");
                                  setTimeout(() => setCopiedDraftType(null), 2505);
                                }}
                                className="flex items-center gap-1 text-[10px] text-white hover:text-zinc-200 cursor-pointer outline-none transition-colors font-medium"
                              >
                                {copiedDraftType === "standard" ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-white" />
                                    <span>{language === "hi" ? "कॉपी हुआ!" : "Copied!"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{language === "hi" ? "मानक कॉपी करें" : "Copy Standard"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Clause Diff Explanatory Guide */}
                      {showDiffHighlight && (
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10.5px]">
                          <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/35 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-400 leading-normal">
                              <strong className="text-rose-300 font-semibold">{language === "hi" ? "जोखिम अंतर (Risks Missing/Changed):" : "Risky Divergence (Pink):"}</strong>{" "}
                              {language === "hi"
                                ? "मूल शर्त के वे विशिष्ट खंड या शब्द जो असंगत शर्तों या उच्च उत्तरदायित्व को दर्शाते हैं।"
                                : "Wording from the original contract containing elevated liability terms or conflicting statutory latencies that are omitted in the standardized alternative."}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded bg-zinc-300/20 border border-zinc-300/35 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-400 leading-normal">
                              <strong className="text-zinc-200 font-semibold">{language === "hi" ? "मानक सुधार (Improvements):" : "Protective Benchmark (Green):"}</strong>{" "}
                              {language === "hi"
                                ? "चयनित प्लेबुक प्रीसेट से प्राप्त संतुलित विधिक शब्द जो आपके दायित्वों को सुरक्षित और स्पष्ट करते हैं।"
                                : "Balanced improvements introduced by the chosen playbook preset to clarify obligations and limit exposure under current statutory acts."}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Interactive Custom Adjustment Sandbox */}
                      <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/30 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-semibold">
                            <Edit3 className="w-3.5 h-3.5 text-white animate-pulse" />
                            {language === "hi" ? "संशोधित खंड अनुकूलन वर्कस्पेस (Sandbox)" : "Interactive Drafting Sandbox (Blend & Verify)"}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCustomDraftText(standardPresetText)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer underline flex items-center gap-1 outline-none font-medium transition-colors"
                              title="Reset sandbox to currently selected standard playbook wording"
                            >
                              {language === "hi" ? "चयनित मानक पर रीसेट करें" : "Reset to Active Standard"}
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={customDraftText}
                          onChange={(e) => setCustomDraftText(e.target.value)}
                          placeholder="Customize and merge terms here..."
                          rows={3}
                          className="w-full bg-slate-950 border border-white/10 text-slate-100 placeholder-slate-600 font-mono text-[11px] leading-relaxed p-3 rounded-lg focus:border-emerald-505 focus:outline-none focus:ring-1 focus:ring-zinc-300/30"
                        />

                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                          <p className="text-[10px] text-slate-500">
                            {language === "hi"
                              ? "अपनी आवश्यकताओं के अनुसार कानूनी खंडों को संपादित करें। कस्टम पाठ कॉपी या समीक्षा चिह्नित करें।"
                              : "Fine-tune the clause variables directly. Click below to copy or clear this flag."}
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(customDraftText);
                                setCopiedDraftType("custom");
                                setTimeout(() => setCopiedDraftType(null), 2505);
                              }}
                              className="text-white hover:bg-slate-850 bg-slate-900 border border-white/10 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-transform flex items-center gap-1.5 cursor-pointer outline-none active:scale-98"
                            >
                              {copiedDraftType === "custom" ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-white animate-bounce" />
                                  <span>{language === "hi" ? "कस्टम कॉपी हो गया!" : "Copied Custom!"}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                                  <span>{language === "hi" ? "कस्टम मसौदा कॉपी करें" : "Copy Custom Draft"}</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                toggleReviewed(selectedRiskId);
                              }}
                              className={`font-semibold text-[10px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer outline-none ${reviewedClauses[selectedRiskId]
                                ? "text-white bg-emerald-950/25 border border-zinc-300/30 font-bold"
                                : "text-slate-300 bg-slate-800 border border-white/10 hover:bg-slate-705"
                                }`}
                            >
                              {reviewedClauses[selectedRiskId] ? (
                                <>
                                  <CheckSquare className="w-3.5 h-3.5 text-white font-bold" />
                                  <span>{language === "hi" ? "संशोधित और स्वीकृत" : "Done (Cleared)"}</span>
                                </>
                              ) : (
                                <>
                                  <Square className="w-3.5 h-3.5 text-slate-405" />
                                  <span>{language === "hi" ? "स्वीकृत चिह्नित करें" : "Flag as Cleared"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()
              )}

            </div>

            {/* Right Panel: AI structural review index */}
            <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col gap-4">

              {/* Metrics summarized pane */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-white" />
                    AI Insights Summary
                  </h3>
                  <div className="flex gap-1.5 font-mono text-[9px]">
                    <span className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/15">
                      {report.risks.filter(r => r.severity === "Critical").length} Critical
                    </span>
                    <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/15">
                      {report.risks.filter(r => r.severity === "Unfavorable").length} Unfavorable
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/5">
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm font-mono ${report.overallScore > 75
                    ? "border-zinc-300 text-zinc-200 bg-zinc-300/5"
                    : report.overallScore > 50
                      ? "border-amber-505 text-amber-300 bg-amber-500/5"
                      : "border-rose-550 text-rose-300 bg-rose-500/5"
                    }`}>
                    {report.overallScore}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{report.riskLevel}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{report.summary}</p>
                  </div>
                </div>

                {/* Reviewed Tasks Progress */}
                {report.risks.length > 0 && (
                  <div className="mt-4 p-3.5 bg-slate-950/25 rounded-xl border border-white/5 text-xs text-slate-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-[11px] text-slate-300">Reviewed Status Progress</span>
                      <span className="font-mono text-[10px] text-white font-semibold">
                        {Object.keys(reviewedClauses).length} of {report.risks.length} Cleared
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 border border-white/5 rounded-full h-2 overflow-hidden p-[1px]">
                      <motion.div
                        className="bg-zinc-300 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(Object.keys(reviewedClauses).length / report.risks.length) * 100}%` }}
                        transition={{ type: "tween", duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Search Risk Clauses Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={riskSearchQuery}
                  onChange={(e) => setRiskSearchQuery(e.target.value)}
                  placeholder="Search issues or filter clauses by name..."
                  className="w-full bg-slate-950/60 border border-white/10 text-slate-100 placeholder-slate-500 font-sans text-xs rounded-xl pl-10 pr-10 py-2.5 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 outline-none transition-all"
                />
                {riskSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRiskSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded bg-slate-950 border border-white/5 hover:border-white/15 transition-colors cursor-pointer outline-none"
                    title="Clear search query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Individual Risks listing card feed */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[420px] pr-2 custom-scrollbar">
                {filteredRisks.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-white/5 rounded-xl bg-slate-950/20">
                    <p className="text-xs text-slate-500 font-sans">No matching clause names found.</p>
                    {riskSearchQuery && (
                      <button
                        onClick={() => setRiskSearchQuery("")}
                        className="text-xs text-white hover:text-zinc-200 underline mt-2 focus:outline-none"
                      >
                        Clear search filter
                      </button>
                    )}
                  </div>
                ) : filteredRisks.map(({ risk, originalIndex: index }) => {
                  const isCritical = risk.severity === "Critical";
                  const isUnfavorable = risk.severity === "Unfavorable";
                  const isProtective = risk.severity === "Protective";
                  const isReviewed = !!reviewedClauses[index];
                  const isSelected = selectedRiskId === index;

                  return (
                    <motion.div
                      key={index}
                      id={`risk-card-${index}`}
                      tabIndex={0}
                      onClick={() => setSelectedRiskId(index)}
                      onFocus={() => setSelectedRiskId(index)}
                      whileHover={{
                        scale: 1.018,
                        borderColor: isSelected
                          ? "#6366f1"
                          : isReviewed
                            ? "rgba(16, 185, 129, 0.45)"
                            : isCritical
                              ? "rgba(244, 63, 94, 0.45)"
                              : isUnfavorable
                                ? "rgba(245, 158, 11, 0.45)"
                                : "rgba(16, 185, 129, 0.35)",
                        boxShadow: isSelected
                          ? "0 0 16px rgba(99, 102, 241, 0.25)"
                          : isReviewed
                            ? "0 0 16px rgba(16, 185, 129, 0.14)"
                            : isCritical
                              ? "0 0 16px rgba(244, 63, 94, 0.18)"
                              : isUnfavorable
                                ? "0 0 16px rgba(245, 158, 11, 0.18)"
                                : "0 0 16px rgba(16, 185, 129, 0.14)"
                      }}
                      transition={{ type: "spring", stiffness: 450, damping: 26 }}
                      className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-200 outline-none cursor-pointer ${isSelected
                        ? "border-zinc-300 bg-slate-900/90 ring-2 ring-zinc-300/45 shadow-lg scale-[1.012]"
                        : isReviewed
                          ? "border-zinc-300/35 bg-emerald-950/20 opacity-80 hover:opacity-100 placeholder-opacity-100"
                          : isCritical
                            ? "bg-slate-900/40 border-rose-500/15 hover:border-rose-500/30"
                            : isUnfavorable
                              ? "bg-slate-900/40 border-amber-500/15 hover:border-amber-500/30"
                              : "bg-slate-900/40 border-zinc-300/10 hover:border-zinc-300/25"
                        }`}
                    >
                      {/* Left vertical border flag of feedback */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${isReviewed
                        ? "bg-zinc-300"
                        : isCritical
                          ? "bg-rose-500"
                          : isUnfavorable
                            ? "bg-amber-500"
                            : "bg-zinc-300"
                        }`} />

                      <div className="flex justify-between items-center mb-3 pl-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${isReviewed
                            ? "bg-zinc-300/15 text-zinc-200"
                            : isCritical
                              ? "bg-rose-500/10 text-rose-300"
                              : isUnfavorable
                                ? "bg-amber-500/10 text-amber-300"
                                : "bg-zinc-300/10 text-white"
                            }`}>
                            {isReviewed ? "Reviewed" : `${risk.severity} Provision`}
                          </span>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReviewed(index);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer outline-none ${isReviewed
                              ? "bg-zinc-300/25 text-zinc-200 border border-zinc-300/35"
                              : "bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-white/5"
                              }`}
                            title={isReviewed ? `Reviewed at ${reviewedClauses[index]}` : "Mark as reviewed"}
                          >
                            {isReviewed ? (
                              <>
                                <CheckSquare className="w-3 h-3 text-white" />
                                <span className="text-[9px]">Done ({reviewedClauses[index]})</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3 h-3" />
                                <span className="text-[9px]">Mark Reviewed</span>
                              </>
                            )}
                          </motion.button>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinRisk(index);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer outline-none ${pinnedRiskIds.includes(index)
                              ? "bg-zinc-300/25 text-zinc-200 border border-zinc-300/35"
                              : "bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-white/5"
                              }`}
                            title={pinnedRiskIds.includes(index) ? "Unpin clause" : "Pin to active review pinboard"}
                          >
                            <Pin className={`w-3 h-3 ${pinnedRiskIds.includes(index) ? "fill-white/40 text-zinc-200" : ""}`} />
                            <span className="text-[9px]">{pinnedRiskIds.includes(index) ? "Pinned" : "Pin"}</span>
                          </motion.button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{risk.section}</span>
                      </div>

                      <div className="flex items-center gap-1.5 pl-1 mb-1 relative flex-wrap">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-zinc-200 transition-colors">
                          {risk.clauseName}
                        </h4>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExplainLawIndex(explainLawIndex === index ? null : index);
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          className={`p-1 rounded-full outline-none focus:ring-1 focus:ring-white transition-colors cursor-pointer ${explainLawIndex === index
                            ? "bg-zinc-300/20 text-zinc-200 border border-zinc-300/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                          title={language === "hi" ? "भारतीय कानून के तहत जोखिम विश्लेषण देखें" : "View risk category explanation under Indian Law"}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {/* Collapsible Indian Law Context Box */}
                      <AnimatePresence>
                        {explainLawIndex === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden mt-2 mx-1 rounded-lg border border-zinc-300/20 bg-emerald-950/20 shadow-inner"
                          >
                            <div className="p-3 text-[11px] space-y-2">
                              {/* Title & Badge */}
                              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                                <span className="font-bold text-zinc-200 font-sans">
                                  {getIndianLawContext(risk.clauseName).title}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-mono bg-zinc-300/20 text-zinc-200 border border-zinc-300/20 font-semibold flex-shrink-0">
                                  {getIndianLawContext(risk.clauseName).act}
                                </span>
                              </div>

                              {/* Description text */}
                              <p className="text-slate-300 leading-relaxed font-sans font-medium">
                                {language === "hi"
                                  ? getIndianLawContext(risk.clauseName).hindiExplanation
                                  : getIndianLawContext(risk.clauseName).explanation}
                              </p>

                              {/* Compliance tag */}
                              <div className="flex items-center gap-1.5 text-[10px] text-white font-semibold font-mono bg-emerald-950/30 p-1.5 rounded border border-white/5">
                                <Scale className="w-3.5 h-3.5 text-white" />
                                <span>{getIndianLawContext(risk.clauseName).badge}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2 pl-1">
                        {risk.summaryOfRisk}
                      </p>

                      {/* Exact Codeblock triggers */}
                      {risk.exactQuote && (
                        <div className="relative group/quote my-3 mx-1 p-2.5 bg-slate-950/50 border border-white/5 rounded-lg text-[10px] text-slate-400 font-mono whitespace-pre-line leading-relaxed pr-9">
                          "{risk.exactQuote.trim()}"
                          <motion.button
                            onClick={() => handleCopyQuote(risk.exactQuote, index)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-2 top-2 p-1.5 rounded bg-slate-950 border border-white/5 hover:border-white/15 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center opacity-60 hover:opacity-100 outline-none"
                            title="Copy original clause text"
                          >
                            {copiedRiskIndex === index ? (
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Operations options buttons */}
                      <div className="flex gap-2 mt-4 pl-1 items-center">
                        {isCritical && (
                          <LiquidButton
                            onClick={() => handleDraftEmail(risk)}
                            className="flex-1 text-slate-200 border border-white/5 text-[10px] font-bold"
                            size="sm"
                          >
                            <Mail className="w-3.5 h-3.5 text-white" />
                            <span>Draft Email</span>
                          </LiquidButton>
                        )}

                        {isUnfavorable && (
                          <LiquidButton
                            onClick={() => handleSuggestAlternative(risk)}
                            className="flex-1 text-white border border-white/5 text-[10px] font-bold"
                            size="sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                            <span>Fair Alternative</span>
                          </LiquidButton>
                        )}

                        <LiquidButton
                          title="Flag to escalate partner attorney handoff"
                          onClick={() => {
                            if (onEscalateToAttorney) {
                              onEscalateToAttorney(
                                risk.clauseName,
                                language === "hi"
                                  ? `अनुबंध "${contractTitle || "दस्तावेज़"}" के विशिष्ट खंड "${risk.clauseName}" के लिए एस्केलेशन का अनुरोध किया गया है। AI ने इस खंड को "${risk.severity}" गंभीरता स्तर के साथ चिह्नित किया है: "${risk.summaryOfRisk}"। अधिवक्ता समीक्षा की आवश्यकता है।`
                                  : `Escalation requested for specific clause "${risk.clauseName}" on the document "${contractTitle || "Agreement"}". The AI identified this clause with severity "${risk.severity}": "${risk.summaryOfRisk}". Requires formal attorney review and protective legal markup.`
                              );
                            } else {
                              alert("Clause flagged for Attorney Escalation. Head over to 'Attorney Handoff' view to select partner.");
                            }
                          }}
                          className="text-slate-400 hover:text-white border border-white/5"
                          size="icon"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </LiquidButton>
                      </div>

                    </motion.div>
                  );
                })}
              </div>

              {/* Entity overview cards container */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-2">
                  Scan Entities
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-500">Counterparty</span>
                    <span className="text-slate-300 font-medium">{report.keyEntities.counterparty || "Not resolved"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-500">Jurisdiction</span>
                    <span className="text-slate-300 font-medium">{report.keyEntities.jurisdiction || "Not resolved"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Liability Cap</span>
                    <span className="text-rose-400 font-medium">{report.keyEntities.liabilityCap || "Not resolved"}</span>
                  </div>
                </div>
              </div>

              {/* Premium Escalate Contract / Attorney Support Handoff card */}
              <div className="bg-gradient-to-br from-emerald-950/45 to-slate-900/75 border border-zinc-300/15 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <Scale className="w-5 h-5 text-white shrink-0" />
                  <h4 className="text-[10px] font-bold uppercase font-mono tracking-wider text-slate-200">
                    {language === "hi" ? "अधिवक्ता एस्केलेशन" : "Attorney Escalation"}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {language === "hi"
                    ? "क्या आपको प्रमाणित कानूनी सहायता या कस्टमाइज्ड संशोधन की आवश्यकता है? इस अनुबंध को सीधे हमारे सत्यापित नेटवर्क वकीलों को सौंपें।"
                    : "Need certified legal drafting representation or custom amendments? Hand off this analyzed agreement directly to our vetted network lawyers."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onEscalateToAttorney) {
                      onEscalateToAttorney(
                        contractTitle || "Full Agreement.pdf",
                        language === "hi"
                          ? `अनुबंध "${contractTitle || "दस्तावेज़"}" की पूर्ण अधिवक्ता समीक्षा की आवश्यकता है। मुख्य चिंताएँ: देयता सीमा, क्षतिपूर्ति सुरक्षा, और भारतीय अनुबंध अधिनियम की धारा 27 के अनुकूल गैर-प्रतिस्पर्धा खंड का विवरण।`
                          : `Comprehensive attorney check required for agreement: "${contractTitle || "Full Document"}". Key focus points include standard limitations of liability, mutual indemnity, and non-competition terms governed under the Indian Contract Act.`
                      );
                    } else {
                      alert("Head over to the 'Attorney Handoff' section to trigger a partner referral request.");
                    }
                  }}
                  className="w-full bg-zinc-400 hover:bg-emerald-550 text-white font-bold py-2.5 px-4 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer outline-none hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{language === "hi" ? "वकील को हैंडऑफ करें" : "Handoff to Attorney"}</span>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Advanced interactive operations outputs Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in-up-snappy relative">
            <motion.button
              onClick={() => setModalType(null)}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 350, damping: 12 }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 outline-none"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              {modalTitle}
            </h3>

            {generatingCta ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Consulting AI legal model parameters...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  readOnly
                  value={modalContent}
                  rows={14}
                  className="w-full bg-slate-950 border border-white/5 text-slate-300 p-4 rounded-xl font-mono text-xs leading-relaxed focus:outline-none custom-scrollbar"
                />

                <div className="flex justify-end gap-3 items-center">
                  <LiquidButton
                    onClick={() => {
                      navigator.clipboard.writeText(modalContent);
                      alert("Copied to Clipboard successfully.");
                    }}
                    className="text-white font-semibold text-xs"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy text
                  </LiquidButton>
                  <LiquidButton
                    onClick={() => setModalType(null)}
                    className="text-slate-300 font-medium text-xs border border-white/10"
                    size="sm"
                  >
                    Close
                  </LiquidButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Print Options Configuration Customizer Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in-up-snappy relative">
            <motion.button
              onClick={() => setIsPrintModalOpen(false)}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 350, damping: 12 }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 outline-none"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Printer className="w-5 h-5 text-white" />
              <div>
                <h3 className="text-sm font-bold text-white">Customize PDF Report</h3>
                <p className="text-[10px] text-slate-500 font-mono">Configure sections and parameters for export</p>
              </div>
            </div>

            <div className="space-y-4 py-1">
              <div className="space-y-2.5">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Report Sections</h4>

                {/* Include Header option */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setPrintSections(prev => ({ ...prev, includeHeader: !prev.includeHeader }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-zinc-300/10 text-white">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Document Header & Metadata</span>
                      <span className="text-[10px] text-slate-500 block">Audit Date, privilege level and title information.</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-all">
                    {printSections.includeHeader ? (
                      <CheckSquare className="w-5 h-5 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Include Score option */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setPrintSections(prev => ({ ...prev, includeScoreSummary: !prev.includeScoreSummary }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-zinc-300/10 text-white">
                      <Brain className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Overall Score & Executive Summary</span>
                      <span className="text-[10px] text-slate-500 block">Aggregate compliance percentage rating and analysis highlights.</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-all">
                    {printSections.includeScoreSummary ? (
                      <CheckSquare className="w-5 h-5 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Include Extracted Entities option */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setPrintSections(prev => ({ ...prev, includeKeyEntities: !prev.includeKeyEntities }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <FileCode className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Extracted Entities & Metadata</span>
                      <span className="text-[10px] text-slate-500 block">Legal jurisdiction, counterparties, and liability ceilings.</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-all">
                    {printSections.includeKeyEntities ? (
                      <CheckSquare className="w-5 h-5 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Include Provisions & Risks Findings Option */}
                <div
                  className="flex flex-col p-3 rounded-lg bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer space-y-3"
                  onClick={(e) => {
                    // prevent click from child buttons from double toggling
                    if ((e.target as HTMLElement).closest('.severity-chk')) return;
                    setPrintSections(prev => ({ ...prev, includeRisks: !prev.includeRisks }));
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <AlertOctagon className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Assessed Statutory Provisions & Findings</span>
                        <span className="text-[10px] text-slate-500 block">Risk audit clauses, exact quotes and custom remedies.</span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-white transition-all">
                      {printSections.includeRisks ? (
                        <CheckSquare className="w-5 h-5 text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Sub-severities checklist when IncludeRisks is enabled */}
                  {printSections.includeRisks && (
                    <div className="pl-9 pr-2 py-1 flex items-center gap-4 text-[10px] font-mono border-t border-white/5 pt-2 mt-1">
                      <button
                        className="severity-chk flex items-center gap-1.5 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintSections(prev => ({ ...prev, severityCritical: !prev.severityCritical }));
                        }}
                      >
                        {printSections.severityCritical ? (
                          <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span className="text-rose-400">Critical</span>
                      </button>

                      <button
                        className="severity-chk flex items-center gap-1.5 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintSections(prev => ({ ...prev, severityUnfavorable: !prev.severityUnfavorable }));
                        }}
                      >
                        {printSections.severityUnfavorable ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span className="text-amber-400">Unfavorable</span>
                      </button>

                      <button
                        className="severity-chk flex items-center gap-1.5 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintSections(prev => ({ ...prev, severityProtective: !prev.severityProtective }));
                        }}
                      >
                        {printSections.severityProtective ? (
                          <CheckSquare className="w-3.5 h-3.5 text-zinc-300" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span className="text-white">Protective</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Include Original Scanned Contract option */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                  onClick={() => setPrintSections(prev => ({ ...prev, includeOriginalContract: !prev.includeOriginalContract }))}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Original Scanned Contract Text</span>
                      <span className="text-[10px] text-slate-500 block">Full body of raw contract records appended at the end.</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-all">
                    {printSections.includeOriginalContract ? (
                      <CheckSquare className="w-5 h-5 text-white" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <LiquidButton
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-300 font-semibold text-xs border border-white/10"
                size="sm"
              >
                Cancel
              </LiquidButton>
              <LiquidButton
                onClick={generatePdfReport}
                className="text-white font-bold text-xs"
                size="sm"
                disabled={!printSections.includeHeader && !printSections.includeScoreSummary && !printSections.includeKeyEntities && !printSections.includeRisks && !printSections.includeOriginalContract}
              >
                <Printer className="w-4 h-4" />
                Generate Print View
              </LiquidButton>
            </div>
          </div>
        </div>
      )}

      {/* Risk Severity Classification Guide help overlay */}
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pb-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative"
            >
              <motion.button
                onClick={() => setIsHelpOpen(false)}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 350, damping: 12 }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <span className="p-2 bg-zinc-300/10 rounded-xl border border-zinc-300/20">
                  <Scale className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.riskHelpModalTitle}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Institutional standards explanation</p>
                </div>
              </div>

              <div className="space-y-4">

                {/* Critical Explanation */}
                <div className="p-4 rounded-xl border border-rose-500/15 bg-rose-950/5 flex items-start gap-4">
                  <div className="p-1 px-2.5 rounded bg-rose-500/10 text-rose-300 font-bold font-mono text-[10px] mt-0.5 border border-rose-500/25 shrink-0">
                    {t.severityCritical}
                  </div>
                  <div className="flex-1 space-y-1 text-left">
                    <h4 className="text-xs font-bold text-slate-100">{t.riskHelpCriticalTitle}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{t.riskHelpCriticalDesc}</p>
                  </div>
                </div>

                {/* Unfavorable Explanation */}
                <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-950/5 flex items-start gap-4">
                  <div className="p-1 px-1.5 rounded bg-amber-500/10 text-amber-300 font-bold font-mono text-[10px] mt-0.5 border border-amber-500/25 shrink-0">
                    {t.severityUnfavorable}
                  </div>
                  <div className="flex-1 space-y-1 text-left">
                    <h4 className="text-xs font-bold text-slate-100">{t.riskHelpUnfavorableTitle}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{t.riskHelpUnfavorableDesc}</p>
                  </div>
                </div>

                {/* Protective Explanation */}
                <div className="p-4 rounded-xl border border-zinc-300/15 bg-emerald-950/5 flex items-start gap-4">
                  <div className="p-1 px-1.5 rounded bg-zinc-300/10 text-zinc-200 font-bold font-mono text-[10px] mt-0.5 border border-zinc-300/25 shrink-0">
                    {language === "hi" ? "सुरक्षात्मक" : "Protective"}
                  </div>
                  <div className="flex-1 space-y-1 text-left">
                    <h4 className="text-xs font-bold text-slate-100">{t.riskHelpProtectiveTitle}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{t.riskHelpProtectiveDesc}</p>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-1">
                <LiquidButton
                  onClick={() => setIsHelpOpen(false)}
                  className="text-white font-bold text-xs cursor-pointer"
                  size="sm"
                >
                  {language === "hi" ? "गाइड बंद करें" : "Close Guide"}
                </LiquidButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
