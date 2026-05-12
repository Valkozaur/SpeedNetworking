"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createRoom,
  joinParticipant,
  reviewCategoryClaim,
  updateRoomCustomization,
  type ClaimStatus,
} from "@/lib/rooms";

export type ActionState = {
  error?: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function createRoomAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination = "";

  try {
    const room = await createRoom(formData);
    destination = `/admin/${room.roomId}?token=${encodeURIComponent(room.adminToken)}`;
  } catch (error) {
    return {
      error: errorMessage(error),
    };
  }

  redirect(destination);
}

export async function joinParticipantAction(
  joinCode: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination = "";

  try {
    const result = await joinParticipant(joinCode, formData);
    const cookieStore = await cookies();

    cookieStore.set(`sn_participant_${result.room.id}`, result.participantToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
    });

    destination = `/r/${result.room.joinCode}`;
  } catch (error) {
    return {
      error: errorMessage(error),
    };
  }

  redirect(destination);
}

export async function updateRoomCustomizationAction(
  roomId: string,
  adminToken: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const room = await updateRoomCustomization(roomId, adminToken, formData);

    revalidatePath(`/admin/${room.id}`);
    revalidatePath(`/r/${room.joinCode}`);
  } catch (error) {
    return {
      error: errorMessage(error),
    };
  }

  return {};
}

export async function reviewCategoryClaimAction(
  roomId: string,
  adminToken: string,
  claimId: string,
  status: ClaimStatus,
  formData: FormData,
) {
  const noteValue = formData.get("adminNote");
  const adminNote = typeof noteValue === "string" ? noteValue : "";

  await reviewCategoryClaim(roomId, adminToken, claimId, status, adminNote);
  revalidatePath(`/admin/${roomId}`);
}
