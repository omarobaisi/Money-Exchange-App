import { Outlet } from "react-router-dom";
import { Box, Container, Paper, Typography } from "@mui/material";

export default function AuthLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            className="arabic-text"
          >
            تطبيق صرافة
          </Typography>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
