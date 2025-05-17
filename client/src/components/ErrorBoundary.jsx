import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log the error to an error reporting service here
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
            bgcolor: "background.default",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: "center",
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              عذراً، حدث خطأ ما
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              يبدو أن هناك مشكلة في التطبيق. يرجى المحاولة مرة أخرى.
            </Typography>
            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 2, mb: 3, textAlign: "left" }}>
                <Typography variant="subtitle2" color="error">
                  {this.state.error?.toString()}
                </Typography>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              sx={{ mt: 2 }}
            >
              إعادة تحميل الصفحة
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
