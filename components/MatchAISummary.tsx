"use client";

import { useState } from "react";

type Props = {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  game: string;
  tournament: string;
  status: string;
  startAt: string;
};

export default function MatchAISummary(props: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  async function handleSummarize() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(props),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "تعذر إنشاء الملخص");
      }

      setSummary(data?.summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-[#B37FEB] bg-[linear-gradient(180deg,#0C1E45_0%,#07162C_100%)] px-8 py-8 shadow-[0_0_28px_rgba(179,127,235,0.18)]">
      <h2 className="mb-8 text-center text-[24px] font-extrabold md:text-[40px]">
        ملخص المباراة بالذكاء الاصطناعي
      </h2>

      {!summary && !loading && !error && (
        <p className="text-center text-white/75 md:text-[20px]">
          اضغط الزر لإنشاء ملخص ذكي للمباراة من بياناتها.
        </p>
      )}

      {loading && (
        <p className="text-center text-white/75 md:text-[20px]">
          جاري إنشاء الملخص...
        </p>
      )}

      {error && (
        <p className="text-center text-red-300 md:text-[18px]">{error}</p>
      )}

      {summary && (
        <div className="space-y-6 whitespace-pre-wrap text-right text-[16px] leading-[2.1] text-white/92 md:text-[22px]">
          {summary}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={handleSummarize}
          disabled={loading}
          className="rounded-[26px] border border-[#B37FEB] bg-[linear-gradient(180deg,#4F1D80_0%,#2B0E4F_100%)] px-14 py-4 text-[22px] font-extrabold text-white shadow-[0_0_22px_rgba(179,127,235,0.28)] transition hover:scale-[1.02] disabled:opacity-60"
        >
          {loading ? "جاري التلخيص..." : "لخّص المباراة"}
        </button>
      </div>
    </div>
  );
}
