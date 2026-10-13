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

// The brief's diacritics string, in all three faces: it also makes the browser load them.
const typetest = document.createElement('div');
typetest.className = 'typetest';
typetest.setAttribute('aria-hidden', 'true');
typetest.innerHTML = ['d', 'b', 'l'].map((f) => `<span class="${f}">${TYPE_TEST}</span>`).join('');
typetest.classList.toggle('show', params.has('typetest'));
document.body.append(typetest);
const FACES = ['600 16px "Cormorant Unicase"', '500 16px "Cormorant Unicase"', '400 16px Alegreya', '600 16px Alegreya', 'italic 400 16px Alegreya', '400 16px "Alegreya SC"'];
await Promise.all(FACES.map((f) => document.fonts.load(f, TYPE_TEST)));

const wake = await Wake.begin(seed, Date.now());
applyFixture(wake, params.get('fixture') ?? 'start');

const stage = document.getElementById('stage')!;
const rotate = document.getElementById('rotate')!;
rotate.innerHTML = rotateSVG();
const table = new Table(stage);
table.render(wake.state());

const fit = () => fitStage(stage, rotate);
fit();
window.addEventListener('resize', fit);
window.visualViewport?.addEventListener('resize', fit);
document.body.dataset.ready = '1';
