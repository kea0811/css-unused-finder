export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-indigo-200">
        css-unused-finder
      </span>
      <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
        A fragility &amp; dead-class report for your CSS.
      </h1>
      <p className="mt-5 max-w-xl text-balance text-lg text-slate-300">
        Paste a stylesheet and see the brittle bits — <code>!important</code> pileups,
        runaway specificity, deeply nested selectors, and classes nothing uses.
      </p>
      <p className="mt-10 font-mono text-sm text-slate-500">
        The interactive analyzer is landing shortly.
      </p>
    </main>
  );
}
