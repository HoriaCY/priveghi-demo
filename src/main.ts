// The demo: the engine holds the wake; the table draws it; hands send actions; the clock ticks.
import './render/style.css';
import { Wake } from './engine';
import type { Entry, Target } from './engine';
import { applyFixture } from './fixtures';
import { attachInput } from './play/input';
import { SOUND, unlockAudio } from './render/audio';
import { fitStage } from './render/fit';
import { rotateSVG } from './render/furniture';
import { Table } from './render/table';
import { LINES, TYPE_TEST } from './strings';
import { TUNING } from './tuning';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '1') || 1;

/** The brief's diacritics string in all three faces; mounting it also makes the browser load them. */
async function loadFaces(): Promise<void> {
  const typetest = document.createElement('div');
  typetest.className = 'typetest';
  typetest.setAttribute('aria-hidden', 'true');
  typetest.innerHTML = ['d', 'b', 'l'].map((f) => `<span class="${f}">${TYPE_TEST}</span>`).join('');
  typetest.classList.toggle('show', params.has('typetest'));
  document.body.append(typetest);
  const faces = ['600 16px "Cormorant Unicase"', '500 16px "Cormorant Unicase"', '400 16px Alegreya', '600 16px Alegreya', 'italic 400 16px Alegreya', '400 16px "Alegreya SC"'];
  await Promise.all(faces.map((f) => document.fonts.load(f, TYPE_TEST)));
}

/** Numbered markers for review screenshots; README.md "What is on the table" is the legend. */
function annotate(stage: HTMLElement): void {
  const marks: [number, number][] = [[452, 20], [100, 126], [272, 140], [784, 140], [1100, 140], [64, 384], [200, 366], [200, 520], [992, 400], [862, 560], [1084, 510]];
  marks.forEach(([x, y], i) => {
    const a = document.createElement('div');
    a.className = 'ann';
    a.textContent = String(i + 1);
    a.style.left = `${x}px`;
    a.style.top = `${y}px`;
    stage.append(a);
  });
}

/** Material sounds for the beats the engine logged; most losses are quiet by design. */
function sound(e: Entry): void {
  switch (e.event) {
    case 'precue':
      return SOUND.tick(0.6);
    case 'day_closed':
      return SOUND.chime();
    case 'placed':
      return typeof e.target === 'object' && e.target.niche === 'troita' ? SOUND.toaca() : SOUND.thread();
    case 'tied':
      return SOUND.thread();
    case 'unplaced':
      return SOUND.tick(0.9);
    case 'wax_fed':
      return SOUND.seal();
    case 'jale_mourned':
      return SOUND.heldNote();
  }
}

async function main(): Promise<void> {
  await loadFaces();
  if (params.has('sheet')) {
    // every card face on one page: the wireframe an artist replaces (docs/shots/step-2/cards-sheet.png)
    const { cardSheet } = await import('./render/sheet');
    document.body.append(cardSheet());
    return;
  }
  const wake = await Wake.begin(seed, Date.now());
  applyFixture(wake, params.get('fixture') ?? 'start');

  const stage = document.getElementById('stage')!;
  const rotate = document.getElementById('rotate')!;
  rotate.innerHTML = rotateSVG();
  const table = new Table(stage);
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  stage.append(toast);
  if (params.has('annotate')) annotate(stage);

  let seen = wake.state().log.length;
  let clock = 0;
  const refresh = () => {
    const s = wake.state();
    table.render(s);
    s.log.slice(seen).forEach(sound);
    seen = s.log.length;
    if (s.phase === 'ended') window.clearInterval(clock);
    document.body.dataset.day = String(s.day);
    document.body.dataset.phase = s.phase;
    document.body.dataset.wax = String(s.wax);
  };
  const act = (a: Parameters<Wake['apply']>[0]) => {
    const answer = wake.apply(a, Date.now());
    if (answer.ok && answer.changed) refresh();
    return answer.ok;
  };
  let toastTimer = 0;
  attachInput(stage, table, {
    probe: (ids: number[], target: Target) => wake.probe({ type: 'place', cards: ids, target }, Date.now()).ok,
    place: (ids: number[], target: Target) => act({ type: 'place', cards: ids, target }),
    unplace: (ids: number[]) => act({ type: 'unplace', cards: ids }),
    tapFlame: () => void act({ type: 'tap', on: 'flame' }),
    lifted: () => SOUND.tick(1.1),
    refused: () => {
      SOUND.tick(0.8);
      toast.textContent = LINES.doesNotFit.ro;
      toast.classList.add('show');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove('show'), TUNING.toast_ms);
    },
  });
  // the first touch opens the sound (iOS needs a gesture)
  stage.addEventListener('pointerdown', unlockAudio, { capture: true });
  stage.addEventListener('keydown', unlockAudio, { capture: true });
  // the clock runs only while someone is at the table
  document.addEventListener('visibilitychange', () => act({ type: document.hidden ? 'pause' : 'resume' }));

  refresh();
  if (!params.has('still')) clock = window.setInterval(() => act({ type: 'tick' }), TUNING.tick_ms);

  const fit = () => fitStage(stage, rotate);
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
}

await main();
document.body.dataset.ready = '1';
