import { z } from "zod";
export const muscles = [
  "Espalda",
  "Pecho",
  "Cuádriceps",
  "Hombros",
  "Isquiotibiales",
  "Bíceps",
  "Tríceps",
  "Pantorrillas",
  "Glúteos",
  "Abdomen",
  "Aductores",
] as const;
export type Muscle = (typeof muscles)[number];
export type Exercise = {
  id: string;
  name: string;
  muscle: Muscle;
  secondary: Muscle[];
  equipment: string;
  unilateral: boolean;
  instruction: string;
};
export type Planned = {
  exerciseId: string;
  sets: number;
  min: number;
  max: number;
  rir: number;
  rest: number;
};
export type Routine = {
  id: string;
  name: string;
  day: number;
  version: number;
  archived?: boolean;
  exercises: Planned[];
};
export const setSchema = z.object({
  id: z.string(),
  weight: z.number().min(0).max(2000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  rir: z.number().min(0).max(10).nullable(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  type: z.enum([
    "Efectiva",
    "Aproximación",
    "Calentamiento",
    "Descendente",
    "Back-off",
    "Superserie",
    "Fallo",
    "Adicional",
  ]),
  status: z.enum(["pendiente", "completada", "omitida", "interrumpida"]),
  notes: z.string(),
  side: z.enum(["ambos", "izquierdo", "derecho"]),
  segments: z.array(
    z.object({ weight: z.number().min(0), reps: z.number().int().min(1) }),
  ),
  restActual: z.number().min(0).optional(),
});
export type SetLog = z.infer<typeof setSchema>;
export type SessionExercise = {
  notes?: string;
  exercise: Exercise;
  plan: Planned;
  machine: string;
  weightMode: "total" | "por mancuerna";
  sets: SetLog[];
  technique: boolean;
  pain: boolean;
};
export type Session = {
  id: string;
  routineId: string;
  routineName: string;
  version: number;
  startedAt: string;
  endedAt?: string;
  status: "activa" | "completada" | "parcial";
  exercises: SessionExercise[];
  notes: string;
  rest?: { end: number; remaining?: number; target: number; started: number };
};
export type Profile = {
  name: string;
  age: number | null;
  height: number | null;
  experience: string;
  frequency: number;
  minutes: number;
  restDay: number;
  unit: "kg" | "lb";
  cycleStart: string;
  theme: "dark" | "light";
  autoRest: boolean;
  sound: boolean;
  vibration: boolean;
};
export const measureFields = [
  "Peso",
  "Estatura",
  "Cuello",
  "Hombros",
  "Pecho",
  "Cintura",
  "Abdomen",
  "Cadera",
  "Brazo derecho relajado",
  "Brazo izquierdo relajado",
  "Brazo derecho flexionado",
  "Brazo izquierdo flexionado",
  "Antebrazo derecho",
  "Antebrazo izquierdo",
  "Muslo derecho",
  "Muslo izquierdo",
  "Pantorrilla derecha",
  "Pantorrilla izquierda",
  "Grasa corporal",
  "Masa muscular",
  "Masa libre de grasa",
] as const;
export type Measurement = {
  id: string;
  date: string;
  values: Record<string, number>;
  method: string;
  notes: string;
};
export type Recovery = {
  id: string;
  date: string;
  signals: boolean[];
  pain: boolean;
  sleep: number | null;
  energy: number;
  stress: number;
  motivation: number;
  notes: string;
};
export type Photo = { id: string; date: string; view: string; blob: Blob };
export type Decision = {
  id: string;
  date: string;
  key: string;
  decision: string;
};
export type State = {
  profile: Profile | null;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  sessionTrash?: { session: Session; deletedAt: string }[];
  measurements: Measurement[];
  recovery: Recovery[];
  decisions: Decision[];
};
export const uid = () => crypto.randomUUID();
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (s: string) =>
  new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
export const blankSet = (
  type: SetLog["type"] = "Efectiva",
  side: SetLog["side"] = "ambos",
): SetLog => ({
  id: uid(),
  weight: null,
  reps: null,
  rir: null,
  type,
  status: "pendiente",
  notes: "",
  side,
  segments: [],
});

export const dayKey = (s: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(s));
