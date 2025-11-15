"use client";

import { usePageBackground } from "@/hooks/usePageBackground";

export default function validationSuits() {
  const pageBackground = usePageBackground();

  return (
    <section id="validationSuits">
      <main className="" style={pageBackground}>
        Test
      </main>
    </section>
  );
}
