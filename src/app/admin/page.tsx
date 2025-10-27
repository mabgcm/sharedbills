"use client";
import { useState } from "react";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
    const [pin, setPin] = useState("");
    const [authorized, setAuthorized] = useState(false);
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN || "2301";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === correctPin) setAuthorized(true);
        else alert("Incorrect PIN");
    };

    if (authorized) return <AdminDashboard />;

    return (
        <main className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded-xl shadow-md space-y-3"
            >
                <h1 className="text-lg font-semibold text-center mb-2">
                    Admin Access
                </h1>
                <input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="border rounded px-3 py-2 w-48 text-center"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white rounded py-2 mt-2"
                >
                    Login
                </button>
            </form>
        </main>
    );
}