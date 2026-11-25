import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { type Recovery, uid, today, dateLabel } from "./model";
import { physicalSets, progression, comparable, detectTrend } from "./engine";
import { useApp, Card, Empty, Field, Num, toKg, fromKg } from "./ui";
import { Chart } from "./charts";
function Coach() {
  const { state, mutate } = useApp();
  const [increment, setIncrement] = useState(2.5);
  const [signals, setSignals] = useState(Array(7).fill(false) as boolean[]);
  const [pain, setPain] = useState(false);
  const [sleep, setSleep] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3),
    [stress, setStress] = useState(3),
    [motivation, setMotivation] = useState(3);
  const { notify } = useApp();
  const questions = [
    "Pérdida de fuerza durante varias sesiones",
    "Molestias articulares persistentes",
    "Recuperación muscular insuficiente",
    "Peor calidad de sueño",
    "Cuesta más completar las mismas cargas",
    "Fatiga persistente durante el día",
    "Menos ganas de entrenar",
  ];
  const recent = [...state.sessions]
    .filter((s) => s.status !== "activa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const used = new Set<string>();
  const recommendations = recent.flatMap((s) =>
    s.exercises
      .filter((e) => {
        const key = e.exercise.id + e.machine + e.weightMode;
        if (used.has(key)) return false;
        used.add(key);
        return true;
      })
      .map((e) => ({
        e,
        s,
        result: progression(e, toKg(increment, state.profile?.unit ?? "kg")!),
      })),
  );
  const week = Math.max(
    1,
    Math.floor(
      (Date.parse(today()) - Date.parse(state.profile?.cycleStart ?? today())) /
        604800000,
    ) + 1,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">ENTRENA CON INTELIGENCIA</p>
          <h1>Mi Coach.</h1>
          <p>Reglas transparentes. Decisiones que tú controlas.</p>
        </div>
        <NavLink to="/ciencia" className="button">
          <BookOpen size={18} />
          Ciencia del entrenamiento
        </NavLink>
      </div>
      <Card>
        <div className="row">
          <h2>Tu ciclo de ocho semanas</h2>
          <span className="tag">SEMANA {week}</span>
        </div>
        <div className="cycle">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              className={
                i + 1 === week ? "current" : i + 1 < week ? "past" : ""
              }
              key={i}
            >
              <strong>{i + 1}</strong>
              <small>
                {
                  [
                    "Adaptación",
                    "Adaptación",
                    "Progresión",
                    "Progresión",
                    "Intensificación",
                    "Intensificación",
                    "Consolidación",
                    "Evaluación",
                  ][i]
                }
              </small>
            </div>
          ))}
        </div>
        <p>
          {week <= 2
            ? "Aprende las cargas y calibra el RIR. Mantén un margen conservador de 2–3 repeticiones."
            : week <= 4
              ? "Mejora repeticiones y utiliza la doble progresión, conservando el RIR específico de cada ejercicio."
              : week <= 6
                ? "Revisa rendimiento y recuperación antes de incorporar técnicas intensivas."
                : week === 7
                  ? "Consolida mejoras con técnica y descansos comparables."
                  : "Evalúa el ciclo. La descarga es una opción según tu recuperación, no una obligación."}
        </p>
        <Field label="Fecha de inicio del ciclo">
          <input
            type="date"
            value={state.profile?.cycleStart ?? today()}
            onChange={(e) =>
              e.target.value &&
              mutate((s) => {
                s.profile!.cycleStart = e.target.value;
              })
            }
          />
        </Field>
        {week > 8 && (
          <button
            onClick={() =>
              mutate((s) => {
                s.profile!.cycleStart = today();
              })
            }
          >
            Iniciar nuevo ciclo conservando historial
          </button>
        )}
      </Card>
      <AdvancedCoach />
      <div className="section-title">
        <h2>Progresión explicable</h2>
        <Field label={`Incremento mínimo disponible (${state.profile?.unit})`}>
          <Num
            value={increment}
            min={0.1}
            max={50}
            label="Incremento"
            onChange={(v) => setIncrement(v ?? 2.5)}
          />
        </Field>
      </div>
      {recommendations.length ? (
        recommendations.map(({ e, s, result }) => {
          const key = s.id + e.exercise.id + e.machine;
          const decision = state.decisions.find((d) => d.key === key);
          return (
            <Card key={key}>
              <div className="row">
                <h3>{e.exercise.name}</h3>
                <span className="tag">CONFIANZA LIMITADA · REGLA LOCAL</span>
              </div>
              <p>{result.reason}</p>
              <small>
                Datos: sesión del {dateLabel(s.startedAt)},{" "}
                {physicalSets(e.sets)} series físicas, equipo{" "}
                {e.machine || "sin identificar"}. Vigila técnica, dolor, RIR y
                descanso.
              </small>
              {result.weight !== null && (
                <p className="accent">
                  {result.increase ? "Propuesta" : "Referencia"}:{" "}
                  {fromKg(result.weight, state.profile?.unit ?? "kg")}{" "}
                  {state.profile?.unit}
                </p>
              )}
              {decision ? (
                <span className="tag">
                  Decisión registrada: {decision.decision}
                </span>
              ) : (
                <div className="actions">
                  {["Aceptar", "Modificar", "Rechazar"].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        const choice =
                          d === "Modificar"
                            ? prompt("Escribe el ajuste que prefieres:")
                            : d;
                        if (!choice) return;
                        mutate((st) =>
                          st.decisions.push({
                            id: uid(),
                            date: today(),
                            key,
                            decision: choice,
                          }),
                        );
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              <small>
                Aceptar registra tu decisión; la carga de la siguiente sesión la
                introduces tú.
              </small>
            </Card>
          );
        })
      ) : (
        <Card>
          <Empty>
            Necesito tus primeras sesiones para proponer una progresión. No
            aumentaré cargas ni series por calendario.
          </Empty>
        </Card>
      )}
      <Card>
        <h2>¿Cómo te estás recuperando?</h2>
        <p>
          Revisión voluntaria de las últimas dos semanas. Orientación práctica,
          no cuestionario clínico validado.
        </p>
        {questions.map((q, i) => (
          <label className="checkbox" key={q}>
            <input
              type="checkbox"
              checked={signals[i]}
              onChange={(e) =>
                setSignals(
                  signals.map((v, j) => (i === j ? e.target.checked : v)),
                )
              }
            />
            {q}
          </label>
        ))}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={pain}
            onChange={(e) => setPain(e.target.checked)}
          />
          Dolor persistente o síntoma importante
        </label>
        <div className="form-grid">
          <Field label="Horas de sueño">
            <Num
              label="Horas de sueño"
              value={sleep}
              max={24}
              onChange={setSleep}
            />
          </Field>
          {[
            ["Energía", energy, setEnergy],
            ["Estrés", stress, setStress],
            ["Motivación", motivation, setMotivation],
          ].map(([label, value, set]) => (
            <Field key={label as string} label={`${label} (1–5)`}>
              <select
                value={value as number}
                onChange={(e) => (set as (n: number) => void)(+e.target.value)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
        <p className={pain ? "danger-text" : "accent"}>
          {pain
            ? "Atiende el dolor independientemente del número de señales. Si tienes dolor agudo, dolor de pecho, desmayo o mareo importante, detén el entrenamiento y busca atención profesional apropiada."
            : signals.filter(Boolean).length >= 3
              ? "Considera ajustar la carga de entrenamiento y evaluar posibles causas."
              : signals.some(Boolean)
                ? "Revisa recuperación y carga. Observa cómo evoluciona tu rendimiento."
                : "Sin señales marcadas: sigue observando el rendimiento."}
        </p>
        <button
          className="primary"
          onClick={() => {
            const r: Recovery = {
              id: uid(),
              date: today(),
              signals,
              pain,
              sleep,
              energy,
              stress,
              motivation,
              notes: "",
            };
            mutate((s) => s.recovery.push(r));
            notify("Autoevaluación guardada.");
          }}
        >
          Guardar autoevaluación
        </button>
        {state.recovery.slice(-4).map((r) => (
          <div className="record-row" key={r.id}>
            <span>{dateLabel(r.date)}</span>
            <span>
              {r.signals.filter(Boolean).length} señales · energía {r.energy}/5
              · sueño {r.sleep ?? "—"} h
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}

function AdvancedCoach() {
  const { state, mutate } = useApp();
  const sessions = [...state.sessions]
    .filter((s) => s.status !== "activa")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const lastRecovery = state.recovery.at(-1);
  const keys = new Set<string>();
  const trends = sessions
    .flatMap((s) => s.exercises)
    .filter((e) => {
      const k = e.exercise.id + e.machine + e.weightMode;
      if (keys.has(k)) return false;
      keys.add(k);
      return true;
    })
    .map((e) => {
      const history = sessions.flatMap((s) =>
        s.exercises.filter((x) => comparable(x, e)),
      );
      return { exercise: e, trend: detectTrend(history), n: history.length };
    })
    .filter((x) => x.trend === "descenso" || x.trend === "estable");
  const recoveryChart = state.recovery
    .slice(-14)
    .map((r) => ({ date: dateLabel(r.date), energy: r.energy }));
  return (
    <>
      {lastRecovery?.pain && (
        <Card>
          <h3 className="warning">Atiende las molestias reportadas</h3>
          <p>
            La última autoevaluación indica dolor. Revisa su evolución antes de
            aumentar cargas o volumen y busca valoración profesional si es
            persistente. Una puntuación general baja no descarta una molestia
            importante.
          </p>
        </Card>
      )}
      {trends.map((t) => (
        <Card key={t.exercise.exercise.id + t.exercise.machine}>
          <div className="row">
            <h3>{t.exercise.exercise.name}</h3>
            <span className="tag">SEGUIMIENTO · CONFIANZA LIMITADA</span>
          </div>
          <p>
            {t.trend === "descenso"
              ? "El volumen de carga disminuyó más de 5% en cada una de las últimas dos comparaciones. Revisa descansos, esfuerzo y recuperación; una disminución temporal no demuestra pérdida muscular."
              : "Las últimas tres sesiones comparables muestran el mismo volumen de carga. Revisa repeticiones, RIR y descansos antes de añadir series."}
          </p>
          <small>
            Datos usados: {t.n} sesiones del mismo ejercicio, equipo y
            convención. El volumen de carga es un indicador parcial, no mide la
            calidad de la técnica.
          </small>
          {t.exercise.exercise.muscle === "Pecho" ||
          t.exercise.exercise.name.toLowerCase().includes("militar") ? (
            <p>
              Revisa si el trabajo de tríceps del día anterior afecta tus
              presses. Puedes valorar mayor RIR en tríceps o trasladarlo al
              final del día de pecho. No se cambia tu rutina automáticamente.
            </p>
          ) : null}
        </Card>
      ))}
      <Card>
        <h3>Antes de aumentar volumen</h3>
        <p>
          Primero reúne al menos tres semanas de registros, confirma
          recuperación, ausencia de dolor y sesiones dentro de tu tiempo
          disponible. La ausencia de cansancio por sí sola no justifica más
          series. En esta versión los aumentos de volumen se deciden manualmente
          desde el editor de rutinas.
        </p>
        <NavLink className="accent" to="/entrenar">
          Revisar mis rutinas →
        </NavLink>
      </Card>
      {recoveryChart.length > 0 && (
        <Card>
          <h3>Energía registrada · últimos 14 registros</h3>
          <Chart data={recoveryChart} dataKey="energy" />
          <small>
            Escala subjetiva de 1 a 5. No se interpreta como diagnóstico.
          </small>
        </Card>
      )}
      <Card>
        <h3>Variante temporal de descarga</h3>
        <p>
          Crea una copia editable con aproximadamente 50% menos series y RIR
          mínimo 3. No reemplaza tu programa ni modifica el historial. Actívala
          y archiva temporalmente las rutinas habituales si decides utilizarla.
        </p>
        <button
          onClick={() => {
            if (
              !confirm(
                "¿Crear copias archivadas de las rutinas activas con menor volumen?",
              )
            )
              return;
            mutate((s) => {
              s.routines.push(
                ...s.routines
                  .filter((r) => !r.archived)
                  .map((r) => ({
                    ...structuredClone(r),
                    id: uid(),
                    name: r.name + " · descarga",
                    version: 1,
                    archived: true,
                    exercises: r.exercises.map((p) => ({
                      ...p,
                      sets: Math.max(1, Math.round(p.sets * 0.5)),
                      rir: Math.max(3, p.rir),
                    })),
                  })),
              );
            });
          }}
        >
          Crear variante de descarga
        </button>
      </Card>
    </>
  );
}

export default Coach;
