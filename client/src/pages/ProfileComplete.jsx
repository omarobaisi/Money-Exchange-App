import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { CURRENCIES } from "../constants/currencies";
import { userService, currencyService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ProfileComplete = () => {
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const [selectedCurrencies, setSelectedCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle adding a new currency
  const handleAddCurrency = (event, newValue) => {
    if (!newValue) return;

    // Don't add duplicates
    if (selectedCurrencies.some((c) => c.code === newValue.code)) return;

    setSelectedCurrencies([
      ...selectedCurrencies,
      {
        ...newValue,
        isPrimary: false,
        balance: 0,
        check_balance: 0,
      },
    ]);
  };

  // Handle removing a currency
  const handleRemoveCurrency = (code) => {
    setSelectedCurrencies(selectedCurrencies.filter((c) => c.code !== code));
  };

  // Toggle primary status for a currency
  const handleTogglePrimary = (code) => {
    setSelectedCurrencies(
      selectedCurrencies.map((c) =>
        c.code === code ? { ...c, isPrimary: !c.isPrimary } : c
      )
    );
  };

  // Update balance for a currency
  const handleBalanceChange = (code, value) => {
    setSelectedCurrencies(
      selectedCurrencies.map((c) =>
        c.code === code
          ? { ...c, balance: value === "" ? 0 : Number(value) }
          : c
      )
    );
  };

  // Update check_balance for a currency
  const handleCheckBalanceChange = (code, value) => {
    setSelectedCurrencies(
      selectedCurrencies.map((c) =>
        c.code === code
          ? { ...c, check_balance: value === "" ? 0 : Number(value) }
          : c
      )
    );
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCurrencies.length === 0) {
      setError("يرجى اختيار عملة واحدة على الأقل");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create currencies and set initial balances
      const promises = selectedCurrencies.map(async (currency) => {
        // Create currency with the expected payload structure
        const newCurrency = await currencyService.createCurrency({
          currency: currency.name, // The server expects 'currency' field instead of 'name'
        });

        if (newCurrency.data && newCurrency.data.data) {
          const currencyId = newCurrency.data.data._id;

          // Set company balance
          await currencyService.updateCompanyBalance(currencyId, {
            balance: currency.balance,
            check_balance: currency.check_balance,
            star: currency.isPrimary,
          });
        }
      });

      await Promise.all(promises);

      // Update user's initial setup flag
      await userService.updateProfile({
        isInitialSetup: false,
      });

      // Refresh auth state
      await checkAuthStatus();

      setSuccess(true);

      // Redirect to dashboard after successful setup
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Profile setup failed:", err);
      setError(err.response?.data?.data?.message || "فشل في إعداد الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            إكمال إعداد الحساب
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" mb={4}>
            يرجى اختيار العملات التي تتعامل بها وتعيين الأرصدة الأولية
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              تم إعداد الحساب بنجاح! جاري تحويلك إلى لوحة التحكم...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box mb={4}>
              <Autocomplete
                options={CURRENCIES}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                onChange={handleAddCurrency}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="إضافة عملة"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            </Box>

            {selectedCurrencies.length > 0 && (
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  العملات المختارة
                </Typography>
                <Grid container spacing={3}>
                  {selectedCurrencies.map((currency) => (
                    <Grid item xs={12} key={currency.code}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, position: "relative" }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={currency.code}
                                color="primary"
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="body1">
                                {currency.name}
                              </Typography>
                              <Button
                                onClick={() =>
                                  handleTogglePrimary(currency.code)
                                }
                                sx={{ ml: 1, minWidth: "auto", p: 0.5 }}
                              >
                                {currency.isPrimary ? (
                                  <StarIcon color="warning" />
                                ) : (
                                  <StarBorderIcon />
                                )}
                              </Button>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label={`الرصيد (${currency.symbol})`}
                                  type="number"
                                  fullWidth
                                  value={currency.balance}
                                  onChange={(e) =>
                                    handleBalanceChange(
                                      currency.code,
                                      e.target.value
                                    )
                                  }
                                  InputProps={{
                                    inputProps: { min: 0, step: "0.01" },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label={`رصيد الشيكات (${currency.symbol})`}
                                  type="number"
                                  fullWidth
                                  value={currency.check_balance}
                                  onChange={(e) =>
                                    handleCheckBalanceChange(
                                      currency.code,
                                      e.target.value
                                    )
                                  }
                                  InputProps={{
                                    inputProps: { min: 0, step: "0.01" },
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                handleRemoveCurrency(currency.code)
                              }
                              fullWidth
                            >
                              إزالة
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={loading || selectedCurrencies.length === 0}
                startIcon={
                  loading && <CircularProgress size={20} color="inherit" />
                }
              >
                {loading ? "جاري الإعداد..." : "إكمال الإعداد"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfileComplete;
