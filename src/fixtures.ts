// Named table states for review and screenshots (`?fixture=`). A fixture is only a list of actions;
// the engine decides what they produce.
import type { Kind, Niche, Wake } from './engine';

export function applyFixture(wake: Wake, name: string): void {
  if (!['start', 'wake', 'frant', 'broken'].includes(name)) return;
  const now = () => Date.now();
  // every fixture begins past the boot: the candle on the sill lit at the troita
  const boot = wake.state().cards.filter((c) => c.at === 'sill' && c.kind === 'lumanare').map((c) => c.id);
  wake.apply({ type: 'place', cards: boot, target: { niche: 'troita' } }, now());
  if (name === 'start') return;
  const onTable = (k: Kind) => wake.state().cards.filter((c) => c.kind === k && c.at === 'table');
  const place = (cards: number[], niche: Niche) => {
    const a = wake.apply({ type: 'place', cards, target: { niche } }, now());
    if (!a.ok) throw new Error(`fixture: ${niche} refused (${a.refusal})`);
  };
  const close = () => wake.apply({ type: 'close_day' }, now());
  const codrii = () => onTable('codrii_vlasiei').map((c) => c.id);

  if (name === 'broken') {
    // the one silence: threads that rot while the watcher is already broken (a run spends it once)
    for (let i = 0; i < 3; i++) {
      place(codrii(), 'umbla');
      place(onTable('lumanare').slice(0, 1).map((c) => c.id), 'umbla');
      close();
    }
    close();
    return;
  }
  if (name === 'frant') {
    // a lit wander on day 1, then nobody mourns: three threads rot at the fourth close and break the watcher
    place(codrii(), 'umbla');
    place(onTable('lumanare').slice(0, 1).map((c) => c.id), 'umbla');
    for (let i = 0; i < 4; i++) close();
    return;
  }
  // days 1-3: three wanders, the first by the light of a candle
  place(codrii(), 'umbla');
  place(onTable('lumanare').slice(0, 1).map((c) => c.id), 'umbla');
  close();
  place(codrii(), 'umbla');
  close();
  place(codrii(), 'umbla');
  close();
  // day 4: Rada sings two of the oldest threads and one of day 2's; the third oldest is left to rot
  const dor = onTable('fir_de_dor').sort((a, b) => a.grains - b.grains || a.id - b.id);
  place(onTable('rada').map((c) => c.id), 'boci');
  place([dor[0].id, dor[1].id, dor[3].id], 'boci');
  place(codrii(), 'umbla');
  close();
  // day 5, morning: the sitting is half sung, one Jale in its corner, the peddler at the table
  place(codrii(), 'umbla');
}
