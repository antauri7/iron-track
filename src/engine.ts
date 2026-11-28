import type {
  Routine,
  Exercise,
  Session,
  SessionExercise,
  SetLog,
  Muscle,
  State,
} from "./model";
import { uid, blankSet } from "./model";
export const isEffective = (s: SetLog) =>
  s.status === "completada" &&
  !["Calentamiento", "Aproximación"].includes(s.type);
export const physicalSets = (sets: SetLog[]) => {
  let n = 0;
  const left = sets.filter(
    (s) => isEffective(s) && s.side === "izquierdo",
  ).length;
  const right = sets.filter(
    (s) => isEffective(s) && s.side === "derecho",
  ).length;
  n = sets.filter((s) => isEffective(s) && s.side === "ambos").length;
  return n + Math.max(left, right);
};
export const tonnage = (e: SessionExercise) =>
  e.sets
    .filter(isEffective)
    .reduce(
      (n, s) =>
        n +
        ((s.weight ?? 0) * (s.reps ?? 0) +
          s.segments.reduce((a, d) => a + d.weight * d.reps, 0)) *
          (e.weightMode === "por mancuerna" && s.side === "ambos" ? 2 : 1),
      0,
    );
export const e1rm = (weight: number, reps: number) =>
  reps > 0 && reps <= 10 ? weight * (1 + reps / 30) : null;
export const warmup = (
  weight: number,
  step: number,
  percentages = [40, 60, 80],
) => percentages.map((p) => Math.round((weight * p) / 100 / step) * step);
export function createSession(
  r: Routine,
  exercises: Exercise[],
  startedAt = new Date().toISOString(),
): Session {
  return {
    id: uid(),
    routineId: r.id,
    routineName: r.name,
    version: r.version,
    startedAt,
    status: "activa",
    notes: "",
    exercises: r.exercises.map((p) => {
      const e = exercises.find((e) => e.id === p.exerciseId)!;
      return {
        exercise: structuredClone(e),
        plan: structuredClone(p),
        machine: "",
        weightMode: "total",
        technique: false,
        pain: false,
        sets: Array.from({ length: p.sets }, () =>
          e.unilateral
            ? [
                blankSet("Efectiva", "izquierdo"),
                blankSet("Efectiva", "derecho"),
              ]
            : [blankSet()],
        ).flat(),
      };
    }),
  };
}
export function volume(sessions: Session[], muscle: Muscle, indirect = false) {
  return sessions.reduce(
    (n, s) =>
      n +
      s.exercises.reduce(
        (a, e) =>
          a +
          physicalSets(e.sets) *
            (e.exercise.muscle === muscle
              ? 1
              : indirect && e.exercise.secondary.includes(muscle)
                ? 0.5
                : 0),
        0,
      ),
    0,
  );
}
export const plannedVolume = (
  routines: Routine[],
  exercises: Exercise[],
  muscle: Muscle,
) =>
  routines
    .filter((r) => !r.archived)
    .reduce(
      (n, r) =>
        n +
        r.exercises.reduce(
          (a, p) =>
            a +
            (exercises.find((e) => e.id === p.exerciseId)?.muscle === muscle
              ? p.sets
              : 0),
          0,
        ),
      0,
    );
export function progression(e: SessionExercise, increment: number) {
  const sets = e.sets.filter(
    (s) => !["Aproximación", "Calentamiento"].includes(s.type),
  );
  if (
    physicalSets(sets) < e.plan.sets ||
    sets.some(
      (s) =>
        !isEffective(s) ||
        s.weight === null ||
        s.reps === null ||
        s.rir === null,
    )
  )
    return {
      increase: false,
      reason: "Faltan series o datos completos para evaluar la progresión.",
      weight: null,
    };
  const weights = new Set(sets.map((s) => s.weight));
  if (e.pain || !e.technique || weights.size !== 1)
    return {
      increase: false,
      reason:
        "Confirma técnica sin dolor y cargas comparables antes de ajustar.",
      weight: null,
    };
  const good = sets.every((s) => s.reps! >= e.plan.max && s.rir! >= e.plan.rir);
  return {
    increase: good,
    reason: good
      ? "Todas las series alcanzaron el máximo de repeticiones con el RIR objetivo, técnica confirmada y sin dolor."
      : "Mantén la carga y busca mejorar repeticiones con técnica y RIR comparables.",
    weight: good ? sets[0].weight! + increment : sets[0].weight,
  };
}
export const remaining = (rest: Session["rest"], now = Date.now()) =>
  !rest ? 0 : Math.max(0, rest.remaining ?? Math.ceil((rest.end - now) / 1000));
export const seconds = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
export function weekRange(date: string) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const start = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 7);
  return { start, end: d.toISOString().slice(0, 10) };
}
export const comparable = (a: SessionExercise, b: SessionExercise) =>
  a.exercise.id === b.exercise.id &&
  a.machine === b.machine &&
  a.weightMode === b.weightMode;
export function estimateMinutes(r: Routine, exercises: Exercise[]) {
  const execution = r.exercises.reduce(
    (n, p) =>
      n +
      p.sets *
        ((p.min + p.max) / 2) *
        3 *
        (exercises.find((e) => e.id === p.exerciseId)?.unilateral ? 2 : 1),
    0,
  );
  const rests = r.exercises.reduce(
    (n, p) => n + Math.max(0, p.sets - 1) * p.rest,
    0,
  );
  const transitions = Math.max(0, r.exercises.length - 1) * 90;
  return Math.ceil((execution + rests + transitions + 20 * 60) / 60);
}
export function detectTrend(history: SessionExercise[]) {
  if (history.length < 3) return "insuficiente" as const;
  const latest = history.slice(0, 3);
  if (
    latest.some(
      (e) =>
        !comparable(e, latest[0]) ||
        e.pain ||
        !e.technique ||
        physicalSets(e.sets) < e.plan.sets,
    )
  )
    return "insuficiente" as const;
  const metrics = latest.map((e) =>
    e.sets
      .filter(isEffective)
      .reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0),
  );
  if (metrics[0] < metrics[1] * 0.95 && metrics[1] < metrics[2] * 0.95)
    return "descenso" as const;
  if (
    Math.abs(metrics[0] - metrics[1]) < 0.01 &&
    Math.abs(metrics[1] - metrics[2]) < 0.01
  )
    return "estable" as const;
  return "variable" as const;
}

/** Reversible removal; the other sessions and related records remain untouched. */
export function moveSessionToTrash(
  state: State,
  id: string,
  deletedAt = new Date().toISOString(),
) {
  const index = state.sessions.findIndex((s) => s.id === id);
  if (index < 0) return;
  const [session] = state.sessions.splice(index, 1);
  state.sessionTrash ??= [];
  state.sessionTrash.push({ session, deletedAt });
}
export function restoreSession(state: State, id: string) {
  const index = state.sessionTrash?.findIndex((t) => t.session.id === id) ?? -1;
  if (index < 0) return;
  const session = state.sessionTrash![index].session;
  if (state.sessions.some((s) => s.id === id))
    throw new Error("Esta sesión ya está en el historial.");
  if (
    session.status === "activa" &&
    state.sessions.some((s) => s.status === "activa")
  )
    throw new Error(
      "Finaliza o cancela la sesión activa antes de recuperar otra sesión en curso.",
    );
  state.sessions.push(session);
  state.sessionTrash!.splice(index, 1);
}
