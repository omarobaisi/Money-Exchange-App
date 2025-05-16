import { useState, useEffect } from "react";
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
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  transactionService,
  currencyService,
  customerService,
} from "../services/api";

// Define transaction type maps
const transactionTypeMap = {
  "buy-cash": {
    label: "شراء نقدي",
    movement: "buy-cash",
    icon: "💵",
    color: "#f44336",
  },
  "buy-check": {
    label: "شراء شيك",
    movement: "buy-check",
    icon: "📝",
    color: "#ff9800",
  },
  "sell-cash": {
    label: "بيع نقدي",
    movement: "sell-cash",
    icon: "💰",
    color: "#9c27b0",
  },
  "sell-check": {
    label: "بيع شيك",
    movement: "sell-check",
    icon: "💳",
    color: "#673ab7",
  },
};

// Validation schema
const transactionSchema = yup.object().shape({
  customerId: yup.mixed().required("اسم الزبون مطلوب"),
  currencyId: yup.mixed().required("العملة مطلوبة"),
  amount: yup
    .number()
    .required("المبلغ مطلوب")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  commission: yup.number().min(0, "العمولة يجب أن تكون 0 أو أكبر").nullable(),
  date: yup.date().required("التاريخ مطلوب"),
  note: yup.string(),
});

// Customer Form schema
const customerSchema = yup.object().shape({
  name: yup.string().required("اسم الزبون مطلوب"),
});

// Currency Form schema
const currencySchema = yup.object().shape({
  currency: yup.string().required("اسم العملة مطلوب"),
});

const TransactionForm = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [newCurrencyDialogOpen, setNewCurrencyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Transaction form
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
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

  // Customer form
  const {
    register: registerCustomer,
    handleSubmit: handleSubmitCustomer,
    reset: resetCustomer,
    formState: { errors: errorsCustomer },
  } = useForm({
    resolver: yupResolver(customerSchema),
  });

  // Currency form
  const {
    register: registerCurrency,
    handleSubmit: handleSubmitCurrency,
    reset: resetCurrency,
    formState: { errors: errorsCurrency },
  } = useForm({
    resolver: yupResolver(currencySchema),
  });

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
        navigate("/transactions");
      },
      onError: (error) => {
        setError("حدث خطأ أثناء إنشاء المعاملة. يرجى المحاولة مرة أخرى.");
        console.error("Error creating transaction:", error);
      },
    }
  );

  // Create customer mutation
  const createCustomerMutation = useMutation(
    (data) => customerService.createCustomer(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(["customers"]);
        setValue("customerId", response.data.data._id);
        handleCloseNewCustomerDialog();
      },
      onError: (error) => {
        setError("حدث خطأ أثناء إنشاء الزبون الجديد. يرجى المحاولة مرة أخرى.");
        console.error("Error creating customer:", error);
      },
    }
  );

  // Create currency mutation
  const createCurrencyMutation = useMutation(
    (data) => currencyService.createCurrency(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(["currencies"]);
        setValue("currencyId", response.data.data._id);
        handleCloseNewCurrencyDialog();
      },
      onError: (error) => {
        setError("حدث خطأ أثناء إنشاء العملة الجديدة. يرجى المحاولة مرة أخرى.");
        console.error("Error creating currency:", error);
      },
    }
  );

  const onSubmit = (data) => {
    setLoading(true);
    setError("");

    const formattedData = {
      customerId: data.customerId,
      currencyId: data.currencyId,
      amount: parseFloat(data.amount),
      commission: parseFloat(data.commission || 0),
      date: data.date.toISO(),
      note: data.note,
      movement: transactionTypeDetails.movement,
    };

    createTransactionMutation.mutate(formattedData);
  };

  const handleCloseNewCustomerDialog = () => {
    setNewCustomerDialogOpen(false);
    resetCustomer();
  };

  const handleCloseNewCurrencyDialog = () => {
    setNewCurrencyDialogOpen(false);
    resetCurrency();
  };

  const handleCreateNewCustomer = (data) => {
    createCustomerMutation.mutate(data);
  };

  const handleCreateNewCurrency = (data) => {
    createCurrencyMutation.mutate(data);
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} className="arabic-text">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
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
                      {customersData?.data.map((customer) => (
                        <MenuItem key={customer._id} value={customer._id}>
                          {customer.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Button
                  variant="outlined"
                  onClick={() => setNewCustomerDialogOpen(true)}
                  className="arabic-text"
                  sx={{ height: "56px", whiteSpace: "nowrap" }}
                >
                  جديد +
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
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
                      {currenciesData?.data.map((currency) => (
                        <MenuItem key={currency._id} value={currency._id}>
                          {currency.currency}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Button
                  variant="outlined"
                  onClick={() => setNewCurrencyDialogOpen(true)}
                  className="arabic-text"
                  sx={{ height: "56px", whiteSpace: "nowrap" }}
                >
                  جديد +
                </Button>
              </Box>
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="العمولة"
                type="number"
                error={!!errors.commission}
                helperText={errors.commission?.message}
                {...register("commission")}
                InputLabelProps={{ className: "arabic-text" }}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                }}
              />
            </Grid>

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
                disabled={loading || createTransactionMutation.isLoading}
                className="arabic-text"
                color="primary"
              >
                {loading || createTransactionMutation.isLoading
                  ? "جاري الإنشاء..."
                  : "إنشاء معاملة"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* New Customer Dialog */}
      <Dialog
        open={newCustomerDialogOpen}
        onClose={handleCloseNewCustomerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="arabic-text">إضافة زبون جديد</DialogTitle>
        <DialogContent>
          <form
            id="new-customer-form"
            onSubmit={handleSubmitCustomer(handleCreateNewCustomer)}
          >
            <TextField
              fullWidth
              margin="dense"
              label="اسم الزبون"
              error={!!errorsCustomer.name}
              helperText={errorsCustomer.name?.message}
              {...registerCustomer("name")}
              InputLabelProps={{ className: "arabic-text" }}
              autoFocus
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseNewCustomerDialog}
            className="arabic-text"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="new-customer-form"
            disabled={createCustomerMutation.isLoading}
            className="arabic-text"
            color="primary"
          >
            {createCustomerMutation.isLoading ? "جاري الإضافة..." : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Currency Dialog */}
      <Dialog
        open={newCurrencyDialogOpen}
        onClose={handleCloseNewCurrencyDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="arabic-text">إضافة عملة جديدة</DialogTitle>
        <DialogContent>
          <form
            id="new-currency-form"
            onSubmit={handleSubmitCurrency(handleCreateNewCurrency)}
          >
            <TextField
              fullWidth
              margin="dense"
              label="اسم العملة"
              error={!!errorsCurrency.currency}
              helperText={errorsCurrency.currency?.message}
              {...registerCurrency("currency")}
              InputLabelProps={{ className: "arabic-text" }}
              autoFocus
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseNewCurrencyDialog}
            className="arabic-text"
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="new-currency-form"
            disabled={createCurrencyMutation.isLoading}
            className="arabic-text"
            color="primary"
          >
            {createCurrencyMutation.isLoading ? "جاري الإضافة..." : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionForm;
