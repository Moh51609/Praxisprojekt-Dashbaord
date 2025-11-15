"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const defaultPage = localStorage.getItem("default-page") ?? "dashboard";

    // Mapping deiner Routen
    const routes: Record<string, string> = {
      dashboard: "/Dashboard",
      elements: "/Elements",
      relations: "/Relations",
      kpis: "/KPIs",
      validation: "/validationSuits",
    };

    const target = routes[defaultPage] || "/";

    // Nur weiterleiten, wenn wir wirklich auf der Root sind
    if (window.location.pathname === "/") {
      router.replace(target);
    }
  }, [router]);

  return null;
}
