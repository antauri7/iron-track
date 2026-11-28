import { useEffect, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { db, validateBackup, exportBackup } from "./storage";
import { type Profile, today, dateLabel } from "./model";
import { useApp, Card, Field, Num } from "./ui";
function ProfilePage() {
  const { state, mutate, notify, saveStatus } = useApp();
  const profile = state.profile;
  const [preview, setPreview] = useState<ReturnType<
    typeof validateBackup
  > | null>(null);
  const [includePhotos, setIncludePhotos] = useState(false);
  const [install, setInstall] = useState<
    (Event & { prompt: () => Promise<void> }) | null
  >(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as typeof install);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!profile) return null;
  const change = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    mutate((s) => {
      s.profile![key] = value;
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">A TU MEDIDA</p>
          <h1>Mi perfil.</h1>
          <p>Tus preferencias. Tus datos. Siempre bajo tu control.</p>
        </div>
      </div>
      <div className="two-cols">
        <Card>
          <h2>Datos personales</h2>
          <p
            className={"save-indicator " + saveStatus}
            aria-live="polite"
            data-testid="save-status"
          >
            {saveStatus === "saving"
              ? "Guardando cambios…"
              : saveStatus === "error"
                ? "No se pudo guardar. Revisa el aviso de almacenamiento."
                : "Cambios guardados en este dispositivo"}
          </p>
          <small className="autosave-help">
            El guardado es automático; no necesitas pulsar Guardar.
          </small>
          <p>
            Introduce y confirma tus datos aquí. No se precargan ni se publican
            en el repositorio.
          </p>
          <Field label="Nombre">
            <input
              value={profile.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </Field>
          <div className="form-grid">
            <Field label="Edad">
              <Num
                label="Edad"
                step="1"
                min={1}
                max={120}
                value={profile.age}
                onChange={(v) => change("age", v)}
              />
            </Field>
            <Field label="Estatura (cm)">
              <Num
                label="Estatura"
                step="1"
                min={30}
                max={260}
                value={profile.height}
                onChange={(v) => change("height", v)}
              />
            </Field>
          </div>
          <small>
            Escribe tu estatura en centímetros: 1.75 m equivale a 175 cm.
          </small>
          <Field label="Experiencia de entrenamiento">
            <input
              value={profile.experience}
              placeholder="Escribe tu experiencia"
              onChange={(e) => change("experience", e.target.value)}
            />
          </Field>
          <Field label="Frecuencia semanal">
            <select
              value={profile.frequency}
              onChange={(e) => change("frequency", +e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} días
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tiempo disponible (minutos)">
            <Num
              label="Tiempo disponible"
              min={15}
              max={300}
              value={profile.minutes}
              onChange={(v) => v && change("minutes", v)}
            />
          </Field>
          <Field label="Día habitual de descanso">
            <select
              value={profile.restDay}
              onChange={(e) => change("restDay", +e.target.value)}
            >
              {[
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
              ].map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <small>
            La agenda se configura en cada rutina; este dato expresa tu
            preferencia.
          </small>
        </Card>
        <div>
          <Card>
            <h2>Preferencias</h2>
            <Field label="Unidades de carga">
              <select
                value={profile.unit}
                onChange={(e) =>
                  change("unit", e.target.value as Profile["unit"])
                }
              >
                <option value="kg">Kilogramos</option>
                <option value="lb">Libras</option>
              </select>
            </Field>
            <small>
              Las medidas corporales se registran en kg y cm. Las cargas se
              almacenan en kg y se convierten al mostrarlas.
            </small>
            <Field label="Apariencia">
              <select
                value={profile.theme}
                onChange={(e) =>
                  change("theme", e.target.value as Profile["theme"])
                }
              >
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
              </select>
            </Field>
            {(["autoRest", "sound", "vibration"] as const).map((key, i) => (
              <label className="checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={profile[key]}
                  onChange={(e) => change(key, e.target.checked)}
                />
                {
                  [
                    "Iniciar descanso al completar una serie",
                    "Sonido al terminar el descanso",
                    "Vibración cuando esté disponible",
                  ][i]
                }
              </label>
            ))}
          </Card>
          <Card>
            <h2>Instalar en tu teléfono</h2>
            <p>
              Abre la aplicación publicada con HTTPS. En iPhone: Compartir →
              Agregar a inicio. En Android: menú del navegador → Instalar
              aplicación.
            </p>
            {install && (
              <button className="primary" onClick={() => install.prompt()}>
                Instalar IRON TRACK
              </button>
            )}
            <small>
              La instalación y los avisos dependen del navegador. Necesitas una
              primera carga completa para usarla sin conexión.
            </small>
          </Card>
        </div>
      </div>
      <Card>
        <h2>Respaldo y restauración</h2>
        {state.backupInfo && (
          <p className="accent">
            Último respaldo generado: {dateLabel(state.backupInfo.generatedAt)}{" "}
            ·{" "}
            {state.backupInfo.includesPhotos
              ? "con fotografías"
              : "sin fotografías"}
          </p>
        )}
        <p>
          El almacenamiento es local y no está sincronizado en la nube. Puede
          borrarse al limpiar el navegador o usar navegación privada.
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => setIncludePhotos(e.target.checked)}
          />
          Incluir fotografías personales en el respaldo
        </label>
        {includePhotos && (
          <p className="warning">
            El archivo contendrá fotografías e información personal. Guárdalo en
            un lugar privado.
          </p>
        )}
        <div className="actions">
          <button
            className="primary"
            onClick={async () => {
              try {
                const info = await exportBackup(state, includePhotos);
                await mutate((s) => {
                  s.backupInfo = info;
                });
                notify("Respaldo exportado. Guárdalo en un lugar privado.");
              } catch {
                notify("No se pudo exportar el respaldo.");
              }
            }}
          >
            <Download size={18} />
            Exportar respaldo JSON
          </button>
          <label className="button">
            <Upload size={18} />
            Importar respaldo
            <input
              className="visually-hidden"
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 100 * 1024 * 1024)
                    throw new Error("El respaldo supera 100 MB.");
                  setPreview(validateBackup(JSON.parse(await f.text())));
                } catch {
                  notify(
                    "Respaldo inválido, duplicado o incompatible. No se modificaron tus datos.",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={async () => {
              const granted = await navigator.storage?.persist?.();
              notify(
                granted
                  ? "El navegador concedió almacenamiento persistente."
                  : "El navegador no concedió persistencia; mantén respaldos.",
              );
            }}
          >
            Solicitar persistencia
          </button>
        </div>
        <small>
          Respaldo sin cifrar. La opción de cifrado aún no está implementada.
        </small>
      </Card>
      <Card>
        <h3>Administrar información</h3>
        <button
          className="danger-button"
          onClick={async () => {
            if (
              prompt(
                "Esta acción elimina todos los registros y fotografías locales. Escribe ELIMINAR para continuar.",
              ) !== "ELIMINAR"
            )
              return;
            try {
              await db.transaction("rw", db.state, db.photos, async () => {
                await db.photos.clear();
                await db.state.clear();
              });
              location.reload();
            } catch {
              notify("No se pudo completar la eliminación.");
            }
          }}
        >
          <Trash2 size={16} />
          Eliminar todos mis datos
        </button>
      </Card>
      {preview && (
        <div className="modal-backdrop">
          <Card className="modal">
            <h2>Revisar antes de restaurar</h2>
            <p>Exportado: {dateLabel(preview.exportedAt)}</p>
            <p>
              {preview.data.sessions.length} sesiones ·{" "}
              {preview.data.measurements.length} mediciones ·{" "}
              {preview.photos?.length ?? 0} fotografías.
            </p>
            <p>
              Se reemplazarán todos los datos actuales. Las fotografías actuales
              se reemplazarán solo si el respaldo incluye fotografías. Exporta
              un respaldo antes de continuar.
            </p>
            <div className="actions">
              <button onClick={() => setPreview(null)}>Cancelar</button>
              <button
                className="primary"
                onClick={async () => {
                  if (
                    !confirm(
                      "¿Confirmas reemplazar los registros actuales por este respaldo?",
                    )
                  )
                    return;
                  try {
                    const photos = await Promise.all(
                      (preview.photos ?? []).map(async (p) => ({
                        id: p.id,
                        date: p.date,
                        view: p.view,
                        blob: await (await fetch(p.data)).arrayBuffer(),
                        mime: p.data.slice(5, p.data.indexOf(";")),
                      })),
                    );
                    await db.transaction(
                      "rw",
                      db.state,
                      db.photos,
                      async () => {
                        await db.state.put({ id: "main", value: preview.data });
                        if (preview.photos) {
                          await db.photos.clear();
                          await db.photos.bulkPut(photos);
                        }
                      },
                    );
                    location.reload();
                  } catch {
                    notify(
                      "No se pudo restaurar el respaldo. La transacción se canceló.",
                    );
                  }
                }}
              >
                Confirmar restauración
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default ProfilePage;
