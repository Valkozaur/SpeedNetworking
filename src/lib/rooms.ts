import type { PoolClient } from "pg";

import {
  cleanRoomText,
  getBackgroundOverlay,
  getThemeById,
  getThemePreset,
  sanitizeAccentColor,
  sanitizeBackgroundImageUrl,
} from "@/lib/customization";
import { query, transaction } from "@/lib/db";
import { rankParticipants, type RankedParticipant } from "@/lib/scoring";
import {
  extractTargetCredential,
  makeJoinCode,
  makeShortCode,
  makeToken,
  parseBulkList,
  parseQuestions,
} from "@/lib/tokens";

export type Room = {
  id: string;
  title: string;
  joinCode: string;
  adminToken: string;
  questions: string[];
  subtitle: string;
  hostName: string;
  themePreset: string;
  accentColor: string;
  backgroundImageUrl: string;
  backgroundOverlay: string;
  createdAt: Date;
};

export type Target = {
  id: string;
  roomId: string;
  name: string;
  scannerToken: string;
  fallbackCode: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
};

export type Participant = {
  id: string;
  roomId: string;
  displayName: string;
  participantToken: string;
  fallbackCode: string;
  createdAt: Date;
};

export type ClaimedTarget = Target & {
  claimedAt: Date | null;
};

type RoomRow = {
  id: string;
  title: string;
  join_code: string;
  admin_token: string;
  questions: string[];
  subtitle: string;
  host_name: string;
  theme_preset: string;
  accent_color: string;
  background_image_url: string;
  background_overlay: string;
  created_at: Date;
};

type TargetRow = {
  id: string;
  room_id: string;
  name: string;
  scanner_token: string;
  fallback_code: string;
  sort_order: number;
  active: boolean;
  created_at: Date;
};

type ParticipantRow = {
  id: string;
  room_id: string;
  display_name: string;
  participant_token: string;
  fallback_code: string;
  created_at: Date;
};

type LeaderboardRow = {
  id: string;
  display_name: string;
  created_at: Date;
  score: number;
  target_total: number;
  last_claim_at: Date | null;
  completion_at: Date | null;
};

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    title: row.title,
    joinCode: row.join_code,
    adminToken: row.admin_token,
    questions: row.questions,
    subtitle: row.subtitle,
    hostName: row.host_name,
    themePreset: row.theme_preset,
    accentColor: row.accent_color,
    backgroundImageUrl: row.background_image_url,
    backgroundOverlay: row.background_overlay,
    createdAt: row.created_at,
  };
}

function roomCustomizationFromForm(formData: FormData) {
  const themePreset = getThemePreset(formData.get("themePreset"));
  const theme = getThemeById(themePreset);

  return {
    subtitle: cleanRoomText(formData.get("subtitle"), 180),
    hostName: cleanRoomText(formData.get("hostName"), 80),
    themePreset,
    accentColor: sanitizeAccentColor(formData.get("accentColor"), theme.accent),
    backgroundImageUrl: sanitizeBackgroundImageUrl(formData.get("backgroundImageUrl")),
    backgroundOverlay: getBackgroundOverlay(formData.get("backgroundOverlay")),
  };
}

function toTarget(row: TargetRow): Target {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    scannerToken: row.scanner_token,
    fallbackCode: row.fallback_code,
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: row.created_at,
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    participantToken: row.participant_token,
    fallbackCode: row.fallback_code,
    createdAt: row.created_at,
  };
}

async function insertRoomTargets(
  client: PoolClient,
  roomId: string,
  targetNames: string[],
) {
  for (const [index, name] of targetNames.entries()) {
    await client.query(
      `
        INSERT INTO targets (id, room_id, name, scanner_token, fallback_code, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        makeToken("target_id", 10),
        roomId,
        name,
        makeToken("target"),
        makeShortCode(),
        index + 1,
      ],
    );
  }
}

export async function createRoom(formData: FormData) {
  const titleValue = formData.get("title");
  const title =
    typeof titleValue === "string" && titleValue.trim()
      ? titleValue.trim()
      : "Speed Networking";
  const targetNames = parseBulkList(formData.get("targets")).slice(0, 200);
  const questions = parseQuestions(formData.get("questions"));
  const customization = roomCustomizationFromForm(formData);

  if (targetNames.length === 0) {
    throw new Error("Add at least one target person.");
  }

  const roomId = makeToken("room", 10);
  const adminToken = makeToken("admin");
  const joinCode = makeJoinCode();

  await transaction(async (client) => {
    await client.query(
      `
        INSERT INTO rooms (
          id,
          title,
          join_code,
          admin_token,
          questions,
          subtitle,
          host_name,
          theme_preset,
          accent_color,
          background_image_url,
          background_overlay
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11)
      `,
      [
        roomId,
        title,
        joinCode,
        adminToken,
        JSON.stringify(questions),
        customization.subtitle,
        customization.hostName,
        customization.themePreset,
        customization.accentColor,
        customization.backgroundImageUrl,
        customization.backgroundOverlay,
      ],
    );

    await insertRoomTargets(client, roomId, targetNames);
  });

  return {
    roomId,
    adminToken,
    joinCode,
  };
}

export async function updateRoomCustomization(
  roomId: string,
  adminToken: string,
  formData: FormData,
) {
  const titleValue = formData.get("title");
  const title =
    typeof titleValue === "string" && titleValue.trim()
      ? titleValue.trim().slice(0, 120)
      : "Speed Networking";
  const questions = parseQuestions(formData.get("questions"));
  const customization = roomCustomizationFromForm(formData);

  const result = await query<RoomRow>(
    `
      UPDATE rooms
      SET
        title = $3,
        questions = $4::jsonb,
        subtitle = $5,
        host_name = $6,
        theme_preset = $7,
        accent_color = $8,
        background_image_url = $9,
        background_overlay = $10
      WHERE id = $1 AND admin_token = $2
      RETURNING *
    `,
    [
      roomId,
      adminToken,
      title,
      JSON.stringify(questions),
      customization.subtitle,
      customization.hostName,
      customization.themePreset,
      customization.accentColor,
      customization.backgroundImageUrl,
      customization.backgroundOverlay,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Room not found or admin link is invalid.");
  }

  return toRoom(row);
}

export async function getPublicRoom(joinCode: string) {
  const roomResult = await query<RoomRow>(
    `SELECT * FROM rooms WHERE upper(join_code) = upper($1) LIMIT 1`,
    [joinCode],
  );
  const roomRow = roomResult.rows[0];

  if (!roomRow) {
    return null;
  }

  const targetResult = await query<TargetRow>(
    `
      SELECT *
      FROM targets
      WHERE room_id = $1 AND active = true
      ORDER BY sort_order ASC, name ASC
    `,
    [roomRow.id],
  );

  return {
    room: toRoom(roomRow),
    targets: targetResult.rows.map(toTarget),
  };
}

export async function getAdminRoom(roomId: string, token?: string) {
  if (!token) {
    return null;
  }

  const roomResult = await query<RoomRow>(
    `SELECT * FROM rooms WHERE id = $1 AND admin_token = $2 LIMIT 1`,
    [roomId, token],
  );
  const roomRow = roomResult.rows[0];

  if (!roomRow) {
    return null;
  }

  const [targetResult, participantCountResult, claimCountResult, leaderboard] =
    await Promise.all([
      query<TargetRow>(
        `
          SELECT *
          FROM targets
          WHERE room_id = $1
          ORDER BY sort_order ASC, name ASC
        `,
        [roomId],
      ),
      query<{ count: number }>(
        `SELECT count(*)::int AS count FROM participants WHERE room_id = $1`,
        [roomId],
      ),
      query<{ count: number }>(
        `SELECT count(*)::int AS count FROM claims WHERE room_id = $1`,
        [roomId],
      ),
      getLeaderboard(roomId),
    ]);

  return {
    room: toRoom(roomRow),
    targets: targetResult.rows.map(toTarget),
    leaderboard,
    stats: {
      participantCount: participantCountResult.rows[0]?.count ?? 0,
      claimCount: claimCountResult.rows[0]?.count ?? 0,
    },
  };
}

export async function joinParticipant(joinCode: string, formData: FormData) {
  const displayNameValue = formData.get("displayName");
  const displayName =
    typeof displayNameValue === "string" ? displayNameValue.trim() : "";

  if (displayName.length < 2) {
    throw new Error("Enter your name so your passport can collect stamps.");
  }

  const publicRoom = await getPublicRoom(joinCode);

  if (!publicRoom) {
    throw new Error("Room not found.");
  }

  const participantId = makeToken("participant_id", 10);
  const participantToken = makeToken("participant");
  const fallbackCode = makeShortCode();

  await query(
    `
      INSERT INTO participants (id, room_id, display_name, participant_token, fallback_code)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      participantId,
      publicRoom.room.id,
      displayName,
      participantToken,
      fallbackCode,
    ],
  );

  return {
    room: publicRoom.room,
    participantToken,
  };
}

export async function getParticipantState(
  joinCode: string,
  participantToken?: string,
) {
  if (!participantToken) {
    return null;
  }

  const publicRoom = await getPublicRoom(joinCode);

  if (!publicRoom) {
    return null;
  }

  const participantResult = await query<ParticipantRow>(
    `
      SELECT *
      FROM participants
      WHERE room_id = $1 AND participant_token = $2
      LIMIT 1
    `,
    [publicRoom.room.id, participantToken],
  );
  const participantRow = participantResult.rows[0];

  if (!participantRow) {
    return null;
  }

  const claimedTargetsResult = await query<TargetRow & { claimed_at: Date | null }>(
    `
      SELECT targets.*, claims.created_at AS claimed_at
      FROM targets
      LEFT JOIN claims
        ON claims.target_id = targets.id
       AND claims.participant_id = $2
      WHERE targets.room_id = $1 AND targets.active = true
      ORDER BY targets.sort_order ASC, targets.name ASC
    `,
    [publicRoom.room.id, participantRow.id],
  );
  const leaderboard = await getLeaderboard(publicRoom.room.id);
  const participant = toParticipant(participantRow);

  return {
    room: publicRoom.room,
    participant,
    targets: claimedTargetsResult.rows.map((row) => ({
      ...toTarget(row),
      claimedAt: row.claimed_at,
    })),
    leaderboard,
    ownRank:
      leaderboard.find((entry) => entry.id === participant.id) ?? null,
  };
}

export async function getTargetByToken(targetToken: string) {
  const result = await query<
    TargetRow & {
      room_title: string;
      room_join_code: string;
      room_questions: string[];
      room_subtitle: string;
      room_host_name: string;
      room_theme_preset: string;
      room_accent_color: string;
      room_background_image_url: string;
      room_background_overlay: string;
    }
  >(
    `
      SELECT
        targets.*,
        rooms.title AS room_title,
        rooms.join_code AS room_join_code,
        rooms.questions AS room_questions,
        rooms.subtitle AS room_subtitle,
        rooms.host_name AS room_host_name,
        rooms.theme_preset AS room_theme_preset,
        rooms.accent_color AS room_accent_color,
        rooms.background_image_url AS room_background_image_url,
        rooms.background_overlay AS room_background_overlay
      FROM targets
      JOIN rooms ON rooms.id = targets.room_id
      WHERE targets.scanner_token = $1 AND targets.active = true
      LIMIT 1
    `,
    [targetToken],
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    target: toTarget(row),
    room: {
      id: row.room_id,
      title: row.room_title,
      joinCode: row.room_join_code,
      questions: row.room_questions,
      subtitle: row.room_subtitle,
      hostName: row.room_host_name,
      themePreset: row.room_theme_preset,
      accentColor: row.room_accent_color,
      backgroundImageUrl: row.room_background_image_url,
      backgroundOverlay: row.room_background_overlay,
    },
  };
}

export async function getParticipantBadge(participantToken: string) {
  const result = await query<
    ParticipantRow & {
      room_title: string;
      room_join_code: string;
    }
  >(
    `
      SELECT
        participants.*,
        rooms.title AS room_title,
        rooms.join_code AS room_join_code
      FROM participants
      JOIN rooms ON rooms.id = participants.room_id
      WHERE participants.participant_token = $1
      LIMIT 1
    `,
    [participantToken],
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    participant: toParticipant(row),
    room: {
      title: row.room_title,
      joinCode: row.room_join_code,
    },
  };
}

export async function claimTargetForParticipant(
  participantToken: string,
  scanValue: string,
) {
  const credential = extractTargetCredential(scanValue);

  if (!credential) {
    throw new Error("Scan a target QR code or enter a target fallback code.");
  }

  return transaction(async (client) => {
    const participantResult = await client.query<ParticipantRow>(
      `
        SELECT *
        FROM participants
        WHERE participant_token = $1
        LIMIT 1
        FOR UPDATE
      `,
      [participantToken],
    );
    const participantRow = participantResult.rows[0];

    if (!participantRow) {
      throw new Error("Participant passport is invalid.");
    }

    const targetResult = await client.query<TargetRow>(
      `
        SELECT *
        FROM targets
        WHERE room_id = $1
          AND active = true
          AND (
            scanner_token = $2
            OR upper(fallback_code) = upper($2)
          )
        LIMIT 1
      `,
      [participantRow.room_id, credential],
    );
    const targetRow = targetResult.rows[0];

    if (!targetRow) {
      throw new Error("Target was not found in this room.");
    }

    const claimId = makeToken("claim", 10);
    const claimResult = await client.query<{ created_at: Date }>(
      `
        INSERT INTO claims (id, room_id, target_id, participant_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (target_id, participant_id) DO NOTHING
        RETURNING created_at
      `,
      [claimId, participantRow.room_id, targetRow.id, participantRow.id],
    );

    const duplicate = claimResult.rowCount === 0;
    const existingClaimResult = duplicate
      ? await client.query<{ created_at: Date }>(
          `
            SELECT created_at
            FROM claims
            WHERE target_id = $1 AND participant_id = $2
            LIMIT 1
          `,
          [targetRow.id, participantRow.id],
        )
      : null;

    const scoreResult = await client.query<{ score: number; target_total: number }>(
      `
        SELECT
          (
            SELECT count(*)::int
            FROM claims
            WHERE participant_id = $1
          ) AS score,
          (
            SELECT count(*)::int
            FROM targets
            WHERE room_id = $2 AND active = true
          ) AS target_total
      `,
      [participantRow.id, participantRow.room_id],
    );

    return {
      duplicate,
      claimedAt:
        claimResult.rows[0]?.created_at ??
        existingClaimResult?.rows[0]?.created_at ??
        new Date(),
      participant: toParticipant(participantRow),
      target: toTarget(targetRow),
      score: scoreResult.rows[0]?.score ?? 0,
      targetTotal: scoreResult.rows[0]?.target_total ?? 0,
    };
  });
}

export async function getLeaderboard(roomId: string): Promise<RankedParticipant[]> {
  const result = await query<LeaderboardRow>(
    `
      WITH active_target_count AS (
        SELECT count(*)::int AS total
        FROM targets
        WHERE room_id = $1 AND active = true
      )
      SELECT
        participants.id,
        participants.display_name,
        participants.created_at,
        count(claims.id)::int AS score,
        active_target_count.total AS target_total,
        max(claims.created_at) AS last_claim_at,
        CASE
          WHEN active_target_count.total > 0
           AND count(claims.id)::int >= active_target_count.total
          THEN max(claims.created_at)
          ELSE NULL
        END AS completion_at
      FROM participants
      CROSS JOIN active_target_count
      LEFT JOIN claims ON claims.participant_id = participants.id
      WHERE participants.room_id = $1
      GROUP BY
        participants.id,
        participants.display_name,
        participants.created_at,
        active_target_count.total
    `,
    [roomId],
  );

  return rankParticipants(
    result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      score: row.score,
      targetTotal: row.target_total,
      createdAt: row.created_at,
      lastClaimAt: row.last_claim_at,
      completionAt: row.completion_at,
    })),
  );
}
