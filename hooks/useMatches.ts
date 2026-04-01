"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types/match";

export function useMatches(tab: "upcoming" | "past" | "live" = "upcoming", onlySaudi: boolean = false) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          tab,
          sa: onlySaudi ? "1" : "0",
          size: "30",
        });

       const response = await fetch(`/api/matches?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch matches");
        }

        const data = await response.json();
        setMatches(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [tab, onlySaudi]);

  return { matches, loading, error };
}