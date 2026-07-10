import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Configure Axios once
let apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "VITE_API_URL is not defined. Please check your .env.production or .env file."
  );
}

// Automatically rewrite localhost to the network IP when accessed from another device
if (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost')) {
  apiUrl = apiUrl.replace(/127\.0\.0\.1|localhost/, window.location.hostname);
}

axios.defaults.baseURL = apiUrl;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Set authorization header before verifying token
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Verify token and fetch current user
          const response = await axios.get('/api/auth/me');

          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      // FastAPI OAuth2PasswordBearer expects form data
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(
        '/api/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);

      setToken(access_token);
      setUser(userData);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return {
        success: true,
        role: userData.role,
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.detail ||
          "An error occurred during login",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');

    setToken(null);
    setUser(null);

    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};