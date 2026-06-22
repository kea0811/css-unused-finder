import { Command, type CommanderError } from 'commander';
import { analyze, type AnalysisReport } from '../../src';
import { type Colors, createColors } from './color.js';
import { formatReport, gradeBelow, parseGrade } from './format.js';

/** I/O hooks the CLI depends on. The binary wires these to the real process. */
export interface RunDeps {
  log: (message: string) => void;
  error: (message: string) => void;
  readFile: (path: string) => string;
  env: Record<string, string | undefined>;
}

interface CliOptions {
  json?: boolean;
  html?: string;
  minGrade?: string;
  color?: boolean;
}

const VERSION = '0.1.0';

const DESCRIPTION = 'Score a stylesheet’s fragility (A–F) and surface !important, ID selectors, deep nesting, and dead classes.';

const HELP_EXAMPLES = `
Examples:
  $ css-unused-finder styles.css
  $ css-unused-finder styles.css --html index.html   # enable dead-class detection
  $ css-unused-finder a.css b.css                     # analyze several files
  $ css-unused-finder styles.css --json
  $ css-unused-finder styles.css --min-grade B        # CI gate: exit 1 below a B
`;

const trimTrailingNewline = (text: string): string => text.replace(/\n+$/, '');

/** A read CSS file paired with the report the engine produced for it. */
interface FileResult {
  file: string;
  report: AnalysisReport;
}

/**
 * Read + analyze every file. Throws on the first unreadable file so the caller
 * can report it and exit `2`. Markup, when supplied, is shared across files.
 */
function analyzeFiles(files: string[], markup: string | undefined, deps: RunDeps): FileResult[] {
  return files.map((file) => {
    let css: string;
    try {
      css = deps.readFile(file);
    } catch (err) {
      throw new Error(`cannot read ${file}: ${(err as Error).message}`);
    }
    return { file, report: analyze({ css, markup }) };
  });
}

function execute(files: string[], options: CliOptions, deps: RunDeps, colors: Colors): number {
  let markup: string | undefined;
  if (options.html !== undefined) {
    try {
      markup = deps.readFile(options.html);
    } catch (err) {
      deps.error(colors.red(`error: cannot read --html ${options.html}: ${(err as Error).message}`));
      return 2;
    }
  }

  let minGrade: ReturnType<typeof parseGrade> = null;
  if (options.minGrade !== undefined) {
    minGrade = parseGrade(options.minGrade);
    if (minGrade === null) {
      deps.error(colors.red(`error: invalid --min-grade "${options.minGrade}" (expected A, B, C, D or F)`));
      return 2;
    }
  }

  let results: FileResult[];
  try {
    results = analyzeFiles(files, markup, deps);
  } catch (err) {
    deps.error(colors.red(`error: ${(err as Error).message}`));
    return 2;
  }

  if (options.json === true) {
    const payload = results.length === 1 ? results[0].report : results.map((r) => ({ file: r.file, ...r.report }));
    deps.log(JSON.stringify(payload, null, 2));
  } else {
    deps.log(results.map((r) => formatReport(r.report, { label: r.file, colors })).join('\n\n'));
  }

  if (minGrade !== null) {
    const failing = results.filter((r) => gradeBelow(r.report.grade, minGrade));
    if (failing.length > 0) {
      for (const r of failing) {
        deps.error(colors.red(`✗ ${r.file}: grade ${r.report.grade} is below --min-grade ${minGrade}`));
      }
      return 1;
    }
  }

  return 0;
}

/**
 * Parse `argv` (user args, without `node` and the script path) and run the CLI.
 * Returns the process exit code. Every side effect is injected via {@link RunDeps}.
 */
export function run(argv: string[], deps: RunDeps): number {
  let exitCode = 0;

  const program = new Command();
  program
    .name('css-unused-finder')
    .description(DESCRIPTION)
    .argument('<file.css>', 'a CSS file to analyze')
    .argument('[moreFiles...]', 'additional CSS files to analyze')
    .option('-j, --json', 'print the raw AnalysisReport as JSON instead of a report')
    .option('--html <file>', 'read markup from <file> to enable dead-class detection')
    .option('--min-grade <A-F>', 'CI gate: exit 1 if any file grades worse than this')
    .option('--no-color', 'disable ANSI colors (also respects the NO_COLOR env var)')
    .version(VERSION, '-v, --version', 'print the version number')
    .addHelpText('after', HELP_EXAMPLES)
    .exitOverride()
    .configureOutput({
      writeOut: (text) => deps.log(trimTrailingNewline(text)),
      writeErr: (text) => deps.error(trimTrailingNewline(text)),
    })
    .action((file: string, moreFiles: string[], options: CliOptions) => {
      const colorsEnabled = options.color !== false && !deps.env.NO_COLOR;
      exitCode = execute([file, ...moreFiles], options, deps, createColors(colorsEnabled));
    });

  try {
    program.parse(argv, { from: 'user' });
  } catch (err) {
    // exitOverride() turns help/version/parse failures into a thrown
    // CommanderError, which always carries a numeric exit code.
    return (err as CommanderError).exitCode;
  }
  return exitCode;
}
