import Dexie, { type Table } from "dexie";
import { z } from "zod";
import {
  setSchema,
  type State,
  type Photo,
  type BackupInfo,
  muscles,
} from "./model";
export class IronDB extends Dexie {
  state!: Table<{ id: string; value: State }>;
  photos!: Table<
    Omit<Photo, "blob"> & { blob: Blob | ArrayBuffer; mime?: string }
  >;
  constructor(name = "iron-track") {
    super(name);
    this.version(1).stores({ state: "id", photos: "id,date,view" });
    this.version(2).stores({ state: "id", photos: "id,date,view" });
    this.version(3).stores({ state: "id", photos: "id,date,view" });
  }
}
export const db = new IronDB();
const exercise = z.object({
  id: z.string(),
  name: z.string().min(1),
  muscle: z.enum(muscles),
  secondary: z.array(z.enum(muscles)),
  equipment: z.string(),
  unilateral: z.boolean(),
  instruction: z.string(),
});
const plan = z
  .object({
    exerciseId: z.string(),
    sets: z.number().int().min(1).max(30),
    min: z.number().int().min(1).max(100),
    max: z.number().int().min(1).max(100),
    rir: z.number().min(0).max(10),
    rest: z.number().min(0).max(3600),
  })
  .refine((p) => p.min <= p.max, "Rango de repeticiones inválido");
const coreStateSchema = z.object({
  profile: z
    .object({
      name: z.string(),
      age: z.number().min(1).max(120).nullable(),
      height: z.number().min(30).max(260).nullable(),
      experience: z.string(),
      frequency: z.number().int().min(1).max(7),
      minutes: z.number().min(15).max(300),
      restDay: z.number().int().min(0).max(6),
      unit: z.enum(["kg", "lb"]),
      cycleStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      theme: z.enum(["dark", "light"]),
      autoRest: z.boolean(),
      sound: z.boolean(),
      vibration: z.boolean(),
    })
    .nullable(),
  exercises: z.array(exercise),
  routines: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      day: z.number().int().min(0).max(6),
      version: z.number().int().min(1),
      archived: z.boolean().optional(),
      exercises: z.array(plan),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      routineId: z.string(),
      routineName: z.string(),
      version: z.number(),
      startedAt: z.iso.datetime(),
      endedAt: z.iso.datetime().optional(),
      status: z.enum(["activa", "completada", "parcial"]),
      exercises: z.array(
        z.object({
          exercise,
          plan,
          notes: z.string().optional(),
          machine: z.string(),
          weightMode: z.enum(["total", "por mancuerna"]),
          sets: z.array(setSchema),
          technique: z.boolean(),
          pain: z.boolean(),
        }),
      ),
      notes: z.string(),
      rest: z
        .object({
          end: z.number(),
          remaining: z.number().optional(),
          target: z.number(),
          started: z.number(),
        })
        .optional(),
    }),
  ),
  measurements: z.array(
    z.object({
      id: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      values: z.record(z.string(), z.number().min(0).max(2000)),
      method: z.string(),
      notes: z.string(),
    }),
  ),
  recovery: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      signals: z.array(z.boolean()),
      pain: z.boolean(),
      sleep: z.number().min(0).max(24).nullable(),
      energy: z.number().min(1).max(5),
      stress: z.number().min(1).max(5),
      motivation: z.number().min(1).max(5),
      notes: z.string(),
    }),
  ),
  decisions: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      key: z.string(),
      decision: z.string(),
    }),
  ),
});
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Fecha inválida");
export const stateSchema = coreStateSchema.extend({
  weeklyReviews: z
    .array(
      z.object({
        id: z.string(),
        weekStart: calendarDate,
        wins: z.string().max(2000),
        challenge: z.string().max(2000),
        nextStep: z.string().max(2000),
        updatedAt: z.iso.datetime(),
      }),
    )
    .optional(),
  processGoals: z
    .array(
      z
        .object({
          id: z.string(),
          title: z.string().min(1).max(120),
          metric: z.enum(["trainingDays", "measurementDays", "reviewWeeks"]),
          target: z.number().int().min(1).max(365),
          start: calendarDate,
          end: calendarDate,
          archived: z.boolean().optional(),
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
        })
        .refine((g) => g.end >= g.start, "El fin debe ser posterior al inicio"),
    )
    .optional(),
  backupInfo: z
    .object({ generatedAt: z.iso.datetime(), includesPhotos: z.boolean() })
    .optional(),
  sessionTrash: z
    .array(
      z.object({
        session: coreStateSchema.shape.sessions.element,
        deletedAt: z.iso.datetime(),
      }),
    )
    .optional(),
});
export const backupSchema = z.object({
  app: z.literal("IRON TRACK"),
  version: z.literal(1),
  exportedAt: z.string(),
  data: stateSchema,
  photos: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        view: z.string(),
        data: z.string().startsWith("data:image/"),
      }),
    )
    .optional(),
});
export function validateBackup(value: unknown) {
  const b = backupSchema.parse(value);
  for (const group of [
    b.data.exercises,
    b.data.routines,
    [...b.data.sessions, ...(b.data.sessionTrash ?? []).map((t) => t.session)],
    b.data.measurements,
    b.data.recovery,
    b.data.decisions,
    b.data.weeklyReviews ?? [],
    b.data.processGoals ?? [],
    b.photos ?? [],
  ]) {
    if (new Set(group.map((x) => x.id)).size !== group.length)
      throw new Error("El respaldo contiene identificadores duplicados.");
  }
  const reviewWeeks = (b.data.weeklyReviews ?? []).map((r) => r.weekStart);
  if (new Set(reviewWeeks).size !== reviewWeeks.length)
    throw new Error("Hay semanas duplicadas en la bitácora.");
  const ids = new Set(b.data.exercises.map((e) => e.id));
  if (
    b.data.routines.some((r) => r.exercises.some((e) => !ids.has(e.exerciseId)))
  )
    throw new Error("Hay ejercicios sin referencia.");
  if (b.data.sessions.filter((s) => s.status === "activa").length > 1)
    throw new Error("Hay más de una sesión activa.");
  return b;
}
export function download(
  name: string,
  content: BlobPart,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const blobData = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export async function readPhotos(): Promise<Photo[]> {
  return (await db.photos.toArray()).map((p) => ({
    ...p,
    blob:
      p.blob instanceof Blob
        ? p.blob
        : new Blob([p.blob], { type: p.mime ?? "image/jpeg" }),
  }));
}
export async function writePhoto(p: Photo) {
  await db.photos.put({
    ...p,
    blob: await p.blob.arrayBuffer(),
    mime: p.blob.type,
  });
}

export async function exportBackup(
  state: State,
  includePhotos = false,
): Promise<BackupInfo> {
  const photos = includePhotos
    ? await Promise.all(
        (await readPhotos()).map(async (p) => ({
          id: p.id,
          date: p.date,
          view: p.view,
          data: await blobData(p.blob),
        })),
      )
    : undefined;
  const backupInfo = {
    generatedAt: new Date().toISOString(),
    includesPhotos: includePhotos,
  };
  const content = JSON.stringify({
    app: "IRON TRACK",
    version: 1,
    exportedAt: backupInfo.generatedAt,
    data: { ...state, backupInfo },
    photos,
  });
  download(
    `iron-track-${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}.json`,
    content,
  );
  return backupInfo;
}
