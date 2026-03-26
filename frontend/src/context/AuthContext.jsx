import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { authStorage } from '../services/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = authStorage.getToken();
            const storedUser = authStorage.getUser();

            if (!token || !storedUser) {
                setLoading(false);
                return;
            }

            try {
                const response = await authApi.me(token);
                setUser(response.data);
                authStorage.setSession({ token, user: response.data });
            } catch {
                authStorage.clearSession();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authApi.login({ email, password });
            const { token, user: loggedInUser } = response.data;
            authStorage.setSession({ token, user: loggedInUser });
            setUser(loggedInUser);
            return { success: true, user: loggedInUser };
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const register = async (data) => {
        try {
            const response = await authApi.register(data);
            return { success: true, user: response.data };
        } catch (error) {
            return { success: false, message: error.message || 'Registration failed' };
        }
    };

    const logout = () => {
        authStorage.clearSession();
        setUser(null);
    };

    const updateCurrentUser = (nextUser) => {
        if (!nextUser) return;
        const token = authStorage.getToken();
        setUser(nextUser);
        if (token) {
            authStorage.setSession({ token, user: nextUser });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
