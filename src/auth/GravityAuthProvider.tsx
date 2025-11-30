/**
 * GravityAuthProvider - Provider-Agnostic OIDC Authentication
 * Works with: Auth0, Keycloak, Azure AD, Cognito, etc.
 */

import { AuthProvider, AuthProviderProps } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

export interface GravityAuthConfig {
  /** OIDC issuer URL (e.g., https://your-tenant.auth0.com) */
  issuer: string;
  /** Client ID from your OIDC provider */
  clientId: string;
  /** API audience/resource identifier */
  audience?: string;
  /** Redirect URI after login (defaults to current origin) */
  redirectUri?: string;
  /** Scopes to request (defaults to 'openid profile email') */
  scope?: string;
}

interface GravityAuthProviderProps {
  config: GravityAuthConfig;
  children: React.ReactNode;
}

export function GravityAuthProvider({ config, children }: GravityAuthProviderProps) {
  const oidcConfig: AuthProviderProps = {
    authority: config.issuer,
    client_id: config.clientId,
    redirect_uri: config.redirectUri || window.location.origin,
    scope: config.scope || "openid profile email",
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    onSigninCallback: () => {
      // Remove OIDC params from URL after login
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };

  // Add audience for Auth0 (and other providers that support it)
  if (config.audience) {
    oidcConfig.extraQueryParams = {
      audience: config.audience,
    };
  }

  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}
