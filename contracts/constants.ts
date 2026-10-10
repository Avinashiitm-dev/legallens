export const Session = {
  cookieName: "legallens_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

/** Limits shared by the upload UI and the server-side extraction engine. */
export const DocumentLimits = {
  /** Max original binary size accepted by the upload endpoint (bytes). */
  maxFileBytes: 25 * 1024 * 1024,
  /** Max extracted characters sent to the analyzer / stored per document. */
  maxExtractChars: 120_000,
  /** Max pages processed for a single PDF. */
  maxPdfPages: 300,
  /** Extensions handled by the server-side extraction engine. */
  supportedExtensions: ["pdf", "docx", "txt", "md", "json"] as const,
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;
