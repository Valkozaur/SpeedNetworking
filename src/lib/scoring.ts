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
  completionDurationMs: number | null;
};

function timeValue(value: Date | string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(value).getTime();
}

function durationValue(participant: LeaderboardInput) {
  if (!participant.completionAt) {
    return null;
  }

  const durationMs = timeValue(participant.completionAt) - timeValue(participant.createdAt);

  return Number.isFinite(durationMs) ? Math.max(0, durationMs) : null;
}

export function rankParticipants(
  participants: LeaderboardInput[],
): RankedParticipant[] {
  const ranked = participants
    .map((participant) => {
      const isComplete =
        participant.targetTotal > 0 &&
        participant.score >= participant.targetTotal &&
        Boolean(participant.completionAt);

      return {
        ...participant,
        isComplete,
        completionDurationMs: isComplete ? durationValue(participant) : null,
      };
    })
    .sort((left, right) => {
      if (left.isComplete && right.isComplete) {
        const durationDelta =
          (left.completionDurationMs ?? Number.POSITIVE_INFINITY) -
          (right.completionDurationMs ?? Number.POSITIVE_INFINITY);

        if (durationDelta !== 0) {
          return durationDelta;
        }

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

export function formatDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "Not finished";
  }

  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function formatCompletionTime(value: Date | string | null) {
  if (!value) {
    return "No final submission";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
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
