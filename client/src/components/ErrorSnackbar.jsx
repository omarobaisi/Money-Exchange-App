import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const ErrorSnackbar = ({ open, message, onClose, duration = 4000 }) => (
  <Snackbar
    open={open}
    autoHideDuration={duration}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "center" }}
  >
    <Alert
      onClose={onClose}
      severity="error"
      sx={{ width: "100%" }}
      className="arabic-text"
    >
      {message}
    </Alert>
  </Snackbar>
);

export default ErrorSnackbar;
