import { Analyzer } from '@/components/Analyzer';

export default function Page() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-indigo-500/15 font-mono text-sm font-bold text-indigo-300"
            aria-hidden
          >
            { }
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight text-slate-100">
            css-unused-finder
          </span>
        </div>
        <a
          href="https://github.com/kea0811/css-unused-finder"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
        >
          GitHub ↗
        </a>
      </header>

      <main className="mt-12 flex-1">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            A fragility &amp; dead-class report for your CSS.
          </h1>
          <p className="mt-4 text-balance text-base text-slate-300 sm:text-lg">
            Paste a stylesheet and see the brittle bits at a glance —{' '}
            <code className="font-mono text-indigo-200">!important</code> pileups, runaway
            specificity, deeply nested selectors, and classes nothing renders. Everything is
            computed locally; nothing is uploaded.
          </p>
        </div>

        <div className="mt-10">
          <Analyzer />
        </div>
      </main>

      <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-slate-500">
        <p>
          Runs entirely in your browser · MIT licensed · Heuristic analysis, not a substitute for
          a full build-time CSS coverage tool.
        </p>
      </footer>
    </div>
  );
}
