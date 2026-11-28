import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  NotebookPen,
  ShieldCheck,
  Download,
  Target,
} from "lucide-react";
import { today, dateLabel } from "./model";
import { useApp, Card } from "./ui";
import { weekDays, goalProgress } from "./tracking-engine";
import { exportBackup } from "./storage";
export function WeekPulse({
  showJournalLink = true,
}: { showJournalLink?: boolean } = {}) {
  const { state } = useApp();
  const date = today(),
    days = weekDays(state, date),
    count = days.filter((d) => d.sessions).length;
  return (
    <Card className="week-pulse">
      <div className="row">
        <div>
          <p className="eyebrow accent">EL PROCESO TAMBIÉN CUENTA</p>
          <h2>Una semana a la vez.</h2>
          <p>
            {count
              ? `${count} ${count === 1 ? "día con entrenamiento registrado" : "días con entrenamiento registrado"}`
              : "Tu próximo entrenamiento será el primer paso de esta semana."}
          </p>
        </div>
        <div
          className="week-orbit"
          aria-label={`${count} días entrenados esta semana`}
          style={
            {
              "--week-progress": `${(count / 7) * 100}%`,
            } as React.CSSProperties
          }
        >
          <div>
            <strong>{count}</strong>
            <small>DÍAS</small>
          </div>
        </div>
      </div>
      <div className="week-pulse-days">
        {days.map((d, i) => (
          <NavLink
            className={
              (d.sessions ? "done " : "") + (d.date === date ? "today" : "")
            }
            to={`/historial?fecha=${d.date}`}
            key={d.date}
            aria-label={`${dateLabel(d.date)}: ${d.sessions ? `${d.sessions} sesiones con series registradas` : d.planned ? "entrenamiento programado" : "sin rutina programada"}`}
          >
            <small>
              {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"][i]}
            </small>
            <strong>{Number(d.date.slice(-2))}</strong>
            <span>
              {d.sessions ? (
                <Check size={15} />
              ) : d.planned ? (
                <i />
              ) : (
                <span className="rest-mark">—</span>
              )}
            </span>
          </NavLink>
        ))}
      </div>
      <small className="week-pulse-note">
        Cada día cuenta una vez. Se incluyen sesiones parciales con series
        efectivas y se excluyen sesiones vacías, en curso y Papelera.
      </small>
      {showJournalLink && (
        <NavLink className="tracking-link" to="/bitacora">
          <NotebookPen size={16} />
          Reflexiona sobre tu semana
          <ArrowUpRight size={16} />
        </NavLink>
      )}
    </Card>
  );
}
export function GoalPreview() {
  const { state } = useApp();
  const goals = (state.processGoals ?? [])
    .filter((g) => !g.archived)
    .slice(0, 2);
  return (
    <Card className="goal-preview">
      <div className="row">
        <h3>
          <Target size={18} />
          Un paso con intención
        </h3>
        <NavLink to="/bitacora" className="tracking-link">
          Mis metas
          <ArrowUpRight size={14} />
        </NavLink>
      </div>
      {goals.length ? (
        goals.map((g) => {
          const p = goalProgress(state, g);
          return (
            <div className="goal-mini" key={g.id}>
              <div className="row">
                <strong>{g.title}</strong>
                <span>
                  {p.count} / {g.target}
                </span>
              </div>
              <div className="goal-track">
                <div style={{ width: p.percent + "%" }} />
              </div>
            </div>
          );
        })
      ) : (
        <p>
          Define una meta de constancia que tenga sentido para ti. El avance se
          calcula con tus registros, sin cambiar tu rutina.
        </p>
      )}
    </Card>
  );
}
export function BackupStatus() {
  const { state, mutate, notify } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="backup-status">
      <div className="row">
        <h3>
          <ShieldCheck size={18} />
          Tu progreso, a salvo
        </h3>
        <span className="tag">COPIA PERSONAL</span>
      </div>
      <p>
        {state.backupInfo
          ? `Último respaldo generado el ${dateLabel(state.backupInfo.generatedAt)}${state.backupInfo.includesPhotos ? ", con fotografías." : ", sin fotografías."}`
          : "Aún no hay un respaldo generado registrado en esta versión."}
      </p>
      <small>
        La copia se genera aquí. Consérvala en Archivos o en el lugar privado
        que elijas; no hay sincronización automática.
      </small>
      <div className="actions">
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const info = await exportBackup(state);
              await mutate((s) => {
                s.backupInfo = info;
              });
              notify(
                "Respaldo generado sin fotografías. Guarda el archivo en un lugar privado.",
              );
            } catch {
              notify("No se pudo generar el respaldo.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={16} />
          {busy ? "Generando…" : "Generar copia sin fotos"}
        </button>
        <NavLink className="tracking-link" to="/perfil">
          Más opciones
          <ArrowUpRight size={14} />
        </NavLink>
      </div>
    </Card>
  );
}
