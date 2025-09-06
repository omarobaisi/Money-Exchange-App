import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { transactionSchema } from "../validation/transactionSchema";

const EditTransactionModal = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  customersData,
  currenciesData,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: initialValues || {
      amount: "",
      commission: 0,
      note: "",
      movement: "",
      customerId: "",
      currencyId: "",
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

  useEffect(() => {
    if (open && initialValues) {
      // Convert commission from decimal to percentage for display
      const formattedValues = {
        ...initialValues,
        commission: initialValues.commission ? initialValues.commission * 100 : 0,
      };
      reset(formattedValues);
    }
  }, [open, initialValues, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="arabic-text">تعديل المعاملة</DialogTitle>
      <DialogContent>
        <form id="edit-transaction-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                name="movement"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="نوع المعاملة"
                    error={!!errors.movement}
                    helperText={errors.movement?.message}
                    InputLabelProps={{ className: "arabic-text" }}
                  >
                    <MenuItem value="withdrawal-cash">سحب نقدي</MenuItem>
                    <MenuItem value="withdrawal-check">سحب شيك</MenuItem>
                    <MenuItem value="deposit-cash">إيداع نقدي</MenuItem>
                    <MenuItem value="deposit-check">إيداع شيك</MenuItem>
                    <MenuItem value="check-collection">تحصيل شيك</MenuItem>
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
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            {(initialValues?.movement === "withdrawal-check" ||
              initialValues?.movement === "deposit-check") && (
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
                    inputProps: { min: 0, max: 100, step: 0.01 },
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
            
            {(initialValues?.movement === "withdrawal-check" ||
              initialValues?.movement === "deposit-check") &&
              watchedAmount > 0 &&
              watchedCommission > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" className="arabic-text">
                    المبلغ بعد العمولة: {calculateAmountAfterCommission().toLocaleString()}
                  </Alert>
                </Grid>
              )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ملاحظات"
                multiline
                rows={3}
                {...register("note")}
                InputLabelProps={{ className: "arabic-text" }}
                error={!!errors.note}
                helperText={errors.note?.message}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} className="arabic-text">
          إلغاء
        </Button>
        <Button
          type="submit"
          form="edit-transaction-form"
          variant="contained"
          color="primary"
          disabled={loading}
          className="arabic-text"
        >
          {loading ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTransactionModal;
