import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Printer,
  QrCode,
  Tags,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { reviewCategoryClaimAction } from "@/app/actions";
import { AdminRememberRoom } from "@/components/admin-remember-room";
import { CopyButton } from "@/components/copy-button";
import { RoomCustomizationForm } from "@/components/room-customization-form";
import { absoluteUrl } from "@/lib/app-url";
import { roomThemeStyle } from "@/lib/customization";
import { getAdminRoom, type ClaimStatus } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminPageProps = {
  params: Promise<{
    roomId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

function statusBadge(status: ClaimStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusIcon(status: ClaimStatus) {
  if (status === "approved") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "rejected") {
    return <XCircle className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

export default async function AdminRoomPage({ params, searchParams }: AdminPageProps) {
  const { roomId } = await params;
  const { token } = await searchParams;
  const data = await getAdminRoom(roomId, token);

  if (!data) {
    notFound();
  }

  const joinUrl = absoluteUrl(`/r/${data.room.joinCode}`);
  const badgeUrl = absoluteUrl(
    `/admin/${data.room.id}/badges?token=${encodeURIComponent(data.room.adminToken)}`,
  );
  const topFive = data.leaderboard.slice(0, 5);
  const approvedTopFive = data.approvedLeaderboard.slice(0, 5);
  const validatedWinner = data.approvedLeaderboard.find((entry) => entry.isComplete);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-950"
      style={roomThemeStyle(data.room)}
    >
      <AdminRememberRoom
        room={{
          id: data.room.id,
          title: data.room.title,
          joinCode: data.room.joinCode,
          adminToken: data.room.adminToken,
          accentColor: data.room.accentColor,
        }}
      />
      <div
        className="mx-auto grid min-w-0 max-w-6xl gap-5"
        style={{ width: "min(100%, calc(100vw - 2rem))" }}
      >
        <header className="grid gap-4 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                Admin dashboard
              </p>
              <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {data.room.title}
              </h1>
              <p className="mt-2 text-base text-slate-600">
                Join code <span className="font-bold text-slate-950">{data.room.joinCode}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={joinUrl} label="Copy join link" />
              <Link
                href="/admin"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <Database className="h-4 w-4" />
                My rooms
              </Link>
              <Link
                href={`/admin/${data.room.id}/badges?token=${encodeURIComponent(data.room.adminToken)}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Printer className="h-4 w-4" />
                People QR sheets
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric icon={<Users className="h-5 w-5" />} label="Participants" value={data.stats.participantCount} />
            <Metric icon={<QrCode className="h-5 w-5" />} label="People QR" value={data.targets.length} />
            <Metric icon={<Tags className="h-5 w-5" />} label="Categories" value={data.categories.filter((category) => category.active).length} />
            <Metric icon={<BarChart3 className="h-5 w-5" />} label="Claims" value={data.stats.claimCount} />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Live dashboard</h2>
                  <p className="mt-1 text-sm text-slate-500">Provisional ranking by submitted categories.</p>
                </div>
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>

              <div className="mt-4 grid gap-2">
                {topFive.length > 0 ? (
                  topFive.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-md bg-white text-sm font-black text-slate-950 shadow-sm">
                          {entry.rank}
                        </div>
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-950">{entry.displayName}</p>
                          <p className="text-sm text-slate-500">
                            {entry.score}/{entry.targetTotal} categories
                          </p>
                        </div>
                      </div>
                      {entry.isComplete ? (
                        <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700">
                          Submitted all
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                    No participants yet. Share the join link to start.
                  </p>
                )}
              </div>
            </div>

            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Validated standings</h2>
                  <p className="mt-1 text-sm text-slate-500">Approved claims only.</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>

              {validatedWinner ? (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <p className="text-sm font-semibold">Validated winner</p>
                  <p className="text-lg font-black">{validatedWinner.displayName}</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-2">
                {approvedTopFive.length > 0 ? (
                  approvedTopFive.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
                    >
                      <p className="break-words font-bold text-slate-950">
                        #{entry.rank} {entry.displayName}
                      </p>
                      <p className="text-sm font-semibold text-slate-500">
                        {entry.score}/{entry.targetTotal}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                    No approved claims yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight">People QR badges</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Everyone who joins gets a QR automatically. Print pre-created people here if needed.
                  </p>
                </div>
                <CopyButton value={badgeUrl} label="Copy sheet link" />
              </div>

              <div className="mt-4 grid gap-2">
                {data.targets.length > 0 ? (
                  data.targets.map((target) => {
                    const targetUrl = absoluteUrl(`/target/${target.scannerToken}`);

                    return (
                      <div
                        key={target.id}
                        className="grid min-w-0 gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-950">{target.name}</p>
                          {target.jobPosition ? (
                            <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                              {target.jobPosition}
                            </p>
                          ) : null}
                          <p className="mt-1 break-all text-xs text-slate-500">{targetUrl}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Fallback code: {target.fallbackCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <CopyButton value={targetUrl} label="Copy" />
                          <Link
                            href={`/target/${target.scannerToken}`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                    No people QR codes yet. They will appear when participants join.
                  </p>
                )}
              </div>
            </div>
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <RoomCustomizationForm room={data.room} categories={data.categories} />
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight">Claim review</h2>
              <p className="mt-1 text-sm text-slate-500">
                Approve or reject submitted categories after checking the conversation context.
              </p>
            </div>
            <p className="text-sm font-bold text-slate-500">{data.claims.length} recent claims</p>
          </div>

          <div className="mt-4 grid gap-3">
            {data.claims.length > 0 ? (
              data.claims.map((claim) => {
                const approveAction = reviewCategoryClaimAction.bind(
                  null,
                  data.room.id,
                  data.room.adminToken,
                  claim.id,
                  "approved" as const,
                );
                const rejectAction = reviewCategoryClaimAction.bind(
                  null,
                  data.room.id,
                  data.room.adminToken,
                  claim.id,
                  "rejected" as const,
                );
                const pendingAction = reviewCategoryClaimAction.bind(
                  null,
                  data.room.id,
                  data.room.adminToken,
                  claim.id,
                  "pending" as const,
                );

                return (
                  <article
                    key={claim.id}
                    className="grid min-w-0 gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div
                        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusBadge(claim.status)}`}
                      >
                        {statusIcon(claim.status)}
                        {claim.status}
                      </div>
                      <p className="mt-3 break-words text-base font-black text-slate-950">
                        {claim.participantName}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        claimed <span className="font-bold text-slate-950">{claim.categoryTitle}</span>{" "}
                        with <span className="font-bold text-slate-950">{claim.targetName}</span>
                      </p>
                      {claim.adminNote ? (
                        <p className="mt-2 rounded-md bg-white p-2 text-sm text-slate-600">
                          {claim.adminNote}
                        </p>
                      ) : null}
                    </div>

                    <form className="grid min-w-0 gap-2 sm:min-w-80">
                      <input
                        name="adminNote"
                        defaultValue={claim.adminNote}
                        placeholder="Optional note"
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[var(--room-accent)] focus:ring-4 focus:ring-sky-100"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          formAction={approveAction}
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          formAction={rejectAction}
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-red-600 px-2 text-xs font-bold text-white transition hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          formAction={pendingAction}
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Clock3 className="h-4 w-4" />
                          Reset
                        </button>
                      </div>
                    </form>
                  </article>
                );
              })
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                Claims will appear here once participants scan people and choose categories.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-white text-slate-700 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-950">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
