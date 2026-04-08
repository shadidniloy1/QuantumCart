"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  type User,
} from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Types
interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: "USER" | "ADMIN";
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Sync Firebase user to Neon DB
  async function syncUserToDb(firebaseUser: User) {
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseId: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL,
        }),
      });
      const data = await res.json();
      setDbUser(data);
    } catch (error) {
      console.error("Failed to sync user:", error);
    }
  }

  // Lister for auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncUserToDb(firebaseUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      await syncUserToDb(firebaseUser);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithEmail(email: string, password: string) {
    setLoading(true);
    try {
      const firebaseUser = await signInWithEmail(email, password);
      await syncUserToDb(firebaseUser);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function registerWithEmail(
    email: string,
    password: string,
    name: string,
  ) {
    setLoading(true);
    try {
      const firebaseUser = await signUpWithEmail(email, password, name);
      await syncUserToDb(firebaseUser);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await logOut();
    setUser(null);
    setDbUser(null);
    router.push("/");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}