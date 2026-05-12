import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Database, ExternalLink, Printer, QrCode, Trophy, Users } from "lucide-react";
import type { ReactNode } from "react";

import { AdminRememberRoom } from "@/components/admin-remember-room";
import { CopyButton } from "@/components/copy-button";
import { RoomCustomizationForm } from "@/components/room-customization-form";
import { absoluteUrl } from "@/lib/app-url";
import { roomThemeStyle } from "@/lib/customization";
import { getAdminRoom } from "@/lib/rooms";

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
  const winner = data.leaderboard.find((entry) => entry.isComplete);

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
          backgroundImageUrl: data.room.backgroundImageUrl,
        }}
      />
      <div
        className="mx-auto grid min-w-0 max-w-6xl gap-5"
        style={{ width: "min(100%, calc(100vw - 2rem))" }}
      >
        <header className="grid gap-4 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
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
                Target QR sheets
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric icon={<Users className="h-5 w-5" />} label="Participants" value={data.stats.participantCount} />
            <Metric icon={<QrCode className="h-5 w-5" />} label="Targets" value={data.targets.length} />
            <Metric icon={<BarChart3 className="h-5 w-5" />} label="Stamps" value={data.stats.claimCount} />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight">Top 5 leaderboard</h2>
                <p className="mt-1 text-sm text-slate-500">Ranked by passport progress.</p>
              </div>
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>

            {winner ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="text-sm font-semibold">Current winner</p>
                <p className="text-lg font-black">{winner.displayName}</p>
              </div>
            ) : null}

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
                          {entry.score}/{entry.targetTotal} stamps
                        </p>
                      </div>
                    </div>
                    {entry.isComplete ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        Complete
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

          <div className="grid min-w-0 gap-5">
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight">Target QR badges</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Print these or let each target open their QR page.
                  </p>
                </div>
                <CopyButton value={badgeUrl} label="Copy sheet link" />
              </div>

              <div className="mt-4 grid gap-2">
                {data.targets.map((target) => {
                  const targetUrl = absoluteUrl(`/target/${target.scannerToken}`);

                  return (
                    <div
                      key={target.id}
                      className="grid min-w-0 gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-950">{target.name}</p>
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
                })}
              </div>
            </div>
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <RoomCustomizationForm room={data.room} />
            </div>
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
