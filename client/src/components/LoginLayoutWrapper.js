"use client";

import { usePathname } from "next/navigation";
import AppLayout from "./AppLayout";

const NO_LAYOUT_ROUTES = ["/login", "/onboarding"];

export default function LoginLayoutWrapper({ children }) {
    const pathname = usePathname();

    if (NO_LAYOUT_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    return <AppLayout>{children}</AppLayout>;
}
