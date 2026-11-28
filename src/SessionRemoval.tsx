import { useEffect, useRef, useState } from "react";
import { type Session, dateLabel } from "./model";
import { physicalSets, moveSessionToTrash } from "./engine";
import { useApp } from "./ui";
export default function SessionRemoval({
  session,
  mode = "delete",
  onClose,
  onRemoved,
}: {
  session: Session;
  mode?: "delete" | "cancel";
  onClose: () => void;
  onRemoved: () => void;
}) {
  const { mutate, notify } = useApp();
  const dialog = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  const completed = session.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.status === "completada").length,
    0,
  );
  const effective = session.exercises.reduce(
    (n, e) => n + physicalSets(e.sets),
    0,
  );
  async function remove() {
    setBusy(true);
    const saved = await mutate((s) => moveSessionToTrash(s, session.id));
    setBusy(false);
    if (!saved) return;
    notify("Sesión enviada a Papelera. Puedes recuperarla desde Tu historial.");
    onRemoved();
  }
  return (
    <div className="modal-backdrop">
      <div
        ref={dialog}
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-removal-title"
        aria-describedby="session-removal-description"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
          if (e.key === "Tab") {
            const buttons = Array.from(
              dialog.current?.querySelectorAll<HTMLButtonElement>("button") ??
                [],
            );
            const first = buttons[0],
              last = buttons.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <h2 id="session-removal-title">
          {mode === "cancel"
            ? "¿Cancelar este entrenamiento?"
            : "¿Eliminar esta sesión del historial?"}
        </h2>
        <p>
          <strong>{session.routineName}</strong>
          <br />
          {dateLabel(session.startedAt)} · {effective} series efectivas (
          {completed} series completadas en total)
        </p>
        <p id="session-removal-description">
          Solo esta sesión se moverá a la Papelera y dejará de contar en las
          estadísticas. Podrás recuperarla; las demás sesiones se conservan.
        </p>
        {mode === "cancel" && completed > 0 && (
          <p>
            Ya hay trabajo registrado. También puedes conservarlo como sesión
            parcial.
          </p>
        )}
        <div className="actions">
          <button disabled={busy} onClick={onClose}>
            {mode === "cancel" ? "Seguir entrenando" : "Volver"}
          </button>
          {mode === "cancel" && completed > 0 && (
            <button
              onClick={async () => {
                const saved = await mutate((s) => {
                  const active = s.sessions.find((x) => x.id === session.id);
                  if (active) {
                    active.status = "parcial";
                    active.endedAt = new Date().toISOString();
                    delete active.rest;
                  }
                });
                if (!saved) return;
                notify("Sesión parcial guardada con sus registros.");
                onRemoved();
              }}
            >
              Conservar como sesión parcial
            </button>
          )}
          <button className="danger-button" disabled={busy} onClick={remove}>
            {mode === "cancel"
              ? "Cancelar y mover a Papelera"
              : "Mover a Papelera"}
          </button>
        </div>
      </div>
    </div>
  );
}
