import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authApi } from '../api/auth';
import { tokenStore, refreshTokenStore } from '../api/token';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  initialized: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_DONE':
      return { ...state, user: action.payload, loading: false, initialized: true };
    case 'LOGIN':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Try to restore session on mount
  useEffect(() => {
    const restore = async () => {
      const rt = refreshTokenStore.get();
      if (!rt) return dispatch({ type: 'INIT_DONE', payload: null });
      try {
        const { data } = await authApi.refresh(rt);
        tokenStore.set(data.data.accessToken);
        refreshTokenStore.set(data.data.refreshToken);
        const me = await authApi.me();
        dispatch({ type: 'INIT_DONE', payload: me.data.data });
      } catch {
        tokenStore.clear();
        refreshTokenStore.clear();
        dispatch({ type: 'INIT_DONE', payload: null });
      }
    };
    restore();
  }, []);

  // Listen for forced logout from interceptor
  useEffect(() => {
    const handler = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    tokenStore.set(data.data.accessToken);
    refreshTokenStore.set(data.data.refreshToken);
    dispatch({ type: 'LOGIN', payload: data.data.admin });
    return data.data.admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      const rt = refreshTokenStore.get();
      if (rt) await authApi.logout(rt);
    } catch { /* silent */ } finally {
      tokenStore.clear();
      refreshTokenStore.clear();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
