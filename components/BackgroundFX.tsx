"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Layer = {
  id: string;
  className: string;
  style: React.CSSProperties;
  depth: number; // كل ما زاد العمق زاد تحركه
};

export default function BackgroundFX() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // -0.5..0.5 تقريبًا

  const layers: Layer[] = useMemo(
    () => [
      {
        id: "gridGlow",
        className: "absolute inset-0 opacity-[0.25]",
        style: {
          background:
            "radial-gradient(1200px 600px at 70% 10%, rgba(179,127,235,0.22), transparent 60%), radial-gradient(900px 500px at 20% 80%, rgba(41,255,100,0.10), transparent 60%)",
        },
        depth: 10,
      },
      {
        id: "blobPurple1",
        className:
          "absolute -top-32 -right-48 w-[680px] h-[680px] rounded-full blur-[110px] opacity-[0.35]",
        style: {
          background: "rgba(146,84,222,0.55)",
        },
        depth: 22,
      },
      {
        id: "blobPurple2",
        className:
          "absolute top-[280px] left-[-220px] w-[520px] h-[520px] rounded-full blur-[110px] opacity-[0.22]",
        style: {
          background: "rgba(179,127,235,0.45)",
        },
        depth: 18,
      },
      {
        id: "blobGreen",
        className:
          "absolute bottom-[-240px] right-[120px] w-[640px] h-[640px] rounded-full blur-[140px] opacity-[0.12]",
        style: {
          background: "rgba(41,255,100,0.55)",
        },
        depth: 14,
      },
      {
        id: "diagLines",
        className: "absolute inset-0 opacity-[0.12]",
        style: {
          background:
            "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.10) 20%, transparent 40%, rgba(255,255,255,0.06) 60%, transparent 80%)",
          maskImage:
            "radial-gradient(closest-side at 50% 50%, black 45%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(closest-side at 50% 50%, black 45%, transparent 85%)",
        },
        depth: 8,
      },

      // ✅ GREEN BLUR (320x320)
      {
        id: "greenBlur320",
        className:
          "absolute top-[1150px] left-[434.0001px] w-[320px] h-[320px] rotate-[48.029deg] rounded-full blur-[120px] opacity-[0.22]",
        style: { background: "#29FF64" },
        depth: 18,
      },

      // ✅ PINK BLUR
      {
        id: "pinkBlur154",
        className:
          "absolute top-[795px] right-[527.0013px] w-[154.177px] h-[154.177px] rotate-[48.029deg] rounded-full blur-[71px] opacity-[0.38]",
        style: { background: "#FF27F0" },
        depth: 24,
      },

      // ✅ arena grid (عندها transform أساسي لازم ما يضيع)
      {
        id: "arenaGrid",
        className: "absolute inset-0 opacity-[0.18]",
        style: {
          backgroundImage: `
            linear-gradient(rgba(41,255,100,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(41,255,100,0.18) 1px, transparent 1px),
            linear-gradient(120deg, rgba(41,255,100,0.12) 1px, transparent 1px),
            linear-gradient(60deg, rgba(41,255,100,0.10) 1px, transparent 1px)
          `,
          backgroundSize: `
            90px 90px,
            90px 90px,
            220px 220px,
            260px 260px
          `,
          backgroundPosition: `0 0, 0 0, 0 0, 0 0`,
          transform:
            "perspective(900px) rotateX(58deg) rotateZ(-18deg) translateY(120px)",
          transformOrigin: "left bottom",
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 55%, transparent 95%)",
          WebkitMaskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 55%, transparent 95%)",
        },
        depth: 6,
      },
    ],
    []
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      setPos({ x: nx, y: ny });
    };

    let raf = 0;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (isCoarse) {
      const start = performance.now();
      const loop = (t: number) => {
        const k = (t - start) / 1000;
        setPos({ x: Math.sin(k * 0.25) * 0.08, y: Math.cos(k * 0.22) * 0.08 });
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    return () => {
      if (!isCoarse) window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#061125]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
        }}
      />

      {layers.map((layer) => {
        const tx = pos.x * layer.depth;
        const ty = pos.y * layer.depth;

        // ✅ مهم: لا نمسح transform الأصلي
        const { transform: baseTransform, ...restStyle } = layer.style as any;

        return (
          <div
            key={layer.id}
            className={layer.className}
            style={{
              ...restStyle,
              transform: `${baseTransform ? baseTransform + " " : ""}translate3d(${tx}px, ${ty}px, 0)`,
              transition: "transform 80ms linear",
            }}
          />
        );
      })}
    </div>
  );
}
