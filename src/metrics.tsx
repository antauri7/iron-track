import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { type Session, muscles } from "./model";
import { plannedVolume, volume } from "./engine";
import { useApp } from "./ui";
export function Stat({
  icon,
  label,
  value,
  link,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  link: string;
}) {
  return (
    <NavLink className="card stat" to={link}>
      <span className="accent">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </NavLink>
  );
}

export function VolumeBars({ sessions }: { sessions: Session[] }) {
  const { state } = useApp();
  return (
    <div className="volume-bars">
      {muscles
        .filter((m) => plannedVolume(state.routines, state.exercises, m) > 0)
        .map((m) => {
          const p = plannedVolume(state.routines, state.exercises, m),
            v = volume(sessions, m);
          return (
            <div className="bar-row" key={m}>
              <span>{m}</span>
              <div className="bar-track">
                <div
                  className="planned"
                  style={{ width: `${Math.min(100, (p / 24) * 100)}%` }}
                />
                <div
                  className="actual"
                  style={{ width: `${Math.min(100, (v / 24) * 100)}%` }}
                />
              </div>
              <span className="bar-number">
                {v}
                <small> / {p}</small>
              </span>
            </div>
          );
        })}
      <div className="legend">
        <span>
          <i className="actual-dot" />
          Realizadas
        </span>
        <span>
          <i />
          Planificadas
        </span>
      </div>
    </div>
  );
}
