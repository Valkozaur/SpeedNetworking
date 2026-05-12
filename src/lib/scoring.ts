export type LeaderboardInput = {
  id: string;
  displayName: string;
  score: number;
  targetTotal: number;
  createdAt: Date | string;
  lastClaimAt: Date | string | null;
  completionAt: Date | string | null;
};

export type RankedParticipant = LeaderboardInput & {
  rank: number;
  isComplete: boolean;
};

function timeValue(value: Date | string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(value).getTime();
}

export function rankParticipants(
  participants: LeaderboardInput[],
): RankedParticipant[] {
  const ranked = participants
    .map((participant) => ({
      ...participant,
      isComplete:
        participant.targetTotal > 0 &&
        participant.score >= participant.targetTotal &&
        Boolean(participant.completionAt),
    }))
    .sort((left, right) => {
      if (left.isComplete && right.isComplete) {
        return timeValue(left.completionAt) - timeValue(right.completionAt);
      }

      if (left.isComplete !== right.isComplete) {
        return left.isComplete ? -1 : 1;
      }

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      const progressDelta = timeValue(left.lastClaimAt) - timeValue(right.lastClaimAt);

      if (progressDelta !== 0) {
        return progressDelta;
      }

      return timeValue(left.createdAt) - timeValue(right.createdAt);
    });

  return ranked.map((participant, index) => ({
    ...participant,
    rank: index + 1,
  }));
}

export const MILESTONES = [
  { key: "25", label: "First set", threshold: 0.25 },
  { key: "50", label: "Halfway", threshold: 0.5 },
  { key: "75", label: "Almost there", threshold: 0.75 },
  { key: "100", label: "Full board", threshold: 1 },
] as const;

export function getMilestones(score: number, targetTotal: number) {
  return MILESTONES.map((milestone) => ({
    ...milestone,
    required: targetTotal > 0 ? Math.max(1, Math.ceil(targetTotal * milestone.threshold)) : 0,
    unlocked:
      targetTotal > 0 &&
      score >= Math.max(1, Math.ceil(targetTotal * milestone.threshold)),
  }));
}
