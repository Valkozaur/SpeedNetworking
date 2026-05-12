import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { CreateRoomForm } from "@/components/create-room-form";

export default function NewRoomPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          My rooms
        </Link>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 grid gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Admin setup
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Create a category collection room
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Define the categories participants should collect. Everyone who
              joins receives a personal QR code, and the admin can review claims
              before choosing the final winner.
            </p>
          </div>

          <CreateRoomForm />
        </section>
      </div>
    </main>
  );
}
