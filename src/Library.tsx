import ExerciseVisual from "./ExerciseVisual";
import { useState } from "react";
import { Dumbbell, Plus, Search } from "lucide-react";
import { muscles, uid } from "./model";
import { useApp, Card, Field } from "./ui";
function Library() {
  const { state, mutate } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [draft, setDraft] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">CONOCE CADA MOVIMIENTO</p>
          <h1>Biblioteca.</h1>
          <p>Tu programa y alternativas personalizadas.</p>
        </div>
        <button className="primary" onClick={() => setDraft(true)}>
          <Plus size={16} />
          Ejercicio personalizado
        </button>
      </div>
      <div className="search">
        <Search size={20} />
        <input
          aria-label="Buscar ejercicios"
          placeholder="Buscar ejercicio o equipo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filtrar músculo"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>Todos</option>
          {muscles.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="routine-grid">
        {state.exercises
          .filter(
            (e) =>
              (filter === "Todos" || e.muscle === filter) &&
              (e.name + " " + e.equipment)
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((e) => (
            <Card key={e.id}>
              <div className="row">
                <Dumbbell className="accent" />
                <span className="tag">{e.equipment}</span>
              </div>
              <ExerciseVisual muscle={e.muscle} />
              <h3>{e.name}</h3>
              <p className="accent">{e.muscle}</p>
              <p>{e.instruction}</p>
              <small>
                Secundarios:{" "}
                {e.secondary.join(", ") || "Sin clasificación adicional"}.{" "}
                {e.unilateral ? "Registro bilateral separado." : ""}
              </small>
              <details>
                <summary>Alternativas del mismo grupo</summary>
                <p>
                  {state.exercises
                    .filter((x) => x.muscle === e.muscle && x.id !== e.id)
                    .map((x) => x.name)
                    .join(" · ") || "Agrega una alternativa personalizada."}
                </p>
                <small>
                  Compartir grupo muscular no garantiza equivalencia técnica ni
                  de carga.
                </small>
              </details>
            </Card>
          ))}
      </div>
      {draft && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              mutate((s) =>
                s.exercises.push({
                  id: uid(),
                  name: String(f.get("name")),
                  muscle: f.get("muscle") as (typeof muscles)[number],
                  secondary: [],
                  equipment: String(f.get("equipment")),
                  unilateral: f.get("unilateral") === "on",
                  instruction: String(f.get("instruction")),
                }),
              );
              setDraft(false);
            }}
          >
            <h2>Ejercicio personalizado</h2>
            <Field label="Nombre">
              <input required name="name" />
            </Field>
            <Field label="Músculo principal">
              <select name="muscle">
                {muscles.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Equipo">
              <select name="equipment">
                {[
                  "Barra",
                  "Mancuernas",
                  "Máquina",
                  "Polea",
                  "Smith",
                  "Peso corporal",
                ].map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </Field>
            <Field label="Instrucciones personales">
              <textarea required name="instruction" />
            </Field>
            <label className="checkbox">
              <input type="checkbox" name="unilateral" />
              Unilateral
            </label>
            <div className="actions">
              <button type="button" onClick={() => setDraft(false)}>
                Cancelar
              </button>
              <button className="primary">Guardar ejercicio</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default Library;
