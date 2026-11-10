"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";

export function MobileRegisterButton() {
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("register");
    if (!form) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (formVisible) return null;

  return (
    <div
      className="fixed inset-x-4 z-40 pr-14 md:hidden"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <ButtonLink href="#register" variant="brass" className="w-full shadow-lg">
        Register
      </ButtonLink>
    </div>
  );
}
