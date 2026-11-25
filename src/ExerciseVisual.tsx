import type { Muscle } from "./model";
export default function ExerciseVisual({ muscle }: { muscle: Muscle }) {
  const back = ["Espalda", "Isquiotibiales", "Glúteos", "Tríceps"].includes(
    muscle,
  );
  const regions: { muscle: Muscle; d: string }[] = [
    {
      muscle: "Hombros",
      d: "M40 60 Q25 60 20 90 L40 98 L50 67Z M90 67 L100 60 Q115 60 120 90 L100 98Z",
    },
    {
      muscle: back ? "Espalda" : "Pecho",
      d: "M49 65 L70 60 L91 65 L97 102 L73 115 L67 115 L43 102Z",
    },
    {
      muscle: "Abdomen",
      d: "M46 109 L67 121 L73 121 L94 109 L88 156 L52 156Z",
    },
    {
      muscle: back ? "Tríceps" : "Bíceps",
      d: "M20 94 L39 102 L31 137 L12 146Z M101 102 L120 94 L128 146 L109 137Z",
    },
    { muscle: "Glúteos", d: "M52 160 L88 160 L94 182 L46 182Z" },
    {
      muscle: back ? "Isquiotibiales" : "Cuádriceps",
      d: "M46 186 L67 186 L64 226 L43 228 L39 206Z M73 186 L94 186 L101 206 L97 228 L76 226Z",
    },
    {
      muscle: "Pantorrillas",
      d: "M43 232 L64 231 L59 269 L43 269Z M76 231 L97 232 L97 269 L81 269Z",
    },
    {
      muscle: "Aductores",
      d: "M59 186 L68 186 L65 217 L58 217Z M72 186 L81 186 L82 217 L75 217Z",
    },
  ];
  return (
    <figure className="exercise-visual">
      <svg
        viewBox="0 0 140 285"
        role="img"
        aria-label={`Diagrama orientativo de ${muscle}, vista ${back ? "posterior" : "frontal"}`}
      >
        <ellipse cx="70" cy="29" rx="18" ry="23" fill="#475569" />
        <path
          d="M64 50h12v12H64z M12 150l18-9 2 28-19 25-7-4z M110 141l18 9 6 40-7 4-19-25z"
          fill="#475569"
        />
        {regions.map((r, i) => (
          <path
            key={i}
            d={r.d}
            fill={r.muscle === muscle ? "#B9F34B" : "#334155"}
            stroke="#080C12"
            strokeWidth="2"
          />
        ))}
      </svg>
      <figcaption>
        <span className="eyebrow accent">{muscle.toUpperCase()}</span>
        <strong>Identifica el grupo principal</strong>
        <span>
          Mapa anatómico esquemático. No representa la ejecución del ejercicio.
        </span>
      </figcaption>
    </figure>
  );
}
