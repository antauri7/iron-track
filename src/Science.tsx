import { Card } from "./ui";
import { references, glossary } from "./science-data";
export default function Science() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow accent">COMPRENDER PARA PROGRESAR</p>
          <h1>Ciencia del entrenamiento.</h1>
          <p>Definiciones, evidencia y decisiones prácticas.</p>
        </div>
      </div>
      <Card>
        <h2>Aprender a interpretar tus registros</h2>
        <p>
          Estas explicaciones son educativas. Las reglas de progresión, el
          factor indirecto y las plantillas de esta aplicación son decisiones
          prácticas ajustables; no son prescripciones universales extraídas
          literalmente de un estudio.
        </p>
      </Card>
      <div className="routine-grid">
        {glossary.map(([title, text], i) => (
          <Card key={title}>
            <span className="eyebrow accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            <small>
              Contexto:{" "}
              {i < 6
                ? "Currier 2026 · Pelland 2026"
                : i < 12
                  ? "Robinson 2024 · Singer 2024"
                  : i < 16
                    ? "Currier 2026 · Maeo 2021/2023 · Zhang 2025"
                    : "Currier 2026 · reglas prácticas de la aplicación"}
              .
            </small>
          </Card>
        ))}
      </div>
      <div className="section-title">
        <h2>Referencias verificadas</h2>
      </div>
      {references.map((r) => (
        <Card key={r.id}>
          <p className="eyebrow accent">
            {r.author} · {r.year}
          </p>
          <h3>{r.title}</h3>
          <p>{r.finding}</p>
          <p className="muted">Límite de interpretación: {r.limit}</p>
          <a
            className="accent"
            href={`https://pubmed.ncbi.nlm.nih.gov/${r.id}/`}
            target="_blank"
            rel="noreferrer"
          >
            Consultar en PubMed ↗
          </a>
          <small style={{ display: "block", marginTop: 12 }}>
            DOI: {r.doi}
          </small>
        </Card>
      ))}
    </>
  );
}
