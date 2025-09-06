import axios from "axios";

// Set base URL
const API_URL = "/api";

// Set token if it exists in localStorage
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Authentication Services
export const authService = {
  login: (credentials) => axios.post(`${API_URL}/auth/login`, credentials),
  register: (userData) => axios.post(`${API_URL}/auth/register`, userData),
  verifyToken: () => axios.get(`${API_URL}/auth/verify`),
};

// User Services
export const userService = {
  getProfile: () => axios.get(`${API_URL}/users/me`),
  updateProfile: (data) => axios.put(`${API_URL}/users/me`, data),
};

// Currency Services
export const currencyService = {
  getAllCurrencies: () => axios.get(`${API_URL}/currencies`),
  getCurrency: (id) => axios.get(`${API_URL}/currencies/${id}`),
  createCurrency: (data) => axios.post(`${API_URL}/currencies`, data),
  updateCurrency: (id, data) => axios.put(`${API_URL}/currencies/${id}`, data),
  deleteCurrency: (id) => axios.delete(`${API_URL}/currencies/${id}`),
  getCompanyBalances: () => axios.get(`${API_URL}/currencies/balances`),
  updateCompanyBalance: (id, data) =>
    axios.put(`${API_URL}/currencies/${id}/balance`, data),
  toggleCurrencyStar: (id) => axios.put(`${API_URL}/currencies/${id}/star`),
  adjustCompanyBalance: (data) => axios.post(`${API_URL}/currencies/adjust-balance`, data),
};

// Customer Services
export const customerService = {
  getAllCustomers: () => axios.get(`${API_URL}/customers`),
  getCustomersCount: () => axios.get(`${API_URL}/customers/count`),
  getCustomer: (id) => axios.get(`${API_URL}/customers/${id}`),
  createCustomer: (data) => axios.post(`${API_URL}/customers`, data),
  updateCustomer: (id, data) => axios.put(`${API_URL}/customers/${id}`, data),
  deleteCustomer: (id) => axios.delete(`${API_URL}/customers/${id}`),
  getCustomerBalances: (id) => axios.get(`${API_URL}/customers/${id}/balances`),
  updateCustomerBalance: (id, currencyId, data) =>
    axios.put(
      `${API_URL}/customers/${id}/currencies/${currencyId}/balance`,
      data
    ),
  toggleCustomerCurrencyStar: (id, currencyId) =>
    axios.put(`${API_URL}/customers/${id}/balances/${currencyId}/star`),
  adjustClientBalance: (data) => axios.post(`${API_URL}/customers/adjust-balance`, data),
};

// Transaction Services
export const transactionService = {
  getTransactions: (params) => axios.get(`${API_URL}/transactions`, { params }),
  getTransaction: (id) => axios.get(`${API_URL}/transactions/${id}`),
  createTransaction: (data) => axios.post(`${API_URL}/transactions`, data),
  deleteTransaction: (id) => axios.delete(`${API_URL}/transactions/${id}`),
  updateTransaction: (id, data) =>
    axios.patch(`${API_URL}/transactions/${id}`, data),
};

// Earnings Services
export const earningService = {
  getAllEarnings: (params) => axios.get(`${API_URL}/earnings`, { params }),
  getEarning: (id) => axios.get(`${API_URL}/earnings/${id}`),
  createEarning: (data) => axios.post(`${API_URL}/earnings`, data),
  updateEarning: (id, data) => axios.put(`${API_URL}/earnings/${id}`, data),
  deleteEarning: (id) => axios.delete(`${API_URL}/earnings/${id}`),
  getEarningsByCurrency: (params) =>
    axios.get(`${API_URL}/earnings/reports/by-currency`, { params }),
  getEarningsByType: () => axios.get(`${API_URL}/earnings/reports/by-type`),
  getTotalEarnings: () => axios.get(`${API_URL}/earnings/total`),
};

// Add an interceptor for API errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle expired tokens
    if (error.response && error.response.status === 401) {
      // Remove invalid token
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default {
  authService,
  userService,
  currencyService,
  customerService,
  transactionService,
  earningService,
};
