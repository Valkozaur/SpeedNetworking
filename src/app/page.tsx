import Link from "next/link";
import { ArrowRight, QrCode, Trophy } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-center">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="grid gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <QrCode className="h-4 w-4" />
              Mobile category game
            </div>
            <div className="grid gap-4">
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Run a speed networking game from any phone.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Create a room, define the categories, and let participants scan
                the people they meet to build a live leaderboard.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Create game room
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                My admin rooms
              </Link>
              <a
                href="#join"
                className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Join with event link
              </a>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              {["Meet", "Scan", "Choose", "Review"].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-md border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-slate-950">{step}</p>
                    <p className="text-sm leading-6 text-slate-500">
                      {index === 0
                        ? "Participant starts a real conversation."
                        : index === 1
                          ? "Participant scans the other person's QR."
                          : index === 2
                            ? "They pick the category this chat completed."
                            : "Admin judges claims and confirms the winner."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md bg-amber-50 p-4 text-amber-900">
              <div className="flex gap-3">
                <Trophy className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold leading-6">
                  Live ranking is provisional. Final results use admin-approved
                  category claims.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="join" className="mt-8 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Participants should open the room link shared by the admin. It looks like{" "}
          <span className="font-semibold text-slate-950">/r/ABCDE</span>.
        </div>
      </section>
    </main>
  );
}
