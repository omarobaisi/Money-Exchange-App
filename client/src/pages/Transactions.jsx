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

// Transaction movement types map
const movementTypeMap = {
  "buy-cash": {
    label: "شراء نقدي",
    color: "#f44336",
  },
  "buy-check": {
    label: "شراء شيك",
    color: "#ff9800",
  },
  "sell-cash": {
    label: "بيع نقدي",
    color: "#9c27b0",
  },
  "sell-check": {
    label: "بيع شيك",
    color: "#673ab7",
  },
  "check-collection": {
    label: "تحصيل شيك",
    color: "#2196f3",
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
    },
    onError: (error) => {
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
    },
    onError: (error) => {
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
      setEditingId(selectedTransaction._id);
      const transaction = transactionsData.data.data.find(
        (t) => t._id === selectedTransaction._id
      );
      if (transaction) {
        setEditInitialValues({
          amount: transaction.amount,
          commission: transaction.commission || 0,
          note: transaction.note || "",
          movement: transaction.movement,
          customerId: transaction.customer._id,
          currencyId: transaction.currency._id,
        });
        setEditModalOpen(true);
      }
    }
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (selectedTransaction) {
      setTransactionToDelete(selectedTransaction);
      setOpenDeleteDialog(true);
    }
    handleCloseMenu();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditModalOpen(false);
  };

  const handleEditSubmitForm = (data) => {
    updateTransactionMutation.mutate({
      id: editingId,
      data,
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
              onClick={() => navigate("/transaction/buy-cash")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              شراء نقدي
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate("/transaction/buy-check")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              شراء شيك
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate("/transaction/sell-cash")}
              sx={{ ml: 1 }}
              className="arabic-text"
            >
              بيع نقدي
            </Button>
            <Button
              variant="contained"
              color="info"
              onClick={() => navigate("/transaction/sell-check")}
              className="arabic-text"
            >
              بيع شيك
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
                    <MenuItem value="buy-cash">شراء نقدي</MenuItem>
                    <MenuItem value="buy-check">شراء شيك</MenuItem>
                    <MenuItem value="sell-cash">بيع نقدي</MenuItem>
                    <MenuItem value="sell-check">بيع شيك</MenuItem>
                    <MenuItem value="check-collection">تحصيل شيك</MenuItem>
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
                        <Link to={`/clients/${transaction.customer._id}`}>
                          {transaction.customer.name}
                        </Link>
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
                        {transaction.commission?.toLocaleString() || "0"}
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
