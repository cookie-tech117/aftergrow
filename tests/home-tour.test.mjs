import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source=await readFile(new URL('../app/home/tour.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {HOME_TOUR_STEPS,tourLayout}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('Home SVG tour follows streak, welcome, island, goals and custom goal steps',()=>{
 assert.deepEqual(HOME_TOUR_STEPS.map(s=>s.id),['streak','welcome','island','goals','add']);
 assert.equal(HOME_TOUR_STEPS[1].action,'Show me around');
 assert.equal(HOME_TOUR_STEPS.at(-1).action,'Got it!');
});
test('spotlight preserves the actual target and places cards above goals and below the island',()=>{
 const island={x:0,y:165,width:393,height:243};
 const islandLayout=tourLayout(2,393,794,island,140);
 assert.ok(islandLayout.highlight.y<=island.y);
 assert.ok(islandLayout.highlight.y+islandLayout.highlight.height>=island.y+island.height);
 assert.ok(islandLayout.panel.y>island.y+island.height);
 const goals={x:20,y:530,width:353,height:222};
 assert.ok(tourLayout(3,393,794,goals,150).panel.y+150<goals.y);
 const add={x:20,y:700,width:353,height:61};
 assert.ok(tourLayout(4,393,794,add,130).panel.y+130<add.y);
});
test('cards remain within narrow phone screens and short viewports',()=>{
 for(const width of [320,375,393,430]) for(const height of [560,620,794]){
  const layout=tourLayout(4,width,height,{x:20,y:height-90,width:width-40,height:60},140*width/393);
  assert.ok(layout.panel.x>=0);
  assert.ok(layout.panel.x+layout.panel.width<=width);
  assert.ok(layout.panel.y+140*width/393<=height);
 }
});
test('tour uses measured spotlight, automatic scrolling, accessible focus and replay without clearing user data',async()=>{
 const tour=await readFile(new URL('../app/home/HomeTour.tsx',import.meta.url),'utf8');
 const dashboard=await readFile(new URL('../app/home/HomeDashboard.tsx',import.meta.url),'utf8');
 const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
 assert.match(tour,/<mask /); assert.match(tour,/getBoundingClientRect/); assert.match(tour,/ResizeObserver/);
 assert.match(tour,/scroller\.scrollTo/); assert.match(tour,/background.inert = true/);
 assert.match(tour,/aria-modal="true"/); assert.match(tour,/Escape/); assert.match(tour,/e.key === 'Tab'/);
 for(const target of ['island','goals','add']) assert.ok(dashboard.includes(`data-home-tour="${target}"`));
 assert.match(page,/previewParams.get\("tour"\)/);
 assert.doesNotMatch(page,/className=\{`home-tour-overlay/);
});
