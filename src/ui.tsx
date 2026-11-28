import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useId,
  type ReactNode,
} from "react";
import { Activity } from "lucide-react";
import { type State } from "./model";
export type AppContext = {
  state: State;
  mutate: (fn: (s: State) => void) => Promise<boolean>;
  notify: (s: string) => void;
  saveStatus: "saving" | "saved" | "error";
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
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);
  const hintId = useId();
  useEffect(() => {
    if (!focused.current) setDraft(value === null ? "" : String(value));
  }, [value]);
  return (
    <>
      <input
        aria-label={label}
        type="number"
        inputMode={step === "1" ? "numeric" : "decimal"}
        min={min}
        max={max}
        step={step}
        value={draft}
        placeholder="—"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? hintId : undefined}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          setInvalid(false);
          if (text === "") {
            onChange(null);
            return;
          }
          const n = Number(text);
          if (
            Number.isFinite(n) &&
            n >= min &&
            n <= max &&
            (step !== "1" || Number.isInteger(n))
          )
            onChange(n);
        }}
        onBlur={() => {
          focused.current = false;
          const n = Number(draft);
          const bad =
            draft !== "" &&
            (!Number.isFinite(n) ||
              n < min ||
              n > max ||
              (step === "1" && !Number.isInteger(n)));
          setInvalid(bad);
          setDraft(value === null ? "" : String(value));
        }}
      />
      {invalid && (
        <small id={hintId} className="danger-text">
          Usa un valor entre {min} y {max}. Se conservó el último valor válido.
        </small>
      )}
    </>
  );
}
