import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required("الاسم مطلوب"),
  username: yup
    .string()
    .min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف")
    .required("اسم المستخدم مطلوب"),
  password: yup
    .string()
    .min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف")
    .required("كلمة المرور مطلوبة"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "كلمة المرور غير متطابقة")
    .required("تأكيد كلمة المرور مطلوب"),
});

export default function Register() {
  const { register: registerUser, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");

      // Remove confirmPassword field before sending to API
      const { confirmPassword, ...userData } = data;

      const success = await registerUser(userData);

      if (success) {
        navigate("/");
      } else {
        setError(authError || "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography
        component="h2"
        variant="h5"
        className="arabic-text"
        gutterBottom
      >
        إنشاء حساب جديد
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, width: "100%" }}
          className="arabic-text"
        >
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ mt: 1, width: "100%" }}
      >
        <TextField
          margin="normal"
          fullWidth
          id="name"
          label="الاسم"
          autoComplete="name"
          autoFocus
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
          InputLabelProps={{ className: "arabic-text" }}
        />
        <TextField
          margin="normal"
          fullWidth
          id="username"
          label="اسم المستخدم"
          autoComplete="username"
          {...register("username")}
          error={!!errors.username}
          helperText={errors.username?.message}
          InputLabelProps={{ className: "arabic-text" }}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              fullWidth
              id="password"
              label="كلمة المرور"
              type="password"
              autoComplete="new-password"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputLabelProps={{ className: "arabic-text" }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              fullWidth
              id="confirmPassword"
              label="تأكيد كلمة المرور"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputLabelProps={{ className: "arabic-text" }}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
          className="arabic-text"
        >
          {loading ? <CircularProgress size={24} /> : "تسجيل حساب جديد"}
        </Button>
        <Box sx={{ textAlign: "center" }}>
          <Link
            component={RouterLink}
            to="/login"
            variant="body2"
            className="arabic-text"
          >
            {"لديك حساب بالفعل؟ تسجيل الدخول"}
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
