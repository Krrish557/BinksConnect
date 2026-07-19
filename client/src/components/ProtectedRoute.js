"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/services/apiClient";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const token = apiClient.loadToken();
        if (!token && pathname !== "/login") {
            router.replace("/login");
        }
        setChecked(true);
    }, [pathname, router]);

    if (!checked) return null;

    const token = apiClient.getToken();
    if (!token && pathname !== "/login") return null;

    return children;
}
