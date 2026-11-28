import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { seedRoutines, seedExercises, initialState } from "../src/seed";
import {
  createSession,
  physicalSets,
  tonnage,
  progression,
  warmup,
  e1rm,
  remaining,
  plannedVolume,
  comparable,
  weekRange,
} from "../src/engine";
import { blankSet } from "../src/model";
import { validateBackup, IronDB } from "../src/storage";
describe("programa y cálculos", () => {
  it("distribuye las 113 series en seis días", () =>
    expect(
      seedRoutines.map((r) => r.exercises.reduce((n, e) => n + e.sets, 0)),
    ).toEqual([18, 21, 17, 20, 21, 16]));
  it("calcula volúmenes directos sin confundir plan e historial", () => {
    expect(plannedVolume(seedRoutines, seedExercises, "Espalda")).toBe(20);
    expect(plannedVolume(seedRoutines, seedExercises, "Pecho")).toBe(18);
    expect(plannedVolume(seedRoutines, seedExercises, "Bíceps")).toBe(12);
    expect(plannedVolume(seedRoutines, seedExercises, "Tríceps")).toBe(10);
  });
  it("preserva el snapshot del programa", () => {
    const routine = structuredClone(seedRoutines[0]);
    const s = createSession(routine, seedExercises);
    routine.exercises[0].rest = 5;
    expect(s.exercises[0].plan.rest).toBe(180);
  });
  it("cuenta lados por pares sin duplicar series, y excluye aproximaciones", () => {
    const logs = [
      {
        ...blankSet(),
        status: "completada" as const,
        side: "izquierdo" as const,
      },
      {
        ...blankSet(),
        status: "completada" as const,
        side: "derecho" as const,
      },
      { ...blankSet("Aproximación"), status: "completada" as const },
    ];
    expect(physicalSets(logs)).toBe(1);
  });
  it("drop set suma tonelaje pero cuenta una sola serie", () => {
    const e = createSession(seedRoutines[0], seedExercises).exercises[0];
    e.sets = [
      {
        ...blankSet("Descendente"),
        status: "completada",
        weight: 100,
        reps: 8,
        segments: [{ weight: 70, reps: 5 }],
      },
    ];
    expect(physicalSets(e.sets)).toBe(1);
    expect(tonnage(e)).toBe(1150);
  });
  it("distingue peso por mancuerna", () => {
    const e = createSession(seedRoutines[2], seedExercises).exercises[0];
    e.sets = [{ ...blankSet(), weight: 20, reps: 10, status: "completada" }];
    e.weightMode = "por mancuerna";
    expect(tonnage(e)).toBe(400);
    e.sets[0].side = "derecho";
    expect(tonnage(e)).toBe(200);
  });
  it("no compara máquinas distintas", () => {
    const a = createSession(seedRoutines[0], seedExercises).exercises[0];
    const b = structuredClone(a);
    b.machine = "otra";
    expect(comparable(a, b)).toBe(false);
  });
  it("progresión requiere todas las series, RIR, técnica y ausencia de dolor", () => {
    const e = createSession(seedRoutines[2], seedExercises).exercises[0];
    e.sets.forEach((s) =>
      Object.assign(s, { weight: 30, reps: 8, rir: 2, status: "completada" }),
    );
    expect(progression(e, 2.5).increase).toBe(false);
    e.technique = true;
    expect(progression(e, 2.5).weight).toBe(32.5);
    e.pain = true;
    expect(progression(e, 2.5).increase).toBe(false);
    e.pain = false;
    e.sets[0].reps = 7;
    expect(progression(e, 2.5).increase).toBe(false);
  });
  it("calcula aproximaciones con redondeo y limita estimaciones de 1RM", () => {
    expect(warmup(100, 2.5)).toEqual([40, 60, 80]);
    expect(e1rm(100, 6)).toBe(120);
    expect(e1rm(100, 12)).toBeNull();
  });
  it("temporizador utiliza fecha absoluta y pausa persistible", () => {
    const rest = { end: 100000, target: 180, started: 0 };
    expect(remaining(rest, 40000)).toBe(60);
    expect(remaining(rest, 200000)).toBe(0);
    expect(remaining({ ...rest, remaining: 35 }, 200000)).toBe(35);
  });
  it("semana inicia en lunes incluso el domingo", () =>
    expect(weekRange("2026-11-29")).toEqual({
      start: "2026-11-23",
      end: "2026-11-30",
    }));
});
describe("persistencia y respaldos", () => {
  it("recupera una sesión activa guardada", async () => {
    const db = new IronDB("test-" + crypto.randomUUID());
    const value = initialState();
    value.sessions.push(createSession(seedRoutines[0], seedExercises));
    await db.state.put({ id: "main", value });
    db.close();
    await db.open();
    expect((await db.state.get("main"))!.value.sessions[0].status).toBe(
      "activa",
    );
    await db.delete();
  });
  it("valida un roundtrip y rechaza duplicados o esquemas inválidos", () => {
    const b = {
      app: "IRON TRACK",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: initialState(),
    };
    expect(
      validateBackup(JSON.parse(JSON.stringify(b))).data.routines,
    ).toHaveLength(6);
    b.data.routines.push(b.data.routines[0]);
    expect(() => validateBackup(b)).toThrow();
    expect(() => validateBackup({ app: "otro" })).toThrow();
  });
});

describe("fechas, tendencias y estimación", () => {
  it("respeta fecha mexicana durante una noche UTC del día siguiente", async () => {
    const { dayKey } = await import("../src/model");
    expect(dayKey("2026-11-26T02:00:00.000Z")).toBe("2026-11-25");
  });
  it("el estimador reacciona a más series y a unilateralidad", async () => {
    const { estimateMinutes } = await import("../src/engine");
    const r = structuredClone(seedRoutines[0]);
    const baseline = estimateMinutes(r, seedExercises);
    r.exercises[0].sets += 5;
    expect(estimateMinutes(r, seedExercises)).toBeGreaterThan(baseline);
  });
  it("no concluye una tendencia con una sola sesión", async () => {
    const { detectTrend } = await import("../src/engine");
    const e = createSession(seedRoutines[0], seedExercises).exercises[0];
    expect(detectTrend([e])).toBe("insuficiente");
  });
  it("detecta descenso repetido solo con condiciones confirmadas", async () => {
    const { detectTrend } = await import("../src/engine");
    const e = createSession(seedRoutines[0], seedExercises).exercises[0];
    e.technique = true;
    e.sets.forEach((s) =>
      Object.assign(s, { status: "completada", weight: 100, reps: 8, rir: 2 }),
    );
    const a = structuredClone(e),
      b = structuredClone(e);
    a.sets.forEach((s) => (s.weight = 80));
    b.sets.forEach((s) => (s.weight = 90));
    expect(detectTrend([a, b, e])).toBe("descenso");
    a.technique = false;
    expect(detectTrend([a, b, e])).toBe("insuficiente");
  });
  it("conserva datos al abrir una base v1 con el esquema v3", async () => {
    const { default: Dexie } = await import("dexie");
    const name = "migration-" + crypto.randomUUID();
    const old = new Dexie(name);
    old.version(1).stores({ state: "id", photos: "id,date,view" });
    await old.table("state").put({ id: "main", value: initialState() });
    old.close();
    const db = new IronDB(name);
    expect((await db.state.get("main"))!.value.routines).toHaveLength(6);
    expect(db.verno).toBe(3);
    await db.delete();
  });
  it("todos los grupos principales coinciden con el programa solicitado", () => {
    const expected = {
      Espalda: 20,
      Pecho: 18,
      Cuádriceps: 15,
      Hombros: 15,
      Isquiotibiales: 13,
      Bíceps: 12,
      Tríceps: 10,
      Pantorrillas: 8,
    };
    for (const [m, n] of Object.entries(expected))
      expect(
        plannedVolume(
          seedRoutines,
          seedExercises,
          m as import("../src/model").Muscle,
        ),
      ).toBe(n);
  });
});

describe("papelera y compatibilidad con sesiones antiguas", () => {
  it("retira solo la sesión elegida y permite restaurarla íntegra", async () => {
    const { moveSessionToTrash, restoreSession } =
      await import("../src/engine");
    const state = initialState();
    state.sessions = Array.from({ length: 3 }, () => {
      const s = createSession(seedRoutines[2], seedExercises);
      s.status = "completada";
      s.endedAt = s.startedAt;
      s.exercises[0].sets[0] = {
        ...s.exercises[0].sets[0],
        weight: 40,
        reps: 8,
        rir: 2,
        status: "completada",
      };
      return s;
    });
    const originals = structuredClone(state.sessions);
    const accidental = createSession(seedRoutines[2], seedExercises);
    state.sessions.push(accidental);
    moveSessionToTrash(state, accidental.id);
    expect(state.sessions).toEqual(originals);
    expect(state.sessionTrash![0].session).toEqual(accidental);
    restoreSession(state, accidental.id);
    expect(state.sessions).toEqual([...originals, accidental]);
    expect(state.sessionTrash).toHaveLength(0);
    moveSessionToTrash(state, "missing");
    expect(state.sessions).toHaveLength(4);
  });
  it("acepta respaldos anteriores sin comentarios ni papelera y preserva tres sesiones", () => {
    const data = initialState();
    data.sessions = Array.from({ length: 3 }, () => {
      const s = createSession(seedRoutines[0], seedExercises);
      s.status = "completada";
      return s;
    });
    const old = validateBackup({
      app: "IRON TRACK",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    });
    expect(old.data.sessions).toEqual(data.sessions);
    expect(old.data.sessionTrash).toBeUndefined();
  });
  it("incluye comentarios y papelera en el roundtrip de un respaldo", async () => {
    const { moveSessionToTrash } = await import("../src/engine");
    const data = initialState();
    const s = createSession(seedRoutines[0], seedExercises);
    s.exercises[0].notes = "Equipo alternativo de prueba";
    data.sessions.push(s);
    moveSessionToTrash(data, s.id);
    const backup = validateBackup(
      JSON.parse(
        JSON.stringify({
          app: "IRON TRACK",
          version: 1,
          exportedAt: new Date().toISOString(),
          data,
        }),
      ),
    );
    expect(backup.data.sessionTrash![0].session.exercises[0].notes).toBe(
      "Equipo alternativo de prueba",
    );
    expect(backup.data.sessions).toHaveLength(0);
  });
  it("no restaura una segunda sesión activa ni pierde su copia", async () => {
    const { moveSessionToTrash, restoreSession } =
      await import("../src/engine");
    const data = initialState();
    const a = createSession(seedRoutines[0], seedExercises);
    data.sessions.push(a);
    moveSessionToTrash(data, a.id);
    data.sessions.push(createSession(seedRoutines[1], seedExercises));
    expect(() => restoreSession(data, a.id)).toThrow();
    expect(data.sessionTrash![0].session.id).toBe(a.id);
    expect(data.sessions).toHaveLength(1);
  });
});
