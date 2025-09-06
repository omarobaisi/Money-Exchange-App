import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import {
  customerService,
  currencyService,
  transactionService,
} from "../services/api";

// Validation schema for client name edit
const clientNameSchema = yup.object().shape({
  name: yup.string().required("اسم العميل مطلوب"),
});

// Validation schema for adding currency
const addCurrencySchema = yup.object().shape({
  currencyId: yup.string().required("يرجى اختيار العملة"),
  balance: yup.number().min(0, "يجب أن يكون الرصيد 0 على الأقل"),
  check_balance: yup.number().min(0, "يجب أن يكون رصيد الشيكات 0 على الأقل"),
});

// Movement types map
const movementTypeMap = {
  "withdrawal-cash": {
    label: "سحب نقدي",
    color: "error",
  },
  "withdrawal-check": {
    label: "سحب شيك",
    color: "warning",
  },
  "deposit-cash": {
    label: "إيداع نقدي",
    color: "secondary",
  },
  "deposit-check": {
    label: "إيداع شيك",
    color: "info",
  },
  "balance-adjustment-cash-add": {
    label: "إضافة رصيد نقدي",
    color: "success",
  },
  "balance-adjustment-cash-remove": {
    label: "خصم رصيد نقدي", 
    color: "error",
  },
  "balance-adjustment-check-add": {
    label: "إضافة رصيد شيكات",
    color: "success",
  },
  "balance-adjustment-check-remove": {
    label: "خصم رصيد شيكات",
    color: "error",
  },
};

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [addCurrencyDialogOpen, setAddCurrencyDialogOpen] = useState(false);

  // Form for client name editing
  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    setValue: setNameValue,
    formState: { errors: nameErrors },
  } = useForm({
    resolver: yupResolver(clientNameSchema),
    defaultValues: {
      name: "",
    },
  });

  // Form for adding currency
  const {
    register: registerCurrency,
    handleSubmit: handleSubmitCurrency,
    setValue: setCurrencyValue,
    reset: resetCurrencyForm,
    formState: { errors: currencyErrors },
  } = useForm({
    resolver: yupResolver(addCurrencySchema),
    defaultValues: {
      currencyId: "",
      balance: 0,
      check_balance: 0,
    },
  });

  // Get client details
  const {
    data: clientData,
    isLoading: clientLoading,
    isError: clientError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.getCustomer(id),
    onSuccess: (data) => {
      setNameValue("name", data?.data.name || "");
    },
  });

  // Get client balances
  const {
    data: balancesData,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useQuery({
    queryKey: ["customerBalances", id],
    queryFn: () => customerService.getCustomerBalances(id),
    enabled: !!id,
  });

  // Get client transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
  } = useQuery({
    queryKey: ["customerTransactions", id],
    queryFn: () =>
      transactionService.getTransactions({ customerId: id, limit: 10 }),
    enabled: !!id,
  });

  // Get available currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: currencyService.getAllCurrencies,
  });
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (data) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      setEditMode(false);
    },
  });

  // Add currency balance mutation
  const addCurrencyMutation = useMutation({
    mutationFn: (data) =>
      customerService.updateCustomerBalance(id, data.currencyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerBalances", id] });
      setAddCurrencyDialogOpen(false);
      resetCurrencyForm();
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: (currencyId) =>
      customerService.toggleCustomerCurrencyStar(id, currencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerBalances", id] });
    },
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setNameValue("name", clientData?.data?.data?.name || "");
    }
  };

  const onSubmitClientName = (data) => {
    updateClientMutation.mutate(data);
  };

  const handleOpenAddCurrencyDialog = () => {
    resetCurrencyForm();
    setAddCurrencyDialogOpen(true);
  };

  const handleCloseAddCurrencyDialog = () => {
    setAddCurrencyDialogOpen(false);
    resetCurrencyForm();
  };

  const onSubmitCurrency = (data) => {
    addCurrencyMutation.mutate({
      currencyId: data.currencyId,
      balance: parseFloat(data.balance) || 0,
      check_balance: parseFloat(data.check_balance) || 0,
    });
  };

  const handleToggleStar = (currencyId) => {
    toggleStarMutation.mutate(currencyId);
  };

  // Check if loading
  if (
    clientLoading ||
    (activeTab === 1 && balancesLoading) ||
    (activeTab === 2 && transactionsLoading)
  ) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if error
  if (
    clientError ||
    (activeTab === 1 && balancesError) ||
    (activeTab === 2 && transactionsError)
  ) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} className="arabic-text">
        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        {editMode ? (
          <Box
            component="form"
            onSubmit={handleSubmitName(onSubmitClientName)}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <TextField
              label="اسم العميل"
              variant="outlined"
              fullWidth
              error={!!nameErrors.name}
              helperText={nameErrors.name?.message}
              InputLabelProps={{ className: "arabic-text" }}
              {...registerName("name")}
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={updateClientMutation.isPending}
            >
              <SaveIcon />
            </IconButton>
            <IconButton color="error" onClick={handleEditToggle}>
              <CancelIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h4" component="h1" className="arabic-text">
              {clientData?.data?.data?.name || ""}
            </Typography>
            <IconButton size="small" onClick={handleEditToggle}>
              <EditIcon />
            </IconButton>
          </Box>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          className="arabic-text"
        >
          تاريخ الإضافة:{" "}
          {new Date(
            clientData?.data?.data?.created || new Date()
          ).toLocaleDateString()}
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="معلومات العميل" className="arabic-text" />
        <Tab label="الأرصدة" className="arabic-text" />
        <Tab label="المعاملات" className="arabic-text" />
      </Tabs>

      {/* Client Info Tab */}
      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" className="arabic-text" gutterBottom>
                    إحصائيات العميل
                  </Typography>
                  <Typography variant="body1" className="arabic-text">
                    عدد العملات: {balancesData?.data?.data?.length || 0}
                  </Typography>
                  <Typography variant="body1" className="arabic-text">
                    عدد المعاملات:{" "}
                    {transactionsData?.data?.pagination?.total || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" className="arabic-text" gutterBottom>
                    إجراءات سريعة
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => navigate("/transaction/withdrawal-cash")}
                      className="arabic-text"
                    >
                      سحب نقدي
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => navigate("/transaction/withdrawal-check")}
                      className="arabic-text"
                    >
                      سحب شيك
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => navigate("/transaction/deposit-cash")}
                      className="arabic-text"
                    >
                      إيداع نقدي
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={() => navigate("/transaction/deposit-check")}
                      className="arabic-text"
                    >
                      إيداع شيك
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Balances Tab */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" className="arabic-text">
              أرصدة العميل
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddCurrencyDialog}
              className="arabic-text"
            >
              إضافة عملة
            </Button>
          </Box>

          {balancesData?.data?.data?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="arabic-text">العملة</TableCell>
                    <TableCell className="arabic-text">الرصيد النقدي</TableCell>
                    <TableCell className="arabic-text">رصيد الشيكات</TableCell>
                    <TableCell className="arabic-text">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {balancesData?.data?.data?.map((balance) => (
                    <TableRow key={balance.currency_id}>
                      <TableCell className="arabic-text">
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleToggleStar(balance.currency_id)
                            }
                          >
                            {balance.star ? (
                              <StarIcon sx={{ color: "#ffc107" }} />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                          {balance.currency?.currency}
                        </Box>
                      </TableCell>
                      <TableCell>{balance.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        {balance.check_balance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" className="arabic-text">
              لا توجد عملات للعميل بعد. يمكنك إضافة عملات من زر "إضافة عملة".
            </Alert>
          )}
        </Paper>
      )}

      {/* Transactions Tab */}
      {activeTab === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" className="arabic-text" gutterBottom>
            معاملات العميل
          </Typography>

          {transactionsData?.data?.data?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="arabic-text">العملة</TableCell>
                    <TableCell className="arabic-text">نوع المعاملة</TableCell>
                    <TableCell className="arabic-text">التاريخ</TableCell>
                    <TableCell className="arabic-text">المبلغ</TableCell>
                    <TableCell className="arabic-text">العمولة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionsData?.data?.data?.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{transaction.currency.currency}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            movementTypeMap[transaction.movement]?.label ||
                            transaction.movement
                          }
                          color={
                            movementTypeMap[transaction.movement]?.color ||
                            "default"
                          }
                          size="small"
                          className="arabic-text"
                        />
                      </TableCell>
                      <TableCell>
                        {DateTime.fromISO(transaction.created).toFormat(
                          "yyyy-MM-dd"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {transaction.commission ? `${(transaction.commission * 100).toFixed(2)}%` : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" className="arabic-text">
              لا توجد معاملات للعميل بعد.
            </Alert>
          )}

          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/transactions")}
              className="arabic-text"
            >
              عرض كل المعاملات
            </Button>
          </Box>
        </Paper>
      )}

      {/* Add Currency Dialog */}
      <Dialog
        open={addCurrencyDialogOpen}
        onClose={handleCloseAddCurrencyDialog}
      >
        <DialogTitle className="arabic-text">إضافة عملة للعميل</DialogTitle>
        <Box component="form" onSubmit={handleSubmitCurrency(onSubmitCurrency)}>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="العملة"
              margin="normal"
              error={!!currencyErrors.currencyId}
              helperText={currencyErrors.currencyId?.message}
              InputLabelProps={{ className: "arabic-text" }}
              {...registerCurrency("currencyId")}
            >
              {currenciesData?.data?.data
                ?.filter(
                  (currency) =>
                    !balancesData?.data?.data?.some(
                      (balance) => balance.currency_id === currency._id
                    )
                )
                .map((currency) => (
                  <MenuItem key={currency._id} value={currency._id}>
                    {currency.currency}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              fullWidth
              label="الرصيد النقدي"
              type="number"
              margin="normal"
              error={!!currencyErrors.balance}
              helperText={currencyErrors.balance?.message}
              InputLabelProps={{ className: "arabic-text" }}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              {...registerCurrency("balance")}
            />

            <TextField
              fullWidth
              label="رصيد الشيكات"
              type="number"
              margin="normal"
              error={!!currencyErrors.check_balance}
              helperText={currencyErrors.check_balance?.message}
              InputLabelProps={{ className: "arabic-text" }}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              {...registerCurrency("check_balance")}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseAddCurrencyDialog}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={addCurrencyMutation.isPending}
              className="arabic-text"
            >
              {addCurrencyMutation.isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
