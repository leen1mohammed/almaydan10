'use client';
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  // هذه الدالة لتشغيل المحرك (Engine) الخاص بالجزيئات
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 z-0 pointer-events-none"
      // 👇 هنا تبدأ الـ options (الإعدادات) اللي تخلي الشكل "قيمنق"
      options={{
  fullScreen: { enable: false },
  fpsLimit: 120,
  particles: {
  number: { value: 100 },
  color: { value: ["#FF27F0", "#29FF64", "#00CCFF"] },
  shape: { type: "square" }, // غيرناه لمربع
  opacity: { value: 0.5 },
  size: { value: { min: 1, max: 5 } }, 
  move: {
    enable: true,
    speed: 5, // سرعة المطر
    direction: "bottom",
    straight: true,
    outModes: { default: "out" },
  },
},
  interactivity: {
    events: {
      onHover: { enable: true, mode: "pulse" }, // نبض عند مرور الماوس
    },
    modes: {
      pulse: { quantity: 4 }
    }

}
      }}
    />



  );
}