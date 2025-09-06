import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { transactionSchema } from "../validation/transactionSchema";
import {
  transactionService,
  currencyService,
  customerService,
} from "../services/api";
import { showSuccess, showError } from "../hooks/useSnackbar";

// Define transaction type maps
const transactionTypeMap = {
  "withdrawal-cash": {
    label: "سحب نقدي",
    movement: "withdrawal-cash",
    icon: "💵",
    color: "#f44336",
  },
  "withdrawal-check": {
    label: "سحب شيك",
    movement: "withdrawal-check",
    icon: "📝",
    color: "#ff9800",
  },
  "deposit-cash": {
    label: "إيداع نقدي",
    movement: "deposit-cash",
    icon: "💰",
    color: "#9c27b0",
  },
  "deposit-check": {
    label: "إيداع شيك",
    movement: "deposit-check",
    icon: "💳",
    color: "#673ab7",
  },
};

const TransactionForm = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Transaction form
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      customerId: "",
      currencyId: "",
      amount: "",
      commission: 0,
      date: DateTime.now(),
      note: "",
    },
  });

  // Watch amount and commission for calculation
  const watchedAmount = watch("amount");
  const watchedCommission = watch("commission");

  // Calculate amount after commission
  const calculateAmountAfterCommission = () => {
    const amount = parseFloat(watchedAmount) || 0;
    const commission = parseFloat(watchedCommission) || 0;
    if (amount > 0 && commission > 0) {
      const commissionAmount = (amount * commission) / 100;
      return amount + commissionAmount;
    }
    return amount;
  };

  // Get transaction type details
  const transactionTypeDetails = transactionTypeMap[type] || {
    label: "معاملة",
    movement: "unknown",
    icon: "❓",
    color: "#000000",
  };

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery(
    ["customers"],
    customerService.getAllCustomers
  );

  // Fetch currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery(
    ["currencies"],
    currencyService.getAllCurrencies
  );

  // Create transaction mutation
  const createTransactionMutation = useMutation(
    (data) => transactionService.createTransaction(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["transactions"]);
        showSuccess("تم إنشاء المعاملة بنجاح");
        navigate("/transactions");
      },
      onError: (error) => {
        showError("حدث خطأ أثناء إنشاء المعاملة. يرجى المحاولة مرة أخرى.");
        console.error("Error creating transaction:", error);
      },
    }
  );

  const onSubmit = (data) => {
    try {
      const formattedData = {
        customerId: data.customerId,
        currencyId: data.currencyId,
        amount: parseFloat(data.amount),
        commission: parseFloat(data.commission || 0) / 100,
        date: DateTime.fromJSDate(data.date).toISO(),
        note: data.note,
        movement: transactionTypeDetails.movement,
      };
      createTransactionMutation.mutate(formattedData);
    } catch (error) {
      console.log(error);
      showError("حدث خطأ أثناء إنشاء المعاملة. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
        sx={{
          color: transactionTypeDetails.color,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <span>{transactionTypeDetails.icon}</span>
        {transactionTypeDetails.label}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="اسم الزبون"
                    error={!!errors.customerId}
                    helperText={errors.customerId?.message}
                    disabled={customersLoading}
                    InputLabelProps={{ className: "arabic-text" }}
                  >
                    {customersData?.data?.data.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
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

            {(type === "withdrawal-check" || type === "deposit-check") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="نسبة العمولة"
                  type="number"
                  error={!!errors.commission}
                  helperText={errors.commission?.message}
                  {...register("commission")}
                  InputLabelProps={{ className: "arabic-text" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            {(type === "withdrawal-check" || type === "deposit-check") &&
              watchedAmount > 0 &&
              watchedCommission > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" className="arabic-text">
                    المبلغ بعد العمولة:{" "}
                    {calculateAmountAfterCommission().toLocaleString()}
                  </Alert>
                </Grid>
              )}

            <Grid item xs={12} sm={6}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="التاريخ"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        error: !!errors.date,
                        helperText: errors.date?.message,
                        InputLabelProps: { className: "arabic-text" },
                      },
                    }}
                  />
                )}
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

            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/transactions")}
                className="arabic-text"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createTransactionMutation.isLoading}
                className="arabic-text"
                color="primary"
              >
                {createTransactionMutation.isLoading
                  ? "جاري الإنشاء..."
                  : "إنشاء معاملة"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TransactionForm;
