"use client";

import { useActionState } from "react";
import { Loader2, Palette } from "lucide-react";

import { createRoomAction, type ActionState } from "@/app/actions";
import { ROOM_THEMES } from "@/lib/customization";

const initialState: ActionState = {};

export function CreateRoomForm() {
  const [state, action, pending] = useActionState(createRoomAction, initialState);

  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Room title</span>
        <input
          name="title"
          placeholder="Founders Breakfast, Sofia Demo Day..."
          className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Subtitle</span>
        <input
          name="subtitle"
          placeholder="A fast room for warm introductions and useful follow-ups"
          className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Host label</span>
        <input
          name="hostName"
          placeholder="Hosted by Sofia Builders Club"
          className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Organization name</span>
          <input
            name="organizationName"
            placeholder="European Bank for Reconstruction and Development"
            className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">Logo URL</span>
          <input
            name="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            className="h-12 rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-900">Conversation categories</span>
        <textarea
          name="categories"
          required
          rows={8}
          placeholder={"Chat with someone who joined in 2025\nChat with someone you have not met\nChat with someone who shares the same birth month as you\nChat with an RO member\nChat with a Tech Sofia member\nChat with someone who has not yet joined"}
          className="min-h-44 rounded-md border border-slate-200 bg-white px-4 py-3 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <span className="text-sm text-slate-500">
          Paste one category per line. Participants will choose from these after scanning a person.
        </span>
      </label>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950">
          <Palette className="h-4 w-4" />
          Visual style
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">Theme</span>
            <select
              name="themePreset"
              defaultValue="emerald"
              className="h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              {ROOM_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-900">Accent</span>
            <input
              name="accentColor"
              type="color"
              defaultValue="#059669"
              className="h-12 rounded-md border border-slate-200 bg-white p-1"
            />
          </label>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Create game room
      </button>
    </form>
  );
}
