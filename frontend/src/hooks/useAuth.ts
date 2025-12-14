"use client";

/**
 * Hook for managing authentication state.
 * 
 * Provides current user info, login status, and logout functionality.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  status: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Token expired or invalid
        localStorage.removeItem("access_token");
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
        return;
      }

      const user = await response.json();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: user.role === "admin",
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
    router.push("/");
    router.refresh();
  }, [router]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    logout,
    refresh,
  };
}

export default useAuth;
