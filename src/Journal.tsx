import { useState } from "react";
import {
  Plus,
  Target,
  Check,
  NotebookPen,
  Archive,
  ArrowUpRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { type ProcessGoal, today, uid, dateLabel } from "./model";
import { weekRange } from "./engine";
import { shiftDate, goalProgress } from "./tracking-engine";
import { useApp, Card, Field } from "./ui";
import { WeekPulse, BackupStatus } from "./TrackingWidgets";
export default function Journal() {
  const { state, mutate, saveStatus } = useApp();
  const [week, setWeek] = useState(weekRange(today()).start);
  const review = state.weeklyReviews?.find((r) => r.weekStart === week);
  const [draft, setDraft] = useState<ProcessGoal | null>(null);
  const [archived, setArchived] = useState(false);
  const goals = (state.processGoals ?? []).filter(
    (g) => Boolean(g.archived) === archived,
  );
  const writeReview = (
    field: "wins" | "challenge" | "nextStep",
    value: string,
  ) =>
    mutate((s) => {
      s.weeklyReviews ??= [];
      let r = s.weeklyReviews.find((r) => r.weekStart === week);
      if (!r) {
        r = {
          id: uid(),
          weekStart: week,
          wins: "",
          challenge: "",
          nextStep: "",
          updatedAt: new Date().toISOString(),
        };
        s.weeklyReviews.push(r);
      }
      r[field] = value;
      r.updatedAt = new Date().toISOString();
    });
  const newGoal = () =>
    setDraft({
      id: uid(),
      title: "",
      metric: "trainingDays",
      target: 4,
      start: today(),
      end: shiftDate(today(), 27),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">MÁS ALLÁ DE LOS KILOGRAMOS</p>
          <h1>Mi bitácora.</h1>
          <p>Observa lo que funciona. Decide tu siguiente paso.</p>
        </div>
        <button className="primary" onClick={newGoal}>
          <Plus size={18} />
          Nueva meta
        </button>
      </div>
      <WeekPulse showJournalLink={false} />
      <div className="tracking-layout">
        <div>
          <Card className="weekly-review">
            <div className="row">
              <h2>
                <NotebookPen size={23} />
                Una pausa para observar
              </h2>
              <span className="tag">SEMANAL · VOLUNTARIO</span>
            </div>
            <p>
              No necesitas una semana perfecta para encontrar algo que aprender.
            </p>
            <Field label="Semana a revisar">
              <input
                type="date"
                value={week}
                max={today()}
                onChange={(e) =>
                  e.target.value && setWeek(weekRange(e.target.value).start)
                }
              />
            </Field>
            <p className="eyebrow">
              {dateLabel(week)} — {dateLabel(shiftDate(week, 6))}
            </p>
            {(
              [
                [
                  "wins",
                  "¿Qué salió bien?",
                  "Un avance, una decisión o un hábito que quieras reconocer.",
                ],
                [
                  "challenge",
                  "¿Qué te lo dificultó?",
                  "Tiempo, equipo ocupado, organización u otra circunstancia.",
                ],
                [
                  "nextStep",
                  "¿Qué quieres probar la próxima semana?",
                  "Elige un cambio pequeño que esté bajo tu control.",
                ],
              ] as const
            ).map(([key, label, placeholder], i) => (
              <div className="review-prompt" key={key}>
                <span className="review-number">0{i + 1}</span>
                <Field label={label}>
                  <textarea
                    aria-label={label}
                    maxLength={2000}
                    placeholder={placeholder}
                    value={review?.[key] ?? ""}
                    onChange={(e) => writeReview(key, e.target.value)}
                  />
                </Field>
              </div>
            ))}
            <p className={"save-indicator " + saveStatus} aria-live="polite">
              {saveStatus === "saving"
                ? "Guardando reflexión…"
                : saveStatus === "error"
                  ? "No se pudo guardar; revisa el aviso."
                  : review
                    ? "Reflexión guardada en este dispositivo"
                    : "Escribe cuando quieras; se guarda automáticamente."}
            </p>
          </Card>
        </div>
        <div>
          <Card>
            <div className="row">
              <h2>
                <Target size={22} />
                Metas de proceso
              </h2>
              <button
                className="icon-button"
                aria-label="Crear meta"
                onClick={newGoal}
              >
                <Plus size={20} />
              </button>
            </div>
            <p>
              Tú eliges el objetivo y el plazo. Son metas de seguimiento, no
              recomendaciones de carga ni exigencias de entrenamiento.
            </p>
            <button className="subtle" onClick={() => setArchived(!archived)}>
              {archived ? "Ver metas activas" : "Ver metas archivadas"}
            </button>
            {goals.length ? (
              goals.map((g) => {
                const p = goalProgress(state, g),
                  expired = g.end < today();
                return (
                  <article className="process-goal" key={g.id}>
                    <div className="row">
                      <span
                        className={
                          "goal-state " + (p.complete ? "achieved" : "")
                        }
                      >
                        {p.complete ? (
                          <>
                            <Check size={14} />
                            OBJETIVO REGISTRADO
                          </>
                        ) : expired ? (
                          "PERIODO TERMINADO"
                        ) : (
                          "EN CAMINO"
                        )}
                      </span>
                      <strong>
                        {p.count}
                        <small> / {g.target}</small>
                      </strong>
                    </div>
                    <h3>{g.title}</h3>
                    <p className="goal-unit">
                      {g.metric === "trainingDays"
                        ? "Días con entrenamiento"
                        : g.metric === "measurementDays"
                          ? "Días con mediciones"
                          : "Semanas con reflexión"}{" "}
                      · {dateLabel(g.start)} — {dateLabel(g.end)}
                    </p>
                    <div
                      className="goal-track"
                      role="progressbar"
                      aria-label={g.title}
                      aria-valuenow={Math.min(p.count, g.target)}
                      aria-valuemin={0}
                      aria-valuemax={g.target}
                    >
                      <div style={{ width: p.percent + "%" }} />
                    </div>
                    <div className="actions">
                      <button onClick={() => setDraft(structuredClone(g))}>
                        Editar meta
                      </button>
                      <button
                        aria-label={`${g.archived ? "Reactivar" : "Archivar"} meta ${g.title}`}
                        onClick={() =>
                          mutate((s) => {
                            const found = s.processGoals!.find(
                              (x) => x.id === g.id,
                            )!;
                            found.archived = !found.archived;
                            found.updatedAt = new Date().toISOString();
                          })
                        }
                      >
                        <Archive size={14} />
                        {g.archived ? "Reactivar" : "Archivar"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="goals-empty">
                <Target size={30} />
                <h3>
                  {archived
                    ? "Aquí quedarán tus metas archivadas"
                    : "Elige algo que puedas registrar"}
                </h3>
                <p>
                  {archived
                    ? "Las metas se conservan y puedes reactivarlas."
                    : "Por ejemplo: registrar cuatro días de entrenamiento en las próximas cuatro semanas. El objetivo lo decides tú."}
                </p>
                {!archived && (
                  <button onClick={newGoal}>
                    Crear mi primera meta
                    <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
            )}
          </Card>
          <BackupStatus />
        </div>
      </div>
      <Card>
        <h2>Lo que ya has aprendido</h2>
        {state.weeklyReviews?.length ? (
          [...state.weeklyReviews]
            .filter((r) =>
              [r.wins, r.challenge, r.nextStep].some((t) => t.trim()),
            )
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
            .map((r) => (
              <button
                className="review-history-row"
                key={r.id}
                onClick={() => {
                  setWeek(r.weekStart);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              >
                <span>
                  <strong>Semana del {dateLabel(r.weekStart)}</strong>
                  <small>{r.nextStep || r.wins || r.challenge}</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))
        ) : (
          <p>Tus reflexiones aparecerán aquí al empezar a escribir.</p>
        )}
        <NavLink className="tracking-link" to="/informes">
          Consultar informes de entrenamiento
          <ArrowUpRight size={16} />
        </NavLink>
      </Card>
      {draft && (
        <div className="modal-backdrop">
          <form
            className="modal"
            aria-label="Editar meta personal"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = {
                ...draft,
                title: draft.title.trim(),
                updatedAt: new Date().toISOString(),
              };
              if (!value.title || value.end < value.start) return;
              const saved = await mutate((s) => {
                s.processGoals ??= [];
                const i = s.processGoals.findIndex((g) => g.id === value.id);
                if (i < 0) s.processGoals.push(value);
                else s.processGoals[i] = value;
              });
              if (saved) setDraft(null);
            }}
          >
            <h2>Una meta que tenga sentido para ti</h2>
            <Field label="Nombre de la meta">
              <input
                required
                maxLength={120}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Lo que quiero sostener"
              />
            </Field>
            <Field label="Qué quieres registrar">
              <select
                value={draft.metric}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    metric: e.target.value as ProcessGoal["metric"],
                  })
                }
              >
                <option value="trainingDays">
                  Días con entrenamiento registrado
                </option>
                <option value="measurementDays">
                  Días con mediciones corporales
                </option>
                <option value="reviewWeeks">Semanas con reflexión</option>
              </select>
            </Field>
            <Field label="Cantidad objetivo">
              <input
                required
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                step={1}
                value={draft.target || ""}
                onChange={(e) =>
                  setDraft({ ...draft, target: Number(e.target.value) })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Inicio de la meta">
                <input
                  required
                  type="date"
                  value={draft.start}
                  max={draft.end}
                  onChange={(e) =>
                    setDraft({ ...draft, start: e.target.value })
                  }
                />
              </Field>
              <Field label="Fin de la meta">
                <input
                  required
                  type="date"
                  value={draft.end}
                  min={draft.start}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </Field>
            </div>
            <small>
              Un día se cuenta una vez, aunque registres varias sesiones o
              mediciones. Las semanas de reflexión se cuentan por su fecha de
              inicio (lunes). Nada cambia en tu rutina.
            </small>
            <div className="actions">
              <button type="button" onClick={() => setDraft(null)}>
                Cancelar
              </button>
              <button
                className="primary"
                type="submit"
                disabled={
                  !draft.title.trim() ||
                  !draft.start ||
                  !draft.end ||
                  draft.end < draft.start ||
                  draft.target < 1
                }
              >
                Guardar meta
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
