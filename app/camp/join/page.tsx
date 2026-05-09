"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function JoinCampPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const joinCamp = async () => {
      const token = params.get("token");

      if (!token) return;

      try {
        const res = await fetch("/api/camp/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!mounted) return;

        if (data.campId) {
          router.replace(`/camp/${data.campId}`);
        } else {
          router.replace("/camp");
        }
      } catch {
        router.replace("/camp");
      }
    };

    joinCamp();

    return () => {
      mounted = false;
    };
  }, [params, router]);

  return (
    <div className="mt-40 text-center text-white">
      جاري الانضمام للمعسكر...
    </div>
  );
}