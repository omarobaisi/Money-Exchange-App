import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Paper,
} from "@mui/material";
import {
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { currencyService } from "../services/api";

const Profile = () => {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState(null);
  const [cashBalance, setCashBalance] = useState("");
  const [checkBalance, setCheckBalance] = useState("");
  const [error, setError] = useState("");

  // Fetch company balances
  const {
    data: balancesData,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useQuery({
    queryKey: ["companyBalances"],
    queryFn: () => currencyService.getCompanyBalances(),
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation(
    (currencyId) => currencyService.toggleCurrencyStar(currencyId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["companyBalances"]);
      },
    }
  );

  // Update balance mutation
  const updateBalanceMutation = useMutation(
    ({ currencyId, data }) =>
      currencyService.updateCompanyBalance(currencyId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["companyBalances"]);
        handleCloseDialog();
      },
      onError: (error) => {
        setError("حدث خطأ أثناء تحديث الرصيد");
        console.error("Error updating balance:", error);
      },
    }
  );

  const handleToggleStar = (currencyId) => {
    toggleStarMutation.mutate(currencyId);
  };

  const handleOpenEditDialog = (currency) => {
    setCurrentCurrency(currency);
    setCashBalance(currency.balance);
    setCheckBalance(currency.check_balance);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setCurrentCurrency(null);
    setCashBalance("");
    setCheckBalance("");
    setError("");
  };

  const handleUpdateBalance = () => {
    if (!currentCurrency) return;

    updateBalanceMutation.mutate({
      currencyId: currentCurrency.currency_id,
      data: {
        balance: parseFloat(cashBalance),
        check_balance: parseFloat(checkBalance),
      },
    });
  };

  // Sort currencies - starred first, then alphabetically
  const sortCurrencies = (currencies) => {
    if (!currencies) return [];
    return [...currencies].sort((a, b) => {
      if (a.star && !b.star) return -1;
      if (!a.star && b.star) return 1;
      return a.currency.currency.localeCompare(b.currency.currency);
    });
  };

  if (balancesLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (balancesError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} className="arabic-text">
        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
      </Alert>
    );
  }

  const currencies = sortCurrencies(balancesData?.data?.data || []);

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
      >
        الحساب الشخصي
      </Typography>

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" className="arabic-text" gutterBottom>
          أرصدة العملات
        </Typography>
        <Typography
          variant="body2"
          className="arabic-text"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          يمكنك تحديث أرصدة العملات وتعليم العملات المفضلة لتظهر في أعلى القائمة
        </Typography>

        <Grid container spacing={3}>
          {currencies.map((currency) => (
            <Grid item xs={12} sm={6} md={4} key={currency._id}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  position: "relative",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                  border: currency.star ? "1px solid #ffc107" : "none",
                }}
              >
                <IconButton
                  sx={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => handleToggleStar(currency.currency_id)}
                >
                  {currency.star ? (
                    <StarIcon sx={{ color: "#ffc107" }} />
                  ) : (
                    <StarBorderIcon />
                  )}
                </IconButton>

                <CardContent>
                  <Typography
                    variant="h6"
                    className="arabic-text"
                    gutterBottom
                    align="center"
                  >
                    {currency.currency.currency}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ mt: 2 }}>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs={6}>
                        <Typography
                          variant="body2"
                          className="arabic-text"
                          color="text.secondary"
                        >
                          رصيد نقدي:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          variant="body1"
                          align="left"
                          fontWeight="medium"
                        >
                          {currency.balance.toLocaleString()}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography
                          variant="body2"
                          className="arabic-text"
                          color="text.secondary"
                        >
                          رصيد شيكات:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          variant="body1"
                          align="left"
                          fontWeight="medium"
                        >
                          {currency.check_balance.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      size="small"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleOpenEditDialog(currency)}
                      className="arabic-text"
                    >
                      تعديل
                    </Button> */}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Edit Balance Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle className="arabic-text">
          تعديل رصيد {currentCurrency?.currency.currency}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} className="arabic-text">
              {error}
            </Alert>
          )}

          <TextField
            margin="dense"
            label="الرصيد النقدي"
            type="number"
            fullWidth
            variant="outlined"
            value={cashBalance}
            onChange={(e) => setCashBalance(e.target.value)}
            InputLabelProps={{ className: "arabic-text" }}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="رصيد الشيكات"
            type="number"
            fullWidth
            variant="outlined"
            value={checkBalance}
            onChange={(e) => setCheckBalance(e.target.value)}
            InputLabelProps={{ className: "arabic-text" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} className="arabic-text">
            إلغاء
          </Button>
          <Button
            onClick={handleUpdateBalance}
            color="primary"
            disabled={updateBalanceMutation.isLoading}
            className="arabic-text"
          >
            {updateBalanceMutation.isLoading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
