import { NextResponse } from "next/server";

import { resolveCategoryScan, submitCategoryClaim } from "@/lib/rooms";

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
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";

    if (!categoryId) {
      const preview = await resolveCategoryScan(participantToken, scan);

      return NextResponse.json({
        mode: "category-selection",
        targetName: preview.target.name,
        targetJobPosition: preview.target.jobPosition,
        targetFallbackCode: preview.target.fallbackCode,
        categories: preview.categories.map((category) => ({
          id: category.id,
          title: category.title,
        })),
      });
    }

    const claim = await submitCategoryClaim(participantToken, scan, categoryId);

    return NextResponse.json({
      mode: "submitted",
      participantName: claim.participant.displayName,
      targetName: claim.target.name,
      targetJobPosition: claim.target.jobPosition,
      categoryTitle: claim.category.title,
      status: claim.claim.status,
      score: claim.score,
      targetTotal: claim.total,
      claimedAt: claim.claim.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not submit category.",
      },
      {
        status: 400,
      },
    );
  }
}
