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
        if (!token && pathname !== "/onboarding" && pathname !== "/login") {
            router.replace("/onboarding");
        }
        setChecked(true);
    }, [pathname, router]);

    if (!checked) return null;

    const token = apiClient.getToken();
    if (!token && pathname !== "/onboarding" && pathname !== "/login") return null;

    return children;
}
