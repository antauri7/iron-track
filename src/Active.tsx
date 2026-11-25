import ExerciseVisual from "./ExerciseVisual";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  ArrowUpRight,
  ArrowLeft,
  Play,
  Timer,
  Check,
  Plus,
  ChevronRight,
  Trash2,
  Copy,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  type Session,
  type SessionExercise,
  type SetLog,
  blankSet,
} from "./model";
import { physicalSets, remaining, seconds, comparable } from "./engine";
import { useApp, Card, Empty, Field, Num, toKg, fromKg } from "./ui";
function Active() {
  const { state, mutate, notify } = useApp();
  const navigate = useNavigate();
  const session = state.sessions.find((s) => s.status === "activa");
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const [finish, setFinish] = useState(false);
  const alarm = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const rest = remaining(session?.rest, tick);
  useEffect(() => {
    if (rest > 0) alarm.current = false;
    if (
      session?.rest &&
      rest === 0 &&
      !alarm.current &&
      session.rest.remaining === undefined
    ) {
      alarm.current = true;
      notify("Descanso terminado. Continúa cuando estés listo.");
      if (state.profile?.vibration) navigator.vibrate?.([200, 100, 200]);
      if (state.profile?.sound) {
        const audio = new AudioContext();
        const o = audio.createOscillator(),
          g = audio.createGain();
        o.connect(g);
        g.connect(audio.destination);
        g.gain.value = 0.1;
        o.frequency.value = 660;
        o.start();
        o.stop(audio.currentTime + 0.3);
        o.onended = () => audio.close();
      }
    }
  }, [rest, session?.rest, state.profile, notify]);
  if (!session)
    return (
      <>
        <Empty>No hay una sesión activa.</Empty>
        <button className="primary" onClick={() => navigate("/entrenar")}>
          Elegir rutina
        </button>
      </>
    );
  const current =
    session.exercises[Math.min(index, session.exercises.length - 1)];
  const elapsed = Math.max(
    0,
    Math.floor((tick - Date.parse(session.startedAt)) / 1000),
  );
  const unit = state.profile?.unit ?? "kg";
  const done = session.exercises.reduce((n, e) => n + physicalSets(e.sets), 0),
    total = session.exercises.reduce((n, e) => n + e.plan.sets, 0);
  const edit = (fn: (s: Session) => void) =>
    mutate((s) => fn(s.sessions.find((x) => x.id === session.id)!));
  const editExercise = (fn: (e: SessionExercise) => void) =>
    edit((s) => fn(s.exercises[index]));
  const editSet = (i: number, fn: (s: SetLog) => void) =>
    editExercise((e) => fn(e.sets[i]));
  const previous = [...state.sessions]
    .filter(
      (s) =>
        s.id !== session.id &&
        s.status !== "activa" &&
        s.startedAt < session.startedAt,
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((s) => s.exercises)
    .find((e) => comparable(e, current));
  function complete(i: number) {
    const set = current.sets[i];
    if (
      set.weight === null ||
      set.reps === null ||
      set.reps < 1 ||
      set.rir === null
    )
      return notify(
        "Registra carga, repeticiones y RIR antes de completar la serie.",
      );
    edit((s) => {
      const row = s.exercises[index].sets[i];
      row.status = "completada";
      if (s.rest)
        row.restActual = Math.max(
          0,
          Math.floor((Date.now() - s.rest.started) / 1000),
        );
      if (state.profile?.autoRest)
        s.rest = {
          end: Date.now() + current.plan.rest * 1000,
          target: current.plan.rest,
          started: Date.now(),
        };
    });
  }
  return (
    <>
      <div className="row active-heading">
        <button
          className="icon-button"
          aria-label="Volver a rutinas"
          onClick={() => navigate("/entrenar")}
        >
          <ArrowLeft />
        </button>
        <div>
          <p className="eyebrow accent">ENTRENAMIENTO ACTIVO</p>
          <h2>{session.routineName}</h2>
        </div>
        <span className="session-clock">
          <Timer size={18} />
          {seconds(elapsed)}
        </span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${Math.min(100, (done / total) * 100)}%` }} />
      </div>
      <div className="row">
        <p className="muted">
          Ejercicio {index + 1} de {session.exercises.length} · {done} / {total}{" "}
          series
        </p>
        <button onClick={() => setFinish(true)}>Finalizar sesión</button>
      </div>
      {elapsed >= ((state.profile?.minutes ?? 90) - 15) * 60 && (
        <div className="alert">
          {elapsed >= (state.profile?.minutes ?? 90) * 60
            ? "Has llegado al tiempo objetivo. Puedes finalizar o continuar voluntariamente."
            : "Quedan 15 minutos de tu tiempo objetivo."}
        </div>
      )}
      <div className="active-layout">
        <div>
          <Card>
            <div className="row">
              <span className="eyebrow accent">
                {current.exercise.muscle} / {current.exercise.equipment}
              </span>
              <select
                aria-label="Ir a ejercicio"
                value={index}
                onChange={(e) => setIndex(+e.target.value)}
              >
                {session.exercises.map((e, i) => (
                  <option value={i} key={i}>
                    {i + 1}. {e.exercise.name}
                  </option>
                ))}
              </select>
            </div>
            <h1 className="exercise-title">{current.exercise.name}</h1>
            <div className="badges">
              <span>
                {current.plan.min}–{current.plan.max} reps
              </span>
              <span>RIR {current.plan.rir}</span>
              <span>{current.plan.rest} s descanso</span>
            </div>
            <details className="exercise-guide">
              <summary>
                Técnica, equipo y sustitución <ChevronRight size={16} />
              </summary>
              <ExerciseVisual muscle={current.exercise.muscle} />
              <div className="technique">
                <Dumbbell />
                <p>{current.exercise.instruction}</p>
              </div>
              <small>
                La guía muestra el grupo muscular; la ilustración específica de
                ejecución está pendiente de revisión técnica.
              </small>
              <div className="form-grid">
                <Field label="Identificador del equipo / máquina">
                  <input
                    value={current.machine}
                    placeholder="Ej. máquina del gimnasio"
                    onChange={(e) =>
                      editExercise((x) => {
                        x.machine = e.target.value;
                      })
                    }
                  />
                </Field>
                <Field label="Convención de la carga">
                  <select
                    value={current.weightMode}
                    onChange={(e) =>
                      editExercise((x) => {
                        x.weightMode = e.target
                          .value as SessionExercise["weightMode"];
                      })
                    }
                  >
                    <option value="total">Peso total</option>
                    <option value="por mancuerna">Por mancuerna</option>
                  </select>
                </Field>
                <Field label="Sustituir ejercicio">
                  <select
                    disabled={current.sets.some(
                      (s) => s.status === "completada",
                    )}
                    value={current.exercise.id}
                    onChange={(e) =>
                      editExercise((x) => {
                        x.exercise = structuredClone(
                          state.exercises.find(
                            (ex) => ex.id === e.target.value,
                          )!,
                        );
                        x.plan.exerciseId = x.exercise.id;
                      })
                    }
                  >
                    {state.exercises.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </details>
          </Card>
          <Card className="set-card">
            <div className="set-head">
              <span>Serie</span>
              <span>Anterior</span>
              <span>{unit}</span>
              <span>Reps</span>
              <span>RIR</span>
              <span>Estado</span>
            </div>
            {current.sets.map((set, i) => (
              <div
                className={
                  "set-entry " +
                  (set.status === "completada" ? "completed" : "")
                }
                key={set.id}
              >
                <div className="set-row">
                  <strong>
                    {i + 1}
                    <small>
                      {set.side === "ambos"
                        ? ""
                        : set.side === "derecho"
                          ? "DER"
                          : "IZQ"}
                    </small>
                  </strong>
                  <span className="previous">
                    {previous?.sets[i]?.weight !== null &&
                    previous?.sets[i]?.weight !== undefined
                      ? `${fromKg(previous.sets[i].weight, unit)} × ${previous.sets[i].reps ?? "—"}`
                      : "—"}
                  </span>
                  <Num
                    value={fromKg(set.weight, unit)}
                    onChange={(v) =>
                      editSet(i, (s) => {
                        s.weight = toKg(v, unit);
                      })
                    }
                    label={`Peso serie ${i + 1}`}
                  />
                  <Num
                    value={set.reps}
                    onChange={(v) =>
                      editSet(i, (s) => {
                        s.reps = v;
                      })
                    }
                    label={`Repeticiones serie ${i + 1}`}
                    max={1000}
                    step="1"
                  />
                  <Num
                    value={set.rir}
                    onChange={(v) =>
                      editSet(i, (s) => {
                        s.rir = v;
                      })
                    }
                    label={`RIR serie ${i + 1}`}
                    max={10}
                  />
                  <button
                    className={
                      "check-button " +
                      (set.status === "completada" ? "checked" : "")
                    }
                    aria-label={`Completar serie ${i + 1}`}
                    onClick={() =>
                      set.status === "completada"
                        ? editSet(i, (s) => {
                            s.status = "pendiente";
                          })
                        : complete(i)
                    }
                  >
                    <Check size={18} />
                  </button>
                </div>
                <details>
                  <summary>
                    Opciones · {set.type} · {set.status}
                  </summary>
                  <div className="form-grid">
                    <Field label="Tipo">
                      <select
                        value={set.type}
                        onChange={(e) =>
                          editSet(i, (s) => {
                            s.type = e.target.value as SetLog["type"];
                          })
                        }
                      >
                        {[
                          "Efectiva",
                          "Aproximación",
                          "Calentamiento",
                          "Descendente",
                          "Back-off",
                          "Superserie",
                          "Fallo",
                          "Adicional",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Lado">
                      <select
                        value={set.side}
                        onChange={(e) =>
                          editSet(i, (s) => {
                            s.side = e.target.value as SetLog["side"];
                          })
                        }
                      >
                        {["ambos", "izquierdo", "derecho"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="RPE opcional">
                      <Num
                        value={set.rpe ?? null}
                        min={1}
                        max={10}
                        label="RPE"
                        onChange={(v) =>
                          editSet(i, (s) => {
                            s.rpe = v;
                          })
                        }
                      />
                    </Field>
                    <Field label="Observaciones">
                      <input
                        value={set.notes}
                        onChange={(e) =>
                          editSet(i, (s) => {
                            s.notes = e.target.value;
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="actions">
                    <button
                      disabled={!i}
                      onClick={() =>
                        editSet(i, (s) => {
                          s.weight = current.sets[i - 1].weight;
                        })
                      }
                    >
                      <Copy size={14} />
                      Copiar carga anterior
                    </button>
                    <button
                      onClick={() =>
                        editSet(i, (s) => {
                          s.status = "omitida";
                        })
                      }
                    >
                      Omitir
                    </button>
                    <button
                      onClick={() =>
                        editSet(i, (s) => {
                          s.status = "interrumpida";
                        })
                      }
                    >
                      Interrumpida
                    </button>
                    <button
                      aria-label="Eliminar serie"
                      onClick={() =>
                        editExercise((e) => {
                          e.sets.splice(i, 1);
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {set.type === "Descendente" && (
                    <div>
                      <small>
                        Los segmentos no suman series físicas independientes.
                      </small>
                      {set.segments.map((d, j) => (
                        <div className="form-grid" key={j}>
                          <Field label={`Carga segmento ${j + 1} (${unit})`}>
                            <Num
                              label="Carga segmento"
                              value={fromKg(d.weight, unit)}
                              onChange={(v) =>
                                editSet(i, (s) => {
                                  s.segments[j].weight = toKg(v, unit) ?? 0;
                                })
                              }
                            />
                          </Field>
                          <Field label="Repeticiones">
                            <Num
                              label="Repeticiones segmento"
                              value={d.reps}
                              min={1}
                              onChange={(v) =>
                                editSet(i, (s) => {
                                  s.segments[j].reps = v ?? 1;
                                })
                              }
                            />
                          </Field>
                          <button
                            onClick={() =>
                              editSet(i, (s) => {
                                s.segments.splice(j, 1);
                              })
                            }
                          >
                            Quitar segmento
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          editSet(i, (s) => {
                            s.segments.push({ weight: 0, reps: 1 });
                          })
                        }
                      >
                        Agregar segmento
                      </button>
                    </div>
                  )}
                </details>
              </div>
            ))}
            <button
              className="subtle wide"
              onClick={() =>
                editExercise((e) => {
                  e.sets.push(blankSet());
                })
              }
            >
              <Plus size={16} />
              Agregar serie
            </button>
          </Card>
          <Card>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={current.technique}
                onChange={(e) =>
                  editExercise((x) => {
                    x.technique = e.target.checked;
                  })
                }
              />
              Mantuve una técnica controlada en todas las series
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={current.pain}
                onChange={(e) =>
                  editExercise((x) => {
                    x.pain = e.target.checked;
                  })
                }
              />
              Hubo dolor durante el ejercicio
            </label>
            <div className="actions">
              <button
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
              >
                Anterior
              </button>
              <button
                className="primary"
                disabled={index === session.exercises.length - 1}
                onClick={() => setIndex(index + 1)}
              >
                Siguiente ejercicio <ChevronRight size={18} />
              </button>
            </div>
          </Card>
        </div>
        <div className="rest-column">
          <Card className="rest-card">
            <p className="eyebrow">DESCANSO ENTRE SERIES</p>
            <div
              className="timer-circle"
              style={
                {
                  "--progress": `${Math.min(100, (rest / (session.rest?.target || 1)) * 100)}%`,
                } as React.CSSProperties
              }
            >
              <div>
                <strong>{seconds(rest)}</strong>
                <small>
                  DE {seconds(session.rest?.target ?? current.plan.rest)}
                </small>
              </div>
            </div>
            <div className="actions">
              <button
                onClick={() =>
                  edit((s) => {
                    if (s.rest) {
                      if (s.rest.remaining !== undefined)
                        s.rest.remaining = Math.max(0, s.rest.remaining - 15);
                      else s.rest.end -= 15000;
                    }
                  })
                }
              >
                −15 s
              </button>
              <button
                aria-label={
                  session.rest?.remaining !== undefined
                    ? "Reanudar descanso"
                    : "Pausar descanso"
                }
                onClick={() =>
                  edit((s) => {
                    if (!s.rest)
                      s.rest = {
                        end: Date.now() + current.plan.rest * 1000,
                        started: Date.now(),
                        target: current.plan.rest,
                      };
                    else if (s.rest.remaining !== undefined) {
                      s.rest.end = Date.now() + s.rest.remaining * 1000;
                      delete s.rest.remaining;
                    } else s.rest.remaining = remaining(s.rest);
                  })
                }
              >
                {session.rest?.remaining !== undefined ? (
                  <Play size={18} />
                ) : (
                  <Pause size={18} />
                )}
              </button>
              <button
                onClick={() =>
                  edit((s) => {
                    if (s.rest) {
                      if (s.rest.remaining !== undefined)
                        s.rest.remaining += 30;
                      else s.rest.end += 30000;
                    }
                  })
                }
              >
                +30 s
              </button>
            </div>
            <div className="actions">
              <button
                onClick={() =>
                  edit((s) => {
                    s.rest = {
                      end: Date.now() + current.plan.rest * 1000,
                      started: Date.now(),
                      target: current.plan.rest,
                    };
                  })
                }
              >
                <RotateCcw size={15} />
                Reiniciar
              </button>
              <button
                onClick={() =>
                  edit((s) => {
                    delete s.rest;
                  })
                }
              >
                Terminar
              </button>
            </div>
            <div className="actions">
              <button
                onClick={() =>
                  edit((s) => {
                    if (s.rest) {
                      if (s.rest.remaining !== undefined)
                        s.rest.remaining += 15;
                      else s.rest.end += 15000;
                    }
                  })
                }
              >
                +15 s
              </button>
            </div>
            <p className="muted" style={{ marginTop: 16 }}>
              Próxima serie:{" "}
              {current.sets.findIndex((s) => s.status === "pendiente") + 1 ||
                "—"}{" "}
              · {current.plan.min}–{current.plan.max} reps
              <br />
              Carga registrada:{" "}
              {fromKg(
                current.sets.find((s) => s.status === "pendiente")?.weight ??
                  null,
                unit,
              ) ?? "Por definir"}{" "}
              {unit}
            </p>
            <small>
              Descanso real transcurrido:{" "}
              {session.rest
                ? seconds(
                    Math.max(
                      0,
                      Math.floor((tick - session.rest.started) / 1000),
                    ),
                  )
                : "—"}
              . Los avisos en segundo plano dependen del navegador.
            </small>
          </Card>
          <Card>
            <h3>Tu referencia anterior</h3>
            {previous ? (
              <p>
                {previous.sets
                  .filter((s) => s.status === "completada")
                  .map(
                    (s) =>
                      `${fromKg(s.weight, unit) ?? "—"} ${unit} × ${s.reps ?? "—"}`,
                  )
                  .join(" · ")}
              </p>
            ) : (
              <p className="muted">
                Todavía no hay una sesión comparable con este equipo y
                convención de carga.
              </p>
            )}
            <NavLink to="/calculadoras">
              Calcular aproximaciones <ArrowUpRight size={16} />
            </NavLink>
            <button
              className="subtle wide"
              onClick={async () => {
                try {
                  await navigator.wakeLock.request("screen");
                  notify("Pantalla activa mientras el navegador lo permita.");
                } catch {
                  notify("Este navegador no pudo mantener la pantalla activa.");
                }
              }}
            >
              Mantener pantalla activa
            </button>
          </Card>
        </div>
      </div>
      {finish && (
        <div className="modal-backdrop">
          <Card className="modal">
            <h2>Guarda el esfuerzo de hoy.</h2>
            <p>
              {done} series efectivas registradas · {seconds(elapsed)}
            </p>
            <Field label="Notas de la sesión">
              <textarea
                value={session.notes}
                onChange={(e) =>
                  edit((s) => {
                    s.notes = e.target.value;
                  })
                }
              />
            </Field>
            <div className="actions">
              <button onClick={() => setFinish(false)}>
                Seguir entrenando
              </button>
              <button
                className="primary"
                onClick={() => {
                  edit((s) => {
                    s.endedAt = new Date().toISOString();
                    s.status = s.exercises.every(
                      (e) => physicalSets(e.sets) >= e.plan.sets,
                    )
                      ? "completada"
                      : "parcial";
                    delete s.rest;
                  });
                  navigate("/progreso");
                  notify("Sesión guardada. Cada repetición cuenta.");
                }}
              >
                Guardar y finalizar
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default Active;
