/**
 * useGravityAuth - Hook for accessing auth state and methods
 * Provider-agnostic wrapper around react-oidc-context
 */

import { useAuth } from "react-oidc-context";

export interface GravityUser {
  /** User ID (sub claim) */
  id: string;
  /** User email */
  email?: string;
  /** User's full name */
  name?: string;
  /** User roles */
  roles: string[];
  /** User permissions (for MCP/tool access) */
  permissions: string[];
  /** Raw OIDC user object */
  raw: any;
}

export interface GravityAuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth is still loading */
  isLoading: boolean;
  /** Current user (if authenticated) */
  user: GravityUser | null;
  /** Access token for API calls */
  accessToken: string | null;
  /** Login function */
  login: () => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Get access token (refreshes if needed) */
  getAccessToken: () => Promise<string | null>;
}

export function useGravityAuth(): GravityAuthState {
  const auth = useAuth();

  // Parse user from OIDC profile
  const user: GravityUser | null = auth.user
    ? {
        id: auth.user.profile.sub,
        email: auth.user.profile.email,
        name: auth.user.profile.name,
        roles: parseArrayClaim(auth.user.profile, "roles"),
        permissions: parseArrayClaim(auth.user.profile, "permissions"),
        raw: auth.user,
      }
    : null;

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user,
    accessToken: auth.user?.access_token || null,

    login: async () => {
      await auth.signinRedirect();
    },

    logout: async () => {
      await auth.signoutRedirect();
    },

    getAccessToken: async () => {
      if (!auth.user) return null;

      // Check if token is expired and refresh if needed
      if (auth.user.expired) {
        try {
          await auth.signinSilent();
        } catch (error) {
          console.error("[GravityAuth] Token refresh failed:", error);
          return null;
        }
      }

      return auth.user?.access_token || null;
    },
  };
}

/**
 * Parse array claims from JWT (handles namespaced claims like Auth0)
 */
function parseArrayClaim(profile: any, claimName: string): string[] {
  // Direct claim
  if (Array.isArray(profile[claimName])) {
    return profile[claimName];
  }

  // Namespaced claim (Auth0 style: https://gravity.ai/claims/permissions)
  const namespacedKey = Object.keys(profile).find(
    (key) => key.endsWith(`/${claimName}`) || key.endsWith(`/claims/${claimName}`)
  );

  if (namespacedKey && Array.isArray(profile[namespacedKey])) {
    return profile[namespacedKey];
  }

  return [];
}
