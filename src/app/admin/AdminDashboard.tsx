// src/app/admin/AdminDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Bill, Payment, getTotals, splitBillParts } from "../../lib /calc";

type AdminData = {
    bills: Bill[];
    payments: Payment[];
    totals: {
        totalNeighborShare: number;
        neighborPaid: number;
        balance: number;
        monthCurrentNeighbor?: number;
        monthCarryNeighbor?: number;
    };
};

export default function AdminDashboard() {
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Add Bill form state (with split fields)
    const [newBill, setNewBill] = useState({
        period: "",
        category: "",
        previous_balance: "",
        current_charge: "",
        notes: "",
        image_url: "",
    });

    // --- Add Payment form state
    const [newPayment, setNewPayment] = useState({
        date: "",
        payer: "neighbor",
        amount: "",
        note: "",
    });

    // Fetch combined admin data (bills + payments + totals)
    async function fetchData() {
        setLoading(true);
        const res = await fetch("/api/admin-data", { cache: "no-store" });
        const json = (await res.json()) as AdminData | { error: string };
        if ("error" in json) {
            alert("Failed to load admin data: " + json.error);
            setLoading(false);
            return;
        }
        setData(json);
        setLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    // -------- Add Bill (server computes total_amount = prev + curr)
    async function handleAddBill(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            period: newBill.period,
            category: newBill.category,
            previous_balance: parseFloat(newBill.previous_balance || "0"),
            current_charge: parseFloat(newBill.current_charge || "0"),
            notes: newBill.notes || null,
            image_url: newBill.image_url || null,
        };

        const res = await fetch("/api/bills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
            alert("Error adding bill: " + (json?.error || "Unknown error"));
            return;
        }

        alert("Bill added");
        setNewBill({
            period: "",
            category: "",
            previous_balance: "",
            current_charge: "",
            notes: "",
            image_url: "",
        });
        fetchData();
    }

    // -------- Upload image to Supabase Storage via /api/upload
    async function handleUpload(file: File) {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json?.url) {
            alert("Upload failed: " + (json?.error || "Unknown error"));
            return;
        }
        setNewBill((b) => ({ ...b, image_url: json.url }));
        alert("✅ File uploaded");
    }

    // -------- Add Payment
    async function handleAddPayment(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            date: newPayment.date,
            payer: newPayment.payer as "admin" | "neighbor",
            amount: parseFloat(newPayment.amount || "0"),
            note: newPayment.note || null,
        };

        const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
            alert("Error adding payment: " + (json?.error || "Unknown error"));
            return;
        }

        alert("Payment recorded");
        setNewPayment({ date: "", payer: "neighbor", amount: "", note: "" });
        fetchData();
    }

    // -------- Delete row helpers
    async function handleDelete(type: "bill" | "payment", id: string) {
        const ok = window.confirm("Are you sure you want to delete this?");
        if (!ok) return;

        const url = type === "bill" ? `/api/bills/${id}` : `/api/payments/${id}`;
        const res = await fetch(url, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) {
            alert("Delete failed: " + (json?.error || "Unknown error"));
            return;
        }
        fetchData();
    }

    if (loading) return <div className="p-8 text-sm text-gray-600">Loading…</div>;

    const safeBills = data?.bills ?? [];
    const safePayments = data?.payments ?? [];
    const totals =
        data?.totals ?? getTotals(safeBills, safePayments); // fallback if API shape changes

    // UI helpers
    const computedTotal =
        Number(newBill.previous_balance || 0) + Number(newBill.current_charge || 0);

    return (
        <main className="p-4 max-w-3xl mx-auto space-y-8">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            required
                            placeholder="Period (e.g. 2025-11)"
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            required
                            type="number"
                            step="0.01"
                            placeholder="Previous Balance (carry-over)"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            value={newBill.previous_balance}
                            onChange={(e) =>
                                setNewBill({
                                    ...newBill,
                                    previous_balance: e.target.value,
                                })
                            }
                        />
                        <input
                            required
                            type="number"
                            step="0.01"
                            placeholder="Current Month Charge"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            value={newBill.current_charge}
                            onChange={(e) =>
                                setNewBill({
                                    ...newBill,
                                    current_charge: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="text-xs text-gray-600">
                        Total invoice (auto): <b>${computedTotal.toFixed(2)}</b>
                    </div>

                    <input
                        placeholder="Notes"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={newBill.notes}
                        onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                    />

                    {/* Upload + preview */}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                if (f.size > 10 * 1024 * 1024) {
                                    alert("File too large (max 10MB)");
                                    return;
                                }
                                await handleUpload(f);
                            }}
                        />
                        {newBill.image_url ? (
                            <a
                                href={newBill.image_url}
                                target="_blank"
                                className="text-xs text-blue-600 underline whitespace-nowrap"
                            >
                                View
                            </a>
                        ) : null}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

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
                    {safeBills.map((bill) => {
                        const parts = splitBillParts(bill);
                        return (
                            <li
                                key={bill.id}
                                className="py-3 flex justify-between items-start text-sm"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium">{bill.category}</div>
                                    <div className="text-xs text-gray-500">
                                        {bill.period} • Total ${Number(bill.total_amount).toFixed(2)}
                                        <span className="text-gray-400">
                                            {" "}
                                            (prev ${Number(bill.previous_balance).toFixed(2)} + curr $
                                            {Number(bill.current_charge).toFixed(2)})
                                        </span>
                                    </div>

                                    <div className="text-[11px] text-gray-500 mt-1">
                                        Neighbor → Prev ${parts.prevNeighbor.toFixed(2)} • Curr $
                                        {parts.currNeighbor.toFixed(2)} •{" "}
                                        <span className="font-medium">
                                            Total ${parts.totalNeighbor.toFixed(2)}
                                        </span>
                                    </div>

                                    {bill.image_url ? (
                                        <a
                                            href={bill.image_url}
                                            target="_blank"
                                            className="text-[11px] text-blue-600 underline mt-1 inline-block"
                                        >
                                            View bill
                                        </a>
                                    ) : null}
                                </div>

                                <button
                                    onClick={() => handleDelete("bill", bill.id)}
                                    className="text-red-500 text-xs ml-3 shrink-0"
                                >
                                    Delete
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* PAYMENTS LIST */}
            <section className="bg-white rounded-xl p-4 shadow">
                <h2 className="text-lg font-semibold mb-2">Payments</h2>
                <ul className="divide-y">
                    {safePayments.map((p) => (
                        <li
                            key={p.id}
                            className="py-2 flex justify-between items-start text-sm"
                        >
                            <div>
                                <div className="font-medium">${Number(p.amount).toFixed(2)}</div>
                                <div className="text-xs text-gray-500">
                                    {p.payer} • {p.date}
                                </div>
                                {p.note ? (
                                    <div className="text-[11px] text-gray-400">{p.note}</div>
                                ) : null}
                            </div>

                            <button
                                onClick={() => handleDelete("payment", p.id)}
                                className="text-red-500 text-xs ml-3 shrink-0"
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
                ${Number(value || 0).toFixed(2)}
            </span>
        </div>
    );
}