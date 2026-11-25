import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowUpRight, Play, Plus, Trash2, Copy } from "lucide-react";
import { seedRoutines } from "./seed";
import { type Routine, uid } from "./model";
import { createSession, estimateMinutes } from "./engine";
import { useApp, Card, Field } from "./ui";
function Train() {
  const { state, mutate, notify } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Routine | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  function start(r: Routine) {
    const active = state.sessions.find((s) => s.status === "activa");
    if (!active) mutate((s) => s.sessions.push(createSession(r, s.exercises)));
    else notify("Retomamos tu sesión pendiente antes de iniciar otra.");
    navigate("/sesion");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">EL PLAN SE CONVIERTE EN ACCIÓN</p>
          <h1>Vamos a entrenar.</h1>
          <p>Seis días. Un propósito. Tu siguiente mejora.</p>
        </div>
        <button
          onClick={() =>
            setEditing({
              id: uid(),
              name: "Nueva rutina",
              day: 1,
              version: 1,
              exercises: [],
            })
          }
        >
          <Plus size={18} />
          Crear rutina
        </button>
      </div>
      {state.sessions.some((s) => s.status === "activa") && (
        <button className="primary wide" onClick={() => navigate("/sesion")}>
          <Play size={18} />
          Continuar sesión pendiente
        </button>
      )}
      <div className="row tabs">
        <button onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Ver activas" : "Ver archivadas"}
        </button>
        <NavLink to="/biblioteca">
          Biblioteca <ArrowUpRight size={16} />
        </NavLink>
      </div>
      <div className="routine-grid">
        {state.routines
          .filter((r) => Boolean(r.archived) === showArchived)
          .map((r) => (
            <Card key={r.id}>
              <div className="row">
                <span className="eyebrow accent">
                  {
                    [
                      "DOMINGO",
                      "LUNES",
                      "MARTES",
                      "MIÉRCOLES",
                      "JUEVES",
                      "VIERNES",
                      "SÁBADO",
                    ][r.day]
                  }
                </span>
                <span className="tag">V{r.version}</span>
              </div>
              <h2>{r.name}</h2>
              <p>
                {r.exercises.length} ejercicios ·{" "}
                {r.exercises.reduce((n, e) => n + e.sets, 0)} series efectivas ·
                ≈ {estimateMinutes(r, state.exercises)} min
              </p>
              {estimateMinutes(r, state.exercises) >
                (state.profile?.minutes ?? 90) && (
                <p className="warning">
                  Esta estimación supera tu tiempo disponible. Considera
                  posponer una serie complementaria o utilizar superseries
                  compatibles, conservando los descansos de los movimientos
                  pesados.
                </p>
              )}
              <div className="exercise-preview">
                {r.exercises.map((p, i) => (
                  <div key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>
                      {state.exercises.find((e) => e.id === p.exerciseId)?.name}
                    </strong>
                    <small>
                      {p.sets} × {p.min}–{p.max}
                    </small>
                  </div>
                ))}
              </div>
              <button
                className="primary wide"
                disabled={!r.exercises.length || r.archived}
                onClick={() => start(r)}
              >
                <Play size={16} />
                Iniciar entrenamiento
              </button>
              <div className="actions">
                <button onClick={() => setEditing(structuredClone(r))}>
                  Editar
                </button>
                <button
                  aria-label={"Duplicar " + r.name}
                  onClick={() =>
                    mutate((s) =>
                      s.routines.push({
                        ...structuredClone(r),
                        id: uid(),
                        name: r.name + " · copia",
                        version: 1,
                        archived: false,
                      }),
                    )
                  }
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() =>
                    mutate((s) => {
                      s.routines.find((x) => x.id === r.id)!.archived =
                        !r.archived;
                    })
                  }
                >
                  {r.archived ? "Activar" : "Archivar"}
                </button>
              </div>
            </Card>
          ))}
      </div>
      {editing && (
        <div className="modal-backdrop">
          <form
            className="modal large"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing.exercises.length)
                return notify("Agrega al menos un ejercicio.");
              mutate((s) => {
                const i = s.routines.findIndex((r) => r.id === editing.id);
                const r = {
                  ...editing,
                  version: i < 0 ? 1 : s.routines[i].version + 1,
                };
                if (i < 0) s.routines.push(r);
                else s.routines[i] = r;
              });
              setEditing(null);
            }}
          >
            <div className="row">
              <h2>Editar rutina</h2>
              <button type="button" onClick={() => setEditing(null)}>
                Cerrar
              </button>
            </div>
            <Field label="Nombre">
              <input
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Día">
              <select
                value={editing.day}
                onChange={(e) =>
                  setEditing({ ...editing, day: +e.target.value })
                }
              >
                {[
                  "Domingo",
                  "Lunes",
                  "Martes",
                  "Miércoles",
                  "Jueves",
                  "Viernes",
                  "Sábado",
                ].map((d, i) => (
                  <option value={i} key={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            {editing.exercises.map((p, i) => (
              <div
                className="editor-exercise"
                key={i}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/plain", String(i))
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  if (
                    !Number.isInteger(from) ||
                    from < 0 ||
                    from >= editing.exercises.length
                  )
                    return;
                  const n = structuredClone(editing);
                  const [move] = n.exercises.splice(from, 1);
                  n.exercises.splice(i, 0, move);
                  setEditing(n);
                }}
              >
                <div className="row">
                  <strong>
                    {state.exercises.find((e) => e.id === p.exerciseId)?.name}
                  </strong>
                  <div className="actions">
                    <button
                      type="button"
                      disabled={!i}
                      aria-label="Subir ejercicio"
                      onClick={() => {
                        const n = structuredClone(editing);
                        [n.exercises[i - 1], n.exercises[i]] = [
                          n.exercises[i],
                          n.exercises[i - 1],
                        ];
                        setEditing(n);
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === editing.exercises.length - 1}
                      aria-label="Bajar ejercicio"
                      onClick={() => {
                        const n = structuredClone(editing);
                        [n.exercises[i + 1], n.exercises[i]] = [
                          n.exercises[i],
                          n.exercises[i + 1],
                        ];
                        setEditing(n);
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="Quitar ejercicio"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          exercises: editing.exercises.filter(
                            (_, j) => j !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="form-grid">
                  {(["sets", "min", "max", "rir", "rest"] as const).map(
                    (key, k) => (
                      <Field
                        key={key}
                        label={
                          [
                            "Series",
                            "Reps mín.",
                            "Reps máx.",
                            "RIR",
                            "Descanso s",
                          ][k]
                        }
                      >
                        <input
                          required
                          type="number"
                          min={key === "rir" || key === "rest" ? 0 : 1}
                          max={key === "rest" ? 600 : key === "rir" ? 10 : 100}
                          value={p[key]}
                          onChange={(e) => {
                            const n = structuredClone(editing);
                            n.exercises[i][key] = +e.target.value;
                            setEditing(n);
                          }}
                        />
                      </Field>
                    ),
                  )}
                </div>
              </div>
            ))}
            <Field label="Agregar ejercicio">
              <select
                value=""
                onChange={(e) =>
                  e.target.value &&
                  setEditing({
                    ...editing,
                    exercises: [
                      ...editing.exercises,
                      {
                        exerciseId: e.target.value,
                        sets: 3,
                        min: 8,
                        max: 12,
                        rir: 2,
                        rest: 120,
                      },
                    ],
                  })
                }
              >
                <option value="">Seleccionar…</option>
                {state.exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="actions">
              <button
                className="primary"
                disabled={editing.exercises.some((p) => p.min > p.max)}
              >
                Guardar nueva versión
              </button>
              {seedRoutines.some((r) => r.id === editing.id) && (
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...structuredClone(
                        seedRoutines.find((r) => r.id === editing.id)!,
                      ),
                      version: editing.version,
                    })
                  }
                >
                  Restaurar original
                </button>
              )}
            </div>
            <small>
              Los entrenamientos históricos conservan su planificación original.
            </small>
          </form>
        </div>
      )}
    </>
  );
}

export default Train;
