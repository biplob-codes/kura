import { createContext, useContext, useState, type ReactNode } from "react";

interface AmbientContextValue {
  /** Current thumbnail URL used for ambient glow (null = none) */
  ambientSrc: string | null;
  setAmbientSrc: (src: string | null) => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

export function AmbientProvider({ children }: { children: ReactNode }) {
  const [ambientSrc, setAmbientSrc] = useState<string | null>(null);

  return (
    <AmbientContext.Provider value={{ ambientSrc, setAmbientSrc }}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient() {
  const ctx = useContext(AmbientContext);
  if (!ctx) {
    throw new Error("useAmbient must be used inside AmbientProvider");
  }
  return ctx;
}
