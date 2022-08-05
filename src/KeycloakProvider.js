import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native'
import * as AuthSession from 'expo-auth-session';
import {
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { KeycloakContext } from './KeycloakContext';
import useTokenStorage from './useTokenStorage';
import { handleTokenExchange, getRealmURL } from './helpers';
import {
  NATIVE_REDIRECT_PATH,
} from './const';
import useNetworkState from './useNetworkState';
import useMounted from './useMounted';

import { resolveDiscoveryAsync } from 'expo-auth-session/src/Discovery';

// export interface IKeycloakConfiguration extends Partial<AuthRequestConfig> {
//   clientId: string;
//   disableAutoRefresh?: boolean;
//   nativeRedirectPath?: string;
//   realm: string;
//   refreshTimeBuffer?: number;
//   scheme?: string;
//   tokenStorageKey?: string;
//   url: string;
// }


export const KeycloakProvider = ({ realm, clientId, url, extraParams, scopes = [], children, ...options }) => {
  const [error, setError] = useState(null);

  //const discovery = useAutoDiscovery();
  const [discovery, setDiscovery] = useState(null);
  const mounted = useMounted();
  useNetworkState(state => {
    if (state.isConnected && !discovery) {
      resolveDiscoveryAsync(getRealmURL({ realm, url })).then(discovery => {
        if (mounted()) {
          setDiscovery(discovery);
        }
      }).catch(error => {
        if (mounted()) {
          setError(error);
        }
      });
    }
});


  const redirectUri = AuthSession.makeRedirectUri({
    native: `${options.scheme ?? 'exp'}://${options.nativeRedirectPath ?? NATIVE_REDIRECT_PATH}`,
    useProxy: !options.scheme,
  });

  const config = { redirectUri, clientId, realm, url, scopes, extraParams }

  const [request, response, promptAsync] = useAuthRequest(
    { usePKCE: false, ...config },
    discovery,
  );
  const [currentToken, updateToken] = useTokenStorage(options, config, discovery)

  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = useCallback((options) => {
    setLoggingIn(true);
    return promptAsync(options);
  }, [request])

  const handleLogout = () => {
    if (!currentToken) throw new Error('Not logged in.');
    try {
      if (discovery.revocationEndpoint) {
        AuthSession.revokeAsync(
          { token: currentToken?.accessToken, ...config }, discovery
        )
      }
      if(discovery.endSessionEndpoint) {
        fetch(`${discovery.endSessionEndpoint}`, {
          method: 'POST',         
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `client_id=${clientId}&refresh_token=${currentToken.refreshToken}`
        })
      }
      if(Platform.OS === 'ios') {
        AuthSession.dismiss();
      }
    } catch (error) {
      console.log(error)
    }
    updateToken(null)
  }
  useEffect(() => {
    if (response) {
      if(response.type === 'cancel') {
        setLoggingIn(false);
      }
      handleTokenExchange({ response, discovery, config })
        .then(token => {
          setLoggingIn(false);
          updateToken(token)
        }).catch(error => {
          setLoggingIn(false);
          setError(error);
        })
    }
  }, [response])
  return (
    <KeycloakContext.Provider
      value={{
        isLoggedIn: currentToken === undefined ? undefined : !!currentToken,
        login: handleLogin,
        logout: handleLogout,
        ready: discovery !== null && request !== null && currentToken !== undefined,
        error,
        token: currentToken,
        loggingIn: loggingIn,
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};
