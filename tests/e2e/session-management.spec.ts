import { test, expect, type Page } from "@playwright/test";
import { initialState, seedRoutines, seedExercises } from "../../src/seed";
import { createSession } from "../../src/engine";
import type { Session } from "../../src/model";
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear mi espacio" }).click();
  await page.goto("/#/perfil");
  await expect(page.getByTestId("save-status")).toHaveText(
    "Cambios guardados en este dispositivo",
  );
}
function legacySessions() {
  return Array.from({ length: 3 }, () => {
    const s = createSession(seedRoutines[2], seedExercises);
    s.status = "completada";
    s.endedAt = s.startedAt;
    for (const ex of s.exercises)
      for (const set of ex.sets)
        Object.assign(set, {
          weight: 40,
          reps: 8,
          rir: 2,
          status: "completada",
        });
    return s;
  });
}
async function seed(page: Page, sessions: Session[]) {
  await page.evaluate(async (sessions) => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("iron-track");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result,
          tx = db.transaction("state", "readwrite"),
          store = tx.objectStore("state");
        const get = store.get("main");
        get.onsuccess = () => {
          const row = get.result;
          row.value.sessions = sessions;
          delete row.value.sessionTrash;
          store.put(row);
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, sessions);
  await page.reload();
}
async function read(page: Page) {
  return page.evaluate(
    async () =>
      new Promise<any>((resolve, reject) => {
        const o = indexedDB.open("iron-track");
        o.onsuccess = () => {
          const db = o.result;
          const r = db.transaction("state").objectStore("state").get("main");
          r.onsuccess = () => {
            resolve(r.result.value);
            db.close();
          };
          r.onerror = () => reject(r.error);
        };
      }),
  );
}
test("elimina la sesión vacía sin alterar tres sesiones reales y permite recuperarla", async ({
  page,
}) => {
  await enter(page);
  const real = legacySessions(),
    empty = createSession(seedRoutines[2], seedExercises);
  await seed(page, [...real, empty]);
  await page.goto("/#/historial");
  const emptyCard = page
    .locator("section.card")
    .filter({ hasText: "0 series efectivas · 0 kg" });
  await emptyCard.getByRole("button", { name: /Eliminar sesión/ }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  expect((await read(page)).sessions).toHaveLength(4);
  await emptyCard.getByRole("button", { name: /Eliminar sesión/ }).click();
  await page
    .getByRole("button", { name: "Mover a Papelera", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Papelera (1)", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Sesión enviada a Papelera",
  );
  await page.reload();
  let stored = await read(page);
  expect(stored.sessions).toEqual(real);
  expect(stored.sessionTrash[0].session).toEqual(empty);
  await page.getByRole("button", { name: "Papelera (1)", exact: true }).click();
  await page.getByRole("button", { name: /Recuperar sesión/ }).click();
  await expect(
    page.getByRole("button", { name: "Papelera (0)", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Sesión recuperada");
  stored = await read(page);
  expect(stored.sessions).toEqual([...real, empty]);
});
test("cancelar sesión iniciada conserva el historial previo y libera una nueva rutina", async ({
  page,
}) => {
  await enter(page);
  const real = legacySessions();
  await seed(page, real);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Seguir entrenando", exact: true })
    .click();
  await expect(page.getByLabel("Peso serie 1", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancelar y mover a Papelera", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vamos a entrenar." }),
  ).toBeVisible();
  const stored = await read(page);
  expect(stored.sessions).toEqual(real);
  expect(stored.sessionTrash).toHaveLength(1);
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Cancelar entrenamiento", exact: true }),
  ).toBeVisible();
});
test("comentarios generales se conservan al cambiar de ejercicio, recargar e ir al historial", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  const text = "Equipo alternativo; ejecución unilateral de prueba";
  await page
    .getByLabel("Comentarios generales del ejercicio", { exact: true })
    .fill(text);
  await page
    .getByRole("button", { name: "Siguiente ejercicio", exact: true })
    .click();
  await expect(
    page.getByLabel("Comentarios generales del ejercicio", { exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await expect(
    page.getByLabel("Comentarios generales del ejercicio", { exact: true }),
  ).toHaveValue(text);
  await page.reload();
  await expect(
    page.getByLabel("Comentarios generales del ejercicio", { exact: true }),
  ).toHaveValue(text);
  await page
    .getByRole("button", { name: "Finalizar sesión", exact: true })
    .click();
  await page.getByRole("button", { name: "Guardar y finalizar" }).click();
  await page.goto("/#/historial");
  await page.getByRole("button", { name: "Ver y editar", exact: true }).click();
  await expect(
    page.getByLabel("Comentarios generales · Sentadilla Hack", { exact: true }),
  ).toHaveValue(text);
});
test("cancelación con series ofrece conservarlas como parcial", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await page.getByLabel("Peso serie 1", { exact: true }).fill("40");
  await page.getByLabel("Repeticiones serie 1", { exact: true }).fill("8");
  await page.getByLabel("RIR serie 1", { exact: true }).fill("2");
  await page.getByLabel("Completar serie 1", { exact: true }).click();
  await page
    .getByRole("button", { name: "Cancelar entrenamiento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Conservar como sesión parcial", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vamos a entrenar." }),
  ).toBeVisible();
  const stored = await read(page);
  expect(stored.sessions[0].status).toBe("parcial");
  expect(stored.sessions[0].exercises[0].sets[0].weight).toBe(40);
  expect(stored.sessions[0].exercises[0].sets[0].status).toBe("completada");
  expect(stored.sessionTrash ?? []).toHaveLength(0);
});
test("navegación y cambio de ejercicio regresan al inicio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await enter(page);
  await page.goto("/#/entrenar");
  await expect(
    page.getByRole("heading", { name: "Vamos a entrenar." }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 1200));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page
    .locator("nav")
    .getByRole("link", { name: "Coach", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Mi Coach." })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page
    .locator("nav")
    .getByRole("link", { name: "Entrenar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Siguiente ejercicio", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
test("bloqueo táctil del entrenamiento evita pellizcos y doble toque, no desplazamiento", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 440, height: 956 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await enter(page);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await expect(page.locator(".exercise-title")).toBeVisible();
  const result = await page.evaluate(() => {
    const target = document.querySelector(".exercise-title")!;
    const dispatch = (type: string, count: number) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(e, "touches", { value: Array(count).fill({}) });
      Object.defineProperty(e, "changedTouches", {
        value: [{ clientX: 100, clientY: 200 }],
      });
      target.dispatchEvent(e);
      return e.defaultPrevented;
    };
    const pinch = dispatch("touchstart", 2),
      scroll = dispatch("touchmove", 1);
    dispatch("touchend", 0);
    const doubleTap = dispatch("touchend", 0);
    return {
      pinch,
      scroll,
      doubleTap,
      action: getComputedStyle(target).touchAction,
    };
  });
  expect(result.pinch).toBe(true);
  expect(result.scroll).toBe(false);
  expect(result.doubleTap).toBe(true);
  expect(result.action).toBe("pan-x pan-y");
  await context.close();
});
