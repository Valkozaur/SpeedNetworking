import Link from "next/link";
import { notFound } from "next/navigation";
import { getParticipantBadge } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ParticipantBadgePageProps = {
  params: Promise<{
    participantToken: string;
  }>;
};

export default async function ParticipantBadgePage({ params }: ParticipantBadgePageProps) {
  const { participantToken } = await params;
  const data = await getParticipantBadge(participantToken);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-xl place-items-center">
        <div className="w-full rounded-md border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
            {data.room.title}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {data.participant.displayName}
          </h1>
          {data.participant.jobPosition ? (
            <p className="mt-1 text-base font-semibold text-slate-600">
              {data.participant.jobPosition}
            </p>
          ) : null}
          <p className="mx-auto mt-2 max-w-sm text-base leading-7 text-slate-600">
            Open your scanner, chat with someone, scan their QR, and choose the
            category they helped you complete.
          </p>

          <Link
            href={`/r/${data.room.joinCode}?pt=${encodeURIComponent(data.participant.participantToken)}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open my game board
          </Link>
        </div>
      </section>
    </main>
  );
}
