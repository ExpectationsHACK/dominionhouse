/**
 * The Bootcamp form's Location choices: the Lighthouses, with the areas
 * around each, as the owner listed them, and the country each is in (saved
 * as the registrant's country). "Others" opens boxes for the exact location
 * and country of residence. Shared by the form and the server action.
 */
export const SGB_LOCATIONS: { name: string; areas?: string; country: string }[] = [
  { name: "Ijegun", areas: "Ijegun, Ikotun, Alimosho", country: "Nigeria" },
  { name: "Bode Thomas", areas: "Surulere, Okota, Yaba", country: "Nigeria" },
  { name: "Lekki", areas: "Lekki, VI", country: "Nigeria" },
  { name: "Jumofak Ikorodu", areas: "Jumofak, Benson, Ikorodu Garage", country: "Nigeria" },
  { name: "Agric Ikorodu", country: "Nigeria" },
  { name: "London United Kingdom", country: "United Kingdom" },
  { name: "Calgary Canada", country: "Canada" },
  { name: "Trinidad", areas: "Diego Martin", country: "Trinidad and Tobago" },
];

export const OTHER_LOCATION = "Others";
