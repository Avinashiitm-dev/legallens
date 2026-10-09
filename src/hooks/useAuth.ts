import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { signOut as firebaseSignOut, onAuthChanged } from "@/lib/auth-client";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [firebaseReady, setFirebaseReady] = useState(false);
  const [hasFirebaseUser, setHasFirebaseUser] = useState(false);

  useEffect(() => {
    console.log("[useAuth] Initializing Firebase onAuthChanged listener...");
    
    // Strict timeout: if Firebase hangs, force ready state after 3 seconds
    const timeout = setTimeout(() => {
      setFirebaseReady((prev) => {
        if (!prev) {
          console.warn("[useAuth] Firebase auth state listener timed out after 3s.");
          return true;
        }
        return prev;
      });
    }, 3000);

    const unsubscribe = onAuthChanged((fbUser) => {
      console.log("[useAuth] Firebase Auth state changed. User exists:", !!fbUser);
      setHasFirebaseUser(!!fbUser);
      setFirebaseReady(true);
      clearTimeout(timeout);
    });
    
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const {
    data: user,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: firebaseReady && hasFirebaseUser,
  });

  const isLoading = !firebaseReady || (hasFirebaseUser && isQueryLoading);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await firebaseSignOut();
      await utils.invalidate();
      navigate(redirectPath);
    },
    onError: async () => {
      await firebaseSignOut();
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  // Log session state as requested
  useEffect(() => {
    console.log("Session verification state:", { user, loading: isLoading, error });
  }, [user, isLoading, error]);

  useEffect(() => {
    // If the API query errors out for an authenticated Firebase user, 
    // clear the broken session and fall back to the Login form UI.
    if (firebaseReady && hasFirebaseUser && error) {
      console.error("[useAuth] Backend API error. Clearing local session.", error);
      firebaseSignOut().then(() => {
        utils.invalidate();
        navigate(redirectPath);
      });
      return;
    }

    if (
      redirectOnUnauthenticated &&
      firebaseReady &&
      !hasFirebaseUser &&
      !isLoading &&
      !user
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [
    redirectOnUnauthenticated,
    firebaseReady,
    hasFirebaseUser,
    isLoading,
    user,
    error,
    navigate,
    redirectPath,
    utils
  ]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
