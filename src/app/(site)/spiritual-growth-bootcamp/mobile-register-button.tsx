"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui";

/**
 * A "Register" bar pinned to the bottom on phones. Hidden while the hero is on
 * screen (it has its own Register button, and the bar would cover it) and
 * while the form itself is in view.
 */
export function MobileRegisterButton() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("sgb-hero");
    const form = document.getElementById("register");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) setHeroVisible(entry.isIntersecting);
          if (entry.target === form) setFormVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.01 },
    );
    if (hero) observer.observe(hero);
    if (form) observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (heroVisible || formVisible) return null;

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
