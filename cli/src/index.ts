// Re-export the analysis engine that lives at the repo root (`<repo>/src`).
// tsup bundles this inline, so the published package carries its own copy with
// no relative-path runtime dependency. Importing `css-unused-finder` therefore
// gives you `analyze`, every helper, and the full set of report types.
export * from '../../src';
