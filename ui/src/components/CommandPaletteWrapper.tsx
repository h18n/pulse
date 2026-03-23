"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

export function CommandPaletteWrapper() {
  return <CommandPalette />;
}
