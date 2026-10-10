import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  multiFactor,
  getMultiFactorResolver,
  PhoneMultiFactorGenerator,
  type User as FirebaseUser,
  type MultiFactorResolver,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";

export type { FirebaseUser, MultiFactorResolver, ConfirmationResult };

// ─── Error parsing ──────────────────────────────────────────────

/**
 * Maps Firebase error codes to user-friendly messages.
 * Falls back to a generic message for unknown codes.
 */
export function parseFirebaseError(err: unknown): string {
  console.error("AUTH_ERROR_DETAIL:", err);
  const code = (err as { code?: string })?.code ?? "";
  const msg = (err as { message?: string })?.message ?? "";

  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/cancelled-popup-request": "Only one popup request is allowed at a time.",
    "auth/account-exists-with-different-credential":
      "An account already exists with the same email but a different sign-in method.",
    "auth/invalid-phone-number": "The phone number is invalid. Use format: +91XXXXXXXXXX.",
    "auth/missing-phone-number": "Please enter a phone number.",
    "auth/invalid-verification-code": "The OTP code is incorrect. Please try again.",
    "auth/code-expired": "The verification code has expired. Please request a new one.",
    "auth/multi-factor-auth-required": "Multi-factor verification required.",
    "auth/network-request-failed":
      "Network error — check your internet connection and try again.",
    "auth/internal-error": "An internal error occurred. Please try again later.",
    "auth/user-disabled": "This account has been disabled by an administrator.",
  };

  return map[code] || msg || "Authentication failed. Please try again.";
}

/**
 * Returns true if the error is a multi-factor auth challenge.
 */
export function isMfaError(err: unknown): boolean {
  return (err as { code?: string })?.code === "auth/multi-factor-auth-required";
}

// ─── Email/Password ─────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
}

// ─── Google ─────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('Cross-Origin')) {
      console.warn("Popup blocked or closed, falling back to redirect...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

// ─── Phone / SMS ────────────────────────────────────────────────

let appVerifier: RecaptchaVerifier | null = null;

/**
 * Initialises (or resets) an invisible RecaptchaVerifier attached to the
 * given container element id. Must be called before `sendPhoneCode`.
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear any previous verifier to avoid stale widget state
  if (appVerifier) {
    try {
      appVerifier.clear();
    } catch {
      // ignore — element may have already unmounted
    }
  }

  appVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — will proceed with phone sign-in
    },
  });

  return appVerifier;
}

/**
 * Sends an SMS verification code to the given phone number.
 * Returns a ConfirmationResult that can be used to verify the code.
 */
export async function sendPhoneCode(
  phoneNumber: string,
): Promise<ConfirmationResult> {
  if (!appVerifier) {
    throw new Error("RecaptchaVerifier not initialised. Call setupRecaptcha first.");
  }
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

/**
 * Confirms the SMS OTP code and completes phone sign-in.
 */
export async function confirmPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
) {
  const credential = await confirmation.confirm(code);
  return credential.user;
}

// ─── Multi-Factor Authentication (SMS second factor) ────────────

/**
 * Extracts the MultiFactorResolver from a Firebase MFA error.
 * Use this when `isMfaError(err)` returns true.
 */
export function getMfaResolver(err: unknown): MultiFactorResolver {
  return getMultiFactorResolver(auth, err as Parameters<typeof getMultiFactorResolver>[1]);
}

/**
 * Sends the MFA SMS verification code for the first SMS hint in the resolver.
 * Returns a verificationId to use with `completeMfaSignIn`.
 */
export async function sendMfaCode(
  resolver: MultiFactorResolver,
  containerId: string,
): Promise<string> {
  const recaptchaVerifier = setupRecaptcha(containerId);

  // Find the first phone-type second factor
  const phoneHint = resolver.hints.find(
    (h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
  );

  if (!phoneHint) {
    throw new Error("No phone-based MFA factor found on this account.");
  }

  const phoneInfoOptions = {
    multiFactorHint: phoneHint,
    session: resolver.session,
  };

  const phoneAuthProviderInstance = new PhoneAuthProvider(auth);
  return phoneAuthProviderInstance.verifyPhoneNumber(
    phoneInfoOptions,
    recaptchaVerifier,
  );
}

/**
 * Completes the MFA sign-in with the OTP code and verificationId.
 */
export async function completeMfaSignIn(
  resolver: MultiFactorResolver,
  verificationId: string,
  otpCode: string,
) {
  const cred = PhoneAuthProvider.credential(verificationId, otpCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
  const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
  return userCredential.user;
}

/**
 * Returns the enrolled MFA factors for the current user (if any).
 */
export function getEnrolledFactors() {
  const user = auth.currentUser;
  if (!user) return [];
  return multiFactor(user).enrolledFactors;
}

// ─── Session helpers ────────────────────────────────────────────

export async function signOut() {
  await firebaseSignOut(auth);
}

/**
 * Returns the Firebase ID token for the currently signed-in user.
 * Attach this as a Bearer token in API calls so the server can verify identity.
 */
let cachedIdToken: string | null = null;

export async function getIdToken(): Promise<string | null> {
  if (cachedIdToken) return cachedIdToken;
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        cachedIdToken = await user.getIdToken();
      } catch (err) {
        console.error("Failed to fetch ID token on auth change:", err);
      }
    } else {
      cachedIdToken = null;
    }
    callback(user);
  });
}

export { auth };
