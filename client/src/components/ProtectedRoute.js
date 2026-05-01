"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuthStore from "@/store/authStore";

export default function ProtectedRoute({
    children
}) {
    const router = useRouter();

    const isAuthenticated =
        useAuthStore(
            (state) => state.isAuthenticated
        );

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    return children;
}