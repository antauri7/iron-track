import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { type Session } from "./model";
import { e1rm } from "./engine";
import { useApp, Card, Empty, fromKg } from "./ui";
export function Chart({
  data,
  dataKey,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
}) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 15, bottom: 10, left: 0 }}
        >
          <defs>
            <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B9F34B" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#B9F34B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#283242"
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
          <YAxis
            domain={["auto", "auto"]}
            stroke="#94A3B8"
            fontSize={11}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: "#151D29",
              border: "1px solid #283242",
              borderRadius: 12,
              color: "#F8FAFC",
            }}
          />
          <Area
            dataKey={dataKey}
            name="Registro"
            stroke="#B9F34B"
            strokeWidth={3}
            fill="url(#green)"
            dot={{ fill: "#B9F34B", r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Records({ sessions }: { sessions: Session[] }) {
  const { state } = useApp();
  const records = new Map<
    string,
    { name: string; weight: number; rm: number | null; reps: number }
  >();
  sessions.forEach((s) =>
    s.exercises.forEach((e) =>
      e.sets
        .filter(
          (x) =>
            x.status === "completada" &&
            x.type === "Efectiva" &&
            x.weight !== null &&
            x.reps !== null,
        )
        .forEach((set) => {
          const key =
            e.exercise.id +
            ":" +
            e.machine +
            ":" +
            e.weightMode +
            ":" +
            set.side;
          const value = records.get(key);
          if (!value || set.weight! > value.weight)
            records.set(key, {
              name:
                e.exercise.name +
                " · " +
                (e.machine || "sin identificador") +
                " · " +
                e.weightMode +
                " · " +
                set.side,
              weight: set.weight!,
              rm: e1rm(set.weight!, set.reps!),
              reps: set.reps!,
            });
        }),
    ),
  );
  return (
    <Card>
      <h3>Mejores cargas comparables</h3>
      <p className="muted">
        1RM estimado con Epley, solo para series de 1–10 repeticiones. Es una
        estimación, no una prueba máxima.
      </p>
      {records.size ? (
        Array.from(records.values()).map((r, i) => (
          <div className="record-row" key={i}>
            <span>{r.name}</span>
            <strong>
              {fromKg(r.weight, state.profile?.unit ?? "kg")}{" "}
              {state.profile?.unit} × {r.reps}
            </strong>
            <small>
              e1RM{" "}
              {r.rm
                ? fromKg(
                    Math.round(r.rm * 10) / 10,
                    state.profile?.unit ?? "kg",
                  )
                : "—"}
            </small>
          </div>
        ))
      ) : (
        <Empty>
          Las mejores cargas aparecerán al completar tus primeras series.
        </Empty>
      )}
    </Card>
  );
}
