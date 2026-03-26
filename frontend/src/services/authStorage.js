const TOKEN_KEY = 'ims_auth_token';
const USER_KEY = 'ims_current_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  },
  setSession: ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
