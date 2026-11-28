import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear mi espacio" }).click();
  await page.goto("/#/perfil");
  await expect(page.getByTestId("save-status")).toHaveText(
    "Cambios guardados en este dispositivo",
  );
}
test("reflexión semanal se guarda y vuelve a aparecer al abrir la app", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/bitacora");
  await page
    .getByLabel("¿Qué salió bien?", { exact: true })
    .fill("Aprendí a registrar mis repeticiones");
  await page
    .getByLabel("¿Qué te lo dificultó?", { exact: true })
    .fill("Equipo ocupado");
  await page
    .getByLabel("¿Qué quieres probar la próxima semana?", { exact: true })
    .fill("Preparar una alternativa");
  await expect(
    page.getByText("Reflexión guardada en este dispositivo", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("¿Qué salió bien?", { exact: true }),
  ).toHaveValue("Aprendí a registrar mis repeticiones");
  await expect(
    page.getByLabel("¿Qué quieres probar la próxima semana?", { exact: true }),
  ).toHaveValue("Preparar una alternativa");
  await expect(page.getByRole("button", { name: /Semana del/ })).toHaveCount(1);
});
test("crea, edita, archiva y reactiva una meta sin inventar avances", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/#/bitacora");
  await page.getByRole("button", { name: "Nueva meta", exact: true }).click();
  await page
    .getByLabel("Nombre de la meta", { exact: true })
    .fill("Mi objetivo de constancia");
  await page.getByLabel("Cantidad objetivo", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Guardar meta", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "Mi objetivo de constancia" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Editar meta", exact: true }).click();
  await page
    .getByLabel("Nombre de la meta", { exact: true })
    .fill("Meta ajustada");
  await page.getByRole("button", { name: "Guardar meta", exact: true }).click();
  await page
    .getByRole("button", { name: "Archivar meta Meta ajustada", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ver metas archivadas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Meta ajustada", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reactivar meta Meta ajustada", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ver metas activas", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("progressbar", { name: "Meta ajustada" }),
  ).toHaveAttribute("aria-valuenow", "0");
});
test("respaldo incluye bitácora y permite restaurarla", async ({ page }) => {
  await enter(page);
  await page.goto("/#/bitacora");
  await page
    .getByLabel("¿Qué salió bien?", { exact: true })
    .fill("Nota de prueba para respaldo");
  await expect(
    page.getByText("Reflexión guardada en este dispositivo", { exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Generar copia sin fotos", exact: true })
    .click();
  const file = await (await pending).path();
  if (!file) throw new Error("No se generó el archivo");
  const backup = JSON.parse(await readFile(file, "utf8"));
  expect(backup.data.weeklyReviews[0].wins).toBe(
    "Nota de prueba para respaldo",
  );
  expect(backup.data.backupInfo.includesPhotos).toBe(false);
  await expect(page.getByText(/Último respaldo generado el/)).toBeVisible();
  await page
    .getByLabel("¿Qué salió bien?", { exact: true })
    .fill("Cambio posterior");
  await page.goto("/#/perfil");
  await page.locator("input[type=file]").setInputFiles(file);
  page.once("dialog", (d) => d.accept());
  await Promise.all([
    page.waitForEvent("load"),
    page
      .getByRole("button", { name: "Confirmar restauración", exact: true })
      .click(),
  ]);
  await page.goto("/#/bitacora");
  await expect(
    page.getByLabel("¿Qué salió bien?", { exact: true }),
  ).toHaveValue("Nota de prueba para respaldo");
});
for (const width of [360, 390, 440])
  test(`bitácora adaptable y enlace de día a historial en ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 956 });
    await enter(page);
    await page.goto("/#/bitacora");
    await expect(
      page.getByRole("heading", { name: "Mi bitácora." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".week-pulse-days a").first().click();
    await expect(
      page.getByRole("button", { name: "Mostrar todo el mes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Sesiones del/ }),
    ).toBeVisible();
  });
