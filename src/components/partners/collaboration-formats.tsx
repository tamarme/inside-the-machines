import { collaborations } from "@/content/collaborations";

export function CollaborationFormats({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className="collaboration-grid">
      {collaborations.map((format) => (
        <article className="collaboration-item" key={format.number}>
          <span className="eyebrow collaboration-number">{format.number} /</span>
          <h3>{format.title}</h3>
          <p>{format.description}</p>
          {detailed && <p className="collaboration-detail">{format.detail}</p>}
        </article>
      ))}
    </div>
  );
}
