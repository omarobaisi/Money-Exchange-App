import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";

const DeleteTransactionDialog = ({
  open,
  onClose,
  onDelete,
  loading,
  transaction,
  getMovementLabel,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle className="arabic-text">تأكيد الحذف</DialogTitle>
    <DialogContent>
      <DialogContentText className="arabic-text">
        هل أنت متأكد من رغبتك في حذف هذه المعاملة؟ هذا الإجراء لا يمكن التراجع
        عنه.
      </DialogContentText>
      {transaction && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" className="arabic-text">
            العميل: {transaction.customer?.name}
          </Typography>
          <Typography variant="body2" className="arabic-text">
            نوع المعاملة: {getMovementLabel(transaction.movement)}
          </Typography>
          <Typography variant="body2" className="arabic-text">
            المبلغ: {transaction.amount?.toLocaleString()}
          </Typography>
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} className="arabic-text">
        إلغاء
      </Button>
      <Button
        onClick={onDelete}
        color="error"
        disabled={loading}
        className="arabic-text"
      >
        {loading ? "جاري الحذف..." : "حذف"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteTransactionDialog;
