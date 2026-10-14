// Step 2: the table drawn from the engine's state. No input yet; the clock does not tick.
import './render/style.css';
import { Wake } from './engine';
import { applyFixture } from './fixtures';
import { fitStage } from './render/fit';
import { rotateSVG } from './render/furniture';
import { Table } from './render/table';
import { TYPE_TEST } from './strings';

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
  new Table(stage).render(wake.state());
  if (params.has('annotate')) annotate(stage);

  const fit = () => fitStage(stage, rotate);
  fit();
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', fit);
}

await main();
document.body.dataset.ready = '1';
