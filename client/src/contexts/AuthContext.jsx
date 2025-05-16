import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated on initial load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);

      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Set axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Verify token with backend
      const response = await axios.get("/api/users/me");

      if (response.data.data) {
        setCurrentUser(response.data.data);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "فشل تسجيل الدخول");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("/api/auth/register", userData);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;

        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || "فشل انشاء الحساب");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
