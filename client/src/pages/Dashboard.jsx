import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  MonetizationOn as EarningsIcon,
  People as PeopleIcon,
  SwapHoriz as TransactionsIcon,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import {
  transactionService,
  currencyService,
  customerService,
  earningService,
} from "../services/api";

// Dashboard card component
const StatsCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: "50%",
              p: 1.5,
              display: "flex",
            }}
          >
            {icon}
          </Box>
        </Grid>
        <Grid item xs>
          <Typography
            variant="h6"
            component="div"
            className="arabic-text"
            sx={{ mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

// Movement types map
const movementTypeMap = {
  "buy-cash": {
    label: "شراء نقدي",
    color: "error",
  },
  "buy-check": {
    label: "شراء شيك",
    color: "warning",
  },
  "sell-cash": {
    label: "بيع نقدي",
    color: "secondary",
  },
  "sell-check": {
    label: "بيع شيك",
    color: "info",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();

  // Query for total currencies count and balances
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery({
    queryKey: ["companyBalances"],
    queryFn: currencyService.getCompanyBalances,
  });

  // Query for total customers count
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "count"],
    queryFn: customerService.getCustomersCount,
  });

  // Query for total earnings
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["earnings", "total"],
    queryFn: earningService.getTotalEarnings,
  });

  // Query for recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: () => transactionService.getTransactions({ limit: 5, page: 1 }),
  });

  if (
    currenciesLoading ||
    customersLoading ||
    earningsLoading ||
    transactionsLoading
  ) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate total balances
  const totalCashBalance = currenciesData?.data
    ? currenciesData.data.reduce((sum, item) => sum + item.balance, 0)
    : 0;

  const totalCheckBalance = currenciesData?.data
    ? currenciesData.data.reduce((sum, item) => sum + item.check_balance, 0)
    : 0;

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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="الرصيد النقدي"
            value={totalCashBalance.toLocaleString()}
            icon={<MoneyIcon sx={{ color: "primary.main" }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="رصيد الشيكات"
            value={totalCheckBalance.toLocaleString()}
            icon={<MoneyIcon sx={{ color: "info.main" }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="إجمالي العملاء"
            value={customersData?.count || 0}
            icon={<PeopleIcon sx={{ color: "success.main" }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="إجمالي الأرباح"
            value={earningsData?.total.toLocaleString() || 0}
            icon={<EarningsIcon sx={{ color: "secondary.main" }} />}
            color="secondary"
          />
        </Grid>
      </Grid>

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
              {transactionsData?.data.length > 0 ? (
                transactionsData.data.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.customer.name}</TableCell>
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

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" className="arabic-text" gutterBottom>
          إجراءات سريعة
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate("/transaction/buy-cash")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              شراء نقدي
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="warning"
              fullWidth
              onClick={() => navigate("/transaction/buy-check")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              شراء شيك
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={() => navigate("/transaction/sell-cash")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              بيع نقدي
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="info"
              fullWidth
              onClick={() => navigate("/transaction/sell-check")}
              className="arabic-text"
              sx={{ py: 1.5 }}
            >
              بيع شيك
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
