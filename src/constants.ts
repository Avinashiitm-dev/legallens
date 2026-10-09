import { Attorney, ContractTemplate, EscalationCase } from "./types";

export const DEFAULT_CONTRACT_BODY = `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of October 24, 2023, by and between Client Inc. ("Client") and Independent Contractor ("Contractor").

1. SERVICES AND DELIVERABLES
Contractor agrees to perform the services described in the attached Statements of Work (SOWs) and provide the deliverables specified therein.

4. COMPENSATION AND PAYMENT
Client shall pay undisputed invoices within ninety (90) days of receipt (Net 90). Contractor is responsible for all expenses incurred unless otherwise agreed in writing.

7. NON-COMPETITION
During the term of this Agreement and for a period of two (2) years thereafter, Contractor shall not directly or indirectly engage in any business that competes with the Client globally.

9. INTELLECTUAL PROPERTY
Contractor retains pre-existing intellectual property rights. Client receives a non-exclusive license to use deliverables solely for internal business purposes.`;

export const VETTED_ATTORNEYS: Attorney[] = [
  {
    id: "att-1",
    name: "Sarah Jenkins",
    firm: "Jenkins & Caldwell LLC",
    rating: 4.9,
    specialization: "IP & Tech Transactions",
    rate: 320,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop",
    avatarAlt: "Sarah Jenkins, IP Attorney"
  },
  {
    id: "att-2",
    name: "Marcus Chen",
    firm: "Chen Legal Partners",
    rating: 4.8,
    specialization: "Corporate M&A",
    rate: 450,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop",
    avatarAlt: "Marcus Chen, Corporate M&A Attorney"
  },
  {
    id: "att-3",
    name: "Elena Rodriguez",
    firm: "Rodriguez & Associates",
    rating: 5.0,
    specialization: "Data Privacy & Security",
    rate: 380,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop",
    avatarAlt: "Elena Rodriguez, Data Privacy Attorney"
  },
  {
    id: "att-4",
    name: "Adv. Avinash",
    firm: "Avinash Legal Chambers",
    rating: 4.95,
    specialization: "Indian Constitution & Corporate Law",
    rate: 290,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    avatarAlt: "Advocate Avinash, Constitutional & Commercial Law Expert",
    phone: "+918210286125",
    email: "avinash000000004@gmail.com",
    affiliation: "Bar Council of India"
  }
];

export const INITIAL_ESCALATIONS: EscalationCase[] = [
  {
    id: "esc-1",
    contractName: "Acme Vendor MSA",
    reason: "Liability cap negotiation",
    priority: "High",
    status: "Awaiting attorney"
  },
  {
    id: "esc-2",
    contractName: "Globex NDA 2024",
    reason: "Non-compete clause review",
    priority: "Medium",
    status: "Assigned to Sarah Jenkins",
    assignedAttorney: "Sarah Jenkins"
  }
];

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "tmpl-1",
    name: "Mutual NDA",
    category: "Confidentiality",
    description: "A robust mutual non-disclosure agreement balancing protection for both parties during preliminary discussions.",
    isProtective: true,
    rawText: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement ("Agreement") is signed by the parties to protect confidential business dialogues.
1. CONFIDENTIAL INFORMATION: Both parties commit to sharing proprietary technical data, financial plans, and product designs solely under strict confidentiality constraints.
2. DURATION: The obligation of non-disclosure shall persist for three (3) years from the date of disclosure.`
  },
  {
    id: "tmpl-2",
    name: "Freelance MSA",
    category: "Services",
    description: "Master Services Agreement tailored for independent contractors, covering IP assignment and payment terms.",
    isProtective: false,
    rawText: `FREELANCE MASTER SERVICES AGREEMENT
This Master Services Agreement governs contract development services.
1. INDEPENDENT CONTRACTOR: Contractor is hired as an independent consultant. No joint venture or employment is implied.
2. INTELLECTUAL PROPERTY: All deliverables developed during this project are 'work-for-hire' and immediately owned by Client Inc.`
  },
  {
    id: "tmpl-3",
    name: "Employment Offer",
    category: "Employment",
    description: "Comprehensive offer letter template including at-will clauses, compensation breakdown, and benefits summary.",
    isProtective: true,
    rawText: `EMPLOYMENT OFFER LETTER
We are delighted to offer you employment.
1. AT-WILL BASE: Employment relationship is at-will, meaning either party can terminate of its own volition at any time.
2. INTELLECTUAL PROPERTY: Employees assign all innovations formulated within business hours or company assets onto the Employer.`
  },
  {
    id: "tmpl-4",
    name: "Vendor Services Agreement",
    category: "Procurement",
    description: "Procurement-focused agreement outlining service level expectations, liabilities, and termination clauses for external vendors.",
    isProtective: false,
    rawText: `VENDOR SERVICES AGREEMENT
This Agreement regulates vendor-supplied raw materials or logistics.
1. LIABILITY LIMITATION: Vendor's aggregate economic liability is strictly limited to actual service receipts of the prior six months.`
  }
];
