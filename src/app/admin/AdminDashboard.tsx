"use client";

import { useState, useEffect } from "react";
import { getTotals, splitBill } from "../../lib /calc";

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newBill, setNewBill] = useState({
        period: "",
        category: "",
        amount_total: "",
        notes: "",
        image_url: "",
    });
    const [newPayment, setNewPayment] = useState({
        date: "",
        payer: "neighbor",
        amount: "",
        note: "",
    });

    // Fetch all bills + payments + totals
    async function fetchData() {
        setLoading(true);
        const res = await fetch("/api/admin-data");
        const json = await res.json();
        setData(json);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    // Add Bill
    async function handleAddBill(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newBill,
                amount_total: parseFloat(newBill.amount_total),
            }),
        });
        if (res.ok) {
            alert("Bill added");
            setNewBill({
                period: "",
                category: "",
                amount_total: "",
                notes: "",
                image_url: "",
            });
            fetchData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }

    // Add Payment
    async function handleAddPayment(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newPayment,
                amount: parseFloat(newPayment.amount),
            }),
        });
        if (res.ok) {
            alert("Payment recorded");
            setNewPayment({
                date: "",
                payer: "neighbor",
                amount: "",
                note: "",
            });
            fetchData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }

    // Delete Bill or Payment
    async function handleDelete(type: "bill" | "payment", id: string) {
        const confirm = window.confirm("Are you sure you want to delete this?");
        if (!confirm) return;

        const res = await fetch(`/api/${type === "bill" ? "bills" : "payments"}/${id}`, {
            method: "DELETE",
        });
        if (res.ok) fetchData();
        else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }

    if (loading) return <div className="p-8">Loading data...</div>;

    const totals = data?.totals || getTotals(data?.bills || [], data?.payments || []);

    return (
        <main className="p-4 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            {/* SUMMARY */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Summary label="Neighbor Share" value={totals.totalNeighborShare} />
                <Summary label="Neighbor Paid" value={totals.neighborPaid} />
                <Summary
                    label={totals.balance >= 0 ? "Owed" : "Credit"}
                    value={Math.abs(totals.balance)}
                    highlight={totals.balance >= 0 ? "text-red-600" : "text-green-600"}
                />
            </section>

            {/* ADD BILL */}
            <section className="bg-white rounded-xl p-4 shadow space-y-2">
                <h2 className="text-lg font-semibold">Add Bill</h2>
                <form onSubmit={handleAddBill} className="space-y-2">
                    <input
                        required
                        placeholder="Period (e.g. 2025-10)"
                        className="input"
                        value={newBill.period}
                        onChange={(e) => setNewBill({ ...newBill, period: e.target.value })}
                    />
                    <input
                        required
                        placeholder="Category (e.g. Enbridge)"
                        className="input"
                        value={newBill.category}
                        onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                    />
                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Amount Total"
                        className="input"
                        value={newBill.amount_total}
                        onChange={(e) => setNewBill({ ...newBill, amount_total: e.target.value })}
                    />
                    <input
                        placeholder="Notes"
                        className="input"
                        value={newBill.notes}
                        onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                    />
                    <input
                        placeholder="Image URL (optional)"
                        className="input"
                        value={newBill.image_url}
                        onChange={(e) => setNewBill({ ...newBill, image_url: e.target.value })}
                    />
                    <button type="submit" className="btn">Add Bill</button>
                </form>
            </section>

            {/* ADD PAYMENT */}
            <section className="bg-white rounded-xl p-4 shadow space-y-2">
                <h2 className="text-lg font-semibold">Add Payment</h2>
                <form onSubmit={handleAddPayment} className="space-y-2">
                    <input
                        required
                        type="date"
                        className="input"
                        value={newPayment.date}
                        onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    />
                    <select
                        className="input"
                        value={newPayment.payer}
                        onChange={(e) => setNewPayment({ ...newPayment, payer: e.target.value })}
                    >
                        <option value="neighbor">Neighbor</option>
                        <option value="admin">Admin</option>
                    </select>
                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="input"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    />
                    <input
                        placeholder="Note"
                        className="input"
                        value={newPayment.note}
                        onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                    />
                    <button type="submit" className="btn">Add Payment</button>
                </form>
            </section>

            {/* BILL LIST */}
            <section className="bg-white rounded-xl p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">All Bills</h2>
                <ul className="divide-y">
                    {data?.bills?.map((bill: any) => (
                        <li key={bill.id} className="py-2 flex justify-between text-sm">
                            <div>
                                <div className="font-medium">{bill.category}</div>
                                <div className="text-xs text-gray-500">
                                    {bill.period} • ${bill.amount_total}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete("bill", bill.id)}
                                className="text-red-500 text-xs"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* PAYMENT LIST */}
            <section className="bg-white rounded-xl p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">Payments</h2>
                <ul className="divide-y">
                    {data?.payments?.map((p: any) => (
                        <li key={p.id} className="py-2 flex justify-between text-sm">
                            <div>
                                <div className="font-medium">${p.amount}</div>
                                <div className="text-xs text-gray-500">
                                    {p.payer} • {p.date}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete("payment", p.id)}
                                className="text-red-500 text-xs"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

// small utility component
function Summary({
    label,
    value,
    highlight,
}: {
    label: string;
    value: number;
    highlight?: string;
}) {
    return (
        <div className="bg-white rounded-xl p-3 shadow flex flex-col">
            <span className="text-[11px] text-gray-500">{label}</span>
            <span className={`text-lg font-semibold ${highlight ?? ""}`}>
                ${value.toFixed(2)}
            </span>
        </div>
    );
}

// tailwind input and button helpers
const style = document.createElement("style");
style.innerHTML = `
  .input {
    @apply w-full border border-gray-300 rounded px-3 py-2 text-sm;
  }
  .btn {
    @apply w-full bg-blue-600 text-white rounded py-2 text-sm;
  }
`;
document.head.appendChild(style);