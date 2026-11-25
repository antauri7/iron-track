import { useState } from "react";
import { Trash2 } from "lucide-react";
import { blankSet } from "./model";
import { warmup } from "./engine";
import { useApp, Card, Empty, Field, Num, toKg } from "./ui";
function Calculators() {
  const { state, mutate, notify } = useApp();
  const [weight, setWeight] = useState<number | null>(null);
  const [step, setStep] = useState(2.5);
  const [bar, setBar] = useState(20);
  const [percent, setPercent] = useState([40, 60, 80]);
  const [exercise, setExercise] = useState(0);
  const active = state.sessions.find((s) => s.status === "activa");
  const unit = state.profile?.unit ?? "kg";
  const values = weight === null ? [] : warmup(weight, step, percent);
  let side = Math.max(0, ((weight ?? 0) - bar) / 2);
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25]
    .map((p) => {
      const n = Math.floor((side + 0.00001) / p);
      side -= n * p;
      return { p, n };
    })
    .filter((x) => x.n);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">PREPARA TU SIGUIENTE SERIE</p>
          <h1>Calculadoras.</h1>
          <p>Una referencia práctica; ajusta según tu equipo.</p>
        </div>
      </div>
      <div className="two-cols">
        <Card>
          <h2>Series de aproximación</h2>
          <p>
            Porcentajes del peso de trabajo, no del 1RM. Mantén las
            aproximaciones lejos del fallo.
          </p>
          <div className="form-grid">
            <Field label={`Peso de trabajo (${unit})`}>
              <Num
                label="Peso de trabajo"
                value={weight}
                onChange={setWeight}
              />
            </Field>
            <Field label={`Incremento mínimo (${unit})`}>
              <Num
                label="Incremento mínimo"
                value={step}
                min={0.1}
                max={50}
                onChange={(v) => setStep(v ?? 2.5)}
              />
            </Field>
          </div>
          {percent.map((p, i) => (
            <div className="approximation" key={i}>
              <Field label={`Aproximación ${i + 1} (%)`}>
                <Num
                  label={`Porcentaje ${i + 1}`}
                  value={p}
                  min={1}
                  max={99}
                  onChange={(v) =>
                    setPercent(percent.map((x, j) => (j === i ? (v ?? 40) : x)))
                  }
                />
              </Field>
              <strong>
                {values[i] ?? "—"} {unit}
              </strong>
              <span>{["10–12", "5–6", "2–3"][i] ?? "2–3"} reps</span>
              <button
                aria-label="Quitar aproximación"
                onClick={() => setPercent(percent.filter((_, j) => j !== i))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="actions">
            <button
              disabled={percent.length >= 5}
              onClick={() => setPercent([...percent, 85])}
            >
              Añadir aproximación
            </button>
          </div>
          {active && (
            <>
              <Field label="Ejercicio de la sesión activa">
                <select
                  value={exercise}
                  onChange={(e) => setExercise(+e.target.value)}
                >
                  {active.exercises.map((e, i) => (
                    <option value={i} key={i}>
                      {e.exercise.name}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                className="primary"
                disabled={weight === null}
                onClick={() => {
                  mutate((s) => {
                    const ex = s.sessions.find((s) => s.id === active.id)!
                      .exercises[exercise];
                    ex.sets.unshift(
                      ...values.map((v, i) => ({
                        ...blankSet("Aproximación"),
                        weight: toKg(v, unit),
                        reps: [10, 5, 2][i] ?? 2,
                      })),
                    );
                  });
                  notify(
                    "Aproximaciones agregadas a la sesión. No cuentan como series efectivas.",
                  );
                }}
              >
                Agregar a sesión activa
              </button>
            </>
          )}
        </Card>
        <Card>
          <h2>Discos por lado</h2>
          <p>
            Disponibilidad de referencia: 25, 20, 15, 10, 5, 2.5 y 1.25 {unit}.
            Mismo montaje en ambos lados.
          </p>
          <Field label={`Peso de la barra (${unit})`}>
            <Num
              label="Peso de la barra"
              value={bar}
              max={100}
              onChange={(v) => setBar(v ?? 20)}
            />
          </Field>
          {weight === null ? (
            <Empty>
              Introduce el peso de trabajo para calcular los discos.
            </Empty>
          ) : weight < bar ? (
            <p className="warning">
              La carga objetivo es menor que el peso de la barra.
            </p>
          ) : (
            <>
              <div className="plates">
                {plates.map(({ p, n }) => (
                  <div key={p} style={{ height: 40 + p * 3 }}>
                    {n} × {p}
                  </div>
                ))}
              </div>
              <h3>
                {plates.map(({ p, n }) => `${n} × ${p}`).join(" + ") ||
                  "Solo la barra"}
              </h3>
              {side > 0.01 && (
                <p className="warning">
                  Faltan {Math.round(side * 200) / 100} {unit} en total para
                  alcanzar la carga con estos discos.
                </p>
              )}
            </>
          )}
          <h3>Distribución orientativa de 90 minutos</h3>
          <div className="time-budget">
            {[8, 12, 35, 30, 5].map((n, i) => (
              <span
                key={i}
                style={{ flex: n, opacity: 1 - i * 0.13 }}
                title={n + " minutos"}
              />
            ))}
          </div>
          <p className="muted">
            Calentamiento 8 · aproximaciones 12 · compuestos 35 · aislamiento 30
            · registro 5 min.
          </p>
          <small>
            Es una distribución de referencia. No reduzcas indiscriminadamente
            descansos de ejercicios pesados.
          </small>
        </Card>
      </div>
    </>
  );
}

export default Calculators;
