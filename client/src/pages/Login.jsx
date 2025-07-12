import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "../contexts/AuthContext";
import { showSuccess, showError } from "../hooks/useSnackbar";

const Form = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

// Validation schema
const schema = yup.object().shape({
  username: yup.string().required("اسم المستخدم مطلوب"),
  password: yup.string().required("كلمة المرور مطلوبة"),
});

const Login = () => {
  const { login, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const success = await login(data.username, data.password);

      if (success) {
        showSuccess("تم تسجيل الدخول بنجاح");
        navigate("/");
      } else {
        showError(
          authError ||
            "فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography
            component="h2"
            variant="h5"
            className="arabic-text"
            gutterBottom
          >
            تسجيل الدخول
          </Typography>

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label="اسم المستخدم"
              name="username"
              autoComplete="username"
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              InputLabelProps={{
                className: "arabic-text",
              }}
              {...register("username")}
            />

            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="كلمة المرور"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputLabelProps={{
                className: "arabic-text",
              }}
              {...register("password")}
            />

            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              className="arabic-text"
            >
              {loading ? <CircularProgress size={24} /> : "تسجيل الدخول"}
            </SubmitButton>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                className="arabic-text"
              >
                ليس لديك حساب؟ سجل الآن
              </Link>
            </Box>
          </Form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
