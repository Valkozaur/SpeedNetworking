import { describe, expect, it } from "vitest";

import { formatDuration, getMilestones, rankParticipants } from "@/lib/scoring";

describe("rankParticipants", () => {
  it("ranks completed participants by fastest elapsed completion time", () => {
    const ranked = rankParticipants([
      {
        id: "late",
        displayName: "Late",
        score: 3,
        targetTotal: 3,
        createdAt: "2026-05-12T09:00:00Z",
        lastClaimAt: "2026-05-12T09:10:00Z",
        completionAt: "2026-05-12T09:10:00Z",
      },
      {
        id: "early",
        displayName: "Early",
        score: 3,
        targetTotal: 3,
        createdAt: "2026-05-12T08:00:00Z",
        lastClaimAt: "2026-05-12T09:05:00Z",
        completionAt: "2026-05-12T09:05:00Z",
      },
    ]);

    expect(ranked.map((participant) => participant.id)).toEqual(["late", "early"]);
    expect(ranked.map((participant) => participant.completionDurationMs)).toEqual([
      10 * 60 * 1000,
      65 * 60 * 1000,
    ]);
  });

  it("ranks in-progress participants by score then timestamp", () => {
    const ranked = rankParticipants([
      {
        id: "two-late",
        displayName: "Two Late",
        score: 2,
        targetTotal: 5,
        createdAt: "2026-05-12T09:00:00Z",
        lastClaimAt: "2026-05-12T09:08:00Z",
        completionAt: null,
      },
      {
        id: "one",
        displayName: "One",
        score: 1,
        targetTotal: 5,
        createdAt: "2026-05-12T09:00:00Z",
        lastClaimAt: "2026-05-12T09:02:00Z",
        completionAt: null,
      },
      {
        id: "two-early",
        displayName: "Two Early",
        score: 2,
        targetTotal: 5,
        createdAt: "2026-05-12T09:00:00Z",
        lastClaimAt: "2026-05-12T09:04:00Z",
        completionAt: null,
      },
    ]);

    expect(ranked.map((participant) => participant.id)).toEqual([
      "two-early",
      "two-late",
      "one",
    ]);
  });
});

describe("formatDuration", () => {
  it("formats finish durations for leaderboard display", () => {
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(8 * 60_000 + 12_000)).toBe("8m 12s");
    expect(formatDuration(2 * 3_600_000 + 5 * 60_000 + 3_000)).toBe("2h 5m 3s");
  });
});

describe("getMilestones", () => {
  it("unlocks milestone badges at 25, 50, 75, and 100 percent", () => {
    expect(getMilestones(3, 8).map((milestone) => milestone.unlocked)).toEqual([
      true,
      false,
      false,
      false,
    ]);

    expect(getMilestones(8, 8).map((milestone) => milestone.unlocked)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
