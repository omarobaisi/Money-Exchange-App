import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";
import TransactionForm from "./pages/TransactionForm";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Earnings from "./pages/Earnings";
import Settings from "./pages/Settings";

// Auth context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Create RTL cache
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create theme with RTL support
const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  palette: {
    primary: {
      main: "#0d47a1",
    },
    secondary: {
      main: "#7b1fa2",
    },
    error: {
      main: "#f44336",
    },
    background: {
      default: "#f8f9fa",
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        InputLabelProps: {
          className: "arabic-text",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        className: "arabic-text",
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: "right",
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <CssBaseline />
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* Protected Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route
                    path="/transaction/:type"
                    element={<TransactionForm />}
                  />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetails />} />
                  <Route path="/earnings" element={<Earnings />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Redirect for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </LocalizationProvider>
        </ThemeProvider>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
