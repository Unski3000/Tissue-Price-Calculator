import { readFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredFiles = [
  'index.html',
  'styles.css',
  'calculator.js',
  'manifest.json',
  'assets/icon.svg',
  'assets/kerio-logo.svg',
  'tests/calculator.test.js',
];
const misplacedFiles = ['icon.svg', 'calculator.test.js'];
const textFilesToScan = [
  ...requiredFiles,
  'README.md',
  'package.json',
];
const failures = [];

async function exists(path) {
  try {
    await access(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

for (const file of requiredFiles) {
  if (!(await exists(file))) {
    failures.push(`Missing required deployment file: ${file}`);
  }
}

for (const file of misplacedFiles) {
  if (await exists(file)) {
    failures.push(`Misplaced root-level file found: ${file}. Use the documented path instead.`);
  }
}

for (const file of textFilesToScan) {
  if (!(await exists(file))) {
    continue;
  }
  const contents = readFileSync(join(repoRoot, file), 'utf8');
  if (contents.startsWith('diff --git') || contents.includes('\n--- a/') || contents.includes('\n+++ b/')) {
    failures.push(`${file} appears to contain a Git diff/patch instead of real file contents.`);
  }
}

if (await exists('index.html')) {
  const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"#?:]+)"/g)].map((match) => match[1]);

  for (const ref of refs) {
    if (ref.startsWith('http') || ref.startsWith('data:')) {
      continue;
    }
    if (!(await exists(ref))) {
      failures.push(`index.html references missing file: ${ref}`);
    }
  }

  if (!html.includes('href="styles.css"')) {
    failures.push('index.html must load styles.css from the repo root.');
  }
  if (!html.includes('src="calculator.js"')) {
    failures.push('index.html must load calculator.js from the repo root.');
  }
}

if (await exists('manifest.json')) {
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'manifest.json'), 'utf8'));
  for (const icon of manifest.icons ?? []) {
    if (!(await exists(icon.src))) {
      failures.push(`manifest.json references missing icon: ${icon.src}`);
    }
  }
}

if (await exists('styles.css')) {
  const styles = readFileSync(join(repoRoot, 'styles.css'), 'utf8');
  if (!styles.includes('.app') || !styles.includes('.hdr') || !styles.includes('.sec')) {
    failures.push('styles.css does not include the expected app layout selectors.');
  }
}

if (await exists('calculator.js')) {
  const calculator = readFileSync(join(repoRoot, 'calculator.js'), 'utf8');
  if (!calculator.includes('export const PRICING_CONFIG') || !calculator.includes('export function calculatePrice')) {
    failures.push('calculator.js does not expose the expected pricing module exports.');
  }
}

if (failures.length > 0) {
  console.error('Deployment check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Deployment check passed: all required app files and references are in place.');
