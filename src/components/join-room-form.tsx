"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { joinParticipantAction, type ActionState } from "@/app/actions";

type JoinRoomFormProps = {
  joinCode: string;
};

const initialState: ActionState = {};

export function JoinRoomForm({ joinCode }: JoinRoomFormProps) {
  const [state, action, pending] = useActionState(
    joinParticipantAction.bind(null, joinCode),
    initialState,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">First name</span>
          <input
            name="firstName"
            required
            minLength={1}
            autoComplete="given-name"
            placeholder="First name"
            className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Last name</span>
          <input
            name="lastName"
            required
            minLength={1}
            autoComplete="family-name"
            placeholder="Last name"
            className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Job position</span>
        <input
          name="jobPosition"
          required
          minLength={2}
          autoComplete="organization-title"
          placeholder="Product manager, engineer, founder..."
          className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Join game
      </button>
    </form>
  );
}
