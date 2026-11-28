import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import {
  Dumbbell,
  House,
  ChartNoAxesCombined,
  Brain,
  User,
  ArrowUpRight,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { db } from "./storage";
import { initialState } from "./seed";
import { type State, type Profile, today } from "./model";
import { Context, useApp, Empty, Field } from "./ui";
import Home from "./Home";
const Train = lazy(() => import("./Train"));
const Active = lazy(() => import("./Active"));
const Progress = lazy(() => import("./Progress"));
const Coach = lazy(() => import("./Coach"));
const ProfilePage = lazy(() => import("./Profile"));
const Library = lazy(() => import("./Library"));
const Calculators = lazy(() => import("./Calculators"));
const History = lazy(() => import("./History"));
const Science = lazy(() => import("./Science"));
const Reports = lazy(() => import("./Reports"));
const Journal = lazy(() => import("./Journal"));
const nav = [
  ["/", "Inicio", House],
  ["/entrenar", "Entrenar", Dumbbell],
  ["/progreso", "Progreso", ChartNoAxesCombined],
  ["/coach", "Coach", Brain],
  ["/perfil", "Perfil", User],
] as const;
export default function App() {
  const [state, setState] = useState<State | null>(null);
  const ref = useRef<State | null>(null);
  const queue = useRef(Promise.resolve());
  const pendingSaves = useRef(0);
  const saveFailed = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error">(
    "saved",
  );
  const [message, notify] = useState("");
  const [error, setError] = useState("");
  const [update, setUpdate] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    db.state
      .get("main")
      .then((row) => {
        const value = row?.value ?? initialState();
        ref.current = value;
        setState(value);
      })
      .catch(() =>
        setError(
          "No se pudo abrir el almacenamiento local. Revisa que el navegador permita IndexedDB.",
        ),
      );
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdate(() => updateSW);
      },
    });
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (state?.profile)
      document.documentElement.dataset.theme = state.profile.theme;
  }, [state?.profile?.theme]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => notify(""), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);
  const mutate = (fn: (s: State) => void) => {
    const next = structuredClone(ref.current!);
    fn(next);
    ref.current = next;
    setState(next);
    pendingSaves.current += 1;
    setSaveStatus("saving");
    const write = queue.current
      .then(async () => {
        await db.state.put({ id: "main", value: next });
        setError("");
        saveFailed.current = false;
        pendingSaves.current -= 1;
        if (pendingSaves.current === 0) setSaveStatus("saved");
        return true;
      })
      .catch(() => {
        pendingSaves.current -= 1;
        setSaveStatus("error");
        saveFailed.current = true;
        setError(
          "No se pudo guardar el último cambio. Exporta un respaldo y revisa el espacio del dispositivo.",
        );
        return false;
      });
    queue.current = write.then(() => {});
    return write;
  };
  if (!state)
    return (
      <main className="loading">
        <Dumbbell />
        <h1>IRON TRACK</h1>
        <p>{error || "Preparando tu espacio de entrenamiento…"}</p>
      </main>
    );
  return (
    <Context.Provider value={{ state, mutate, notify, saveStatus }}>
      <div className="app">
        <aside>
          <NavLink className="brand" to="/">
            <span className="logo">
              <Dumbbell />
            </span>
            <span>
              IRON TRACK<small>PERSONAL TRAINING SYSTEM</small>
            </span>
          </NavLink>
          <nav>
            {nav.map(([to, label, Icon]) => (
              <NavLink key={to} end={to === "/"} to={to}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="aside-note">
            <ShieldCheck size={18} />
            <span>
              Tus datos se quedan
              <br />
              en este dispositivo
            </span>
          </div>
        </aside>
        <div className="content">
          <header>
            <NavLink className="mobile-brand" to="/">
              <Dumbbell /> IRON TRACK
            </NavLink>
            <span className="eyebrow desktop-only">
              TU ESPACIO. TU PROGRESO.
            </span>
            <div className="header-right">
              <span className={"connection " + (!online ? "offline" : "")}>
                {online ? "LOCAL · PRIVADO" : "SIN CONEXIÓN"}
              </span>
              <NavLink
                to="/perfil"
                aria-label="Configuración"
                className="icon-button"
              >
                <Settings size={21} />
              </NavLink>
            </div>
          </header>
          {error && (
            <div role="alert" className="alert danger">
              {error}
            </div>
          )}
          {update && (
            <div className="alert">
              Hay una actualización disponible. Tus registros se conservan.{" "}
              <button
                onClick={async () => {
                  await queue.current;
                  if (!saveFailed.current && pendingSaves.current === 0)
                    await update(true);
                }}
              >
                Actualizar
              </button>
            </div>
          )}
          <Suspense fallback={<Empty>Cargando módulo…</Empty>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entrenar" element={<Train />} />
              <Route path="/sesion/:id?" element={<Active />} />
              <Route path="/progreso" element={<Progress />} />
              <Route path="/coach" element={<Coach />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/biblioteca" element={<Library />} />
              <Route path="/calculadoras" element={<Calculators />} />
              <Route path="/historial" element={<History />} />
              <Route path="/ciencia" element={<Science />} />
              <Route path="/informes" element={<Reports />} />
              <Route path="/bitacora" element={<Journal />} />
              <Route
                path="*"
                element={
                  <Empty>Esta página no existe. Regresa a Inicio.</Empty>
                }
              />
            </Routes>
          </Suspense>
          <footer>
            IRON TRACK · v{__APP_VERSION__}{" "}
            <span>Construye tu siguiente versión.</span>
          </footer>
        </div>
        {message && (
          <div className="toast" role="status">
            {message}
          </div>
        )}
        {!state.profile && <Onboarding />}
      </div>
    </Context.Provider>
  );
}
function Onboarding() {
  const { mutate } = useApp();
  const [name, setName] = useState("");
  return (
    <div className="modal-backdrop">
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          mutate((s) => {
            s.profile = {
              name,
              age: null,
              height: null,
              experience: "",
              frequency: 6,
              minutes: 90,
              restDay: 0,
              unit: "kg",
              cycleStart: today(),
              theme: "dark",
              autoRest: true,
              sound: false,
              vibration: false,
            };
          });
          navigator.storage?.persist?.();
        }}
      >
        <span className="logo">
          <Dumbbell />
        </span>
        <p className="eyebrow accent">BIENVENIDO A IRON TRACK</p>
        <h1>
          Tu progreso
          <br />
          empieza aquí.
        </h1>
        <p>
          Un espacio para entrenar con intención y registrar cada avance. Sin
          cuentas ni datos de ejemplo.
        </p>
        <Field label="¿Cómo te llamas? (opcional)">
          <input
            autoFocus
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Field>
        <div className="privacy">
          <ShieldCheck />
          <p>
            Los registros se guardan en este navegador. Exporta respaldos para
            conservarlos si cambias de dispositivo o borras su almacenamiento.
          </p>
        </div>
        <button className="primary" type="submit">
          Crear mi espacio <ArrowUpRight size={20} />
        </button>
        <small>Podrás confirmar tus medidas y preferencias en Perfil.</small>
      </form>
    </div>
  );
}
