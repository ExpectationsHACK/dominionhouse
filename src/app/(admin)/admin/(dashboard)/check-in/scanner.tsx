"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { scanTicket, type ScanResult } from "./actions";
import { Badge, Button, Eyebrow } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

const OUTCOME_STYLE: Record<string, { bg: string; label: string; tone: "success" | "warn" | "danger" | "neutral" }> = {
  admitted: { bg: "bg-success text-white", label: "Admitted", tone: "success" },
  already: { bg: "bg-warn text-white", label: "Already in", tone: "warn" },
  revoked: { bg: "bg-danger text-white", label: "Revoked", tone: "danger" },
  unpaid: { bg: "bg-danger text-white", label: "Owes money", tone: "danger" },
  unknown: { bg: "bg-ink text-white", label: "Not found", tone: "neutral" },
};

export function Scanner() {
  const [state, formAction] = useActionState<ScanResult, FormData>(scanTicket, {});
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // A browser capability, not React state, read it on the client and render
  // false on the server so hydration matches.
  const supportsCamera = useSyncExternalStore(
    () => () => {},
    () => "BarcodeDetector" in window && Boolean(navigator.mediaDevices?.getUserMedia),
    () => false,
  );

  // Keep the caret in the box, most gates use a USB scanner that types.
  useEffect(() => {
    if (state.outcome) inputRef.current?.select();
  }, [state]);

  useEffect(() => {
    if (!cameraOn) return;

    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    async function run() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const DetectorCtor = (
          window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => BarcodeDetectorLike }
        ).BarcodeDetector;
        const detector = new DetectorCtor({ formats: ["qr_code"] });

        let lastValue = "";
        let lastAt = 0;

        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            const now = Date.now();
            if (value && (value !== lastValue || now - lastAt > 4000)) {
              lastValue = value;
              lastAt = now;
              if (inputRef.current) inputRef.current.value = value;
              formRef.current?.requestSubmit();
            }
          } catch {
            // A dropped frame is not an error worth surfacing.
          }
          raf = requestAnimationFrame(() => void tick());
        };

        void tick();
      } catch {
        setCameraError("Couldn't open the camera. Type the ticket code instead.");
        setCameraOn(false);
      }
    }

    void run();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);

  const style = state.outcome ? OUTCOME_STYLE[state.outcome] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div className="border border-ink/12 bg-paper p-5">
          <Eyebrow>Scan or type</Eyebrow>
          <form ref={formRef} action={formAction} className="mt-4 space-y-3">
            <Input
              ref={inputRef}
              name="code"
              autoFocus
              autoComplete="off"
              placeholder="TKT-FFC-27-XXXXX"
              className="text-center font-mono text-lg tracking-[0.12em] uppercase"
              aria-label="Ticket code or QR payload"
            />
            <SubmitButton className="w-full" pendingLabel="Checking…">
              Check in
            </SubmitButton>
          </form>
          <p className="mt-3 text-xs leading-relaxed text-ink-45">
            A USB barcode scanner works here with no setup, it just types the code and presses
            enter.
          </p>
        </div>

        {supportsCamera ? (
          <div className="border border-ink/12 bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>Phone camera</Eyebrow>
              <Button
                type="button"
                size="sm"
                variant={cameraOn ? "outline" : "solid"}
                onClick={() => {
                  setCameraError(null);
                  setCameraOn((value) => !value);
                }}
              >
                {cameraOn ? "Stop camera" : "Start camera"}
              </Button>
            </div>
            {cameraError ? <p className="mt-3 text-xs text-danger">{cameraError}</p> : null}
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn("mt-4 w-full border border-ink/12 bg-ink", !cameraOn && "hidden")}
            />
          </div>
        ) : null}
      </div>

      {/* ── the result, sized to be readable at arm's length in the dark ── */}
      <div>
        {!state.outcome ? (
          <div className="flex h-full min-h-[320px] items-center justify-center border border-dashed border-ink/20 px-6 text-center">
            <p className="display max-w-sm text-3xl text-ink-45">
              Scan a ticket to admit someone
            </p>
          </div>
        ) : (
          <div className={cn("p-7 sm:p-9", style?.bg)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow text-white/60">{style?.label}</p>
              {state.person ? (
                <p className="font-mono text-sm text-white/70">{state.person.ticketCode}</p>
              ) : null}
            </div>

            <p className="display mt-4 text-[clamp(2.5rem,6vw,4.5rem)] text-white">
              {state.person?.name ?? "Unknown ticket"}
            </p>

            <p className="mt-3 text-lg text-white/80">{state.message}</p>

            {state.person ? (
              <dl className="mt-8 grid gap-5 border-t border-white/25 pt-6 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-white/50">Ticket</dt>
                  <dd className="mt-1 text-base font-semibold text-white">
                    {state.person.category}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/50">Room</dt>
                  <dd className="mt-1 text-base font-semibold text-white">
                    {state.person.room ?? "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/50">Record</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/admin/registrants/${state.person.id}`}
                      className="text-base font-semibold text-white underline underline-offset-4"
                    >
                      Open profile
                    </Link>
                  </dd>
                </div>
              </dl>
            ) : null}

            {state.person?.medicalNotes ? (
              <div className="mt-6 border border-white/30 bg-white/10 p-4">
                <Badge tone="neutral" className="border-white/40 bg-white/15 text-white">
                  Medical note
                </Badge>
                <p className="mt-2 text-sm leading-relaxed text-white">
                  {state.person.medicalNotes}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
