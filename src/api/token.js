// Access token lives only in memory — never persisted to localStorage
let _accessToken = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

// Refresh token stored in localStorage (only option with this backend)
const REFRESH_KEY = 'rt';

export const refreshTokenStore = {
  get: () => localStorage.getItem(REFRESH_KEY),
  set: (token) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => localStorage.removeItem(REFRESH_KEY),
};
