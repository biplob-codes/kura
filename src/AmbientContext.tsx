import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AmbientContextValue {
  /** Current thumbnail URL used for ambient glow (null = none) */
  ambientSrc: string | null;
  setAmbientSrc: (src: string | null) => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

export function AmbientProvider({ children }: { children: ReactNode }) {
  const [ambientSrc, setAmbientSrcState] = useState<string | null>(null);

  // Stable identity so consumers don't re-run effects every render
  const setAmbientSrc = useCallback((src: string | null) => {
    setAmbientSrcState((prev) => (prev === src ? prev : src));
  }, []);

  const value = useMemo(
    () => ({ ambientSrc, setAmbientSrc }),
    [ambientSrc, setAmbientSrc],
  );

  return (
    <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>
  );
}

export function useAmbient() {
  const ctx = useContext(AmbientContext);
  if (!ctx) {
    throw new Error("useAmbient must be used inside AmbientProvider");
  }
  return ctx;
}
