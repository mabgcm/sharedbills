// src/lib/calc.ts

export type Bill = {
    id: string;
    period: string;
    category: string;
    amount_total: number;
    image_url: string | null;
    notes: string | null;
    created_at: string;
};

export type Payment = {
    id: string;
    date: string; // ISO date string
    payer: "admin" | "neighbor";
    amount: number;
    note: string | null;
    created_at: string;
};

// For now hardcode split. Later we can read from settings table.
const NEIGHBOR_RATIO = 0.3;
const ADMIN_RATIO = 0.7;

export function splitBill(amount_total: number) {
    return {
        neighborShare: amount_total * NEIGHBOR_RATIO,
        adminShare: amount_total * ADMIN_RATIO,
    };
}

export function getTotals(bills: Bill[], payments: Payment[]) {
    // how much neighbor owes total
    const totalNeighborShare = bills.reduce((sum, bill) => {
        return sum + bill.amount_total * NEIGHBOR_RATIO;
    }, 0);

    // how much neighbor actually paid
    const neighborPaid = payments
        .filter((p) => p.payer === "neighbor")
        .reduce((sum, p) => sum + p.amount, 0);

    const balance = totalNeighborShare - neighborPaid;

    return {
        totalNeighborShare,
        neighborPaid,
        balance, // >0 means neighbor owes, <0 means neighbor has credit
    };
}