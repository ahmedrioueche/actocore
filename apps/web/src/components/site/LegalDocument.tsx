type LegalSection = {
  key: string;
  title: string;
  body: string;
};

type LegalDocumentProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, updated, intro, sections }: LegalDocumentProps) {
  return (
    <div className="site-container max-w-3xl py-16 sm:py-20">
      <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">{updated}</p>
      <p className="mt-6 text-text-secondary">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.key} id={section.key}>
            <h2 className="text-xl font-semibold text-text-primary">{section.title}</h2>
            <p className="mt-3 leading-relaxed text-text-secondary">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
