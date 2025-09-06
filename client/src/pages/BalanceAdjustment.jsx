import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { currencyService, customerService } from "../services/api";
import { showSuccess, showError } from "../hooks/useSnackbar";

// Validation schema
const balanceAdjustmentSchema = yup.object().shape({
  accountType: yup.string().required("نوع الحساب مطلوب"),
  customerId: yup.string().when("accountType", {
    is: "client",
    then: (schema) => schema.required("العميل مطلوب"),
    otherwise: (schema) => schema.nullable(),
  }),
  currencyId: yup.string().required("العملة مطلوبة"),
  balanceType: yup.string().required("نوع الرصيد مطلوب"),
  adjustmentType: yup.string().required("نوع التعديل مطلوب"),
  amount: yup
    .number()
    .required("المبلغ مطلوب")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  note: yup.string(),
});

const BalanceAdjustment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(balanceAdjustmentSchema),
    defaultValues: {
      accountType: "company",
      customerId: "",
      currencyId: "",
      balanceType: "cash",
      adjustmentType: "add",
      amount: "",
      note: "",
    },
  });

  const watchedCurrencyId = watch("currencyId");
  const watchedAccountType = watch("accountType");
  const watchedCustomerId = watch("customerId");

  // Fetch currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: currencyService.getAllCurrencies,
  });

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAllCustomers,
  });

  // Fetch company balances
  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["companyBalances"],
    queryFn: currencyService.getCompanyBalances,
  });

  // Fetch client balances (when client is selected)
  const { data: clientBalancesData, isLoading: clientBalancesLoading } = useQuery({
    queryKey: ["customerBalances", watchedCustomerId],
    queryFn: () => customerService.getCustomerBalances(watchedCustomerId),
    enabled: watchedAccountType === "client" && !!watchedCustomerId,
  });

  // Balance adjustment mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: (data) => {
      if (data.accountType === "company") {
        return currencyService.adjustCompanyBalance(data);
      } else {
        // Client balance adjustment (to be implemented)
        return customerService.adjustClientBalance(data);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["companyBalances"] });
      queryClient.invalidateQueries({ queryKey: ["customerBalances"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      showSuccess(response.data.message || "تم تعديل الرصيد بنجاح");
      reset();
      setSelectedCurrency(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "حدث خطأ أثناء تعديل الرصيد";
      showError(errorMessage);
      console.error("Error adjusting balance:", error);
    },
  });

  // Get current balance for selected currency
  const getCurrentBalance = () => {
    if (!watchedCurrencyId) return null;
    
    if (watchedAccountType === "company") {
      if (!balancesData?.data?.data) return null;
      return balancesData.data.data.find(
        (balance) => balance.currency_id === parseInt(watchedCurrencyId)
      );
    } else {
      if (!clientBalancesData?.data?.data) return null;
      return clientBalancesData.data.data.find(
        (balance) => balance.currency_id === parseInt(watchedCurrencyId)
      );
    }
  };

  const onSubmit = (data) => {
    adjustBalanceMutation.mutate(data);
  };

  // Handle currency selection
  const handleCurrencyChange = (currencyId) => {
    const currency = currenciesData?.data?.data?.find(
      (c) => c._id === parseInt(currencyId)
    );
    setSelectedCurrency(currency);
  };

  const currentBalance = getCurrentBalance();

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
        sx={{
          color: "#1976d2",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <span>💰</span>
        نظام تعديل الأرصدة
      </Typography>

      <Grid container spacing={3}>
        {/* Adjustment Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom className="arabic-text">
              تعديل الرصيد
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="نوع الحساب"
                        error={!!errors.accountType}
                        helperText={errors.accountType?.message}
                        InputLabelProps={{ className: "arabic-text" }}
                      >
                        <MenuItem value="company">حساب الشركة</MenuItem>
                        <MenuItem value="client">حساب عميل</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                {watchedAccountType === "client" && (
                  <Grid item xs={12}>
                    <Controller
                      name="customerId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="اختيار العميل"
                          error={!!errors.customerId}
                          helperText={errors.customerId?.message}
                          disabled={customersLoading}
                          InputLabelProps={{ className: "arabic-text" }}
                        >
                          {customersData?.data?.data?.map((customer) => (
                            <MenuItem key={customer._id} value={customer._id}>
                              {customer.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Controller
                    name="currencyId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="العملة"
                        error={!!errors.currencyId}
                        helperText={errors.currencyId?.message}
                        disabled={currenciesLoading}
                        InputLabelProps={{ className: "arabic-text" }}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCurrencyChange(e.target.value);
                        }}
                      >
                        {currenciesData?.data?.data?.map((currency) => (
                          <MenuItem key={currency._id} value={currency._id}>
                            {currency.currency}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="balanceType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="نوع الرصيد"
                        error={!!errors.balanceType}
                        helperText={errors.balanceType?.message}
                        InputLabelProps={{ className: "arabic-text" }}
                      >
                        <MenuItem value="cash">رصيد نقدي</MenuItem>
                        <MenuItem value="check">رصيد شيكات</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="adjustmentType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        fullWidth
                        label="نوع التعديل"
                        error={!!errors.adjustmentType}
                        helperText={errors.adjustmentType?.message}
                        InputLabelProps={{ className: "arabic-text" }}
                      >
                        <MenuItem value="add">إضافة</MenuItem>
                        <MenuItem value="remove">خصم</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="المبلغ"
                    type="number"
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    {...register("amount")}
                    InputLabelProps={{ className: "arabic-text" }}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="ملاحظات"
                    multiline
                    rows={3}
                    {...register("note")}
                    InputLabelProps={{ className: "arabic-text" }}
                  />
                </Grid>

                {/* Current Balance Info */}
                {currentBalance && (
                  <Grid item xs={12}>
                    <Alert severity="info" className="arabic-text">
                      <Typography variant="body2" component="div">
                        <strong>الأرصدة الحالية:</strong>
                        <br />
                        رصيد نقدي: {currentBalance.balance.toLocaleString()}
                        <br />
                        رصيد شيكات: {currentBalance.check_balance.toLocaleString()}
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                <Grid
                  item
                  xs={12}
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/dashboard")}
                    className="arabic-text"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={adjustBalanceMutation.isPending}
                    className="arabic-text"
                    color="primary"
                  >
                    {adjustBalanceMutation.isPending ? "جاري التعديل..." : "تعديل الرصيد"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Balances Overview */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom className="arabic-text">
              {watchedAccountType === "company" ? "أرصدة الشركة" : 
               watchedAccountType === "client" && watchedCustomerId ? 
               `أرصدة العميل: ${customersData?.data?.data?.find(c => c._id === watchedCustomerId)?.name}` : 
               "الأرصدة"}
            </Typography>

            {(watchedAccountType === "company" && balancesLoading) ||
             (watchedAccountType === "client" && clientBalancesLoading) ? (
              <Alert severity="info" className="arabic-text">
                جاري تحميل البيانات...
              </Alert>
            ) : watchedAccountType === "company" ? (
              balancesData?.data?.data?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell className="arabic-text">العملة</TableCell>
                        <TableCell className="arabic-text">رصيد نقدي</TableCell>
                        <TableCell className="arabic-text">رصيد شيكات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {balancesData.data.data.map((balance) => (
                        <TableRow key={balance.currency_id}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {balance.star && <span>⭐</span>}
                              {balance.currency?.currency}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {balance.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {balance.check_balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" className="arabic-text">
                  لا توجد أرصدة للشركة بعد
                </Alert>
              )
            ) : watchedAccountType === "client" && watchedCustomerId ? (
              clientBalancesData?.data?.data?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell className="arabic-text">العملة</TableCell>
                        <TableCell className="arabic-text">رصيد نقدي</TableCell>
                        <TableCell className="arabic-text">رصيد شيكات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clientBalancesData.data.data.map((balance) => (
                        <TableRow key={balance.currency_id}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {balance.star && <span>⭐</span>}
                              {balance.currency?.currency}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {balance.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {balance.check_balance.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" className="arabic-text">
                  لا توجد أرصدة لهذا العميل بعد
                </Alert>
              )
            ) : (
              <Alert severity="info" className="arabic-text">
                يرجى اختيار نوع الحساب والعميل لعرض الأرصدة
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Usage Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom className="arabic-text">
            دليل الاستخدام
          </Typography>
          <Typography variant="body2" className="arabic-text" component="div">
            <ul>
              <li><strong>إضافة:</strong> لإضافة أموال جديدة للشركة (مثل حصول الشركة على أموال جديدة)</li>
              <li><strong>خصم:</strong> لخصم أموال من رصيد الشركة (مثل مصاريف أو سحوبات)</li>
              <li><strong>رصيد نقدي:</strong> النقد المتوفر في الخزنة</li>
              <li><strong>رصيد شيكات:</strong> قيمة الشيكات المتوفرة</li>
              <li>سيتم تسجيل جميع التعديلات في سجل المعاملات للمراجعة</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BalanceAdjustment;