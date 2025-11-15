import { useEffect, useState } from "react";

export function useLocalStoragePermission() {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("local-storage-enabled");
    setAllowed(saved !== "false");

    const handler = () => {
      const newVal = localStorage.getItem("local-storage-enabled");
      setAllowed(newVal !== "false");
    };
    window.addEventListener("local-storage-changed", handler);
    return () => window.removeEventListener("local-storage-changed", handler);
  }, []);

  return allowed;
}
