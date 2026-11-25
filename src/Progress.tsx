import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChartNoAxesCombined,
  Timer,
  Check,
  Plus,
  Download,
  Trash2,
} from "lucide-react";
import { db, download, readPhotos, writePhoto } from "./storage";
import {
  type Session,
  type Measurement,
  type Photo,
  measureFields,
  muscles,
  uid,
  today,
  dateLabel,
} from "./model";
import { volume, comparable } from "./engine";
import { useApp, Card, Empty, Field, Num, fromKg } from "./ui";
import { Stat, VolumeBars } from "./metrics";
import { Chart, Records } from "./charts";
function Progress() {
  const { state } = useApp();
  const [tab, setTab] = useState("Entrenamiento");
  const [days, setDays] = useState(90);
  const [exerciseId, setExerciseId] = useState(state.exercises[0].id);
  const [machine, setMachine] = useState("");
  const [mode, setMode] = useState("total");
  const cutoff = Date.now() - days * 86400000;
  const sessions = state.sessions.filter(
    (s) => s.status !== "activa" && Date.parse(s.startedAt) >= cutoff,
  );
  const choices = Array.from(
    new Set(
      sessions.flatMap((s) =>
        s.exercises
          .filter((e) => e.exercise.id === exerciseId)
          .map((e) => e.machine),
      ),
    ),
  );
  const chart = sessions
    .slice()
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((s) =>
      s.exercises
        .filter(
          (e) =>
            e.exercise.id === exerciseId &&
            e.machine === machine &&
            e.weightMode === mode,
        )
        .map((e) => ({
          date: dateLabel(s.startedAt),
          weight: Math.max(
            0,
            ...e.sets
              .filter((x) => x.status === "completada" && x.type === "Efectiva")
              .map((x) => fromKg(x.weight, state.profile?.unit ?? "kg") ?? 0),
          ),
        })),
    )
    .filter((x) => x.weight > 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">EL ESFUERZO, VISIBLE</p>
          <h1>Mi progreso.</h1>
          <p>Registros reales. Una perspectiva más clara.</p>
        </div>
        <NavLink className="button" to="/informes">
          <Download size={18} />
          Informes de progreso
        </NavLink>
      </div>
      <div className="tabs">
        {["Entrenamiento", "Medidas", "Fotografías", "Mapa muscular"].map(
          (t) => (
            <button
              key={t}
              className={t === tab ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {tab === "Entrenamiento" && (
        <>
          <div className="period-tabs">
            {[7, 30, 90, 36500].map((d) => (
              <button
                key={d}
                className={days === d ? "selected" : ""}
                onClick={() => setDays(d)}
              >
                {d === 36500 ? "Todo" : d + " días"}
              </button>
            ))}
          </div>
          <Card>
            <div className="form-grid">
              <Field label="Ejercicio">
                <select
                  value={exerciseId}
                  onChange={(e) => {
                    setExerciseId(e.target.value);
                    setMachine("");
                  }}
                >
                  {state.exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Equipo comparable">
                <select
                  value={machine}
                  onChange={(e) => setMachine(e.target.value)}
                >
                  <option value="">Sin identificador</option>
                  {choices.filter(Boolean).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Carga">
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="total">Total</option>
                  <option value="por mancuerna">Por mancuerna</option>
                </select>
              </Field>
            </div>
            <div className="row">
              <div>
                <p className="eyebrow">
                  MÁXIMA CARGA EFECTIVA REGISTRADA POR SESIÓN
                </p>
                <h2>
                  {chart.length
                    ? `${chart[chart.length - 1].weight} ${state.profile?.unit}`
                    : "Tu primer punto está por llegar"}
                </h2>
              </div>
              <ChartNoAxesCombined className="accent" />
            </div>
            {chart.length ? (
              <Chart data={chart} dataKey="weight" />
            ) : (
              <Empty>
                Completa una sesión con cargas para ver la evolución. Las
                máquinas y las convenciones de carga se comparan por separado.
              </Empty>
            )}
          </Card>
          <div className="stats-grid progress-stats">
            <Stat
              icon={<Check />}
              label="Sesiones finalizadas"
              value={String(sessions.length)}
              link="/historial"
            />
            <Stat
              icon={<Timer />}
              label="Tiempo registrado"
              value={`${Math.round(sessions.reduce((n, s) => n + (Date.parse(s.endedAt ?? s.startedAt) - Date.parse(s.startedAt)) / 60000, 0))} min`}
              link="/historial"
            />
          </div>
          <Card>
            <h3>Volumen del periodo seleccionado</h3>
            <p className="muted">
              Comparación con una semana planificada. Para comparar periodos
              equivalentes, selecciona 7 días.
            </p>
            <VolumeBars sessions={sessions} />
          </Card>
          <Records sessions={sessions} />
        </>
      )}
      {tab === "Medidas" && <Measurements />}
      {tab === "Fotografías" && <Photos />}
      {tab === "Mapa muscular" && <MuscleMap sessions={sessions} />}
    </>
  );
}

function Measurements() {
  const { state, mutate } = useApp();
  const [draft, setDraft] = useState<Measurement | null>(null);
  const [metric, setMetric] = useState("Peso");
  const data = [...state.measurements]
    .filter((m) => m.values[metric] !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: dateLabel(m.date), value: m.values[metric] }));
  const diff =
    data.length > 1 ? Number(data.at(-1)!.value) - Number(data[0].value) : null;
  return (
    <>
      <div className="section-title">
        <h2>Medidas corporales</h2>
        <button
          className="primary"
          onClick={() =>
            setDraft({
              id: uid(),
              date: today(),
              values: {},
              method: "Cinta métrica / báscula",
              notes: "",
            })
          }
        >
          <Plus size={18} />
          Registrar medidas
        </button>
      </div>
      <Card>
        <Field label="Medida">
          <select value={metric} onChange={(e) => setMetric(e.target.value)}>
            {measureFields.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        {data.length ? (
          <>
            <h2>
              {data.at(-1)!.value}{" "}
              {metric === "Peso" || metric.includes("Masa")
                ? "kg"
                : metric === "Grasa corporal"
                  ? "%"
                  : "cm"}
            </h2>
            <p className="muted">
              {diff !== null
                ? `Cambio desde la primera medición: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} (${Number(data[0].value) !== 0 ? ((diff / Number(data[0].value)) * 100).toFixed(1) : "—"}%)`
                : "Primera medición registrada"}
            </p>
            <Chart data={data} dataKey="value" />
          </>
        ) : (
          <Empty>
            Registra solo las medidas que conozcas. Los campos vacíos permanecen
            vacíos.
          </Empty>
        )}
      </Card>
      <Card>
        <h3>Registro de mediciones</h3>
        {state.measurements.map((m) => (
          <div className="record-row" key={m.id}>
            <span>{dateLabel(m.date)}</span>
            <span>
              {Object.entries(m.values)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </span>
            <button onClick={() => setDraft(structuredClone(m))}>Editar</button>
          </div>
        ))}
      </Card>
      <Card>
        <h3>Mediciones consistentes</h3>
        <p>
          Utiliza la misma cinta, en condiciones similares y lejos del
          entrenamiento. Mantén la cinta horizontal, sin comprimir la piel y
          mide siempre los mismos puntos. Para cintura, registra el punto
          anatómico que uses en las observaciones. La bioimpedancia varía con
          hidratación y horario.
        </p>
      </Card>
      {draft && (
        <div className="modal-backdrop">
          <form
            className="modal large"
            onSubmit={(e) => {
              e.preventDefault();
              mutate((s) => {
                const i = s.measurements.findIndex((m) => m.id === draft.id);
                if (i < 0) s.measurements.push(draft);
                else s.measurements[i] = draft;
              });
              setDraft(null);
            }}
          >
            <div className="row">
              <h2>Registrar medidas</h2>
              <button type="button" onClick={() => setDraft(null)}>
                Cerrar
              </button>
            </div>
            <Field label="Fecha">
              <input
                required
                type="date"
                max={today()}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </Field>
            <div className="form-grid">
              {measureFields.map((m) => (
                <Field
                  label={`${m} (${m === "Peso" || m.includes("Masa") ? "kg" : m === "Grasa corporal" ? "%" : "cm"})`}
                  key={m}
                >
                  <Num
                    value={draft.values[m] ?? null}
                    label={m}
                    min={0.1}
                    max={m === "Grasa corporal" ? 100 : 2000}
                    onChange={(v) => {
                      const n = structuredClone(draft);
                      if (v === null) delete n.values[m];
                      else n.values[m] = v;
                      setDraft(n);
                    }}
                  />
                </Field>
              ))}
            </div>
            <Field label="Método de medición">
              <input
                value={draft.method}
                onChange={(e) => setDraft({ ...draft, method: e.target.value })}
              />
            </Field>
            <Field label="Observaciones">
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </Field>
            <button
              className="primary"
              disabled={!Object.keys(draft.values).length}
            >
              Guardar medición
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Photos() {
  const { notify } = useApp();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [date, setDate] = useState(today());
  const [view, setView] = useState("Frontal");
  const [selected, setSelected] = useState<string[]>([]);
  const load = () => readPhotos().then(setPhotos);
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const next = Object.fromEntries(
      photos.map((p) => [p.id, URL.createObjectURL(p.blob)]),
    );
    setUrls(next);
    return () => Object.values(next).forEach(URL.revokeObjectURL);
  }, [photos]);
  return (
    <>
      <Card>
        <h2>Fotografías de progreso</h2>
        <p>
          Solo en este dispositivo. Se comprimen y se vuelven a codificar para
          descartar metadatos de origen.
        </p>
        <div className="form-grid">
          <Field label="Fecha">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Vista">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              {[
                "Frontal",
                "Posterior",
                "Perfil derecho",
                "Perfil izquierdo",
                "Adicional",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Agregar fotografía">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 30 * 1024 * 1024)
                    throw new Error("La imagen excede 30 MB.");
                  const image = await createImageBitmap(f);
                  const canvas = document.createElement("canvas");
                  const ratio = Math.min(
                    1,
                    1600 / Math.max(image.width, image.height),
                  );
                  canvas.width = Math.round(image.width * ratio);
                  canvas.height = Math.round(image.height * ratio);
                  canvas
                    .getContext("2d")!
                    .drawImage(image, 0, 0, canvas.width, canvas.height);
                  image.close();
                  const blob = await new Promise<Blob | null>((r) =>
                    canvas.toBlob(r, "image/jpeg", 0.85),
                  );
                  if (!blob) throw new Error("No se pudo procesar la imagen.");
                  await writePhoto({ id: uid(), date, view, blob });
                  await load();
                  notify("Fotografía guardada localmente.");
                } catch (err) {
                  notify(
                    err instanceof Error
                      ? err.message
                      : "No se pudo guardar la fotografía.",
                  );
                }
                e.target.value = "";
              }}
            />
          </Field>
        </div>
      </Card>
      {selected.length > 0 && (
        <Card>
          <h3>Comparación por fecha</h3>
          <div className="photo-compare">
            {selected.map((id) => {
              const p = photos.find((p) => p.id === id)!;
              return (
                <figure key={id}>
                  <img src={urls[id]} alt={p.view} />
                  <figcaption>
                    {dateLabel(p.date)} · {p.view}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </Card>
      )}
      <div className="photo-grid">
        {photos.map((p) => (
          <Card key={p.id}>
            <img
              src={urls[p.id]}
              alt={`Progreso ${p.view} del ${dateLabel(p.date)}`}
            />
            <p>
              {dateLabel(p.date)} · {p.view}
            </p>
            <div className="actions">
              <button
                onClick={() =>
                  setSelected(
                    selected.includes(p.id)
                      ? selected.filter((i) => i !== p.id)
                      : [...selected.slice(-1), p.id],
                  )
                }
              >
                {selected.includes(p.id) ? "Quitar comparación" : "Comparar"}
              </button>
              <button
                aria-label="Exportar fotografía"
                onClick={() =>
                  download(`progreso-${p.date}.jpg`, p.blob, "image/jpeg")
                }
              >
                <Download size={16} />
              </button>
              <button
                aria-label="Eliminar fotografía"
                onClick={async () => {
                  if (
                    !confirm("¿Eliminar esta fotografía de este dispositivo?")
                  )
                    return;
                  await db.photos.delete(p.id);
                  setSelected(selected.filter((i) => i !== p.id));
                  load();
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
      {!photos.length && (
        <Empty>
          Agrega tu primera fotografía. No se subirá a ningún servidor.
        </Empty>
      )}
    </>
  );
}

function MuscleMap({ sessions }: { sessions: Session[] }) {
  const { state } = useApp();
  const [selected, setSelected] = useState<(typeof muscles)[number]>("Pecho");
  const [indirect, setIndirect] = useState(false);
  const regions: [(typeof muscles)[number], string][] = [
    ["Hombros", "M40 65 L22 80 L18 105 L40 112 L53 82Z"],
    ["Hombros", "M107 82 L120 65 L138 80 L142 105 L120 112Z"],
    ["Pecho", "M53 75 L77 70 L77 113 L48 109Z"],
    ["Pecho", "M83 70 L107 75 L112 109 L83 113Z"],
    ["Bíceps", "M18 110 L40 118 L34 158 L11 169Z"],
    ["Bíceps", "M120 118 L142 110 L149 169 L126 158Z"],
    ["Abdomen", "M55 120 L105 120 L99 178 L61 178Z"],
    ["Cuádriceps", "M59 184 L78 190 L75 259 L49 262 L43 225Z"],
    ["Cuádriceps", "M82 190 L101 184 L117 225 L111 262 L85 259Z"],
    ["Pantorrillas", "M49 268 L74 266 L69 316 L47 316Z"],
    ["Pantorrillas", "M86 266 L111 268 L113 316 L91 316Z"],
  ];
  const back: [(typeof muscles)[number], string][] = [
    ["Hombros", "M40 65 L22 80 L18 105 L40 112 L53 82Z"],
    ["Hombros", "M107 82 L120 65 L138 80 L142 105 L120 112Z"],
    ["Espalda", "M53 75 L80 65 L107 75 L102 110 L80 130 L58 110Z"],
    ["Espalda", "M48 115 L77 140 L77 178 L59 165Z"],
    ["Espalda", "M83 140 L112 115 L101 165 L83 178Z"],
    ["Tríceps", "M18 110 L40 118 L34 158 L11 169Z"],
    ["Tríceps", "M120 118 L142 110 L149 169 L126 158Z"],
    ["Glúteos", "M59 180 L101 180 L108 208 L52 208Z"],
    ["Isquiotibiales", "M52 212 L78 212 L75 259 L49 262 L43 225Z"],
    ["Isquiotibiales", "M82 212 L108 212 L117 225 L111 262 L85 259Z"],
    ["Pantorrillas", "M49 268 L74 266 L69 316 L47 316Z"],
    ["Pantorrillas", "M86 266 L111 268 L113 316 L91 316Z"],
  ];
  return (
    <Card>
      <div className="row">
        <h2>Mapa de volumen muscular</h2>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={indirect}
            onChange={(e) => setIndirect(e.target.checked)}
          />
          Incluir estimación indirecta (0.5)
        </label>
      </div>
      <p className="muted">
        Representación del volumen registrado del periodo elegido. No mide
        recuperación, daño muscular ni activación.
      </p>
      <div className="body-map">
        {[regions, back].map((paths, i) => (
          <div key={i}>
            <svg
              viewBox="0 0 160 340"
              role="group"
              aria-label={i ? "Vista posterior" : "Vista frontal"}
            >
              <ellipse
                cx="80"
                cy="32"
                rx="22"
                ry="28"
                fill="#475569"
                stroke="#080c12"
                strokeWidth="2"
              />
              {paths.map(([m, d], j) => {
                const v = volume(sessions, m, indirect);
                return (
                  <path
                    key={j}
                    d={d}
                    fill={
                      v ? `hsl(79 80% ${Math.min(62, 27 + v * 2)}%)` : "#334155"
                    }
                    stroke={selected === m ? "#F8FAFC" : "#080c12"}
                    strokeWidth="2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${m}: ${v} series`}
                    onClick={() => setSelected(m)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelected(m);
                    }}
                  />
                );
              })}
            </svg>
            <small>{i ? "POSTERIOR" : "FRONTAL"}</small>
          </div>
        ))}
      </div>
      <div className="tabs">
        {muscles.map((m) => (
          <button
            key={m}
            className={m === selected ? "selected" : ""}
            onClick={() => setSelected(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <h3>
        {selected} · {volume(sessions, selected)} series directas
      </h3>
      <p>
        Contribución indirecta estimada:{" "}
        {volume(sessions, selected, true) - volume(sessions, selected)} series
        equivalentes (factor configurable pendiente).
      </p>
      <p className="muted">
        {state.exercises
          .filter((e) => e.muscle === selected)
          .map((e) => e.name)
          .join(" · ") || "Agrega ejercicios para este grupo muscular."}
      </p>
    </Card>
  );
}

export default Progress;
