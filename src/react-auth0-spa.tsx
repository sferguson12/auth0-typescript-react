import React, { useState, useEffect, useContext } from "react";
import createAuth0Client from "@auth0/auth0-spa-js";
import Auth0Client from "@auth0/auth0-spa-js/dist/typings/Auth0Client";

// export interface Auth0RedirectState {
//   targetUrl?: string;
// }

// export interface Auth0User extends Omit<IdToken, '__raw'> {}

interface Auth0Context {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  popupOpen: boolean;
  loginWithPopup(options: PopupLoginOptions): Promise<void>;
  handleRedirectCallback(): Promise<RedirectLoginResult>;
  getIdTokenClaims(options?: getIdTokenClaimsOptions): Promise<IdToken>;
  loginWithRedirect(options: RedirectLoginOptions): Promise<void>;
  getTokenSilently(options?: GetTokenSilentlyOptions): Promise<string | undefined>;
  getTokenWithPopup(options?: GetTokenWithPopupOptions): Promise<string | undefined>;
  logout(options?: LogoutOptions): void;
}

interface Auth0ProviderOptions {
  children: React.ReactElement;
  onRedirectCallback?(result: RedirectLoginResult): void;
}

const DEFAULT_REDIRECT_CALLBACK = () =>
  window.history.replaceState({}, document.title, window.location.pathname);

export const Auth0Context = React.createContext<Auth0Context | null>(null);
export const useAuth0 = () => useContext(Auth0Context)!;
export const Auth0Provider = ({
  children,
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
  ...initOptions
}: Auth0ProviderOptions & Auth0ClientOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState();
  const [auth0Client, setAuth0] = useState<Auth0Client>();
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const initAuth0 = async () => {
      const auth0FromHook = await createAuth0Client(initOptions);
      setAuth0(auth0FromHook);

      if (window.location.search.includes("code=")) {
        const { appState } = await auth0FromHook.handleRedirectCallback();
        onRedirectCallback(appState);        
      }

      const isAuthenticated = await auth0FromHook.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const user = await auth0FromHook.getUser();
        setUser(user);
      }

      setLoading(false);
    };

    initAuth0();
  }, []);

  const loginWithPopup = async (params: PopupLoginOptions) => {
    setPopupOpen(true);

    try {
      await auth0Client!.loginWithPopup(params);
    } catch (error) {
      console.error(error);
    } finally {
      setPopupOpen(false);
    }

    const user = await auth0Client!.getUser();
    setUser(user);
    setIsAuthenticated(true);
  };

  const handleRedirectCallback = async () => {
    setLoading(true);
    const result = await auth0Client!.handleRedirectCallback();
    const user = await auth0Client!.getUser();
    setLoading(false);
    setIsAuthenticated(true);
    setUser(user);
    return result;
  };

  return (
    <Auth0Context.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        popupOpen,
        loginWithPopup,
        handleRedirectCallback,
        getIdTokenClaims: (params: getIdTokenClaimsOptions | undefined) => auth0Client!.getIdTokenClaims(params),
        loginWithRedirect: (params: RedirectLoginOptions | undefined) => auth0Client!.loginWithRedirect(params),
        getTokenSilently: (params: GetTokenSilentlyOptions | undefined) => auth0Client!.getTokenSilently(params),
        getTokenWithPopup: (params: GetTokenWithPopupOptions | undefined) => auth0Client!.getTokenWithPopup(params),
        logout: (params: LogoutOptions | undefined) => auth0Client!.logout(params)
      }}
    >
      {children}
    </Auth0Context.Provider>
  );
};