// src/components/InvoiceForm.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createInvoice } from "../features/invoice/invoiceSlice";

export default function InvoiceForm({ onClose }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    customer_id: "",
    issue_date: "",
    due_date: "",
    currency: "INR",
    shipping_amount: 0,
    discount_amount: 0,
    notes: "",
    terms: "",
    items: [
      { product_id: "", quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 },
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx][field] = value;
      return { ...f, items };
    });
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { product_id: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(createInvoice(form));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Create Invoice</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer ID */}
          <div>
            <label className="block text-sm font-medium">Customer ID</label>
            <input
              type="number"
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded-lg p-2"
            />
          </div>

          {/* Issue Date / Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Issue Date</label>
              <input
                type="date"
                name="issue_date"
                value={form.issue_date}
                onChange={handleChange}
                required
                className="mt-1 block w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Due Date</label>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-lg p-2"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium mb-2">Items</label>
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-5 gap-2 mb-2 items-center"
              >
                <input
                  type="number"
                  placeholder="Product ID"
                  value={item.product_id}
                  onChange={(e) =>
                    handleItemChange(idx, "product_id", e.target.value)
                  }
                  className="border rounded-lg p-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(idx, "quantity", e.target.value)
                  }
                  className="border rounded-lg p-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unit_price}
                  onChange={(e) =>
                    handleItemChange(idx, "unit_price", e.target.value)
                  }
                  className="border rounded-lg p-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Discount"
                  value={item.discount}
                  onChange={(e) =>
                    handleItemChange(idx, "discount", e.target.value)
                  }
                  className="border rounded-lg p-2"
                />
                <input
                  type="number"
                  placeholder="Tax %"
                  value={item.tax_rate}
                  onChange={(e) =>
                    handleItemChange(idx, "tax_rate", e.target.value)
                  }
                  className="border rounded-lg p-2"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 text-sm mt-2"
            >
              + Add Item
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Save Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
