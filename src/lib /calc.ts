// src/lib/calc.ts

// ---------- Types ----------
export type Bill = {
    id: string;
    period: string;             // e.g. "2025-09"
    category: string;           // InnPower / Enbridge / Barrie Water / Enercare / etc.
    previous_balance: number;   // carry-over included on the invoice
    current_charge: number;     // this month's usage
    total_amount: number;       // previous_balance + current_charge (server-computed)
    image_url: string | null;
    notes: string | null;
    created_at: string;
};

export type Payment = {
    id: string;
    date: string;               // ISO date (YYYY-MM-DD)
    payer: "admin" | "neighbor";
    amount: number;
    note: string | null;
    created_at: string;
};

// ---------- Ratios ----------
export const NEIGHBOR_RATIO = 0.3;
export const ADMIN_RATIO = 0.7;

// ---------- Per-bill split helpers ----------
export function splitBillParts(bill: Bill) {
    const prevNeighbor = (Number(bill.previous_balance) || 0) * NEIGHBOR_RATIO;
    const currNeighbor = (Number(bill.current_charge) || 0) * NEIGHBOR_RATIO;
    const totalNeighbor = (Number(bill.total_amount) || 0) * NEIGHBOR_RATIO;

    const prevAdmin = (Number(bill.previous_balance) || 0) * ADMIN_RATIO;
    const currAdmin = (Number(bill.current_charge) || 0) * ADMIN_RATIO;
    const totalAdmin = (Number(bill.total_amount) || 0) * ADMIN_RATIO;

    return {
        prevNeighbor, currNeighbor, totalNeighbor,
        prevAdmin, currAdmin, totalAdmin,
    };
}

// ---------- Totals (no double-counting) ----------
/**
 * We want to avoid counting the same arrears twice when a later invoice
 * includes `previous_balance` from earlier months.
 *
 * Rule:
 *  - Sum ALL `current_charge` across all bills (each month’s usage exactly once)
 *  - Include `previous_balance` ONLY for the earliest period present
 *    (covers starting debt if you began tracking mid-cycle)
 */
export function getTotals(bills: Bill[], payments: Payment[]) {
    const safeBills = bills ?? [];
    const safePayments = payments ?? [];

    // helper to compare "YYYY-MM" strings
    const cmpPeriod = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

    // Sum of all current month usages
    const sumCurrent = safeBills.reduce(
        (sum, b) => sum + (Number(b.current_charge) || 0),
        0
    );

    // Include previous_balance only for the earliest period we have on record
    let earliestPrev = 0;
    if (safeBills.length > 0) {
        const earliestPeriod = safeBills.map(b => b.period).sort(cmpPeriod)[0];
        earliestPrev = safeBills
            .filter(b => b.period === earliestPeriod)
            .reduce((sum, b) => sum + (Number(b.previous_balance) || 0), 0);
    }

    // Neighbor share
    const totalNeighborShare = (sumCurrent + earliestPrev) * NEIGHBOR_RATIO;

    // Neighbor paid
    const neighborPaid = safePayments
        .filter(p => p.payer === "neighbor")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const balance = totalNeighborShare - neighborPaid;

    // Optional breakdowns (useful for UI cards)
    const monthCurrentNeighbor = sumCurrent * NEIGHBOR_RATIO;
    const monthCarryNeighbor = earliestPrev * NEIGHBOR_RATIO;

    return {
        totalNeighborShare,
        neighborPaid,
        balance,
        monthCurrentNeighbor,
        monthCarryNeighbor,
    };
}