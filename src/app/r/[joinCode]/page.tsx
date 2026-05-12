import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Check, Circle, Medal, QrCode, Trophy } from "lucide-react";

import { JoinRoomForm } from "@/components/join-room-form";
import { ParticipantAutoRefresh } from "@/components/participant-auto-refresh";
import { ParticipantScanner } from "@/components/participant-scanner";
import { roomThemeStyle } from "@/lib/customization";
import { getMilestones } from "@/lib/scoring";
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
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <QrCode className="h-4 w-4" />
                Passport room
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
                Join to open your passport scanner. After each conversation,
                scan that target person&apos;s QR badge to unlock one stamp.
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {publicRoom.targets.length} target stamps to collect
              </p>
            </div>
            <JoinRoomForm joinCode={publicRoom.room.joinCode} />
          </div>
        </section>
      </main>
    );
  }

  const collected = state.targets.filter((target) => target.claimedAt).length;
  const total = state.targets.length;
  const progress = total > 0 ? Math.round((collected / total) * 100) : 0;
  const milestones = getMilestones(collected, total);
  const topFive = state.leaderboard.slice(0, 5);

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
            <p className="break-words text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
              {state.room.title}
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950">
              {state.participant.displayName}
            </h1>
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
              Scan a target QR badge after each conversation to stamp your passport.
            </p>
          </div>

          <ParticipantScanner
            participantToken={state.participant.participantToken}
            accentColor={state.room.accentColor}
          />

          <div className="rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight">Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {collected}/{total} stamps collected
                </p>
              </div>
              <div className="text-3xl font-black text-slate-950">{progress}%</div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: state.room.accentColor,
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.key}
                  className={
                    milestone.unlocked
                      ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800"
                      : "rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-500"
                  }
                >
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4" />
                    <p className="text-sm font-bold">{milestone.label}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium">
                    {milestone.required} stamps
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-w-0 gap-5">
          <div className="min-w-0 rounded-md border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur">
            <h2 className="text-xl font-black tracking-tight">Passport stamps</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {state.targets.map((target) => {
                const unlocked = Boolean(target.claimedAt);

                return (
                  <div
                    key={target.id}
                    className={
                      unlocked
                        ? "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
                        : "rounded-md border border-slate-200 bg-white p-4 text-slate-500"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          unlocked
                            ? "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-600 text-white"
                            : "grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-400"
                        }
                      >
                        {unlocked ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold">{target.name}</p>
                        <p className="mt-1 text-sm">
                          {unlocked ? "Stamp collected" : "Locked"}
                        </p>
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
              <h2 className="text-xl font-black tracking-tight">Leaderboard</h2>
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
                      {entry.score}/{entry.targetTotal} stamps
                    </p>
                  </div>
                  {entry.isComplete ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                      Complete
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
