import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Collapse,
  Card,
  CardContent,
  Menu,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import debounce from "lodash.debounce";
import {
  transactionService,
  currencyService,
  customerService,
} from "../services/api";
import EditTransactionModal from "../components/EditTransactionModal";
import DeleteTransactionDialog from "../components/DeleteTransactionDialog";
import { showSuccess, showError } from "../hooks/useSnackbar";

// Transaction movement types map
const movementTypeMap = {
  "withdrawal-cash": {
    label: "سحب نقدي",
    color: "#f44336",
  },
  "withdrawal-check": {
    label: "سحب شيك",
    color: "#ff9800",
  },
  "deposit-cash": {
    label: "إيداع نقدي",
    color: "#9c27b0",
  },
  "deposit-check": {
    label: "إيداع شيك",
    color: "#673ab7",
  },
  "check-collection": {
    label: "تحصيل شيك",
    color: "#2196f3",
  },
  "balance-adjustment-cash-add": {
    label: "إضافة رصيد نقدي",
    color: "#4caf50",
  },
  "balance-adjustment-cash-remove": {
    label: "خصم رصيد نقدي", 
    color: "#f44336",
  },
  "balance-adjustment-check-add": {
    label: "إضافة رصيد شيكات",
    color: "#4caf50",
  },
  "balance-adjustment-check-remove": {
    label: "خصم رصيد شيكات",
    color: "#f44336",
  },
};

const getMovementLabel = (movement) =>
  movementTypeMap[movement]?.label || movement;
const getMovementColor = (movement) =>
  movementTypeMap[movement]?.color || "#000000";

const Transactions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [filterExpanded, setFilterExpanded] = useState(false);

  // Action menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Edit mode state
  const [editingId, setEditingId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);

  // Filter states
  const [customerId, setCustomerId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [movement, setMovement] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(DateTime.now());

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: [
      "transactions",
      page,
      rowsPerPage,
      customerId,
      currencyId,
      movement,
      startDate,
      endDate,
    ],
    queryFn: () =>
      transactionService.getTransactions({
        page: page + 1,
        limit: rowsPerPage,
        ...(customerId && { customerId }),
        ...(currencyId && { currencyId }),
        ...(movement && { movement }),
        ...(startDate && { startDate: startDate.toISODate() }),
        ...(endDate && { endDate: endDate.toISODate() }),
      }),
    keepPreviousData: true,
  });

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAllCustomers,
  });

  // Fetch currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: currencyService.getAllCurrencies,
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (id) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      handleCloseDeleteDialog();
      showSuccess("تم حذف المعاملة بنجاح");
    },
    onError: (error) => {
      showError("حدث خطأ أثناء حذف المعاملة. يرجى المحاولة مرة أخرى.");
      console.error("Error deleting transaction:", error);
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }) =>
      transactionService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setEditingId(null);
      showSuccess("تم تعديل المعاملة بنجاح");
    },
    onError: (error) => {
      showError("حدث خطأ أثناء تعديل المعاملة. يرجى المحاولة مرة أخرى.");
      console.error("Error updating transaction:", error);
    },
  });

  // Action menu handlers
  const handleOpenMenu = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransaction(transaction);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    if (selectedTransaction && transactionsData?.data?.data) {
      const transaction = transactionsData.data.data.find(
        (t) => t._id === selectedTransaction._id
      );
      
      if (transaction) {
        // Check if this is a balance adjustment transaction
        const isBalanceAdjustment = transaction.movement.startsWith('balance-adjustment');
        
        if (isBalanceAdjustment) {
          // For balance adjustment transactions, redirect to balance adjustment page
          // or show a message that these should be edited via the balance adjustment system
          showError("يجب تعديل معاملات تعديل الرصيد من خلال صفحة تعديل الأرصدة");
          handleCloseMenu();
          return;
        }
        
        // For regular transactions, proceed with normal edit
        setEditingId(selectedTransaction._id);
        setEditInitialValues({
          amount: transaction.amount,
          commission: transaction.commission || 0,
          note: transaction.note || "",
          movement: transaction.movement,
          customerId: transaction.customer?._id || "",
          currencyId: transaction.currency._id,
          created: transaction.created,
          date: transaction.created,
        });
        setEditModalOpen(true);
      }
    }
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (selectedTransaction) {
      const transaction = transactionsData.data.data.find(
        (t) => t._id === selectedTransaction._id
      );
      
      if (transaction) {
        // Check if this is a balance adjustment transaction
        const isBalanceAdjustment = transaction.movement.startsWith('balance-adjustment');
        
        if (isBalanceAdjustment) {
          // For balance adjustment transactions, show a confirmation but allow deletion
          // These transactions can be deleted but should be handled carefully
          setTransactionToDelete(selectedTransaction);
          setOpenDeleteDialog(true);
        } else {
          // For regular transactions, proceed with normal delete
          setTransactionToDelete(selectedTransaction);
          setOpenDeleteDialog(true);
        }
      }
    }
    handleCloseMenu();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditModalOpen(false);
  };

  const handleEditSubmitForm = (data) => {
    // Convert commission from percentage to decimal
    const formattedData = {
      ...data,
      commission: parseFloat(data.commission || 0) / 100,
    };
    updateTransactionMutation.mutate({
      id: editingId,
      data: formattedData,
    });
    setEditModalOpen(false);
    setEditingId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTransactionToDelete(null);
  };

  const handleDeleteTransaction = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete._id);
    }
  };

  const handleToggleFilters = () => {
    setFilterExpanded(!filterExpanded);
  };

  const handleClearFilters = () => {
    setCustomerId("");
    setCurrencyId("");
    setMovement("");
    setStartDate(null);
    setEndDate(DateTime.now());
  };

  const debouncedRefetch = debounce(refetchTransactions, 300);

  // Refetch when filters change
  useEffect(() => {
    debouncedRefetch();
    return () => debouncedRefetch.cancel();
  }, [customerId, currencyId, movement, startDate, endDate]);

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
      >
        المعاملات
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={handleToggleFilters}
            className="arabic-text"
          >
            {filterExpanded ? "إخفاء المرشحات" : "إظهار المرشحات"}
          </Button>

          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/transaction/withdrawal-cash")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              سحب نقدي
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate("/transaction/withdrawal-check")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              سحب شيك
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/transaction/deposit-cash")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              إيداع نقدي
            </Button>
            <Button
              variant="contained"
              color="info"
              onClick={() => navigate("/transaction/deposit-check")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              إيداع شيك
            </Button>
          </Box>
        </Box>

        <Collapse in={filterExpanded}>
          <Card elevation={0} sx={{ mb: 3, border: "1px solid #e0e0e0" }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="العميل"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    InputLabelProps={{ className: "arabic-text" }}
                    disabled={customersLoading}
                  >
                    <MenuItem value="">
                      <em>الكل</em>
                    </MenuItem>
                    {customersData?.data?.data?.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="العملة"
                    value={currencyId}
                    onChange={(e) => setCurrencyId(e.target.value)}
                    InputLabelProps={{ className: "arabic-text" }}
                    disabled={currenciesLoading}
                  >
                    <MenuItem value="">
                      <em>الكل</em>
                    </MenuItem>
                    {currenciesData?.data?.data?.map((currency) => (
                      <MenuItem key={currency._id} value={currency._id}>
                        {currency.currency}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="نوع المعاملة"
                    value={movement}
                    onChange={(e) => setMovement(e.target.value)}
                    InputLabelProps={{ className: "arabic-text" }}
                  >
                    <MenuItem value="">
                      <em>الكل</em>
                    </MenuItem>
                    <MenuItem value="withdrawal-cash">سحب نقدي</MenuItem>
                    <MenuItem value="withdrawal-check">سحب شيك</MenuItem>
                    <MenuItem value="deposit-cash">إيداع نقدي</MenuItem>
                    <MenuItem value="deposit-check">إيداع شيك</MenuItem>
                    <MenuItem value="check-collection">تحصيل شيك</MenuItem>
                    <MenuItem value="balance-adjustment-cash-add">إضافة رصيد نقدي</MenuItem>
                    <MenuItem value="balance-adjustment-cash-remove">خصم رصيد نقدي</MenuItem>
                    <MenuItem value="balance-adjustment-check-add">إضافة رصيد شيكات</MenuItem>
                    <MenuItem value="balance-adjustment-check-remove">خصم رصيد شيكات</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="من تاريخ"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputLabelProps: { className: "arabic-text" },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="إلى تاريخ"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputLabelProps: { className: "arabic-text" },
                      },
                    }}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    fullWidth
                    className="arabic-text"
                  >
                    مسح المرشحات
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {transactionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : transactionsError ? (
          <Alert severity="error" sx={{ mt: 2 }} className="arabic-text">
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="arabic-text">العميل</TableCell>
                    <TableCell className="arabic-text">العملة</TableCell>
                    <TableCell className="arabic-text">نوع المعاملة</TableCell>
                    <TableCell className="arabic-text">التاريخ</TableCell>
                    <TableCell className="arabic-text">المبلغ</TableCell>
                    <TableCell className="arabic-text">العمولة</TableCell>
                    <TableCell className="arabic-text">ملاحظات</TableCell>
                    <TableCell className="arabic-text">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionsData?.data?.data?.map((transaction) => (
                    <TableRow key={transaction._id}>
                      {/* Only view mode, remove isEditing logic */}
                      <TableCell>
                        {transaction.customer ? (
                          <Link to={`/clients/${transaction.customer._id}`}>
                            {transaction.customer.name}
                          </Link>
                        ) : (
                          <span className="arabic-text" style={{ color: '#666' }}>الشركة</span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.currency.currency}</TableCell>
                      <TableCell>
                        <Chip
                          label={getMovementLabel(transaction.movement)}
                          sx={{
                            bgcolor: getMovementColor(transaction.movement),
                            color: "white",
                          }}
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
                      <TableCell className="arabic-text">
                        {transaction.note || "-"}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, transaction)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {transactionsData?.data?.data?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        className="arabic-text"
                      >
                        لا توجد معاملات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={transactionsData?.data?.pagination?.total || 0}
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          <Typography className="arabic-text">تعديل</Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" color="error" />
          <Typography className="arabic-text" color="error">
            حذف
          </Typography>
        </MenuItem>
      </Menu>

      <EditTransactionModal
        open={editModalOpen}
        onClose={handleCancelEdit}
        onSubmit={handleEditSubmitForm}
        initialValues={editInitialValues}
        customersData={customersData}
        currenciesData={currenciesData}
        loading={updateTransactionMutation.isLoading}
      />
      <DeleteTransactionDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onDelete={handleDeleteTransaction}
        loading={deleteTransactionMutation.isLoading}
        transaction={transactionToDelete}
        getMovementLabel={getMovementLabel}
      />
    </Box>
  );
};

export default Transactions;
