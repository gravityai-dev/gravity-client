import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";

const USER_ID_COOKIE = "gravity_user_id";

interface UserContextValue {
  userId: string | null;
  loading: boolean;
  updateUserId: (newUserId: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps): JSX.Element {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function initUser() {
      // First check localStorage
      let currentUserId = typeof localStorage !== "undefined" ? localStorage.getItem("gravity_user_id") : null;

      // If not in localStorage, check cookies
      if (!currentUserId) {
        currentUserId = getCookie(USER_ID_COOKIE);
      }

      // If still not found, generate a new one
      if (!currentUserId) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 10);
        currentUserId = `user_${timestamp}_${randomStr}`;

        // Store in both cookie and localStorage
        setCookie(USER_ID_COOKIE, currentUserId);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("gravity_user_id", currentUserId);
        }
      }

      setUserId(currentUserId);
      setLoading(false);
    }

    initUser();
  }, []);

  const updateUserId = (newUserId: string) => {
    if (newUserId && newUserId !== userId) {
      setCookie(USER_ID_COOKIE, newUserId);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("gravity_user_id", newUserId);
      }
      setUserId(newUserId);
    }
  };

  return <UserContext.Provider value={{ userId, loading, updateUserId }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
