import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  Check,
  Circle,
  Clock3,
  Medal,
  QrCode as QrCodeIcon,
  Trophy,
  XCircle,
} from "lucide-react";

import { JoinRoomForm } from "@/components/join-room-form";
import { ParticipantAutoRefresh } from "@/components/participant-auto-refresh";
import { ParticipantScanner } from "@/components/participant-scanner";
import { QrCode } from "@/components/qr-code";
import { RoomBrandMark } from "@/components/room-brand-mark";
import { absoluteUrl } from "@/lib/app-url";
import { roomThemeStyle } from "@/lib/customization";
import { formatDuration, getMilestones } from "@/lib/scoring";
import { getParticipantState, getPublicRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RoomPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
  searchParams: Promise<{
    pt?: string;
  }>;
};

function statusTone(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

function statusIcon(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return <Check className="h-5 w-5" />;
  }

  if (status === "rejected") {
    return <XCircle className="h-5 w-5" />;
  }

  return <Clock3 className="h-5 w-5" />;
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { joinCode } = await params;
  const { pt } = await searchParams;
  const publicRoom = await getPublicRoom(joinCode);

  if (!publicRoom) {
    notFound();
  }

  const cookieStore = await cookies();
  const participantToken =
    pt || cookieStore.get(`sn_participant_${publicRoom.room.id}`)?.value;
  const state = await getParticipantState(joinCode, participantToken);

  if (!state) {
    return (
      <main
        className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-950"
        style={roomThemeStyle(publicRoom.room)}
      >
        <section
          className="mx-auto grid min-h-[calc(100vh-3rem)] min-w-0 max-w-xl place-items-center"
          style={{ width: "min(100%, calc(100vw - 2rem))" }}
        >
          <div className="w-full min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-7">
            <div className="mb-6 grid gap-3">
              <RoomBrandMark
                organizationName={publicRoom.room.organizationName}
                logoUrl={publicRoom.room.logoUrl}
              />
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                <QrCodeIcon className="h-4 w-4" />
                Category collection
              </div>
              <h1 className="break-words text-3xl font-black tracking-tight text-slate-950">
                {publicRoom.room.title}
              </h1>
              {publicRoom.room.subtitle ? (
                <p className="break-words text-lg font-semibold leading-7 text-slate-800">
                  {publicRoom.room.subtitle}
                </p>
              ) : null}
              <p className="text-base leading-7 text-slate-600">
                Join to get your own QR, scan people after conversations, and
                collect the room categories.
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {publicRoom.categories.length} categories to collect
              </p>
            </div>
            <JoinRoomForm joinCode={publicRoom.room.joinCode} />
          </div>
        </section>
      </main>
    );
  }

  const submitted = state.categories.filter(
    (category) => category.claim && category.claim.status !== "rejected",
  ).length;
  const approved = state.categories.filter(
    (category) => category.claim?.status === "approved",
  ).length;
  const pending = state.categories.filter(
    (category) => category.claim?.status === "pending",
  ).length;
  const rejected = state.categories.filter(
    (category) => category.claim?.status === "rejected",
  ).length;
  const total = state.categories.length;
  const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const milestones = getMilestones(submitted, total);
  const topFive = state.leaderboard.slice(0, 5);
  const targetUrl = state.target ? absoluteUrl(`/target/${state.target.scannerToken}`) : "";

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-950"
      style={roomThemeStyle(state.room)}
    >
      <ParticipantAutoRefresh />
      <div
        className="mx-auto grid min-w-0 max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]"
        style={{ width: "min(100%, calc(100vw - 2rem))" }}
      >
        <section className="grid min-w-0 gap-5">
          <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <RoomBrandMark
              organizationName={state.room.organizationName}
              logoUrl={state.room.logoUrl}
            />
            <p className="break-words text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
              {state.room.title}
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950">
              {state.participant.displayName}
            </h1>
            {state.participant.jobPosition ? (
              <p className="mt-1 break-words text-base font-semibold text-slate-600">
                {state.participant.jobPosition}
              </p>
            ) : null}
            {state.room.subtitle ? (
              <p className="mt-2 break-words text-lg font-semibold leading-7 text-slate-800">
                {state.room.subtitle}
              </p>
            ) : null}
            {state.room.hostName ? (
              <p className="mt-2 break-words text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
                {state.room.hostName}
              </p>
            ) : null}
            <p className="mt-2 text-base text-slate-600">
              Chat first, scan the person, then pick the category you completed.
            </p>
          </div>

          {state.target ? (
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black tracking-tight">My QR</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Show this after a conversation so others can scan you.
                  </p>
                </div>
                <QrCodeIcon className="h-5 w-5 text-sky-600" />
              </div>
              <QrCode
                value={targetUrl}
                alt={`Personal QR for ${state.participant.displayName}`}
                size={220}
              />
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-center">
                <p className="text-xs font-semibold text-slate-500">Fallback code</p>
                <p className="mt-1 text-2xl font-black tracking-[0.18em] text-slate-950">
                  {state.target.fallbackCode}
                </p>
              </div>
            </div>
          ) : null}

          <ParticipantScanner
            participantToken={state.participant.participantToken}
            accentColor={state.room.accentColor}
          />

          <div className="rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight">Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {submitted}/{total} categories submitted
                </p>
              </div>
              <div className="text-3xl font-black text-slate-950">{progress}%</div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: state.room.accentColor,
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-amber-50 p-3 text-amber-800">
                <p className="text-2xl font-black">{pending}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em]">Pending</p>
              </div>
              <div className="rounded-md bg-emerald-50 p-3 text-emerald-800">
                <p className="text-2xl font-black">{approved}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em]">Approved</p>
              </div>
              <div className="rounded-md bg-red-50 p-3 text-red-800">
                <p className="text-2xl font-black">{rejected}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em]">Rejected</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.key}
                  className={
                    milestone.unlocked
                      ? "rounded-md border border-sky-200 bg-sky-50 p-3 text-sky-800"
                      : "rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-500"
                  }
                >
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4" />
                    <p className="text-sm font-bold">{milestone.label}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium">
                    {milestone.required} categories
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5">
          <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <h2 className="text-xl font-black tracking-tight">Category board</h2>
            <div className="mt-4 grid gap-3">
              {state.categories.map((category) => {
                const claim = category.claim;
                const activeClaim = claim && claim.status !== "rejected";

                return (
                  <div
                    key={category.id}
                    className={
                      claim
                        ? `rounded-md border p-4 ${statusTone(claim.status)}`
                        : "rounded-md border border-slate-200 bg-white p-4 text-slate-600"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          activeClaim
                            ? "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/80 text-current"
                            : "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400"
                        }
                      >
                        {claim ? statusIcon(claim.status) : <Circle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="break-words font-bold">{category.title}</p>
                        <p className="mt-1 text-sm">
                          {claim
                            ? `${claim.status === "rejected" ? "Rejected" : claim.status} with ${claim.targetName}`
                            : "Open"}
                        </p>
                        {claim?.status === "rejected" && claim.adminNote ? (
                          <p className="mt-2 rounded-md bg-white/70 p-2 text-sm">
                            {claim.adminNote}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {state.room.questions.length > 0 ? (
            <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
              <h2 className="text-xl font-black tracking-tight">Question prompts</h2>
              <div className="mt-4 grid gap-2">
                {state.room.questions.map((question) => (
                  <p key={question} className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    {question}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight">Live dashboard</h2>
                <p className="mt-1 text-sm text-slate-500">Provisional ranking by submitted categories.</p>
              </div>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-4 grid gap-2">
              {topFive.map((entry) => (
                <div
                  key={entry.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-bold text-slate-950">
                      #{entry.rank} {entry.displayName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {entry.score}/{entry.targetTotal} categories
                    </p>
                    {entry.isComplete ? (
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Final time {formatDuration(entry.completionDurationMs)}
                      </p>
                    ) : null}
                  </div>
                  {entry.isComplete ? (
                    <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700">
                      Submitted all
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            {state.ownRank ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Your rank: <span className="font-black">#{state.ownRank.rank}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
