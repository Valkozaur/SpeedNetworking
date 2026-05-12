"use client";

import type { Html5Qrcode as Html5QrcodeInstance } from "html5-qrcode";
import { Camera, CheckCircle2, Keyboard, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

type ClaimResult = {
  duplicate: boolean;
  participantName: string;
  targetName: string;
  score: number;
  targetTotal: number;
};

type ParticipantScannerProps = {
  participantToken: string;
  accentColor: string;
};

export function ParticipantScanner({ participantToken, accentColor }: ParticipantScannerProps) {
  const router = useRouter();
  const generatedId = useId();
  const readerId = `reader-${generatedId.replace(/:/g, "")}`;
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastClaim, setLastClaim] = useState<ClaimResult | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) {
      setCameraActive(false);
      return;
    }

    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // The scanner may already be stopped when a scan callback wins the race.
    } finally {
      scannerRef.current = null;
      setCameraActive(false);
    }
  }

  async function submitScan(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError("Scan a target QR code or enter a target fallback code.");
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/participant/${encodeURIComponent(participantToken)}/claim`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ scan: trimmedValue }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not stamp this target.");
      }

      setLastClaim(data);
      setMessage(
        data.duplicate
          ? `${data.targetName} is already in your passport.`
          : `Stamped ${data.targetName}.`,
      );
      setManualCode("");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Scan failed.");
    } finally {
      setPending(false);
    }
  }

  async function startScanner() {
    setError(null);
    setMessage(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(readerId);
      const qrboxSize = Math.min(260, Math.max(200, window.innerWidth - 96));

      scannerRef.current = scanner;
      setCameraActive(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: qrboxSize,
            height: qrboxSize,
          },
        },
        async (decodedText) => {
          await stopScanner();
          await submitScan(decodedText);
        },
        undefined,
      );
    } catch (caughtError) {
      setCameraActive(false);
      scannerRef.current = null;
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Camera could not start. Use fallback code entry.",
      );
    }
  }

  return (
    <div className="grid min-w-0 gap-5">
      <div className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">Passport scanner</p>
            <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
              Scan target QR
            </h2>
          </div>
          <div className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Stamp mode
          </div>
        </div>

        <div
          id={readerId}
          className="min-h-[260px] w-full min-w-0 max-w-full overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-950 sm:min-h-[300px]"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={cameraActive ? stopScanner : startScanner}
            disabled={pending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {cameraActive ? <RotateCcw className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {cameraActive ? "Stop" : "Scan QR"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLastClaim(null);
              setMessage(null);
              setError(null);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <form
        className="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          void submitScan(manualCode);
        }}
      >
        <label className="grid gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Keyboard className="h-4 w-4" />
            Target fallback code
          </span>
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value.toLocaleUpperCase())}
            placeholder="Target code"
            className="h-12 min-w-0 rounded-md border border-slate-200 bg-white px-4 text-center text-lg font-bold uppercase tracking-[0.12em] text-slate-950 outline-none transition placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:tracking-[0.18em]"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition brightness-100 hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ backgroundColor: accentColor }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Stamp target
        </button>
      </form>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{message}</p>
              {lastClaim ? (
                <p className="mt-1 text-sm">
                  Passport progress: {lastClaim.score}/{lastClaim.targetTotal}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
