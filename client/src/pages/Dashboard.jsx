import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from "@mui/material";
import { DateTime } from "luxon";
import { transactionService } from "../services/api";

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

export default function Dashboard() {
  const navigate = useNavigate();

  // Query for recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: () => transactionService.getTransactions({ limit: 5, page: 1 }),
  });

  if (transactionsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          className="arabic-text"
        >
          لوحة التحكم
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          className="arabic-text"
        >
          نظرة عامة على أداء تطبيق الصرافة
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" className="arabic-text" gutterBottom>
          إجراءات سريعة
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => navigate("/balance-adjustment")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              تعديل الأرصدة
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate("/transaction/withdrawal-cash")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              سحب نقدي
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              color="warning"
              fullWidth
              onClick={() => navigate("/transaction/withdrawal-check")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              سحب شيك
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => navigate("/transaction/deposit-cash")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              إيداع نقدي
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Button
              variant="contained"
              color="info"
              fullWidth
              onClick={() => navigate("/transaction/deposit-check")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              إيداع شيك
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Transactions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" className="arabic-text">
            أحدث المعاملات
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/transactions")}
            className="arabic-text"
          >
            عرض الكل
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="arabic-text">العميل</TableCell>
                <TableCell className="arabic-text">العملة</TableCell>
                <TableCell className="arabic-text">نوع المعاملة</TableCell>
                <TableCell className="arabic-text">التاريخ</TableCell>
                <TableCell className="arabic-text">المبلغ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactionsData?.data?.data?.length > 0 ? (
                transactionsData?.data?.data?.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {/* {transaction.customer.name} */}
                      <Link to={`/clients/${transaction.customer._id}`}>
                        {transaction.customer.name}
                      </Link>
                    </TableCell>
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
                    <TableCell>{transaction.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" className="arabic-text">
                    لا توجد معاملات حديثة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
