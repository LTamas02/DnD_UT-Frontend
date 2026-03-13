import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const useScrollRestoration = (options = {}) => {
  const { ready = true, enabled = true, key } = options;
  const location = useLocation();
  const storageKey = key || `scroll:${location.pathname}`;
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled || !ready || restoredRef.current) return;
    const raw = sessionStorage.getItem(storageKey);
    const saved = raw ? Number(raw) : 0;
    if (Number.isFinite(saved) && saved > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, behavior: "auto" });
      });
    }
    restoredRef.current = true;
  }, [enabled, ready, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(storageKey, String(window.scrollY || 0));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, storageKey]);

  const saveNow = () => {
    if (!enabled) return;
    sessionStorage.setItem(storageKey, String(window.scrollY || 0));
  };

  return { saveNow };
};
