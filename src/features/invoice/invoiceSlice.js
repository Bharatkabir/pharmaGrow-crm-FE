import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosInstance";

// const API = "http://127.0.0.1:8000/api";
const API =  import.meta.env.VITE_API_URL_LIVE;

// fetch paginated invoices
export const fetchInvoices = createAsyncThunk(
  "invoice/fetchInvoices",
  async (params = "", { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/invoices${params ? `?${params}` : ""}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// fetch single invoice
export const fetchInvoice = createAsyncThunk(
  "invoice/fetchInvoice",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/invoices/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// create invoice
export const createInvoice = createAsyncThunk(
  "invoice/createInvoice",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/invoices`, payload);
      return res.data.invoice;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// mark invoice as paid
export const markPaid = createAsyncThunk(
  "invoice/markPaid",
  async ({ id, amount }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/invoices/${id}/mark-paid`, { amount });
      return res.data.invoice;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// send invoice
export const sendInvoice = createAsyncThunk(
  "invoice/sendInvoice",
  async ({ id, email, cc_email }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/invoices/${id}/send-email`, {
        to_email: email,
        cc_email, // ✅ include CC email if provided
      });

      return res.data; // { success: true, message: "..."}
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// export single invoice PDF
export const exportInvoicePDF = createAsyncThunk(
  "invoice/exportPDF",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/invoices/${id}/export-pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// export all invoices Excel
export const exportInvoicesExcel = createAsyncThunk(
  "invoice/exportExcel",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/invoices/export/excel`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoices.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const slice = createSlice({
  name: "invoice",
  initialState: {
    invoices: { data: [], meta: {}, links: {} },
    invoice: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (s, a) => {
        s.loading = false;
        s.invoices = a.payload;
      })
      .addCase(fetchInvoices.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(fetchInvoice.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchInvoice.fulfilled, (s, a) => {
        s.loading = false;
        s.invoice = a.payload;
      })
      .addCase(fetchInvoice.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(createInvoice.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createInvoice.fulfilled, (s, a) => {
        s.loading = false;
        if (s.invoices && Array.isArray(s.invoices.data)) {
          s.invoices.data.unshift(a.payload);
        } else {
          s.invoices.data = [a.payload];
        }
      })
      .addCase(createInvoice.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })
      .addCase(markPaid.fulfilled, (s, a) => {
        if (s.invoice && s.invoice.id === a.payload.id) s.invoice = a.payload;
        if (s.invoices && Array.isArray(s.invoices.data)) {
          s.invoices.data = s.invoices.data.map((inv) =>
            inv.id === a.payload.id ? a.payload : inv
          );
        }
      })
      .addCase(sendInvoice.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(sendInvoice.fulfilled, (s, a) => {
        s.loading = false;
        if (s.invoice && s.invoice.id === a.payload.id) s.invoice = a.payload;
        if (s.invoices && Array.isArray(s.invoices.data)) {
          s.invoices.data = s.invoices.data.map((inv) =>
            inv.id === a.payload.id ? a.payload : inv
          );
        }
      })
      .addCase(sendInvoice.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      });
  },
});

export default slice.reducer;