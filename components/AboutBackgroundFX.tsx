"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function AboutBackgroundFX() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const layers = useMemo(() => [
    {
      id: "glow",
      className: "absolute inset-0 opacity-[0.45]",
      style: {
        background:
          "radial-gradient(950px 650px at 12% 18%, rgba(255,39,240,0.16), transparent 60%), radial-gradient(1100px 700px at 86% 8%, rgba(179,127,235,0.22), transparent 60%), radial-gradient(950px 650px at 76% 86%, rgba(41,255,100,0.10), transparent 60%)",
      },
      depth: 10,
    },
    {
      id: "blobRightTop",
      className:
        "absolute -top-40 -right-64 w-[780px] h-[780px] rounded-full blur-[150px] opacity-[0.35]",
      style: { background: "rgba(146,84,222,0.75)" },
      depth: 18,
    },
    {
      id: "blobBottomPink",
      className:
        "absolute bottom-[-240px] left-1/2 -translate-x-1/2 w-[920px] h-[520px] rounded-full blur-[160px] opacity-[0.40]",
      style: { background: "rgba(255,39,240,0.70)" },
      depth: 8,
    },
    {
      id: "bottomGrad",
      className: "absolute inset-x-0 bottom-0 h-[520px] opacity-[0.95]",
      style: {
        background:
          "linear-gradient(180deg, rgba(6,17,37,0) 0%, rgba(146,84,222,0.22) 35%, rgba(255,39,240,0.55) 82%, rgba(255,39,240,0.65) 100%)",
      },
      depth: 6,
    },
  ], []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

   const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      setPos({ x, y });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#061125]"
    >
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={layer.className}
          style={{
            ...layer.style,
            transform: `translate3d(${pos.x * layer.depth}px, ${
              pos.y * layer.depth
            }px, 0)`,
            transition: "transform 80ms linear",
          }}
        />
      ))}
    </div>
  );
}
