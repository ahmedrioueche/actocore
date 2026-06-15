type ProseSectionProps = {
  title: string;
  body: string;
  id?: string;
};

export function ProseSection({ title, body, id }: ProseSectionProps) {
  return (
    <section id={id}>
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      <p className="mt-3 leading-relaxed text-text-secondary">{body}</p>
    </section>
  );
}
