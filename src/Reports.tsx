import { useState } from "react";
import { Dumbbell, Timer, Scale, Check } from "lucide-react";
import { download } from "./storage";
import { muscles, today, dateLabel, dayKey } from "./model";
import { physicalSets, volume, weekRange } from "./engine";
import { useApp, Card, Empty, Field } from "./ui";
import { Stat } from "./metrics";
import { Records } from "./charts";
function Reports() {
  const { state } = useApp();
  const [start, setStart] = useState(weekRange(today()).start);
  const [end, setEnd] = useState(today());
  const sessions = state.sessions.filter(
    (s) =>
      s.status !== "activa" &&
      dayKey(s.startedAt) >= start &&
      dayKey(s.startedAt) <= end,
  );
  const measurements = state.measurements.filter(
    (m) => m.date >= start && m.date <= end,
  );
  const recovery = state.recovery.filter(
    (r) => r.date >= start && r.date <= end,
  );
  const series = sessions.reduce(
    (n, s) => n + s.exercises.reduce((a, e) => a + physicalSets(e.sets), 0),
    0,
  );
  const minutes = Math.round(
    sessions.reduce(
      (n, s) =>
        n +
        (Date.parse(s.endedAt ?? s.startedAt) - Date.parse(s.startedAt)) /
          60000,
      0,
    ),
  );
  const weeklyWeight = new Map<string, number[]>();
  measurements
    .filter((m) => m.values.Peso !== undefined)
    .forEach((m) => {
      const key = weekRange(m.date).start;
      weeklyWeight.set(key, [...(weeklyWeight.get(key) ?? []), m.values.Peso]);
    });
  const weights = Array.from(weeklyWeight, ([date, values]) => ({
    date: dateLabel(date),
    mean:
      Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) /
      100,
    n: values.length,
  }));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">OBSERVA EL CAMINO RECORRIDO</p>
          <h1>Informe de progreso.</h1>
          <p>
            {dateLabel(start)} — {dateLabel(end)}
          </p>
        </div>
        <div className="actions">
          <button onClick={() => window.print()}>Imprimir / Guardar PDF</button>
          <button
            onClick={() =>
              download(
                `informe-${start}-${end}.json`,
                JSON.stringify({
                  app: "IRON TRACK",
                  type: "report",
                  start,
                  end,
                  sessions,
                  measurements,
                  recovery,
                  summary: { series, minutes },
                  weightWeeklyMeans: weights,
                }),
              )
            }
          >
            Exportar informe JSON
          </button>
        </div>
      </div>
      <Card>
        <div className="tabs">
          {["Semana", "Mes", "Ciclo", "Año", "Todo"].map((label, i) => (
            <button
              key={label}
              onClick={() => {
                const t = today();
                setEnd(t);
                setStart(
                  i === 0
                    ? weekRange(t).start
                    : i === 1
                      ? t.slice(0, 7) + "-01"
                      : i === 2
                        ? (state.profile?.cycleStart ?? t)
                        : i === 3
                          ? t.slice(0, 4) + "-01-01"
                          : (state.sessions
                              .map((s) => dayKey(s.startedAt))
                              .sort()[0] ?? t),
                );
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <Field label="Desde">
            <input
              type="date"
              value={start}
              max={end}
              onChange={(e) => e.target.value && setStart(e.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              value={end}
              min={start}
              max={today()}
              onChange={(e) => e.target.value && setEnd(e.target.value)}
            />
          </Field>
        </div>
      </Card>
      <div className="stats-grid progress-stats">
        <Stat
          icon={<Check />}
          label="Sesiones registradas"
          value={String(sessions.length)}
          link="/historial"
        />
        <Stat
          icon={<Timer />}
          label="Tiempo real"
          value={`${minutes} min`}
          link="/historial"
        />
        <Stat
          icon={<Dumbbell />}
          label="Series físicas efectivas"
          value={String(series)}
          link="/progreso"
        />
        <Stat
          icon={<Scale />}
          label="Mediciones corporales"
          value={String(measurements.length)}
          link="/progreso"
        />
      </div>
      <Card>
        <h2>Series directas por músculo</h2>
        {muscles.map((m) => (
          <div className="record-row" key={m}>
            <span>{m}</span>
            <strong>{volume(sessions, m)} series</strong>
          </div>
        ))}
        <small>
          El estímulo indirecto y las estimaciones de 1RM se presentan por
          separado en Progreso.
        </small>
      </Card>
      <Card>
        <h2>Promedios semanales de peso</h2>
        {weights.length ? (
          weights.map((w) => (
            <div className="record-row" key={w.date}>
              <span>Semana de {w.date}</span>
              <strong>{w.mean} kg</strong>
              <small>{w.n} medición(es)</small>
            </div>
          ))
        ) : (
          <Empty>No hay mediciones de peso en este periodo.</Empty>
        )}
      </Card>
      <Records sessions={sessions} />
      <Card>
        <h2>Recuperación registrada</h2>
        {recovery.length ? (
          recovery.map((r) => (
            <div className="record-row" key={r.id}>
              <span>{dateLabel(r.date)}</span>
              <span>
                {r.signals.filter(Boolean).length} señales · energía {r.energy}
                /5 · estrés {r.stress}/5
              </span>
            </div>
          ))
        ) : (
          <p>
            Sin autoevaluaciones en este periodo. No se infiere el estado de
            recuperación sin registros.
          </p>
        )}
      </Card>
    </>
  );
}

export default Reports;
