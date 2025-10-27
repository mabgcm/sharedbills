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

    async function handleDelete(type: "bill" | "payment", id: string) {
        const ok = window.confirm("Are you sure you want to delete this?");
        if (!ok) return;

        const url =
            type === "bill" ? `/api/bills/${id}` : `/api/payments/${id}`;

        const res = await fetch(url, { method: "DELETE" });

        if (res.ok) {
            fetchData();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    }

    if (loading) {
        return <div className="p-8 text-sm text-gray-600">Loading data...</div>;
    }

    const totals = data?.totals || getTotals(data?.bills || [], data?.payments || []);

    return (
        <main className="p-4 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            {/* SUMMARY */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SummaryCard label="Neighbor Share" value={totals.totalNeighborShare} />
                <SummaryCard label="Neighbor Paid" value={totals.neighborPaid} />
                <SummaryCard
                    label={totals.balance >= 0 ? "Owed" : "Credit"}
                    value={Math.abs(totals.balance)}
                    highlight={totals.balance >= 0 ? "text-red-600" : "text-green-600"}
                />
            </section>

            {/* ADD BILL */}
            <section className="bg-white rounded-xl p-4 shadow space-y-3">
                <h2 className="text-lg font-semibold">Add Bill</h2>
                <form onSubmit={handleAddBill} className="space-y-3">
                    <input
                        required
                        placeholder="Period (e.g. 2025-10)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newBill.period}
                        onChange={(e) =>
                            setNewBill({ ...newBill, period: e.target.value })
                        }
                    />

                    <input
                        required
                        placeholder="Category (e.g. Enbridge)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newBill.category}
                        onChange={(e) =>
                            setNewBill({ ...newBill, category: e.target.value })
                        }
                    />

                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Amount Total"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newBill.amount_total}
                        onChange={(e) =>
                            setNewBill({ ...newBill, amount_total: e.target.value })
                        }
                    />

                    <input
                        placeholder="Notes"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newBill.notes}
                        onChange={(e) =>
                            setNewBill({ ...newBill, notes: e.target.value })
                        }
                    />

                    <div className="flex items-center justify-between">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append("file", file);

                                const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                });

                                const result = await res.json();
                                if (result.url) {
                                    setNewBill({ ...newBill, image_url: result.url });
                                    alert("✅ File uploaded successfully!");
                                } else {
                                    alert("Upload failed: " + result.error);
                                }
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        {newBill.image_url && (
                            <a
                                href={newBill.image_url}
                                target="_blank"
                                className="ml-2 text-xs text-blue-600 underline"
                            >
                                View
                            </a>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium"
                    >
                        Add Bill
                    </button>
                </form>
            </section>

            {/* ADD PAYMENT */}
            <section className="bg-white rounded-xl p-4 shadow space-y-3">
                <h2 className="text-lg font-semibold">Add Payment</h2>
                <form onSubmit={handleAddPayment} className="space-y-3">
                    <input
                        required
                        type="date"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newPayment.date}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, date: e.target.value })
                        }
                    />

                    <select
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newPayment.payer}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, payer: e.target.value })
                        }
                    >
                        <option value="neighbor">Neighbor</option>
                        <option value="admin">Admin</option>
                    </select>

                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newPayment.amount}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, amount: e.target.value })
                        }
                    />

                    <input
                        placeholder="Note (e.g. e-transfer)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newPayment.note}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, note: e.target.value })
                        }
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium"
                    >
                        Record Payment
                    </button>
                </form>
            </section>

            {/* BILLS LIST */}
            <section className="bg-white rounded-xl p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">All Bills</h2>
                <ul className="divide-y">
                    {data?.bills?.map((bill: any) => (
                        <li
                            key={bill.id}
                            className="py-2 flex justify-between items-start text-sm"
                        >
                            <div>
                                <div className="font-medium">{bill.category}</div>
                                <div className="text-xs text-gray-500">
                                    {bill.period} • ${bill.amount_total}
                                </div>
                                {bill.image_url ? (
                                    <a
                                        href={bill.image_url}
                                        target="_blank"
                                        className="text-[11px] text-blue-600 underline"
                                    >
                                        View bill
                                    </a>
                                ) : null}
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

            {/* PAYMENTS LIST */}
            <section className="bg-white rounded-xl p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">Payments</h2>
                <ul className="divide-y">
                    {data?.payments?.map((p: any) => (
                        <li
                            key={p.id}
                            className="py-2 flex justify-between items-start text-sm"
                        >
                            <div>
                                <div className="font-medium">${p.amount}</div>
                                <div className="text-xs text-gray-500">
                                    {p.payer} • {p.date}
                                </div>
                                {p.note ? (
                                    <div className="text-[11px] text-gray-400">{p.note}</div>
                                ) : null}
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

function SummaryCard({
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