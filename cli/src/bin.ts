import { readFileSync } from 'node:fs';
import process from 'node:process';
import { run } from './cli.js';

const code = run(process.argv.slice(2), {
  log: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
  readFile: (path) => (path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8')),
  env: process.env,
});

if (code !== 0) {
  process.exitCode = code;
}
