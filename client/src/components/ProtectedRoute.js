"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { providerManager } from "@/core/providerManager";

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const hasSession = providerManager.isConfigured();
        if (!hasSession && pathname !== "/onboarding" && pathname !== "/login") {
            router.replace("/onboarding");
        }
        setChecked(true);
    }, [pathname, router]);

    if (!checked) return null;

    const hasSession = providerManager.isConfigured();
    if (!hasSession && pathname !== "/onboarding" && pathname !== "/login") return null;

    return children;
}
