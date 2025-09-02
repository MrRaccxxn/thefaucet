"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores";
import type { User } from "@/lib/stores/types";

export function useAuth() {
  const { data: session, status } = useSession();
  const { login, logout, user, isAuthenticated } = useAuthStore();

  // Sync NextAuth session with our Zustand store
  useEffect(() => {
    if (status === "loading") return;

    if (session?.user) {
      // Convert NextAuth user to our User type
      // Note: session.user.id and githubUsername are added by our server-side callback
      const user: User = {
        id: (session.user as any).id || session.user.email || "unknown",
        nickname: (session.user as any).githubUsername || session.user.name || session.user.email || "unknown",
        avatarUrl: session.user.image || "",
        isVerified: true, // We'll implement validation later
      };
      login(user);
    } else {
      logout();
    }
  }, [session, status, login, logout]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    logout();
  };

  return {
    user,
    isAuthenticated,
    isLoading: status === "loading",
    signOut: handleSignOut,
  };
}
