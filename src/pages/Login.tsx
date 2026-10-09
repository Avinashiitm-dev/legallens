import { motion } from "framer-motion";
import {
  Scale,
  ShieldCheck,
  FileSearch,
  Landmark,
  MessageSquare,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithEmail,
  registerWithEmail,
  signInWithGoogle,
  sendPhoneCode,
  confirmPhoneCode,
  setupRecaptcha,
  parseFirebaseError,
  isMfaError,
  getMfaResolver,
  sendMfaCode,
  completeMfaSignIn,
  onAuthChanged,
  type ConfirmationResult,
  type MultiFactorResolver,
} from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import LiquidMetalHero from "@/components/ui/liquid-metal-hero";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LiquidButton } from "@/components/ui/liquid-glass-button";


// ─── Auth flow stages ───────────────────────────────────────────

type AuthStage =
  | "email"      // Email/password sign-in or register
  | "phone"      // Phone number input
  | "phone-otp"  // OTP verification for phone sign-in
  | "mfa"        // MFA OTP verification (triggered after email/Google sign-in)
  | "success";   // Post-auth, navigating to dashboard

// ─── Google SVG logo ────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════

export default function Login() {
  const navigate = useNavigate();

  // ─── Core state ─────────────────────────────────────────────
  const [showAuth, setShowAuth] = useState(false);
  const [stage, setStage] = useState<AuthStage>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email flow
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Phone flow
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otpCode, setOtpCode] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] =
    useState<ConfirmationResult | null>(null);

  // MFA flow
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(
    null,
  );
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(
    null,
  );
  const [mfaCode, setMfaCode] = useState("");

  // Recaptcha container ref
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaInitialised = useRef(false);

  // ─── Auto-redirect if already signed in ─────────────────────
  useEffect(() => {
    const unsub = onAuthChanged((user) => {
      if (user && stage !== "success") {
        setStage("success");
        navigate("/");
      }
    });
    return unsub;
  }, [navigate, stage]);

  // ─── Initialise invisible recaptcha once DOM is ready ───────
  useEffect(() => {
    if (recaptchaRef.current && !recaptchaInitialised.current) {
      try {
        setupRecaptcha("recaptcha-container");
        recaptchaInitialised.current = true;
      } catch {
        // Recaptcha init can fail if element not yet in DOM — retry on next mount
      }
    }
  }, [stage]);

  // ─── Shared error handler (also handles MFA challenge) ──────
  const handleAuthError = useCallback(
    async (err: unknown) => {
      console.error("Authentication/Sync error:", err);
      if (isMfaError(err)) {
        try {
          const resolver = getMfaResolver(err);
          setMfaResolver(resolver);

          const verificationId = await sendMfaCode(
            resolver,
            "recaptcha-container",
          );
          setMfaVerificationId(verificationId);
          setStage("mfa");
          setError(null);
          toast.info(
            "Multi-factor verification required. Check your phone for an SMS code.",
          );
        } catch (mfaErr) {
          setError(parseFirebaseError(mfaErr));
        }
      } else {
        const msg = parseFirebaseError(err);
        setError(msg);
        toast.error(msg);
      }
    },
    [],
  );

  // ─── Email/Password submit ─────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await registerWithEmail(email, password, name || email.split("@")[0]);
        toast.success("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
      }
      // onAuthChanged will handle navigation
    } catch (err) {
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google sign-in ────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      // onAuthChanged will handle navigation
    } catch (err) {
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Phone: send code ─────────────────────────────────────
  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number with country code (e.g. +91XXXXXXXXXX).");
      return;
    }

    setLoading(true);

    try {
      // Re-setup recaptcha for fresh verification
      setupRecaptcha("recaptcha-container");
      const confirmation = await sendPhoneCode(phoneNumber);
      setPhoneConfirmation(confirmation);
      setStage("phone-otp");
      setError(null);
      toast.info("Verification code sent! Check your SMS messages.");
    } catch (err) {
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Phone: verify OTP ────────────────────────────────────
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      if (phoneConfirmation) {
        await confirmPhoneCode(phoneConfirmation, otpCode);
        // onAuthChanged will handle navigation
      }
    } catch (err) {
      await handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── MFA: verify OTP ─────────────────────────────────────
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mfaCode || mfaCode.length < 6) {
      setError("Please enter the 6-digit MFA code.");
      return;
    }

    setLoading(true);

    try {
      if (mfaResolver && mfaVerificationId) {
        await completeMfaSignIn(mfaResolver, mfaVerificationId, mfaCode);
        toast.success("MFA verification successful!");
        // onAuthChanged will handle navigation
      }
    } catch (err) {
      const msg = parseFirebaseError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset to initial state ───────────────────────────────
  const resetToEmail = () => {
    setStage("email");
    setError(null);
    setOtpCode("");
    setMfaCode("");
    setPhoneConfirmation(null);
    setMfaResolver(null);
    setMfaVerificationId(null);
  };

  // ─── Shared input classes ─────────────────────────────────
  const inputClass =
    "w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-400 outline-none focus:outline-none focus:ring-0 focus:border-white/30 border-white/10 [outline:none] [box-shadow:none]";

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <>
      <div id="recaptcha-container" ref={recaptchaRef} className="hidden" />

      {/* Hero Section */}
      <LiquidMetalHero
        badge="✨ Next Generation Legal AI"
        title="LegalLens"
        subtitle="AI Contract Intelligence & Legal Analysis. Built for modern law firms that demand both precision and performance."
        primaryCtaLabel="Sign In"
        secondaryCtaLabel="Learn More"
        onPrimaryCtaClick={() => setShowAuth(true)}
        features={[
          "AI contract risk audits",
          "Private secure vault",
          "Indian Law Codex"
        ]}
      />

      {/* Auth Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="bg-transparent border-none shadow-none max-w-md p-0 flex justify-center [&>button]:hidden">
          <DialogTitle className="sr-only">Authenticate to LegalLens</DialogTitle>
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full relative z-10"
          >
        <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6">
          {/* Brand Icon */}
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 border border-white/30 flex items-center justify-center shadow-lg shadow-white/10">
              <Scale className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 animate-fade-in">
              {error}
            </div>
          )}

          {/* ════════ EMAIL/PASSWORD STAGE ════════ */}
          {stage === "email" && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {isRegistering && (
                  <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>

                <LiquidButton
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold text-sm tracking-wide text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please wait…
                    </>
                  ) : isRegistering ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </LiquidButton>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  or continue with
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social / alternate sign-in buttons */}
              <div className="flex gap-3">
                <LiquidButton
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="group flex-1"
                >
                  <GoogleIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Google
                </LiquidButton>

                <LiquidButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStage("phone");
                    setError(null);
                  }}
                  disabled={loading}
                  className="group flex-1"
                >
                  <Phone className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
                  Phone
                </LiquidButton>
              </div>

              {/* Toggle register / sign-in */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                  className="text-xs text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Need an account? Register"}
                </button>
              </div>
            </>
          )}

          {/* ════════ PHONE NUMBER INPUT STAGE ════════ */}
          {stage === "phone" && (
            <>
              <form onSubmit={handleSendPhoneCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium">
                    Phone Number
                  </label>
                  <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Include country code (e.g. +91 for India, +1 for US)
                  </p>
                </div>

                <LiquidButton
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold text-sm tracking-wide text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </LiquidButton>
              </form>

              <button
                type="button"
                onClick={resetToEmail}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to email sign-in
              </button>
            </>
          )}

          {/* ════════ PHONE OTP VERIFICATION STAGE ════════ */}
          {stage === "phone-otp" && (
            <>
              <div className="text-center space-y-1">
                <Phone className="w-8 h-8 text-white mx-auto" />
                <p className="text-sm text-slate-300">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-sm font-semibold text-white font-mono">
                  {phoneNumber}
                </p>
              </div>

              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                  <input
                    type="text"
                    placeholder="000000"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>

                <LiquidButton
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full font-bold text-sm tracking-wide text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </LiquidButton>
              </form>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetToEmail}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode("");
                    setStage("phone");
                    setError(null);
                  }}
                  className="text-xs text-white/80 hover:text-white hover:underline underline-offset-4 transition-all"
                >
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* ════════ MFA VERIFICATION STAGE ════════ */}
          {stage === "mfa" && (
            <>
              <div className="text-center space-y-1">
                <ShieldCheck className="w-8 h-8 text-white mx-auto" />
                <p className="text-sm text-slate-300 font-medium">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-slate-400">
                  Enter the verification code sent to your registered phone
                  number
                </p>
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                <div className="relative flex items-center rounded-xl bg-white/5 border border-white/10 focus-within:border-white/30 transition-all backdrop-blur-md">
                  <input
                    type="text"
                    placeholder="000000"
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) =>
                      setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>

                <LiquidButton
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  className="w-full font-bold text-sm tracking-wide text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify Identity"
                  )}
                </LiquidButton>
              </form>

              <button
                type="button"
                onClick={resetToEmail}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                Try a different sign-in method
              </button>
            </>
          )}

          {/* ════════ SUCCESS / REDIRECTING ════════ */}
          {stage === "success" && (
            <div className="text-center py-4 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-white/80 mx-auto" />
              <p className="text-sm text-slate-300">
                Signed in! Redirecting to dashboard…
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-500 text-center leading-relaxed mt-4">
            Secure sign-in powered by Firebase Authentication.
            <br />
            Your contracts and chats are stored privately and never shared.
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
          Informational analysis only — not a substitute for advice from a
          licensed advocate.
        </p>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
