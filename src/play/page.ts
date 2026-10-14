// The page: paper beside the table (iPad, desktop) or over it (phone, on a tap). It carries the
// day, the pips Rada has lit, the card last touched (its name, its line, its state) and the ending.
// Every word on it comes from src/strings.ts; aspects are motif chips and numbers, never words.
import type { Card, Kind, State } from '../engine';
import { LOOK } from '../render/catalog';
import { M } from '../render/motifs';
import { C } from '../render/palette';
import { BOCITOARE, CARD, DAYS, LINES, POMELNIC, TROITA } from '../strings';

/** What the page is about: a card kind (with the cards it stands for), the troita, the dark door. */
export type Focus = { kind: Kind; ids: number[] } | { place: 'troita' | 'door' } | null;

const LINE: Partial<Record<Kind, string>> = {
  fir_de_dor: LINES.unmourned.ro,
  jale: LINES.unmourned.ro,
  negustor: LINES.countAgain.ro,
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** A hem motif as a small chip (the prototype's lore panel aspects). */
export function motifChip(kind: Kind, uid: string): string {
  const hem = LOOK[kind].hem;
  const pattern = hem === 'ochiul-deschis' ? M.ochi(uid, C.soot) : (M[hem] as (id: string, c: string, d?: string) => string)(uid, C.soot, C.woodLight);
  return `<svg class="chip" viewBox="0 0 36 12" aria-hidden="true"><defs>${pattern}</defs><rect width="36" height="12" fill="url(#${uid})"/></svg>`;
}

/** Wheat-ears, one per bocet sung: the pips on the page. */
function wheat(n: number): string {
  if (n <= 0) return '';
  const ears = Array.from({ length: n }, (_, i) => {
    const x = 6 + i * 14;
    return `<path d="M${x} 22 V4 M${x} 8 l-4 -3 M${x} 8 l4 -3 M${x} 13 l-4 -3 M${x} 13 l4 -3 M${x} 18 l-4 -3 M${x} 18 l4 -3" fill="none" stroke="${C.soot}" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join('');
  return `<svg class="ears" viewBox="0 0 ${n * 14} 24" style="width:${n * 14}px" aria-hidden="true">${ears}</svg>`;
}

/** A card's state without words: grains for longing, day-steps for what does not stay, a count. */
function aspects(cards: Card[], kind: Kind): string {
  const c = cards[0];
  const parts = [motifChip(kind, `asp-${kind}`)];
  if (cards.length > 1) parts.push(`<span class="n">×${cards.length}</span>`);
  if (c && kind === 'fir_de_dor') parts.push(`<span class="n">${'·'.repeat(c.grains)}</span>`);
  if (c && c.days > 0) parts.push(`<span class="n">${'|'.repeat(c.days)}</span>`);
  return parts.join('');
}

export class Page {
  private focus: Focus = null;
  private said: string | null = null;
  /** The Bride's page was tapped: LINES.notYet stands under her line while the next wake gets ready. */
  notYet = false;

  constructor(readonly el: HTMLElement) {}

  setFocus(f: Focus): void {
    this.focus = f;
  }

  /** A line the table spoke: the door's answer, the one silence. Stays until the next touch. */
  say(line: string | null): void {
    this.said = line;
  }

  /** The strip: one card's name and aspects, the light version of the page. */
  strip(s: State, f: Focus): string {
    if (!f) return '';
    if ('place' in f) return f.place === 'troita' ? `<span class="nm">${esc(TROITA.ro)}</span>` : '';
    const cards = s.cards.filter((c) => f.ids.includes(c.id));
    const sub = f.kind === 'rada' ? `<span class="sub">${esc(BOCITOARE.ro)}</span>` : '';
    return `<span class="nm">${esc(CARD[f.kind].ro)}</span>${sub}<span class="asp">${aspects(cards, f.kind)}</span>`;
  }

  render(s: State): void {
    const day = `<div class="day">${esc(DAYS[Math.min(s.day, DAYS.length) - 1].ro)}</div>`;
    const pips = `<div class="pips-row">${wheat(s.bocete)}</div>`;
    let focus = '';
    const f = this.focus;
    if (f && 'place' in f) {
      const line = f.place === 'troita' ? LINES.nothingLies.ro : LINES.deadLeave.ro;
      focus = `<div class="focus">${f.place === 'troita' ? `<div class="nm">${esc(TROITA.ro)}</div>` : ''}<p class="line">${esc(line)}</p></div>`;
    } else if (f) {
      const cards = s.cards.filter((c) => f.ids.includes(c.id));
      const sub = f.kind === 'rada' ? `<div class="sub">${esc(BOCITOARE.ro)}</div>` : '';
      const line = LINE[f.kind] ? `<p class="line">${esc(LINE[f.kind]!)}</p>` : '';
      focus = `<div class="focus"><div class="nm">${esc(CARD[f.kind].ro)}</div>${sub}${line}<div class="asp">${aspects(cards, f.kind)}</div></div>`;
    }
    const said = this.said ? `<p class="said">${esc(this.said)}</p>` : '';
    let end = '';
    if (s.phase === 'ended' && s.ending === 'pomelnic') {
      end = `<div class="end kept"><div class="title">${esc(POMELNIC.ro)}</div>${wheat(s.bocete)}<p class="line">${esc(LINES.wakeKept.ro)}</p></div>`;
    } else if (s.phase === 'ended') {
      const answer = this.notYet ? `<p class="line answer">${esc(LINES.notYet.ro)}</p>` : '';
      end = `<div class="end bride"><p class="line">${esc(LINES.sheComes.ro)}</p>${answer}</div>`;
    }
    this.el.innerHTML = end ? day + end : day + pips + said + focus;
    this.el.dataset.phase = s.phase;
  }
}
