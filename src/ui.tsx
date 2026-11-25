import { createContext, useContext, type ReactNode } from "react";
import { Activity } from "lucide-react";
import { type State } from "./model";
export type AppContext = {
  state: State;
  mutate: (fn: (s: State) => void) => void;
  notify: (s: string) => void;
};
export const Context = createContext<AppContext>(null!);
export const useApp = () => useContext(Context);
export const toKg = (n: number | null, unit: string) =>
  n === null ? null : unit === "lb" ? n / 2.2046226218 : n;
export const fromKg = (n: number | null, unit: string) =>
  n === null
    ? null
    : unit === "lb"
      ? Math.round(n * 2.2046226218 * 100) / 100
      : n;
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"card " + className}>{children}</section>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Activity size={28} />
      <p>{children}</p>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Num({
  value,
  onChange,
  label,
  min = 0,
  max = 2000,
  step = "any",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <input
      aria-label={label}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={value ?? ""}
      placeholder="—"
      onChange={(e) => {
        const n = e.target.value === "" ? null : Number(e.target.value);
        if (n === null || (Number.isFinite(n) && n >= min && n <= max))
          onChange(n);
      }}
    />
  );
}
