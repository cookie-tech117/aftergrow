import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const weatherSource = await readFile(new URL('../app/home/weather.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(weatherSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { HOME_WEATHER, WEATHER_ORDER, nextWeather } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('one weather button cycles all six states and returns to sunny', () => {
  let current = 'sunny';
  const visited = [];
  for (let i = 0; i < 6; i++) { visited.push(current); current = nextWeather(current); }
  assert.deepEqual(visited, WEATHER_ORDER);
  assert.equal(new Set(visited).size, 6);
  assert.equal(current, 'sunny');
  for (const weather of visited) {
    assert.ok(HOME_WEATHER[weather].label);
    assert.ok(HOME_WEATHER[weather].intensity > 0);
    assert.match(HOME_WEATHER[weather].background, /^linear-gradient/);
  }
});

test('home retains the existing live island and saved weather integration', async () => {
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const dashboard = await readFile(new URL('../app/home/HomeDashboard.tsx', import.meta.url), 'utf8');
  assert.match(page, /<BaseIslandPreviewScene items=\{baseDecorations\}/);
  assert.match(page, /onDecorate=\{\(\) => setTab\("island"\)\}/);
  assert.match(page, /onWeather=\{\(\) => setWeather\(\(current\) => nextWeather\(current\)\)\}/);
  assert.match(page, /const save: SaveData = \{ inventory, placedItems, sessions, weather, island \}/);
  assert.match(dashboard, /role="progressbar"/);
  assert.match(dashboard, /aria-live="polite"/);
  assert.match(dashboard, /onClick=\{onDecorate\}/);
});
