import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
} from "@mui/material";
import { userService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { showSuccess, showError } from "../hooks/useSnackbar";

// Validation schema for profile form
const profileSchema = yup.object().shape({
  name: yup.string().required("الاسم مطلوب"),
  username: yup.string().required("اسم المستخدم مطلوب"),
  password: yup
    .string()
    .min(4, "كلمة المرور يجب أن تكون على الأقل 6 أحرف")
    .nullable(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "كلمة المرور غير متطابقة")
    .when("password", {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required("تأكيد كلمة المرور مطلوب"),
    }),
});

export default function Settings() {
  const { currentUser, checkAuthStatus } = useAuth();
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      username: currentUser?.username || "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (userData) => userService.updateProfile(userData),
    onSuccess: () => {
      showSuccess("تم تحديث الملف الشخصي بنجاح");
      reset({ password: "", confirmPassword: "" });
      checkAuthStatus(); // Refresh user data
    },
    onError: (err) => {
      showError(
        err.response?.data?.data?.message || "حدث خطأ أثناء تحديث البيانات"
      );
    },
  });

  const onSubmitProfile = (data) => {
    const userData = {
      name: data.name,
      username: data.username,
      ...(data.password && { password: data.password }),
    };

    updateProfileMutation.mutate(userData);
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    // Here you would implement theme switching logic
  };

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
      >
        الإعدادات
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              className="arabic-text"
              sx={{ mb: 3 }}
            >
              الملف الشخصي
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmitProfile)}
              noValidate
            >
              <TextField
                fullWidth
                label="الاسم"
                margin="normal"
                InputLabelProps={{ className: "arabic-text" }}
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />

              <TextField
                fullWidth
                label="اسم المستخدم"
                margin="normal"
                InputLabelProps={{ className: "arabic-text" }}
                error={!!errors.username}
                helperText={errors.username?.message}
                {...register("username")}
              />

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="subtitle1"
                gutterBottom
                className="arabic-text"
                sx={{ mt: 2 }}
              >
                تغيير كلمة المرور
              </Typography>

              <TextField
                fullWidth
                label="كلمة المرور الجديدة"
                type="password"
                margin="normal"
                InputLabelProps={{ className: "arabic-text" }}
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register("password")}
              />

              <TextField
                fullWidth
                label="تأكيد كلمة المرور"
                type="password"
                margin="normal"
                InputLabelProps={{ className: "arabic-text" }}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={updateProfileMutation.isPending}
                sx={{ mt: 3 }}
                className="arabic-text"
              >
                {updateProfileMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              className="arabic-text"
              sx={{ mb: 3 }}
            >
              إعدادات التطبيق
            </Typography>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={handleToggleDarkMode}
                    />
                  }
                  label="الوضع الداكن"
                  className="arabic-text"
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography className="arabic-text" gutterBottom>
                  حول التطبيق
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="arabic-text"
                >
                  تطبيق صرافة للعملات وإدارة المعاملات
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="arabic-text"
                >
                  الإصدار: 1.0.0
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
