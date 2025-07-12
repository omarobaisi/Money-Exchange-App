import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const SuccessSnackbar = ({ open, message, onClose, duration = 3000 }) => (
  <Snackbar
    open={open}
    autoHideDuration={duration}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "center" }}
  >
    <Alert
      onClose={onClose}
      severity="success"
      sx={{ width: "100%" }}
      className="arabic-text"
    >
      {message}
    </Alert>
  </Snackbar>
);

export default SuccessSnackbar;
