import { type State, type Session, type ProcessGoal, dayKey } from "./model";
import { physicalSets, weekRange } from "./engine";
export function shiftDate(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export const hasRecordedWork = (s: Session) =>
  s.status !== "activa" && s.exercises.some((e) => physicalSets(e.sets) > 0);
export function trainingDates(sessions: Session[], start: string, end: string) {
  return [
    ...new Set(
      sessions
        .filter(hasRecordedWork)
        .map((s) => dayKey(s.startedAt))
        .filter((d) => d >= start && d <= end),
    ),
  ].sort();
}
export function goalProgress(state: State, goal: ProcessGoal) {
  let dates: string[];
  if (goal.metric === "trainingDays")
    dates = trainingDates(state.sessions, goal.start, goal.end);
  else if (goal.metric === "measurementDays")
    dates = [
      ...new Set(
        state.measurements
          .filter((m) => Object.keys(m.values).length > 0)
          .map((m) => m.date)
          .filter((d) => d >= goal.start && d <= goal.end),
      ),
    ];
  else
    dates = [
      ...new Set(
        (state.weeklyReviews ?? [])
          .filter((r) =>
            [r.wins, r.challenge, r.nextStep].some((t) => t.trim()),
          )
          .map((r) => r.weekStart)
          .filter(
            (d) =>
              d >= weekRange(goal.start).start &&
              d <= weekRange(goal.end).start,
          ),
      ),
    ];
  return {
    count: dates.length,
    percent: Math.min(100, Math.round((dates.length / goal.target) * 100)),
    complete: dates.length >= goal.target,
  };
}
export function weekDays(state: State, date: string) {
  const { start } = weekRange(date);
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(start, i),
      day = (i + 1) % 7;
    return {
      date,
      planned: state.routines.some((r) => !r.archived && r.day === day),
      sessions: state.sessions.filter(
        (s) => hasRecordedWork(s) && dayKey(s.startedAt) === date,
      ).length,
    };
  });
}
