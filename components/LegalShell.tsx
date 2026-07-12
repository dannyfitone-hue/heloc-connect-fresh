import ComplianceLinks from "./ComplianceLinks";
import type { ReactNode } from "react";

type Section = {
  title: string;
  paragraphs?: ReactNode[];
  bullets?: ReactNode[];
};

export default function LegalShell({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  sections: Section[];
}) {
  return (
    <main className="legal-page relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_8%_0%,rgba(184,137,32,.22),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(214,163,61,.12),transparent_28%),linear-gradient(180deg,#020202,#0b0a07)]" />
      <div className="legal-mascot-layer pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="legal-mascot-glow" />
        <img src="/legal-mascot-transparent.png" alt="" className="legal-mascot-image" />
        <div className="legal-mascot-fade" />
      </div>

      <div className="mx-auto max-w-5xl">
        <header className="legal-header rounded-[26px] border border-amber-300/20 bg-[#0d0c08]/92 px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,.36)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <a href="/" aria-label="Return to HELOC CONNECT home" className="shrink-0">
              <img src="/hc-logo-premium-visible-v52.png" alt="HELOC CONNECT" className="h-14 w-auto object-contain sm:h-16" />
            </a>
            <ComplianceLinks className="legal-compliance-links" />
          </div>
        </header>

        <article className="mt-5 overflow-hidden rounded-[30px] border border-amber-300/20 bg-[#11100b]/94 shadow-[0_30px_100px_rgba(0,0,0,.42)] backdrop-blur-[2px]">
          <div className="border-b border-amber-300/15 bg-[radial-gradient(circle_at_85%_0%,rgba(212,175,55,.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.035),transparent)] px-5 py-9 sm:px-10 sm:py-12">
            <a href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-amber-200 transition hover:text-amber-100">← Back to HELOC CONNECT</a>
            <div className="mt-7 text-[11px] font-black uppercase tracking-[.28em] text-amber-200">{eyebrow}</div>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-6xl">{title}</h1>
            <div className="mt-5 max-w-3xl text-base font-semibold leading-8 text-white/76 sm:text-lg">{intro}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-amber-100">Effective July 11, 2026</div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-white/55">Last Updated July 11, 2026</div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-6 sm:px-10 sm:py-10">
            {sections.map((section, index) => (
              <section key={section.title} className="rounded-[22px] border border-white/10 bg-black/25 p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-300/30 bg-amber-300/10 text-sm font-black text-amber-200">{index + 1}</div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black tracking-[-.025em] text-white sm:text-2xl">{section.title}</h2>
                    {section.paragraphs?.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="mt-3 text-sm font-semibold leading-7 text-white/72 sm:text-base">{paragraph}</p>
                    ))}
                    {section.bullets && (
                      <ul className="mt-4 space-y-3 text-sm font-semibold leading-7 text-white/72 sm:text-base">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex gap-3"><span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" /><span>{bullet}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </article>

        <footer className="px-3 py-7 text-center text-xs font-semibold leading-6 text-white/42">
          <p>HELOC CONNECT is not a lender or mortgage company. We connect consumers with participating mortgage companies.</p>
          <p className="mt-2">Questions: <a className="font-black text-amber-200" href="mailto:clientservices@helocconnect.com">clientservices@helocconnect.com</a> · <a className="font-black text-amber-200" href="tel:9498662466">(949) 866-2466</a></p>
        </footer>
      </div>
    </main>
  );
}
