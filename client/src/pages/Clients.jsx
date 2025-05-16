import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  InputAdornment,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { customerService } from "../services/api";
import debounce from "lodash.debounce";

// Validation schema for new client form
const newClientSchema = yup.object().shape({
  name: yup.string().required("اسم العميل مطلوب"),
});

export default function Clients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // React Hook Form for new client
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(newClientSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch clients
  const {
    data: clientsData,
    isLoading: clientsLoading,
    isError: clientsError,
    refetch,
  } = useQuery({
    queryKey: ["customers", page, rowsPerPage, searchQuery],
    queryFn: () =>
      customerService.getAllCustomers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      }),
    keepPreviousData: true,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (data) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      reset();
      setOpenNewClientDialog(false);
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleCloseDeleteDialog();
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = debounce((e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  }, 300);

  const handleOpenNewClientDialog = () => {
    reset();
    setOpenNewClientDialog(true);
  };

  const handleCloseNewClientDialog = () => {
    setOpenNewClientDialog(false);
    reset();
  };

  const onSubmitNewClient = (data) => {
    createClientMutation.mutate(data);
  };

  const handleOpenDeleteDialog = (client) => {
    setClientToDelete(client);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setClientToDelete(null);
  };

  const handleDeleteClient = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete._id);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="arabic-text"
      >
        العملاء
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <TextField
            label="بحث"
            variant="outlined"
            size="small"
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ className: "arabic-text" }}
            sx={{ width: 300 }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNewClientDialog}
            className="arabic-text"
          >
            إضافة عميل
          </Button>
        </Box>

        {clientsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        ) : clientsError ? (
          <Alert severity="error" sx={{ mt: 2 }} className="arabic-text">
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="arabic-text">اسم العميل</TableCell>
                    <TableCell className="arabic-text">عدد العملات</TableCell>
                    <TableCell className="arabic-text">عدد المعاملات</TableCell>
                    <TableCell className="arabic-text">تاريخ الإضافة</TableCell>
                    <TableCell className="arabic-text">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientsData?.data.length > 0 ? (
                    clientsData.data.map((client) => (
                      <TableRow
                        key={client._id}
                        hover
                        onClick={() => navigate(`/clients/${client._id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell className="arabic-text">
                          {client.name}
                        </TableCell>
                        <TableCell>{client.currencies_count || 0}</TableCell>
                        <TableCell>{client.transactions_count || 0}</TableCell>
                        <TableCell>
                          {new Date(client.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${client._id}`);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteDialog(client);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        className="arabic-text"
                      >
                        لا يوجد عملاء
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={clientsData?.pagination?.total || 0}
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

      {/* New Client Dialog */}
      <Dialog open={openNewClientDialog} onClose={handleCloseNewClientDialog}>
        <DialogTitle className="arabic-text">إضافة عميل جديد</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmitNewClient)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="اسم العميل"
              fullWidth
              variant="outlined"
              error={!!errors.name}
              helperText={errors.name?.message}
              InputLabelProps={{ className: "arabic-text" }}
              {...register("name")}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseNewClientDialog}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={createClientMutation.isPending}
              className="arabic-text"
            >
              {createClientMutation.isPending ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle className="arabic-text">تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText className="arabic-text">
            هل أنت متأكد من رغبتك في حذف العميل{" "}
            <strong>{clientToDelete?.name}</strong>؟ هذا الإجراء لا يمكن التراجع
            عنه وسيؤدي إلى حذف جميع بيانات العميل ومعاملاته.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} className="arabic-text">
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteClient}
            color="error"
            disabled={deleteClientMutation.isPending}
            className="arabic-text"
          >
            {deleteClientMutation.isPending ? "جاري الحذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
