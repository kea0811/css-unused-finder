import { analyze } from '../../src';
import { createColors } from './color.js';
import { run, type RunDeps } from './cli.js';
import { formatReport, gradeBelow, gradeRank, parseGrade } from './format.js';

const ESC = String.fromCharCode(27);

interface Harness {
  deps: RunDeps;
  out: string[];
  err: string[];
  stdout: () => string;
  stderr: () => string;
}

function harness(files: Record<string, string>, env: Record<string, string | undefined> = {}): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const deps: RunDeps = {
    log: (message) => out.push(message),
    error: (message) => err.push(message),
    readFile: (path) => {
      if (!(path in files)) {
        throw new Error(`ENOENT: no such file, open '${path}'`);
      }
      return files[path];
    },
    env,
  };
  return { deps, out, err, stdout: () => out.join('\n'), stderr: () => err.join('\n') };
}

// A deliberately fragile stylesheet: an ID + deep chain + !important + magic z-index,
// one display:none rule, and an unused class.
const FRAGILE = '#x .y .z .w{color:red!important;z-index:99999} .a{display:none} .unused{margin:0}';
const MARKUP = '<div class="a"></div>';
// A calm stylesheet — a single class, no offenders.
const CLEAN = '.card{color:#333}';

describe('format helpers', () => {
  it('ranks grades A (best) to F (worst)', () => {
    expect(gradeRank('A')).toBe(0);
    expect(gradeRank('F')).toBe(4);
    expect(gradeRank('A')).toBeLessThan(gradeRank('C'));
  });

  it('gradeBelow is true only when worse than the minimum', () => {
    expect(gradeBelow('C', 'B')).toBe(true);
    expect(gradeBelow('A', 'B')).toBe(false);
    expect(gradeBelow('B', 'B')).toBe(false);
  });

  it('parses and normalizes a --min-grade value', () => {
    expect(parseGrade('b')).toBe('B');
    expect(parseGrade('  F ')).toBe('F');
    expect(parseGrade('Z')).toBeNull();
    expect(parseGrade('')).toBeNull();
  });
});

describe('formatReport', () => {
  const colors = createColors(false);

  it('renders the grade, every severity group, and the stats footer', () => {
    const report = analyze({ css: FRAGILE });
    const text = formatReport(report, { label: 'styles.css', colors });
    expect(text).toContain('styles.css');
    expect(text).toContain(`fragility  ${report.grade}`);
    expect(text).toContain('High');
    expect(text).toContain('Medium');
    expect(text).toContain('Low');
    // a high-severity finding's selector and message both appear
    expect(text).toContain('#x .y .z .w');
    expect(text).toContain('!important');
    expect(text).toMatch(/\d+ rules · \d+ selectors · \d+ declarations/);
  });

  it('omits the dead-class section when no markup was supplied', () => {
    const text = formatReport(analyze({ css: FRAGILE }), { label: 's.css', colors });
    expect(text).not.toContain('Dead classes');
  });

  it('lists unused classes when markup is supplied', () => {
    const text = formatReport(analyze({ css: FRAGILE, markup: MARKUP }), { label: 's.css', colors });
    expect(text).toContain('Dead classes');
    expect(text).toContain('.unused');
    expect(text).not.toContain('.a  —'); // .a is used by the markup
  });

  it('celebrates when every defined class is used', () => {
    const text = formatReport(analyze({ css: '.a{}', markup: '<i class="a"></i>' }), {
      label: 's.css',
      colors,
    });
    expect(text).toContain('all 1 defined classes appear in the markup');
  });

  it('reports a clean bill of health when there are no findings', () => {
    const text = formatReport(analyze({ css: CLEAN }), { label: 'clean.css', colors });
    expect(text).toContain('no fragility findings');
  });

  it('paints a C grade and skips the empty severity groups', () => {
    // `ul.nav` is a single overqualified (medium) finding → grade C, no high/low groups.
    const report = analyze({ css: 'ul.nav{}' });
    expect(report.grade).toBe('C');
    const text = formatReport(report, { label: 's.css', colors });
    expect(text).toContain('Medium (1)');
    expect(text).not.toContain('High');
    expect(text).not.toContain('Low');
  });

  it('renders a report whose only finding is low severity', () => {
    const report = analyze({ css: '.a{z-index:99999}' });
    const text = formatReport(report, { label: 's.css', colors });
    expect(text).toContain('Low (1)');
    expect(text).not.toContain('High');
    expect(text).not.toContain('Medium');
  });
});

describe('run', () => {
  it('prints a report and exits 0', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).toContain('styles.css');
    expect(h.stdout()).toContain('fragility');
  });

  it('colors output by default', () => {
    const h = harness({ 'styles.css': FRAGILE });
    run(['styles.css'], h.deps);
    expect(h.stdout()).toContain(ESC);
  });

  it('disables color with --no-color', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css', '--no-color'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).not.toContain(ESC);
  });

  it('disables color when NO_COLOR is set', () => {
    const h = harness({ 'styles.css': FRAGILE }, { NO_COLOR: '1' });
    const code = run(['styles.css'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).not.toContain(ESC);
  });

  it('emits the raw report as JSON with --json', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css', '--json'], h.deps);
    expect(code).toBe(0);
    const parsed = JSON.parse(h.stdout());
    expect(parsed.grade).toBe(analyze({ css: FRAGILE }).grade);
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(h.stdout()).not.toContain(ESC);
  });

  it('analyzes several files and tags each JSON entry with its file', () => {
    const h = harness({ 'a.css': FRAGILE, 'b.css': CLEAN });
    const code = run(['a.css', 'b.css', '--json'], h.deps);
    expect(code).toBe(0);
    const parsed = JSON.parse(h.stdout());
    expect(parsed.map((entry: { file: string }) => entry.file)).toEqual(['a.css', 'b.css']);
  });

  it('renders each file as its own section in the default report', () => {
    const h = harness({ 'a.css': FRAGILE, 'b.css': CLEAN });
    const code = run(['a.css', 'b.css', '--no-color'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).toContain('a.css');
    expect(h.stdout()).toContain('b.css');
  });

  it('enables dead-class detection with --html', () => {
    const h = harness({ 'styles.css': FRAGILE, 'index.html': MARKUP });
    const code = run(['styles.css', '--html', 'index.html', '--no-color'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).toContain('Dead classes');
    expect(h.stdout()).toContain('.unused');
  });

  it('fails the gate when a file grades below --min-grade', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css', '--min-grade', 'A'], h.deps);
    expect(code).toBe(1);
    expect(h.stderr()).toContain('below --min-grade A');
  });

  it('passes the gate when every file meets --min-grade', () => {
    const h = harness({ 'styles.css': CLEAN });
    const code = run(['styles.css', '--min-grade', 'F'], h.deps);
    expect(code).toBe(0);
    expect(h.stderr()).toBe('');
  });

  it('rejects an invalid --min-grade value with exit 2', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css', '--min-grade', 'Z'], h.deps);
    expect(code).toBe(2);
    expect(h.stderr()).toContain('invalid --min-grade');
  });

  it('exits 2 when the CSS file cannot be read', () => {
    const h = harness({});
    const code = run(['missing.css'], h.deps);
    expect(code).toBe(2);
    expect(h.stderr()).toContain('cannot read missing.css');
  });

  it('exits 2 when the --html file cannot be read', () => {
    const h = harness({ 'styles.css': FRAGILE });
    const code = run(['styles.css', '--html', 'missing.html'], h.deps);
    expect(code).toBe(2);
    expect(h.stderr()).toContain('cannot read --html missing.html');
  });

  it('prints help and exits 0', () => {
    const h = harness({});
    const code = run(['--help'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).toContain('Usage:');
    expect(h.stdout()).toContain('Examples:');
  });

  it('prints the version and exits 0', () => {
    const h = harness({});
    const code = run(['--version'], h.deps);
    expect(code).toBe(0);
    expect(h.stdout()).toContain('0.1.0');
  });

  it('errors and exits non-zero when the file argument is missing', () => {
    const h = harness({});
    const code = run([], h.deps);
    expect(code).toBe(1);
    expect(h.stderr()).toContain('missing required argument');
  });
});
