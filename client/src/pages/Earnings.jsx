import { useState } from "react";
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Card,
  CardContent,
  Tab,
  Tabs,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { earningService, currencyService } from "../services/api";
import { showSuccess, showError } from "../hooks/useSnackbar";

// Validation schema
const earningSchema = yup.object().shape({
  amount: yup
    .number()
    .typeError("المبلغ يجب أن يكون رقمًا")
    .required("المبلغ مطلوب")
    .positive("المبلغ يجب أن يكون أكبر من صفر"),
  currencyId: yup.number().typeError("العملة مطلوبة").required("العملة مطلوبة"),
  date: yup.date().required("التاريخ مطلوب"),
  description: yup.string(),
  type: yup.string().required("نوع الربح مطلوب"),
});

const EarningTypeMap = {
  commission: "عمولة",
  fee: "رسوم",
  spread: "فرق سعر",
  exchange: "تحويل عملة",
  other: "أخرى",
};

const getEarningTypeLabel = (type) => EarningTypeMap[type] || "أخرى";

const getEarningTypeColor = (type) => {
  switch (type) {
    case "commission":
      return "primary";
    case "fee":
      return "secondary";
    case "spread":
      return "success";
    case "exchange":
      return "info";
    default:
      return "default";
  }
};

const Earnings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [earningToDelete, setEarningToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(earningSchema),
    defaultValues: {
      amount: "",
      currencyId: "",
      date: DateTime.now(),
      description: "",
      type: "commission",
    },
  });

  // Fetch all earnings
  const {
    data: earningsData,
    isLoading: earningsLoading,
    isError: earningsError,
  } = useQuery({
    queryKey: ["earnings", page, rowsPerPage, startDate, endDate],
    queryFn: () =>
      earningService.getAllEarnings({
        page: page + 1,
        limit: rowsPerPage,
        startDate: startDate ? startDate.toISODate() : undefined,
        endDate: endDate ? endDate.toISODate() : undefined,
      }),
    keepPreviousData: true,
  });

  // Fetch earnings by currency (for summary)
  const { data: earningsByCurrency, isLoading: summaryLoading } = useQuery({
    queryKey: ["earningsByCurrency", startDate, endDate],
    queryFn: () =>
      earningService.getEarningsByCurrency({
        startDate: startDate ? startDate.toISODate() : undefined,
        endDate: endDate ? endDate.toISODate() : undefined,
      }),
  });

  // Fetch all currencies for the dropdown
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery(
    ["currencies"],
    currencyService.getAllCurrencies
  );

  // Create earning mutation
  const createEarningMutation = useMutation(
    (data) => earningService.createEarning(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["earnings"]);
        queryClient.invalidateQueries(["earningsByCurrency"]);
        reset();
        showSuccess("تمت إضافة الربح بنجاح");
      },
      onError: () => {
        showError("حدث خطأ أثناء إضافة الربح. يرجى المحاولة مرة أخرى.");
      },
    }
  );

  // Update earning mutation
  const updateEarningMutation = useMutation(
    ({ id, data }) => earningService.updateEarning(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["earnings"]);
        queryClient.invalidateQueries(["earningsByCurrency"]);
        resetForm();
        showSuccess("تم تعديل الربح بنجاح");
      },
      onError: () => {
        showError("حدث خطأ أثناء تعديل الربح. يرجى المحاولة مرة أخرى.");
      },
    }
  );

  // Delete earning mutation
  const deleteEarningMutation = useMutation(
    (id) => earningService.deleteEarning(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["earnings"]);
        queryClient.invalidateQueries(["earningsByCurrency"]);
        handleCloseDeleteDialog();
      },
    }
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDeleteDialog = (earning) => {
    setEarningToDelete(earning);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setEarningToDelete(null);
  };

  const handleDeleteEarning = () => {
    if (earningToDelete) {
      deleteEarningMutation.mutate(earningToDelete._id);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const resetForm = () => {
    reset({
      amount: "",
      currencyId: "",
      date: DateTime.now(),
      description: "",
      type: "commission",
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleEditEarning = (earning) => {
    setEditMode(true);
    setEditId(earning._id);

    reset({
      amount: earning.amount,
      currencyId: earning.currency_id,
      date: DateTime.fromISO(earning.date),
      description: earning.description || "",
      type: earning.type,
    });
  };

  const onSubmit = (data) => {
    try {
      const formattedData = {
        ...data,
        date:
          typeof data.date?.toISO === "function"
            ? data.date.toISO()
            : data.date,
      };

      if (editMode) {
        updateEarningMutation.mutate({ id: editId, data: formattedData });
      } else {
        createEarningMutation.mutate(formattedData);
      }
    } catch (error) {
      console.log("error", error);
      showError("حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.");
    }
  };

  // Filter UI component
  const PeriodFilter = ({ onFilter, onReset }) => (
    <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <DatePicker
        label="من تاريخ"
        value={startDate}
        onChange={setStartDate}
        slotProps={{
          textField: { size: "small", fullWidth: false },
        }}
      />
      <DatePicker
        label="إلى تاريخ"
        value={endDate}
        onChange={setEndDate}
        slotProps={{
          textField: { size: "small", fullWidth: false },
        }}
      />
      <Button
        variant="contained"
        onClick={() => {
          setPage(0);
          if (onFilter) onFilter();
        }}
        className="arabic-text"
      >
        تصفية
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          setStartDate(null);
          setEndDate(null);
          setPage(0);
          if (onReset) onReset();
        }}
        className="arabic-text"
      >
        إعادة تعيين
      </Button>
    </Box>
  );

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
      >
        إدارة الأرباح
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="إضافة ربح" className="arabic-text" />
        <Tab label="سجل الأرباح" className="arabic-text" />
        <Tab label="ملخص الأرباح" className="arabic-text" />
      </Tabs>

      {/* Add Earning Tab */}
      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom className="arabic-text">
            {editMode ? "تعديل ربح" : "إضافة ربح جديد"}
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
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
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      label="نوع الربح"
                      error={!!errors.type}
                      helperText={errors.type?.message}
                      InputLabelProps={{ className: "arabic-text" }}
                    >
                      <MenuItem value="commission">عمولة</MenuItem>
                      <MenuItem value="exchange">تحويل عملة</MenuItem>
                      <MenuItem value="fee">رسوم</MenuItem>
                      <MenuItem value="spread">فرق سعر</MenuItem>
                      <MenuItem value="other">أخرى</MenuItem>
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
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
                  label="الوصف (اختياري)"
                  multiline
                  rows={3}
                  {...register("description")}
                  InputLabelProps={{ className: "arabic-text" }}
                />
              </Grid>

              <Grid
                item
                xs={12}
                sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
              >
                {editMode && (
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    className="arabic-text"
                  >
                    إلغاء
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    createEarningMutation.isLoading ||
                    updateEarningMutation.isLoading
                  }
                  className="arabic-text"
                >
                  {editMode
                    ? updateEarningMutation.isLoading
                      ? "جاري التعديل..."
                      : "تعديل الربح"
                    : createEarningMutation.isLoading
                    ? "جاري الإضافة..."
                    : "إضافة ربح"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Earnings List Tab */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom className="arabic-text">
            سجل الأرباح
          </Typography>

          <PeriodFilter />

          {earningsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : earningsError ? (
            <Alert severity="error" sx={{ mt: 2 }} className="arabic-text">
              حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="arabic-text">العملة</TableCell>
                      <TableCell className="arabic-text">النوع</TableCell>
                      <TableCell className="arabic-text">المبلغ</TableCell>
                      <TableCell className="arabic-text">التاريخ</TableCell>
                      <TableCell className="arabic-text">الوصف</TableCell>
                      {/* <TableCell className="arabic-text">الإجراءات</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {earningsData?.data?.data?.map((earning) => (
                      <TableRow key={earning._id}>
                        <TableCell>{earning.currency.currency}</TableCell>
                        <TableCell>
                          <Chip
                            label={getEarningTypeLabel(earning.type)}
                            color={getEarningTypeColor(earning.type)}
                            size="small"
                            className="arabic-text"
                          />
                        </TableCell>
                        <TableCell>{earning.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {DateTime.fromISO(earning.date).toFormat(
                            "yyyy-MM-dd"
                          )}
                        </TableCell>
                        <TableCell className="arabic-text">
                          {earning.description || "-"}
                        </TableCell>
                        {/* <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditEarning(earning)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(earning)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={earningsData?.data?.pagination?.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="عدد العناصر في الصفحة:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
                }
              />
            </>
          )}
        </Paper>
      )}

      {/* Earnings Summary Tab */}
      {activeTab === 2 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom className="arabic-text">
            ملخص الأرباح حسب العملة
          </Typography>

          <PeriodFilter />

          {summaryLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {earningsByCurrency?.data?.data?.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.currency_id}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        className="arabic-text"
                      >
                        {item.currency.currency}
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {parseFloat(item.total_amount).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="arabic-text"
                      >
                        إجمالي الأرباح
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle className="arabic-text">تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText className="arabic-text">
            هل أنت متأكد من رغبتك في حذف هذا الربح؟ هذا الإجراء لا يمكن التراجع
            عنه.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} className="arabic-text">
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteEarning}
            color="error"
            disabled={deleteEarningMutation.isLoading}
            className="arabic-text"
          >
            {deleteEarningMutation.isLoading ? "جاري الحذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Earnings;
