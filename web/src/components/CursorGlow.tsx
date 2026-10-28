"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 6 };
    const target = { x: pos.x, y: pos.y };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = Math.min(e.clientY, window.innerHeight / 3);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y - pos.y) * 0.08;
      el.style.transform = `translate3d(${pos.x - 48}px, ${pos.y - 48}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[33vh] overflow-hidden">
      <div
        ref={dot}
        className="absolute left-0 top-0 h-24 w-24 rounded-full bg-blue-600 opacity-70 blur-2xl"
      />
    </div>
  );
}