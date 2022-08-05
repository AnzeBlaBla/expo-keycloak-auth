import { useContext, useMemo } from 'react';
import { KeycloakContext } from './KeycloakContext';

export const useKeycloak = () => {
  const val = useContext(KeycloakContext);

  return {
    ...val,
    token: val.token?.accessToken ?? null,
  }
}
