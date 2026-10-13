// Step 1 harness: proves the WebAssembly engine runs in the browser by logging one state
// transition (a wander through one close). Replaced by the table in step 2.
import { Wake } from './engine';
import type { Entry, State } from './engine';

const seed = Number(new URLSearchParams(location.search).get('seed') ?? '1') || 1;
const wake = await Wake.begin(seed, Date.now());

const before = wake.state();
const codrii = before.cards.find((c) => c.kind === 'codrii_vlasiei');
if (!codrii) throw new Error('the starting table has no place card');
const placed = wake.apply({ type: 'place', cards: [codrii.id], target: { niche: 'umbla' } }, Date.now());
const closed = wake.apply({ type: 'close_day' }, Date.now());
const after = wake.state();

const closeLog = after.log.filter((e) => e.day === before.day && e.event !== 'placed');
const arrived = closeLog.flatMap((e: Entry) => (e.event === 'arrived' ? [e.kind] : []));
const line =
  `[priveghi] state transition (seed ${seed}): day ${before.day} -> day ${after.day}, ` +
  `rev ${before.rev} -> ${after.rev}; umbla(codrii_vlasiei) resolved; arrived: ${arrived.join(', ')}`;

console.log(line);
console.log('[priveghi] answers', { placed, closed });
console.log('[priveghi] before', before);
console.log('[priveghi] after', after);

const table = (s: State) =>
  s.cards.map((c) => `${String(c.id).padStart(2)} ${c.kind.padEnd(16)} ${JSON.stringify(c.at).padEnd(18)} grains ${c.grains}`).join('\n');
const out = document.querySelector<HTMLPreElement>('#out');
if (out) {
  out.textContent = [
    line,
    '',
    'the close, in order:',
    ...closeLog.map((e) => '  ' + JSON.stringify(e)),
    '',
    `table after (day ${after.day}):`,
    table(after),
  ].join('\n');
}
