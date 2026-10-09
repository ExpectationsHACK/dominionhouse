"use client";

import { createContext, useContext, useTransition, type ComponentProps } from "react";

const PendingContext = createContext(false);

/** True while the surrounding KeepValuesForm is submitting. */
export const useKeepValuesPending = () => useContext(PendingContext);

/**
 * A form for a server action that keeps what the person typed when the
 * action sends back an error.
 *
 * A plain `<form action={…}>` is reset by React after every submission, so a
 * refused one (an email already registered, a phone number in the wrong
 * shape) used to wipe every field and send people back to the start. Here the
 * submission is dispatched by hand, which React doesn't follow with a reset.
 * `action` stays on the form too, so it still works before the page's
 * JavaScript has loaded. Successful actions redirect, so nothing lingers.
 */
export function KeepValuesForm({
  action,
  children,
  ...props
}: Omit<ComponentProps<"form">, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <PendingContext value={pending}>
      <form
        {...props}
        action={action}
        onSubmit={(event) => {
          event.preventDefault();
          // The submitter carries a button's own name/value (e.g. "pay later").
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          const formData = new FormData(event.currentTarget, submitter);
          startTransition(() => action(formData));
        }}
      >
        {children}
      </form>
    </PendingContext>
  );
}
