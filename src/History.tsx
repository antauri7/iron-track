import SessionRemoval from "./SessionRemoval";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Download, Trash2, RotateCcw } from "lucide-react";
import { download } from "./storage";
import { type Session, type SetLog, today, dateLabel, dayKey } from "./model";
import { createSession, physicalSets, tonnage, restoreSession } from "./engine";
import { useApp, Card, Empty, Field, Num } from "./ui";
function History() {
  const { state, mutate, notify } = useApp();
  const [search] = useSearchParams();
  const requested = search.get("fecha") ?? "";
  const validRequested =
    /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
    !Number.isNaN(Date.parse(requested + "T12:00:00Z")) &&
    new Date(requested + "T12:00:00Z").toISOString().slice(0, 10) === requested;
  const [month, setMonth] = useState(
    (validRequested ? requested : today()).slice(0, 7),
  );
  const [selected, setSelected] = useState<Session | null>(null);
  const [date, setDate] = useState(validRequested ? requested : today());
  const [selectedOnly, setSelectedOnly] = useState(validRequested);
  useEffect(() => {
    if (validRequested) {
      setMonth(requested.slice(0, 7));
      setDate(requested);
      setSelectedOnly(true);
    }
  }, [requested]);
  const [removing, setRemoving] = useState<Session | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const sorted = [...state.sessions]
    .filter((s) => dayKey(s.startedAt).slice(0, 7) === month)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const visible = selectedOnly
    ? sorted.filter((s) => dayKey(s.startedAt) === date)
    : sorted;
  const count = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)),
    0,
  ).getDate();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">CADA SESIÓN DEJA HUELLA</p>
          <h1>Tu historial.</h1>
          <p>Revisa, corrige y conserva tu entrenamiento.</p>
        </div>
        <div className="actions">
          <button
            onClick={() => {
              const routine = state.routines.find((r) => !r.archived);
              if (!routine) return;
              const session = createSession(
                routine,
                state.exercises,
                date + "T18:00:00.000Z",
              );
              session.status = "parcial";
              session.endedAt = session.startedAt;
              setSelected(session);
            }}
          >
            Registrar en fecha seleccionada
          </button>
          <button
            onClick={() => {
              const rows = [
                [
                  "fecha",
                  "rutina",
                  "ejercicio",
                  "equipo",
                  "tipo",
                  "estado",
                  "lado",
                  "peso_kg",
                  "repeticiones",
                  "RIR",
                ],
                ...state.sessions.flatMap((s) =>
                  s.exercises.flatMap((e) =>
                    e.sets.map((x) => [
                      s.startedAt,
                      s.routineName,
                      e.exercise.name,
                      e.machine,
                      x.type,
                      x.status,
                      x.side,
                      x.weight ?? "",
                      x.reps ?? "",
                      x.rir ?? "",
                    ]),
                  ),
                ),
              ];
              const cell = (v: unknown) => {
                let t = String(v);
                if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
                return '"' + t.replaceAll('"', '""') + '"';
              };
              download(
                `entrenamientos-${today()}.csv`,
                "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
                "text/csv;charset=utf-8",
              );
            }}
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button onClick={() => window.print()}>Imprimir informe</button>
        </div>
      </div>
      <Card>
        <Field label="Mes">
          <input
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setSelectedOnly(false);
              }
            }}
          />
        </Field>
        <div className="calendar">
          {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
            <small key={d}>{d}</small>
          ))}
          {Array.from(
            { length: (new Date(month + "-01T12:00:00").getDay() + 6) % 7 },
            (_, i) => (
              <span key={"pad" + i} />
            ),
          )}
          {Array.from({ length: count }, (_, i) => {
            const d = month + "-" + String(i + 1).padStart(2, "0");
            const sessions = sorted.filter((s) => dayKey(s.startedAt) === d);
            return (
              <button
                className={sessions.length ? "trained" : ""}
                key={d}
                onClick={() => {
                  setDate(d);
                  setSelectedOnly(true);
                }}
              >
                <strong>{i + 1}</strong>
                <small>
                  {sessions.length ? `${sessions.length} sesión(es)` : "—"}
                </small>
              </button>
            );
          })}
        </div>
        <p>
          {dateLabel(date)} ·{" "}
          {sorted.filter((s) => dayKey(s.startedAt) === date).length} sesiones
        </p>
      </Card>
      {selectedOnly && (
        <div className="section-title">
          <h2>Sesiones del {dateLabel(date)}</h2>
          <button onClick={() => setSelectedOnly(false)}>
            Mostrar todo el mes
          </button>
        </div>
      )}
      {visible.length ? (
        visible.map((s) => (
          <Card key={s.id}>
            <div className="row history-session">
              <div>
                <p className="eyebrow">
                  {dateLabel(s.startedAt)} · {s.status.toUpperCase()}
                </p>
                <h2>{s.routineName}</h2>
                <p>
                  {s.exercises.reduce((n, e) => n + physicalSets(e.sets), 0)}{" "}
                  series efectivas ·{" "}
                  {Math.round(s.exercises.reduce((n, e) => n + tonnage(e), 0))}{" "}
                  kg de volumen de carga
                </p>
                {!s.exercises.some((e) =>
                  e.sets.some((x) => x.status === "completada"),
                ) && <span className="tag">Sin series completadas</span>}
              </div>
              <div className="history-session-actions">
                <button onClick={() => setSelected(structuredClone(s))}>
                  Ver y editar
                </button>
                <button
                  className="danger-button"
                  aria-label={`Eliminar sesión de ${s.routineName} del ${dateLabel(s.startedAt)}`}
                  onClick={() => setRemoving(s)}
                >
                  <Trash2 size={16} />
                  Eliminar sesión
                </button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Empty>
          {selectedOnly
            ? "No hay entrenamientos registrados en esta fecha."
            : "No hay entrenamientos registrados en este mes."}
        </Empty>
      )}
      <Card>
        <button
          className="subtle wide"
          onClick={() => setTrashOpen(!trashOpen)}
          aria-expanded={trashOpen}
        >
          <Trash2 size={16} />
          Papelera ({state.sessionTrash?.length ?? 0})
        </button>
        {trashOpen && (
          <div>
            <p>
              Las sesiones de la papelera no cuentan en tus estadísticas. Puedes
              recuperarlas sin perder sus datos.
            </p>
            {state.sessionTrash?.length ? (
              state.sessionTrash.map(({ session: s }) => (
                <div className="record-row" key={s.id}>
                  <div>
                    <strong>{s.routineName}</strong>
                    <small style={{ display: "block" }}>
                      {dateLabel(s.startedAt)} ·{" "}
                      {s.exercises.reduce(
                        (n, e) => n + physicalSets(e.sets),
                        0,
                      )}{" "}
                      series efectivas
                    </small>
                  </div>
                  <button
                    aria-label={`Recuperar sesión ${s.routineName}`}
                    onClick={async () => {
                      try {
                        const saved = await mutate((st) =>
                          restoreSession(st, s.id),
                        );
                        if (!saved) return;
                        notify("Sesión recuperada con todos sus registros.");
                      } catch (e) {
                        notify(
                          e instanceof Error
                            ? e.message
                            : "No se pudo recuperar la sesión.",
                        );
                      }
                    }}
                  >
                    <RotateCcw size={16} />
                    Recuperar sesión
                  </button>
                </div>
              ))
            ) : (
              <p>No hay sesiones en la papelera.</p>
            )}
          </div>
        )}
      </Card>
      {removing && (
        <SessionRemoval
          session={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => setRemoving(null)}
        />
      )}
      {selected && (
        <div className="modal-backdrop">
          <form
            className="modal large"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                selected.exercises.some((ex) =>
                  ex.sets.some(
                    (s) =>
                      s.status === "completada" &&
                      (s.weight === null ||
                        s.reps === null ||
                        s.reps < 1 ||
                        s.rir === null),
                  ),
                )
              )
                return notify(
                  "Completa carga, repeticiones y RIR de cada serie marcada como completada.",
                );
              const corrected = structuredClone(selected);
              corrected.status =
                corrected.exercises.length > 0 &&
                corrected.exercises.every(
                  (ex) => physicalSets(ex.sets) >= ex.plan.sets,
                )
                  ? "completada"
                  : "parcial";
              const saved = await mutate((st) => {
                const idx = st.sessions.findIndex((s) => s.id === selected.id);
                if (idx < 0) st.sessions.push(corrected);
                else st.sessions[idx] = corrected;
              });
              if (!saved) return;
              setSelected(null);
              notify(
                "Historial actualizado. Las estadísticas se recalcularon.",
              );
            }}
          >
            <div className="row">
              <h2>{selected.routineName}</h2>
              <button type="button" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
            {selected.exercises.map((ex, i) => (
              <div key={i}>
                <h3>{ex.exercise.name}</h3>
                <Field label={`Comentarios generales · ${ex.exercise.name}`}>
                  <textarea
                    aria-label={`Comentarios generales · ${ex.exercise.name}`}
                    value={ex.notes ?? ""}
                    onChange={(e) => {
                      const n = structuredClone(selected);
                      n.exercises[i].notes = e.target.value;
                      setSelected(n);
                    }}
                  />
                </Field>
                {ex.sets.map((s, j) => (
                  <div className="history-set" key={s.id}>
                    <span>
                      {j + 1} · {s.side}
                      <Num
                        label={`RIR histórico ${i}-${j}`}
                        value={s.rir}
                        max={10}
                        onChange={(v) => {
                          const n = structuredClone(selected);
                          n.exercises[i].sets[j].rir = v;
                          setSelected(n);
                        }}
                      />
                    </span>
                    <Num
                      label={`Carga histórica ${i}-${j}`}
                      value={s.weight}
                      onChange={(v) => {
                        const n = structuredClone(selected);
                        n.exercises[i].sets[j].weight = v;
                        setSelected(n);
                      }}
                    />
                    <Num
                      label={`Repeticiones históricas ${i}-${j}`}
                      value={s.reps}
                      max={1000}
                      onChange={(v) => {
                        const n = structuredClone(selected);
                        n.exercises[i].sets[j].reps = v;
                        setSelected(n);
                      }}
                    />
                    <select
                      aria-label="Estado histórico"
                      value={s.status}
                      onChange={(e) => {
                        const n = structuredClone(selected);
                        n.exercises[i].sets[j].status = e.target
                          .value as SetLog["status"];
                        setSelected(n);
                      }}
                    >
                      {[
                        "pendiente",
                        "completada",
                        "omitida",
                        "interrumpida",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ))}
            <div className="form-grid">
              <Field label="Fecha del entrenamiento">
                <input
                  required
                  type="date"
                  max={today()}
                  value={dayKey(selected.startedAt)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const start = e.target.value + "T18:00:00.000Z";
                    const duration = Math.max(
                      0,
                      Date.parse(selected.endedAt ?? selected.startedAt) -
                        Date.parse(selected.startedAt),
                    );
                    setSelected({
                      ...selected,
                      startedAt: start,
                      endedAt: new Date(
                        Date.parse(start) + duration,
                      ).toISOString(),
                    });
                  }}
                />
              </Field>
              <Field label="Duración total (minutos)">
                <Num
                  label="Duración histórica"
                  value={Math.round(
                    (Date.parse(selected.endedAt ?? selected.startedAt) -
                      Date.parse(selected.startedAt)) /
                      60000,
                  )}
                  max={600}
                  onChange={(v) =>
                    setSelected({
                      ...selected,
                      endedAt: new Date(
                        Date.parse(selected.startedAt) + (v ?? 0) * 60000,
                      ).toISOString(),
                    })
                  }
                />
              </Field>
            </div>
            <small>
              Las cargas de este editor se expresan en kg. En registros
              manuales, confirma la rutina y la duración.
            </small>
            <Field label="Observaciones">
              <textarea
                value={selected.notes}
                onChange={(e) =>
                  setSelected({ ...selected, notes: e.target.value })
                }
              />
            </Field>
            <div className="actions">
              <button className="primary">Guardar correcciones</button>
              {state.sessions.some((s) => s.id === selected.id) && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    setRemoving(selected);
                    setSelected(null);
                  }}
                >
                  Eliminar sesión
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default History;
