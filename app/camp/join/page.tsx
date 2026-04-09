"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function JoinCampPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");

    if (!token) return;

    fetch("/api/camp/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.campId) {
          router.push(`/camp/${data.campId}`);
        } else {
          alert(data.error);
          router.push("/camp");
        }
      });
  }, []);

  return (
    <div className="text-white text-center mt-40">
      جاري الانضمام للمعسكر...
    </div>
  );
}