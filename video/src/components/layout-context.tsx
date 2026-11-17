import { createContext, useContext } from "react";
import { Easing } from "remotion";
import { LAYOUTS, type Layout } from "../config";

export const LayoutContext = createContext<Layout>("vertical");

/** The current layout's name and measurements (canvas, safe zones, margins). */
export function useLayout() {
  const name = useContext(LayoutContext);
  return { name, ...LAYOUTS[name], isWide: name === "wide" };
}

/** The site's --ease-out-expo. */
export const expo = Easing.bezier(0.16, 1, 0.3, 1);

/** Pick a value per layout. */
export function per<T>(layout: { isWide: boolean }, vertical: T, wide: T): T {
  return layout.isWide ? wide : vertical;
}
