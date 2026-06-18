'use client';

import { useMemo, useState } from 'react';
import { analyze, type AnalysisReport, type Finding } from '@/src';
import { SAMPLE_CSS, SAMPLE_MARKUP } from '@/app/sample';
import {
  GRADE_COLOR,
  GRADE_RING,
  KIND_LABEL,
  SEVERITY_ORDER,
  SEVERITY_STYLE,
} from './meta';

const GRADE_CAPTION: Record<string, string> = {
  A: 'Rock solid',
  B: 'In good shape',
  C: 'A few rough edges',
  D: 'Getting brittle',
  F: 'Fragile — handle with care',
};

export function Analyzer() {
  const [css, setCss] = useState('');
  const [markup, setMarkup] = useState('');

  const report = useMemo<AnalysisReport>(() => analyze({ css, markup }), [css, markup]);
  const hasInput = css.trim() !== '';

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col gap-4" aria-label="Input">
        <Field
          id="css-input"
          label="Stylesheet"
          hint="Paste any CSS — it never leaves your browser."
          value={css}
          onChange={setCss}
          placeholder=".btn { color: red !important; }"
          rows={14}
        />
        <Field
          id="markup-input"
          label="Markup"
          hint="Optional — add HTML or JSX to find classes nothing uses."
          value={markup}
          onChange={setMarkup}
          placeholder={'<div class="btn">Save</div>'}
          rows={7}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setCss(SAMPLE_CSS);
              setMarkup(SAMPLE_MARKUP);
            }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={() => {
              setCss('');
              setMarkup('');
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          >
            Clear
          </button>
        </div>
      </section>

      <section aria-label="Report" aria-live="polite">
        {hasInput ? <Report report={report} /> : <EmptyState />}
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-100">{label}</span>
        <span className="text-xs text-slate-400">{hint}</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="w-full resize-y rounded-xl border border-white/10 bg-ink-900/80 p-4 font-mono text-sm leading-relaxed text-slate-100 shadow-inner outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/30"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-10 text-center">
      <div className="mb-3 text-3xl" aria-hidden>
        ✦
      </div>
      <p className="text-base font-semibold text-slate-200">Your report appears here</p>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Paste a stylesheet on the left (or hit <strong>Load example</strong>) to see its
        fragility grade and dead classes.
      </p>
    </div>
  );
}

function Report({ report }: { report: AnalysisReport }) {
  const findings = [...report.findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className="flex flex-col gap-5">
      <ScoreCard report={report} />
      <FindingsPanel findings={findings} />
      <DeadClassPanel report={report} />
    </div>
  );
}

function ScoreCard({ report }: { report: AnalysisReport }) {
  const { grade, fragilityScore, stats } = report;
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-ink-900/70 p-5 shadow-glow">
      <div
        className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 bg-ink-950 ${GRADE_RING[grade]}`}
      >
        <span className={`text-3xl font-extrabold leading-none ${GRADE_COLOR[grade]}`}>
          {grade}
        </span>
        <span className="mt-0.5 font-mono text-[0.6rem] text-slate-400">{fragilityScore}/100</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{GRADE_CAPTION[grade]}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Fragility score — lower is sturdier.
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-slate-300">
          <Stat label="rules" value={stats.rules} />
          <Stat label="selectors" value={stats.selectors} />
          <Stat label="declarations" value={stats.declarations} />
        </dl>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

function FindingsPanel({ findings }: { findings: Finding[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Fragility findings</h2>
        <span className="font-mono text-xs text-slate-400">{findings.length}</span>
      </div>
      {findings.length === 0 ? (
        <p className="rounded-lg border border-grade-a/30 bg-grade-a/5 px-3 py-2 text-sm text-grade-a">
          No fragility signals found — clean cascade. ✨
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {findings.map((finding, index) => (
            <FindingRow key={`${finding.kind}-${finding.selector}-${index}`} finding={finding} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const severity = SEVERITY_STYLE[finding.severity];
  return (
    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${severity.dot}`}
          aria-hidden
        />
        <span className="text-xs font-semibold text-slate-100">{KIND_LABEL[finding.kind]}</span>
        <span className={`text-[0.65rem] uppercase tracking-wide ${severity.text}`}>
          {severity.label}
        </span>
      </div>
      <code className="mt-1.5 block break-all font-mono text-xs text-indigo-200">
        {finding.selector || '(no selector)'}
      </code>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{finding.message}</p>
    </li>
  );
}

function DeadClassPanel({ report }: { report: AnalysisReport }) {
  const { definedClasses, unusedClasses, markupProvided } = report.deadClasses;
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Dead classes</h2>
        <span className="font-mono text-xs text-slate-400">
          {markupProvided ? `${unusedClasses.length} unused` : `${definedClasses.length} defined`}
        </span>
      </div>
      {!markupProvided ? (
        <p className="text-sm text-slate-400">
          Add markup above and any class defined here but never rendered shows up as dead.
        </p>
      ) : unusedClasses.length === 0 ? (
        <p className="text-sm text-grade-a">Every defined class appears in your markup. 🎉</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {unusedClasses.map((cls) => (
            <li
              key={cls}
              className="rounded-md border border-grade-f/30 bg-grade-f/10 px-2 py-1 font-mono text-xs text-grade-f"
            >
              .{cls}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
