import type { PoolClient } from "pg";

import {
  cleanRoomText,
  getThemeById,
  getThemePreset,
  sanitizeAccentColor,
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
  createdAt: Date;
};

export type Target = {
  id: string;
  roomId: string;
  name: string;
  jobPosition: string;
  scannerToken: string;
  fallbackCode: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
};

export type Category = {
  id: string;
  roomId: string;
  title: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
};

export type ClaimStatus = "pending" | "approved" | "rejected";

export type CategoryClaim = {
  id: string;
  roomId: string;
  categoryId: string;
  participantId: string;
  targetId: string;
  status: ClaimStatus;
  adminNote: string;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type CategoryProgress = Category & {
  claim: (CategoryClaim & { targetName: string }) | null;
};

export type ClaimReview = CategoryClaim & {
  categoryTitle: string;
  participantName: string;
  targetName: string;
};

export type Participant = {
  id: string;
  roomId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  jobPosition: string;
  participantToken: string;
  fallbackCode: string;
  targetId: string | null;
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
  created_at: Date;
};

type TargetRow = {
  id: string;
  room_id: string;
  name: string;
  job_position: string;
  scanner_token: string;
  fallback_code: string;
  sort_order: number;
  active: boolean;
  created_at: Date;
};

type CategoryRow = {
  id: string;
  room_id: string;
  title: string;
  sort_order: number;
  active: boolean;
  created_at: Date;
};

type CategoryClaimRow = {
  id: string;
  room_id: string;
  category_id: string;
  participant_id: string;
  target_id: string;
  status: ClaimStatus;
  admin_note: string;
  reviewed_at: Date | null;
  created_at: Date;
};

type ParticipantRow = {
  id: string;
  room_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  job_position: string;
  participant_token: string;
  fallback_code: string;
  target_id: string | null;
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
  };
}

function toTarget(row: TargetRow): Target {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    jobPosition: row.job_position,
    scannerToken: row.scanner_token,
    fallbackCode: row.fallback_code,
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: row.created_at,
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    roomId: row.room_id,
    title: row.title,
    sortOrder: row.sort_order,
    active: row.active,
    createdAt: row.created_at,
  };
}

function toCategoryClaim(row: CategoryClaimRow): CategoryClaim {
  return {
    id: row.id,
    roomId: row.room_id,
    categoryId: row.category_id,
    participantId: row.participant_id,
    targetId: row.target_id,
    status: row.status,
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    jobPosition: row.job_position,
    participantToken: row.participant_token,
    fallbackCode: row.fallback_code,
    targetId: row.target_id,
    createdAt: row.created_at,
  };
}

function normalizeNameForMatch(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function cleanProfileText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, maxLength)
    : "";
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

async function insertRoomCategories(
  client: PoolClient,
  roomId: string,
  categoryTitles: string[],
) {
  for (const [index, title] of categoryTitles.entries()) {
    await client.query(
      `
        INSERT INTO categories (id, room_id, title, sort_order)
        VALUES ($1, $2, $3, $4)
      `,
      [makeToken("category", 10), roomId, title, index + 1],
    );
  }
}

async function syncRoomCategories(
  client: PoolClient,
  roomId: string,
  categoryTitles: string[],
) {
  const existingResult = await client.query<CategoryRow>(
    `
      SELECT *
      FROM categories
      WHERE room_id = $1
      ORDER BY sort_order ASC, title ASC
    `,
    [roomId],
  );

  for (const [index, title] of categoryTitles.entries()) {
    const existing = existingResult.rows[index];

    if (existing) {
      await client.query(
        `
          UPDATE categories
          SET title = $3, sort_order = $4, active = true
          WHERE id = $1 AND room_id = $2
        `,
        [existing.id, roomId, title, index + 1],
      );
      continue;
    }

    await client.query(
      `
        INSERT INTO categories (id, room_id, title, sort_order)
        VALUES ($1, $2, $3, $4)
      `,
      [makeToken("category", 10), roomId, title, index + 1],
    );
  }

  for (const existing of existingResult.rows.slice(categoryTitles.length)) {
    await client.query(
      `
        UPDATE categories
        SET active = false
        WHERE id = $1 AND room_id = $2
      `,
      [existing.id, roomId],
    );
  }
}

async function findOrCreateTargetForName(
  client: PoolClient,
  roomId: string,
  displayName: string,
  normalizedName: string,
  jobPosition = "",
) {
  const matchedTargetResult = await client.query<TargetRow>(
    `
      SELECT *
      FROM targets
      WHERE room_id = $1
        AND active = true
        AND lower(regexp_replace(trim(name), '\\s+', ' ', 'g')) = $2
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 1
    `,
    [roomId, normalizedName],
  );
  const matchedTarget = matchedTargetResult.rows[0];

  if (matchedTarget) {
    if (jobPosition && matchedTarget.job_position !== jobPosition) {
      const updatedTargetResult = await client.query<TargetRow>(
        `
          UPDATE targets
          SET job_position = $3
          WHERE id = $1 AND room_id = $2
          RETURNING *
        `,
        [matchedTarget.id, roomId, jobPosition],
      );

      return updatedTargetResult.rows[0];
    }

    return matchedTarget;
  }

  const orderResult = await client.query<{ sort_order: number }>(
    `
      SELECT coalesce(max(sort_order), 0)::int + 1 AS sort_order
      FROM targets
      WHERE room_id = $1
    `,
    [roomId],
  );
  const createdTargetResult = await client.query<TargetRow>(
    `
      INSERT INTO targets (id, room_id, name, job_position, scanner_token, fallback_code, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      makeToken("target_id", 10),
      roomId,
      displayName,
      jobPosition,
      makeToken("target"),
      makeShortCode(),
      orderResult.rows[0]?.sort_order ?? 1,
    ],
  );

  return createdTargetResult.rows[0];
}

export async function createRoom(formData: FormData) {
  const titleValue = formData.get("title");
  const title =
    typeof titleValue === "string" && titleValue.trim()
      ? titleValue.trim()
      : "Speed Networking";
  const targetNames = parseBulkList(formData.get("targets")).slice(0, 300);
  const categoryTitles = parseBulkList(formData.get("categories")).slice(0, 30);
  const questions = parseQuestions(formData.get("questions"));
  const customization = roomCustomizationFromForm(formData);

  if (categoryTitles.length === 0) {
    throw new Error("Add at least one category.");
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
          accent_color
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
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
      ],
    );

    await insertRoomCategories(client, roomId, categoryTitles);

    if (targetNames.length > 0) {
      await insertRoomTargets(client, roomId, targetNames);
    }
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
  const categoryTitles = parseBulkList(formData.get("categories")).slice(0, 30);
  const questions = parseQuestions(formData.get("questions"));
  const customization = roomCustomizationFromForm(formData);

  if (categoryTitles.length === 0) {
    throw new Error("Add at least one category.");
  }

  return transaction(async (client) => {
    const result = await client.query<RoomRow>(
      `
        UPDATE rooms
        SET
          title = $3,
          questions = $4::jsonb,
          subtitle = $5,
          host_name = $6,
          theme_preset = $7,
          accent_color = $8
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
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Room not found or admin link is invalid.");
    }

    await syncRoomCategories(client, roomId, categoryTitles);

    return toRoom(row);
  });
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
  const categoryResult = await query<CategoryRow>(
    `
      SELECT *
      FROM categories
      WHERE room_id = $1 AND active = true
      ORDER BY sort_order ASC, title ASC
    `,
    [roomRow.id],
  );

  return {
    room: toRoom(roomRow),
    targets: targetResult.rows.map(toTarget),
    categories: categoryResult.rows.map(toCategory),
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

  const [
    targetResult,
    categoryResult,
    participantCountResult,
    claimCountResult,
    leaderboard,
    approvedLeaderboard,
    claimResult,
  ] =
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
      query<CategoryRow>(
        `
          SELECT *
          FROM categories
          WHERE room_id = $1
          ORDER BY active DESC, sort_order ASC, title ASC
        `,
        [roomId],
      ),
      query<{ count: number }>(
        `SELECT count(*)::int AS count FROM participants WHERE room_id = $1`,
        [roomId],
      ),
      query<{ count: number }>(
        `SELECT count(*)::int AS count FROM category_claims WHERE room_id = $1`,
        [roomId],
      ),
      getLeaderboard(roomId),
      getLeaderboard(roomId, { approvedOnly: true }),
      query<
        CategoryClaimRow & {
          category_title: string;
          participant_name: string;
          target_name: string;
        }
      >(
        `
          SELECT
            category_claims.*,
            categories.title AS category_title,
            participants.display_name AS participant_name,
            targets.name AS target_name
          FROM category_claims
          JOIN categories ON categories.id = category_claims.category_id
          JOIN participants ON participants.id = category_claims.participant_id
          JOIN targets ON targets.id = category_claims.target_id
          WHERE category_claims.room_id = $1
          ORDER BY category_claims.created_at DESC
          LIMIT 200
        `,
        [roomId],
      ),
    ]);

  return {
    room: toRoom(roomRow),
    targets: targetResult.rows.map(toTarget),
    categories: categoryResult.rows.map(toCategory),
    claims: claimResult.rows.map((row) => ({
      ...toCategoryClaim(row),
      categoryTitle: row.category_title,
      participantName: row.participant_name,
      targetName: row.target_name,
    })),
    leaderboard,
    approvedLeaderboard,
    stats: {
      participantCount: participantCountResult.rows[0]?.count ?? 0,
      claimCount: claimCountResult.rows[0]?.count ?? 0,
    },
  };
}

export async function joinParticipant(joinCode: string, formData: FormData) {
  const firstName = cleanProfileText(formData.get("firstName"), 60);
  const lastName = cleanProfileText(formData.get("lastName"), 60);
  const jobPosition = cleanProfileText(formData.get("jobPosition"), 100);
  const displayNameFallback = cleanProfileText(formData.get("displayName"), 140);
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : displayNameFallback;

  if (!firstName || !lastName) {
    throw new Error("Enter your first and last name to join the game.");
  }

  if (!jobPosition) {
    throw new Error("Enter your job position to join the game.");
  }

  const publicRoom = await getPublicRoom(joinCode);

  if (!publicRoom) {
    throw new Error("Room not found.");
  }

  const participant = await transaction(async (client) => {
    const normalizedName = normalizeNameForMatch(displayName);
    const existingParticipantResult = await client.query<ParticipantRow>(
      `
        SELECT *
        FROM participants
        WHERE room_id = $1
          AND lower(regexp_replace(trim(display_name), '\\s+', ' ', 'g')) = $2
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [publicRoom.room.id, normalizedName],
    );
    const existingParticipant = existingParticipantResult.rows[0];

    if (existingParticipant) {
      if (existingParticipant.target_id) {
        await client.query(
          `
            UPDATE targets
            SET job_position = $3
            WHERE id = $1 AND room_id = $2
          `,
          [existingParticipant.target_id, publicRoom.room.id, jobPosition],
        );
        const updatedParticipantResult = await client.query<ParticipantRow>(
          `
            UPDATE participants
            SET first_name = $3,
                last_name = $4,
                job_position = $5,
                display_name = $6
            WHERE id = $1 AND room_id = $2
            RETURNING *
          `,
          [
            existingParticipant.id,
            publicRoom.room.id,
            firstName,
            lastName,
            jobPosition,
            displayName,
          ],
        );

        return toParticipant(updatedParticipantResult.rows[0]);
      }

      const targetRow = await findOrCreateTargetForName(
        client,
        publicRoom.room.id,
        displayName,
        normalizedName,
        jobPosition,
      );
      const linkedParticipantResult = await client.query<ParticipantRow>(
        `
          UPDATE participants
          SET target_id = $3,
              first_name = $4,
              last_name = $5,
              job_position = $6,
              display_name = $7
          WHERE id = $1 AND room_id = $2
          RETURNING *
        `,
        [
          existingParticipant.id,
          publicRoom.room.id,
          targetRow.id,
          firstName,
          lastName,
          jobPosition,
          displayName,
        ],
      );

      return toParticipant(linkedParticipantResult.rows[0]);
    }

    const targetRow = await findOrCreateTargetForName(
      client,
      publicRoom.room.id,
      displayName,
      normalizedName,
      jobPosition,
    );
    const linkedParticipantResult = await client.query<ParticipantRow>(
      `
        SELECT *
        FROM participants
        WHERE target_id = $1
        LIMIT 1
      `,
      [targetRow.id],
    );
    const linkedParticipant = linkedParticipantResult.rows[0];

    if (linkedParticipant) {
      const updatedParticipantResult = await client.query<ParticipantRow>(
        `
          UPDATE participants
          SET first_name = $3,
              last_name = $4,
              job_position = $5,
              display_name = $6
          WHERE id = $1 AND room_id = $2
          RETURNING *
        `,
        [
          linkedParticipant.id,
          publicRoom.room.id,
          firstName,
          lastName,
          jobPosition,
          displayName,
        ],
      );

      return toParticipant(updatedParticipantResult.rows[0]);
    }

    const participantId = makeToken("participant_id", 10);
    const participantToken = makeToken("participant");
    const fallbackCode = makeShortCode();
    const participantResult = await client.query<ParticipantRow>(
      `
        INSERT INTO participants (
          id,
          room_id,
          display_name,
          first_name,
          last_name,
          job_position,
          participant_token,
          fallback_code,
          target_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        participantId,
        publicRoom.room.id,
        displayName,
        firstName,
        lastName,
        jobPosition,
        participantToken,
        fallbackCode,
        targetRow.id,
      ],
    );

    return toParticipant(participantResult.rows[0]);
  });

  return {
    room: publicRoom.room,
    participantToken: participant.participantToken,
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

  const categoryResult = await query<
    CategoryRow & {
      claim_id: string | null;
      claim_room_id: string | null;
      claim_category_id: string | null;
      claim_participant_id: string | null;
      claim_target_id: string | null;
      claim_status: ClaimStatus | null;
      claim_admin_note: string | null;
      claim_reviewed_at: Date | null;
      claim_created_at: Date | null;
      claim_target_name: string | null;
    }
  >(
    `
      SELECT
        categories.*,
        latest_claim.id AS claim_id,
        latest_claim.room_id AS claim_room_id,
        latest_claim.category_id AS claim_category_id,
        latest_claim.participant_id AS claim_participant_id,
        latest_claim.target_id AS claim_target_id,
        latest_claim.status AS claim_status,
        latest_claim.admin_note AS claim_admin_note,
        latest_claim.reviewed_at AS claim_reviewed_at,
        latest_claim.created_at AS claim_created_at,
        latest_target.name AS claim_target_name
      FROM categories
      LEFT JOIN LATERAL (
        SELECT *
        FROM category_claims
        WHERE category_claims.category_id = categories.id
          AND category_claims.participant_id = $2
        ORDER BY category_claims.created_at DESC
        LIMIT 1
      ) latest_claim ON true
      LEFT JOIN targets latest_target ON latest_target.id = latest_claim.target_id
      WHERE categories.room_id = $1 AND categories.active = true
      ORDER BY categories.sort_order ASC, categories.title ASC
    `,
    [publicRoom.room.id, participantRow.id],
  );
  const targetResult = participantRow.target_id
    ? await query<TargetRow>(
        `
          SELECT *
          FROM targets
          WHERE id = $1 AND room_id = $2 AND active = true
          LIMIT 1
        `,
        [participantRow.target_id, publicRoom.room.id],
      )
    : null;
  const leaderboard = await getLeaderboard(publicRoom.room.id);
  const participant = toParticipant(participantRow);

  return {
    room: publicRoom.room,
    participant,
    target: targetResult?.rows[0] ? toTarget(targetResult.rows[0]) : null,
    categories: categoryResult.rows.map((row): CategoryProgress => ({
      ...toCategory(row),
      claim: row.claim_id
        ? {
            id: row.claim_id,
            roomId: row.claim_room_id ?? row.room_id,
            categoryId: row.claim_category_id ?? row.id,
            participantId: row.claim_participant_id ?? participantRow.id,
            targetId: row.claim_target_id ?? "",
            status: row.claim_status ?? "pending",
            adminNote: row.claim_admin_note ?? "",
            reviewedAt: row.claim_reviewed_at,
            createdAt: row.claim_created_at ?? new Date(),
            targetName: row.claim_target_name ?? "Unknown",
          }
        : null,
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
        rooms.accent_color AS room_accent_color
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

async function readScanContext(
  client: PoolClient,
  participantToken: string,
  scanValue: string,
  lockParticipant = false,
) {
  const credential = extractTargetCredential(scanValue);

  if (!credential) {
    throw new Error("Scan a person QR code or enter their fallback code.");
  }

  const participantResult = await client.query<ParticipantRow>(
    `
      SELECT *
      FROM participants
      WHERE participant_token = $1
      LIMIT 1
      ${lockParticipant ? "FOR UPDATE" : ""}
    `,
    [participantToken],
  );
  const participantRow = participantResult.rows[0];

  if (!participantRow) {
    throw new Error("Participant session is invalid.");
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
    throw new Error("That QR code is not active in this room.");
  }

  if (participantRow.target_id === targetRow.id) {
    throw new Error("You cannot use your own QR for a category.");
  }

  return {
    participantRow,
    targetRow,
  };
}

async function getOpenCategories(client: PoolClient, roomId: string, participantId: string) {
  const result = await client.query<CategoryRow>(
    `
      SELECT categories.*
      FROM categories
      WHERE categories.room_id = $1
        AND categories.active = true
        AND NOT EXISTS (
          SELECT 1
          FROM category_claims
          WHERE category_claims.category_id = categories.id
            AND category_claims.participant_id = $2
            AND category_claims.status <> 'rejected'
        )
      ORDER BY categories.sort_order ASC, categories.title ASC
    `,
    [roomId, participantId],
  );

  return result.rows.map(toCategory);
}

async function getUsedTargetClaim(
  client: PoolClient,
  participantId: string,
  targetId: string,
) {
  const result = await client.query<
    CategoryClaimRow & {
      category_title: string;
    }
  >(
    `
      SELECT category_claims.*, categories.title AS category_title
      FROM category_claims
      JOIN categories ON categories.id = category_claims.category_id
      WHERE category_claims.participant_id = $1
        AND category_claims.target_id = $2
        AND category_claims.status <> 'rejected'
      ORDER BY category_claims.created_at DESC
      LIMIT 1
    `,
    [participantId, targetId],
  );

  return result.rows[0] ?? null;
}

export async function resolveCategoryScan(
  participantToken: string,
  scanValue: string,
) {
  return transaction(async (client) => {
    const { participantRow, targetRow } = await readScanContext(
      client,
      participantToken,
      scanValue,
    );
    const usedTargetClaim = await getUsedTargetClaim(client, participantRow.id, targetRow.id);

    if (usedTargetClaim) {
      throw new Error(
        `${targetRow.name} is already used for "${usedTargetClaim.category_title}".`,
      );
    }

    const categories = await getOpenCategories(client, participantRow.room_id, participantRow.id);

    if (categories.length === 0) {
      throw new Error("All categories are already submitted.");
    }

    return {
      participant: toParticipant(participantRow),
      target: toTarget(targetRow),
      categories,
    };
  });
}

export async function submitCategoryClaim(
  participantToken: string,
  scanValue: string,
  categoryId: string,
) {
  if (!categoryId) {
    throw new Error("Choose a category for this conversation.");
  }

  return transaction(async (client) => {
    const { participantRow, targetRow } = await readScanContext(
      client,
      participantToken,
      scanValue,
      true,
    );
    const usedTargetClaim = await getUsedTargetClaim(client, participantRow.id, targetRow.id);

    if (usedTargetClaim) {
      throw new Error(
        `${targetRow.name} is already used for "${usedTargetClaim.category_title}".`,
      );
    }

    const categoryResult = await client.query<CategoryRow>(
      `
        SELECT *
        FROM categories
        WHERE id = $1 AND room_id = $2 AND active = true
        LIMIT 1
      `,
      [categoryId, participantRow.room_id],
    );
    const categoryRow = categoryResult.rows[0];

    if (!categoryRow) {
      throw new Error("That category is not active in this room.");
    }

    const existingCategoryClaim = await client.query<CategoryClaimRow>(
      `
        SELECT *
        FROM category_claims
        WHERE participant_id = $1
          AND category_id = $2
          AND status <> 'rejected'
        LIMIT 1
      `,
      [participantRow.id, categoryRow.id],
    );

    if (existingCategoryClaim.rows[0]) {
      throw new Error("That category is already submitted.");
    }

    const claimResult = await client.query<CategoryClaimRow>(
      `
        INSERT INTO category_claims (
          id,
          room_id,
          category_id,
          participant_id,
          target_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        makeToken("category_claim", 10),
        participantRow.room_id,
        categoryRow.id,
        participantRow.id,
        targetRow.id,
      ],
    );
    const scoreResult = await client.query<{ score: number; total: number }>(
      `
        SELECT
          (
            SELECT count(*)::int
            FROM category_claims
            JOIN categories ON categories.id = category_claims.category_id
            WHERE category_claims.participant_id = $1
              AND category_claims.status <> 'rejected'
              AND categories.active = true
          ) AS score,
          (
            SELECT count(*)::int
            FROM categories
            WHERE room_id = $2 AND active = true
          ) AS total
      `,
      [participantRow.id, participantRow.room_id],
    );

    return {
      claim: toCategoryClaim(claimResult.rows[0]),
      participant: toParticipant(participantRow),
      target: toTarget(targetRow),
      category: toCategory(categoryRow),
      score: scoreResult.rows[0]?.score ?? 0,
      total: scoreResult.rows[0]?.total ?? 0,
    };
  });
}

export async function reviewCategoryClaim(
  roomId: string,
  adminToken: string,
  claimId: string,
  status: ClaimStatus,
  adminNote = "",
) {
  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    throw new Error("Invalid review status.");
  }

  const note = adminNote.trim().slice(0, 240);
  const result = await query<CategoryClaimRow>(
    `
      UPDATE category_claims
      SET status = $4,
          admin_note = $5,
          reviewed_at = CASE WHEN $4 = 'pending' THEN NULL ELSE now() END
      FROM rooms
      WHERE category_claims.id = $3
        AND category_claims.room_id = $1
        AND rooms.id = category_claims.room_id
        AND rooms.admin_token = $2
      RETURNING category_claims.*
    `,
    [roomId, adminToken, claimId, status, note],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Claim not found or admin link is invalid.");
  }

  return toCategoryClaim(row);
}

export async function getLeaderboard(
  roomId: string,
  options: { approvedOnly?: boolean } = {},
): Promise<RankedParticipant[]> {
  const statusFilter = options.approvedOnly
    ? "AND category_claims.status = 'approved'"
    : "AND category_claims.status <> 'rejected'";
  const result = await query<LeaderboardRow>(
    `
      WITH active_category_count AS (
        SELECT count(*)::int AS total
        FROM categories
        WHERE room_id = $1 AND active = true
      )
      SELECT
        participants.id,
        participants.display_name,
        participants.created_at,
        count(categories.id)::int AS score,
        active_category_count.total AS target_total,
        max(category_claims.created_at) FILTER (WHERE categories.id IS NOT NULL) AS last_claim_at,
        CASE
          WHEN active_category_count.total > 0
           AND count(categories.id)::int >= active_category_count.total
          THEN max(category_claims.created_at) FILTER (WHERE categories.id IS NOT NULL)
          ELSE NULL
        END AS completion_at
      FROM participants
      CROSS JOIN active_category_count
      LEFT JOIN category_claims
        ON category_claims.participant_id = participants.id
       ${statusFilter}
      LEFT JOIN categories
        ON categories.id = category_claims.category_id
       AND categories.active = true
      WHERE participants.room_id = $1
      GROUP BY
        participants.id,
        participants.display_name,
        participants.created_at,
        active_category_count.total
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
