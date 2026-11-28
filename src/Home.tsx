import { WeekPulse, GoalPreview, BackupStatus } from "./TrackingWidgets";
import { trainingDates } from "./tracking-engine";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Brain,
  ArrowUpRight,
  Play,
  Flame,
  CalendarDays,
  Timer,
  Scale,
  Check,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { today, dayKey } from "./model";
import { createSession, weekRange, estimateMinutes } from "./engine";
import { useApp, Card, fromKg } from "./ui";
import { Stat, VolumeBars } from "./metrics";
function Home() {
  const { state, mutate } = useApp();
  const navigate = useNavigate();
  const date = today();
  const day = new Date(date + "T12:00:00").getDay();
  const routine = state.routines.find((r) => r.day === day && !r.archived);
  const active = state.sessions.find((s) => s.status === "activa");
  const range = weekRange(date);
  const sessions = state.sessions.filter(
    (s) =>
      s.status !== "activa" &&
      dayKey(s.startedAt) >= range.start &&
      dayKey(s.startedAt) < range.end,
  );
  const lastWeight = [...state.measurements]
    .filter((m) => m.values.Peso)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.values.Peso;
  const week = Math.max(
    1,
    Math.floor(
      (Date.parse(date) - Date.parse(state.profile?.cycleStart ?? date)) /
        604800000,
    ) + 1,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {new Date(date + "T12:00:00")
              .toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
              .toUpperCase()}{" "}
            <span className="accent"> / DÍA {day || 7}</span>
          </p>
          <h1>
            Supera tu última sesión<span className="accent">.</span>
          </h1>
          <p>
            {state.profile?.name
              ? `${state.profile.name}, cada repetición cuenta.`
              : "Cada repetición cuenta. Entrena con intención."}
          </p>
        </div>
        <span className="pill desktop-only">
          <Flame size={16} /> CONSTANCIA, SIEMPRE
        </span>
      </div>
      <div className="home-grid">
        <Card className="hero">
          <div className="row">
            <p className="eyebrow accent">
              {active ? "ENTRENAMIENTO EN CURSO" : "ENTRENAMIENTO DE HOY"}
            </p>
            <Flame className="accent" />
          </div>
          <div>
            <h2>
              {active?.routineName ?? routine?.name ?? "Hoy toca recuperar"}
            </h2>
            <p>
              {routine
                ? `${routine.exercises.length} ejercicios · ${routine.exercises.reduce((n, e) => n + e.sets, 0)} series · ≈ ${estimateMinutes(routine, state.exercises)} min`
                : "Descansa, revisa tu semana y prepárate para la siguiente sesión."}
            </p>
          </div>
          <button
            className="primary"
            onClick={() => {
              if (!active && routine)
                mutate((s) =>
                  s.sessions.push(createSession(routine, s.exercises)),
                );
              navigate(active || routine ? "/sesion" : "/entrenar");
            }}
          >
            <Play size={19} />
            {active
              ? "Continuar entrenamiento"
              : routine
                ? "Iniciar entrenamiento"
                : "Ver mis rutinas"}
            <ArrowUpRight size={20} />
          </button>
          <span className="hero-watermark">
            <Dumbbell />
          </span>
        </Card>
        <div className="stats-grid">
          <Stat
            icon={<Scale />}
            label="Peso corporal"
            value={
              lastWeight
                ? `${fromKg(lastWeight, state.profile?.unit ?? "kg")} ${state.profile?.unit}`
                : "Sin registro"
            }
            link="/progreso"
          />
          <Stat
            icon={<CalendarDays />}
            label="Ciclo actual"
            value={week <= 8 ? `Sem. ${week} / 8` : "Ciclo finalizado"}
            link="/coach"
          />
          <Stat
            icon={<Timer />}
            label="Tiempo disponible"
            value={`${state.profile?.minutes ?? 90} min`}
            link="/perfil"
          />
          <Stat
            icon={<Check />}
            label="Días entrenados"
            value={`${trainingDates(state.sessions, range.start, date).length} días`}
            link="/historial"
          />
        </div>
      </div>
      <WeekPulse />
      <div className="tracking-home-secondary">
        <GoalPreview />
        <BackupStatus />
      </div>
      <div className="section-title">
        <h2>Tu semana, en perspectiva</h2>
        <NavLink to="/progreso">
          Ver progreso <ArrowUpRight size={16} />
        </NavLink>
      </div>
      <div className="two-cols">
        <Card>
          <div className="row">
            <h3>Volumen semanal</h3>
            <span className="tag">PLANIFICADO / REALIZADO</span>
          </div>
          <VolumeBars sessions={sessions} />
          <small>
            Series directas. Una serie puede estimular otros músculos de forma
            indirecta.
          </small>
        </Card>
        <Card>
          <div className="row">
            <h3>Próximas sesiones</h3>
            <CalendarDays className="muted" />
          </div>
          <div className="schedule">
            {[...state.routines]
              .filter((r) => !r.archived)
              .sort((a, b) => ((a.day - day + 7) % 7) - ((b.day - day + 7) % 7))
              .slice(0, 4)
              .map((r) => (
                <button
                  className="schedule-item"
                  key={r.id}
                  onClick={() => navigate("/entrenar")}
                >
                  <span className="day-box">
                    {["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"][r.day]}
                  </span>
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.exercises.length} ejercicios ·{" "}
                      {r.exercises.reduce((n, e) => n + e.sets, 0)} series
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
          </div>
        </Card>
      </div>
      <NavLink to="/coach" className="coach-strip">
        <span className="coach-icon">
          <Brain />
        </span>
        <div>
          <h3>Tu entrenador</h3>
          <p>
            {state.sessions.length
              ? "Revisa sugerencias basadas en tus registros y tu recuperación."
              : "Registra tus primeras sesiones para recibir recomendaciones basadas en tu rendimiento real."}
          </p>
        </div>
        <ArrowUpRight />
      </NavLink>

      <div className="quick-links">
        <NavLink to="/biblioteca">
          <BookOpen />
          Biblioteca de ejercicios
          <ArrowUpRight />
        </NavLink>
        <NavLink to="/calculadoras">
          <Dumbbell />
          Calculadoras
          <ArrowUpRight />
        </NavLink>
        <NavLink to="/historial">
          <CalendarDays />
          Calendario e historial
          <ArrowUpRight />
        </NavLink>
      </div>
    </>
  );
}

export default Home;
