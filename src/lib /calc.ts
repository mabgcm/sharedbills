export type Bill = {
    id: string;
    period: string;
    category: string;
    previous_balance: number; // carry-over
    current_charge: number;   // this month's usage
    total_amount: number;     // previous + current
    image_url: string | null;
    notes: string | null;
    created_at: string;
};

export type Payment = {
    id: string;
    date: string;
    payer: "admin" | "neighbor";
    amount: number;
    note: string | null;
    created_at: string;
};

const NEIGHBOR_RATIO = 0.3;
const ADMIN_RATIO = 0.7;

export function splitBillParts(bill: Bill) {
    const prevNeighbor = bill.previous_balance * NEIGHBOR_RATIO;
    const currNeighbor = bill.current_charge * NEIGHBOR_RATIO;
    const totalNeighbor = bill.total_amount * NEIGHBOR_RATIO;

    const prevAdmin = bill.previous_balance * ADMIN_RATIO;
    const currAdmin = bill.current_charge * ADMIN_RATIO;
    const totalAdmin = bill.total_amount * ADMIN_RATIO;

    return {
        prevNeighbor, currNeighbor, totalNeighbor,
        prevAdmin, currAdmin, totalAdmin,
    };
}

export function getTotals(bills: Bill[], payments: Payment[]) {
    const totalNeighborShare = bills.reduce((sum, b) => sum + b.total_amount * NEIGHBOR_RATIO, 0);
    const neighborPaid = payments
        .filter((p) => p.payer === "neighbor")
        .reduce((sum, p) => sum + p.amount, 0);

    const balance = totalNeighborShare - neighborPaid;

    // (optional – helpful on the UI)
    const monthCurrentNeighbor = bills.reduce((sum, b) => sum + b.current_charge * NEIGHBOR_RATIO, 0);
    const monthCarryNeighbor = bills.reduce((sum, b) => sum + b.previous_balance * NEIGHBOR_RATIO, 0);

    return {
        totalNeighborShare,
        neighborPaid,
        balance,
        monthCurrentNeighbor,
        monthCarryNeighbor,
    };
}