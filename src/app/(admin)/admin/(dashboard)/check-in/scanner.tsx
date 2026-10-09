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
  early: { bg: "bg-meridian text-white", label: "Not checked in", tone: "neutral" },
};

/** The same ticket in view again is ignored for this long, so one hold is one scan. */
const SAME_CODE_MS = 4000;
/** After any result, scanning rests this long so the gate can read the screen. */
const REST_MS = 1500;

/** A mouse or trackpad: a desk with a USB scanner, not a phone at the gate. */
const deskPointer = () => window.matchMedia("(pointer: fine)").matches;

/**
 * Reads QR codes from a video element. Chrome on Android has a native
 * detector; iPhones and Firefox don't, so they decode frames with jsQR,
 * loaded only when needed.
 */
async function createReader(video: HTMLVideoElement) {
  const native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (native) {
    try {
      const detector = new native({ formats: ["qr_code"] });
      return async () => (await detector.detect(video))[0]?.rawValue ?? null;
    } catch {
      // Present but without QR support: fall through to jsQR.
    }
  }

  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async () => {
    if (!context || !video.videoWidth) return null;
    // Scaled down: a ticket QR held to the camera reads fine at 640px, and
    // full-resolution frames would make a mid-range phone stutter.
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

export function Scanner() {
  const [state, formAction, pending] = useActionState<ScanResult, FormData>(scanTicket, {});
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const restUntil = useRef(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // A browser capability, not React state: read it on the client and render
  // false on the server so hydration matches.
  const supportsCamera = useSyncExternalStore(
    () => () => {},
    () => Boolean(navigator.mediaDevices?.getUserMedia),
    () => false,
  );

  useEffect(() => {
    busy.current = pending;
  }, [pending]);

  // Desks keep the caret in the box for a USB scanner that types. Phones
  // don't: focusing the box would throw the keyboard over the camera.
  useEffect(() => {
    if (deskPointer()) inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!state.outcome) return;
    busy.current = false;
    restUntil.current = Date.now() + REST_MS;
    // A buzz the gate can feel: one short for in, a long double for trouble.
    navigator.vibrate?.(state.outcome === "admitted" ? 80 : [220, 90, 220]);
    if (deskPointer()) inputRef.current?.select();
    else if (!cameraOn) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state, cameraOn]);

  useEffect(() => {
    if (!cameraOn) return;

    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;

    async function run() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const read = await createReader(video);
        let lastValue = "";
        let lastAt = 0;

        const tick = async () => {
          if (stopped) return;
          const now = Date.now();
          if (!busy.current && now >= restUntil.current) {
            try {
              const value = await read();
              if (value && (value !== lastValue || now - lastAt > SAME_CODE_MS)) {
                lastValue = value;
                lastAt = now;
                busy.current = true;
                if (inputRef.current) inputRef.current.value = value;
                formRef.current?.requestSubmit();
              }
            } catch {
              // A dropped frame is not an error worth surfacing.
            }
          }
          // About seven reads a second: quick to catch a code, easy on the battery.
          timer = window.setTimeout(() => void tick(), 140);
        };

        void tick();
      } catch (error) {
        const denied = error instanceof DOMException && error.name === "NotAllowedError";
        setCameraError(
          denied
            ? "Camera access was blocked. Allow the camera for this site in your browser settings, or type the ticket code below."
            : "Couldn't open the camera. Type the ticket code below instead.",
        );
        setCameraOn(false);
      }
    }

    void run();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);

  const style = state.outcome ? OUTCOME_STYLE[state.outcome] : null;

  return (
    // Phones: camera, then the result right under it, then typing. Desks: the
    // two inputs on the left, the result large on the right.
    <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:gap-6">
      {supportsCamera ? (
        <div className="border border-ink/12 bg-paper p-4 sm:p-5 lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>Phone camera</Eyebrow>
            {cameraOn ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setCameraOn(false)}>
                Stop
              </Button>
            ) : null}
          </div>

          {cameraOn ? (
            <div className="relative mt-4 aspect-square overflow-hidden bg-ink sm:aspect-[4/3]">
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              {/* Where to hold the ticket. */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "aspect-square w-3/5 border-2 transition-colors",
                    pending ? "border-brass" : "border-white/80",
                  )}
                />
              </div>
              <p className="absolute inset-x-0 bottom-0 bg-ink/60 px-3 py-2 text-center text-xs font-semibold text-white">
                {pending ? "Checking…" : "Hold the ticket QR inside the square"}
              </p>
            </div>
          ) : (
            <Button
              type="button"
              size="lg"
              className="mt-4 w-full justify-center"
              onClick={() => {
                setCameraError(null);
                setCameraOn(true);
              }}
            >
              Start scanning
            </Button>
          )}
          {cameraError ? <p className="mt-3 text-sm leading-relaxed text-danger">{cameraError}</p> : null}
        </div>
      ) : null}

      {/* ── the result, sized to be readable at arm's length in the dark ── */}
      <div ref={resultRef} className="scroll-mt-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {!state.outcome ? (
          <div className="flex h-full min-h-[120px] items-center justify-center border border-dashed border-ink/20 px-6 py-6 text-center lg:min-h-[320px]">
            <p className="display max-w-sm text-2xl text-ink-45 lg:text-3xl">Scan a ticket to admit someone</p>
          </div>
        ) : (
          <div className={cn("p-5 sm:p-9", style?.bg)} role="status" aria-live="assertive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow text-white/70">{style?.label}</p>
              {state.person ? <p className="font-mono text-sm text-white/70">{state.person.ticketCode}</p> : null}
            </div>

            <p className="display mt-3 text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] text-white">
              {state.person?.name ?? "Unknown ticket"}
            </p>

            <p className="mt-3 text-base text-white/85 sm:text-lg">{state.message}</p>

            {state.person ? (
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-white/25 pt-4 sm:mt-8 sm:gap-5 sm:pt-6">
                <div>
                  <dt className="eyebrow text-white/50">Ticket</dt>
                  <dd className="mt-1 text-sm font-semibold text-white sm:text-base">{state.person.category}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/50">Room</dt>
                  <dd className="mt-1 text-sm font-semibold text-white sm:text-base">
                    {state.person.room ?? "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/50">Record</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/admin/registrants/${state.person.id}`}
                      className="text-sm font-semibold text-white underline underline-offset-4 sm:text-base"
                    >
                      Profile
                    </Link>
                  </dd>
                </div>
              </dl>
            ) : null}

            {state.person?.medicalNotes ? (
              <div className="mt-5 border border-white/30 bg-white/10 p-4">
                <Badge tone="neutral" className="border-white/40 bg-white/15 text-white">
                  Medical note
                </Badge>
                <p className="mt-2 text-sm leading-relaxed text-white">{state.person.medicalNotes}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border border-ink/12 bg-paper p-4 sm:p-5 lg:col-start-1 lg:row-start-2 lg:self-start">
        <Eyebrow>Or type the code</Eyebrow>
        <form ref={formRef} action={formAction} className="mt-4 space-y-3">
          <Input
            ref={inputRef}
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="TKT-FFC-27-XXXXX"
            className="text-center font-mono text-lg tracking-[0.12em] uppercase"
            aria-label="Ticket code or QR payload"
          />
          <SubmitButton className="w-full" pendingLabel="Checking…">
            Check in
          </SubmitButton>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-ink-45">
          The code is printed under the QR on every ticket. A USB barcode scanner works here too, it
          types the code and presses enter.
        </p>
      </div>
    </div>
  );
}
