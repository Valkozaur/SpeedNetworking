import { NextResponse } from "next/server";

import { claimTargetForParticipant } from "@/lib/rooms";

export const runtime = "nodejs";

type ClaimRouteProps = {
  params: Promise<{
    participantToken: string;
  }>;
};

export async function POST(request: Request, { params }: ClaimRouteProps) {
  const { participantToken } = await params;

  try {
    const body = await request.json();
    const scan = typeof body.scan === "string" ? body.scan : "";
    const claim = await claimTargetForParticipant(participantToken, scan);

    return NextResponse.json({
      duplicate: claim.duplicate,
      participantName: claim.participant.displayName,
      targetName: claim.target.name,
      score: claim.score,
      targetTotal: claim.targetTotal,
      claimedAt: claim.claimedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not stamp target.",
      },
      {
        status: 400,
      },
    );
  }
}
