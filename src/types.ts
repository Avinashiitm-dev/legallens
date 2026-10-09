export interface ContractRisk {
  clauseName: string;
  severity: "Critical" | "Unfavorable" | "Protective";
  section: string;
  summaryOfRisk: string;
  exactQuote: string;
  suggestedAlternative: string;
}

export interface KeyEntities {
  counterparty: string;
  jurisdiction: string;
  liabilityCap: string;
}

export interface AnalysisReport {
  overallScore: number;
  riskLevel: string;
  summary: string;
  risks: ContractRisk[];
  keyEntities: KeyEntities;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  privileged?: boolean;
}

export interface Attorney {
  id: string;
  name: string;
  firm: string;
  rating: number;
  specialization: string;
  rate: number;
  avatar: string;
  avatarAlt: string;
  phone?: string;
  email?: string;
  affiliation?: string;
}

export interface EscalationCase {
  id: string;
  contractName: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  status: string;
  assignedAttorney?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  category: "Confidentiality" | "Services" | "Employment" | "Procurement" | "Real Estate";
  description: string;
  isProtective: boolean;
  rawText: string;
}
