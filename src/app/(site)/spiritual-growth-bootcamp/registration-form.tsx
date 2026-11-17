"use client";

import { useActionState, useState } from "react";
import { NextFieldHint, SuccessBurst } from "@/components/site/motion";
import { Eyebrow } from "@/components/ui";
import { Field, FormError, Input, Select } from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { KeepValuesForm } from "@/components/ui/keep-values-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerForSgb, type SgbRegistrationState } from "./actions";
import { OTHER_LOCATION, SGB_LOCATIONS } from "./locations";

const initialState: SgbRegistrationState = {};

/** Suggestions for Country of residence; people can type any other. */
const COUNTRIES = ["Nigeria", "United Kingdom", "Canada", "Trinidad and Tobago", "United States", "Ghana"];

export function SgbRegistrationForm() {
  const [state, formAction] = useActionState(registerForSgb, initialState);
  const [location, setLocation] = useState("");

  if (state.ok) {
    return (
      <div className="border border-success/30 bg-success-soft p-7">
        <SuccessBurst className="mb-5" />
        <Eyebrow className="text-success">We&apos;ve got it</Eyebrow>
        <p className="display mt-3 text-4xl text-ink">You&apos;re registered</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-70">
          The team will reach you on WhatsApp, on the number you gave, with your confirmation and
          access information.
        </p>
      </div>
    );
  }

  return (
    <KeepValuesForm action={formAction} className="space-y-5">
      <NextFieldHint />
      <FormError message={state.error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required error={state.errors?.firstName}>
          <Input
            id="firstName"
            name="firstName"
            required
            minLength={2}
            maxLength={60}
            autoComplete="given-name"
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" required error={state.errors?.lastName}>
          <Input
            id="lastName"
            name="lastName"
            required
            minLength={2}
            maxLength={60}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field
        label="WhatsApp phone number"
        htmlFor="phone"
        required
        hint="Your confirmation and access information come here."
        error={state.errors?.phone}
      >
        <PhoneInput id="phone" name="phone" required invalid={Boolean(state.errors?.phone)} />
      </Field>

      <Field label="Email" htmlFor="email" required error={state.errors?.email}>
        <Input id="email" name="email" type="email" required maxLength={120} autoComplete="email" />
      </Field>

      <Field label="Gender" htmlFor="gender" required error={state.errors?.gender}>
        <Select id="gender" name="gender" required defaultValue="">
          <option value="" disabled>
            Choose your gender
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>
      </Field>

      <Field
        label="Location"
        htmlFor="location"
        required
        hint="Choose the Lighthouse closest to you."
        error={state.errors?.location}
      >
        <Select
          id="location"
          name="location"
          required
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        >
          <option value="" disabled>
            Choose your location
          </option>
          {SGB_LOCATIONS.map((place) => (
            <option key={place.name} value={place.name}>
              {place.areas ? `${place.name}: ${place.areas}` : place.name}
            </option>
          ))}
          <option value={OTHER_LOCATION}>{OTHER_LOCATION}</option>
        </Select>
      </Field>

      {location === OTHER_LOCATION ? (
        <>
          <Field
            label="Your exact location"
            htmlFor="otherLocation"
            required
            error={state.errors?.otherLocation}
          >
            <Input
              id="otherLocation"
              name="otherLocation"
              required
              minLength={2}
              maxLength={120}
              placeholder="Area and city"
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Country of residence" htmlFor="country" required error={state.errors?.country}>
            <Input
              id="country"
              name="country"
              required
              minLength={2}
              maxLength={60}
              list="sgb-countries"
              autoComplete="country-name"
            />
            <datalist id="sgb-countries">
              {COUNTRIES.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>
          </Field>
        </>
      ) : null}


      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton className="w-full" pendingLabel="Registering…">
        Register Now
      </SubmitButton>
      <p className="text-xs text-ink-45">Your details are only used for the Bootcamp.</p>
    </KeepValuesForm>
  );
}
