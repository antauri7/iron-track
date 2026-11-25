import { test, expect } from "@playwright/test";
async function enter(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear mi espacio" }).click();
  await expect(
    page.getByRole("heading", { name: "Supera tu última sesión." }),
  ).toBeVisible();
}
test("sesión se recupera y un registro real aparece en historial", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await page.getByLabel("Peso serie 1", { exact: true }).fill("50");
  await page.getByLabel("Repeticiones serie 1", { exact: true }).fill("8");
  await page.getByLabel("RIR serie 1", { exact: true }).fill("2");
  await page.getByLabel("Completar serie 1", { exact: true }).click();
  await expect(
    page.getByLabel("Completar serie 1", { exact: true }),
  ).toHaveClass(/checked/);
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByLabel("Peso serie 1", { exact: true })).toHaveValue(
    "50",
  );
  await expect(
    page.getByLabel("Completar serie 1", { exact: true }),
  ).toHaveClass(/checked/);
  await page
    .getByRole("button", { name: "Finalizar sesión", exact: true })
    .click();
  await page.getByRole("button", { name: "Guardar y finalizar" }).click();
  await page.goto("/#/historial");
  await expect(
    page.getByText("1 series efectivas · 400 kg de volumen de carga"),
  ).toBeVisible();
});
test("rutina editada no altera el snapshot de una sesión iniciada", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .first()
    .click();
  await page.goto("/#/entrenar");
  await page
    .getByRole("button", { name: "Editar", exact: true })
    .first()
    .click();
  await page.getByLabel("Nombre", { exact: true }).fill("Rutina modificada");
  await page.getByRole("button", { name: "Guardar nueva versión" }).click();
  await page
    .getByRole("button", { name: "Continuar sesión pendiente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pierna A", exact: true }),
  ).toBeVisible();
});
for (const width of [360, 390, 430, 768, 1024, 1440])
  test(`sin desborde horizontal a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await enter(page);
    for (const route of [
      "/",
      "/entrenar",
      "/progreso",
      "/coach",
      "/perfil",
      "/biblioteca",
      "/calculadoras",
      "/historial",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator(".content h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
test("service worker permite recargar sin conexión", async ({
  page,
  context,
}) => {
  await enter(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Supera tu última sesión." }),
  ).toBeVisible();
  await page.goto("/#/entrenar");
  await expect(
    page.getByRole("heading", { name: "Vamos a entrenar." }),
  ).toBeVisible();
});
test("medida parcial y exportación JSON", async ({ page }) => {
  await enter(page);
  await page.goto("/#/progreso");
  await page.getByRole("button", { name: "Medidas", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar medidas", exact: true })
    .click();
  await page.getByLabel("Peso", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Guardar medición" }).click();
  await expect(
    page.getByRole("heading", { name: "80 kg", exact: true }),
  ).toBeVisible();
  await page.goto("/#/perfil");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar respaldo JSON" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/iron-track.*\.json/);
});
test("respaldo restaura registros y rechaza entradas inválidas", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/perfil");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar respaldo JSON" }).click();
  const file = await (await pending).path();
  if (!file) throw new Error("Falta archivo exportado");
  await page.getByLabel("Nombre", { exact: true }).fill("Cambio temporal");
  await page.waitForTimeout(200);
  await page.locator("input[type=file]").setInputFiles(file);
  await expect(
    page.getByRole("heading", { name: "Revisar antes de restaurar" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Confirmar restauración" }).click();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"app":"incorrecta"}'),
  });
  await expect(page.getByRole("status")).toContainText("Respaldo inválido");
});
test("no aparecen errores al navegar ni al guardar recuperación", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await page.goto("/#/coach");
  await page.getByRole("button", { name: "Guardar autoevaluación" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Autoevaluación guardada",
  );
  await page.goto("/#/informes");
  await expect(
    page.getByRole("heading", { name: "Informe de progreso." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("fotos locales se comprimen y comparan sin servicios externos", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/progreso");
  await page.getByRole("button", { name: "Fotografías", exact: true }).click();
  await page
    .getByLabel("Agregar fotografía")
    .setInputFiles("public/icon-192.png");
  await expect(page.getByRole("status")).toContainText(
    "Fotografía guardada localmente",
  );
  await expect(page.getByAltText(/Progreso Frontal/)).toBeVisible();
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Comparación por fecha" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Fotografías", exact: true }).click();
  await expect(page.getByAltText(/Progreso Frontal/)).toBeVisible();
  await page.goto("/#/perfil");
  await page
    .getByLabel("Incluir fotografías personales en el respaldo")
    .check();
  const pendingPhotoBackup = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar respaldo JSON" }).click();
  const photoBackup = await (await pendingPhotoBackup).path();
  if (!photoBackup) throw new Error("No se exportó el respaldo con fotografía");
  await page.locator("input[type=file]").setInputFiles(photoBackup);
  await expect(
    page.getByText("0 sesiones · 0 mediciones · 1 fotografías."),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Confirmar restauración" }).click();
  await expect(page.getByRole("heading", { name: "Mi perfil." })).toBeVisible();
  await page.goto("/#/progreso");
  await page.getByRole("button", { name: "Fotografías", exact: true }).click();
  await expect(page.getByAltText(/Progreso Frontal/)).toBeVisible();
});
