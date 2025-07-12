import React, {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import SuccessSnackbar from "../components/SuccessSnackbar";
import ErrorSnackbar from "../components/ErrorSnackbar";

const SnackbarContext = createContext();

export const useSnackbar = () => useContext(SnackbarContext);

let globalShowSnackbar = null;

export function showSuccess(message, duration = 3000) {
  if (globalShowSnackbar) {
    globalShowSnackbar({ open: true, message, type: "success", duration });
  }
}

export function showError(message, duration = 4000) {
  if (globalShowSnackbar) {
    globalShowSnackbar({ open: true, message, type: "error", duration });
  }
}

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
    duration: 3000,
  });

  useEffect(() => {
    globalShowSnackbar = (snackbarConfig) => {
      setSnackbar({ ...snackbarConfig, open: true });
    };
    return () => {
      globalShowSnackbar = null;
    };
  }, []);

  const handleClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError }}>
      {children}
      {snackbar.type === "success" ? (
        <SuccessSnackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={handleClose}
          duration={snackbar.duration}
        />
      ) : (
        <ErrorSnackbar
          open={snackbar.open}
          message={snackbar.message}
          onClose={handleClose}
          duration={snackbar.duration}
        />
      )}
    </SnackbarContext.Provider>
  );
};
