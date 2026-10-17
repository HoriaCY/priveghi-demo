// The page: paper beside the table (desktop), below it (iPad), folded over its right side on a
// phone. It carries the day; Uitare and the forecast; Spaima; Putere as drops; the tally as five
// rows; the card in focus (name, kinds, owner, state, the match with the Dor in hand); the last
// line the table spoke; the soroc dishes (step 4); at an ending the ending's title, after the
// last soroc's result and the last line (charter section 5). Words only from src/strings.ts;
// states are grains, strokes, dishes and counts, never words.
import type { Card, View } from '../engine';
import { SOURCES } from '../engine';
import { hemOfPerson, nameOf, ownerName } from '../render/catalog';
import { brideSVG, grainRowSVG, pipsSVG, sorocSVG, tallyBandSVG } from '../render/furniture';
import { C } from '../render/palette';
import { sorocDays, sorocState } from '../render/table';
import { AMINTIRE, DAYS, ENDING, FEL, PERSON, PREVESTIRE, PUTERE, SOROC, SPAIMA, UITARE } from '../strings';

/** What the page is about: the cards of a stack, the tally, or the soroc dishes. */
export type Focus = { ids: number[] } | { tally: true } | { soroace: true } | null;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** The kind labels and the owner, joined; a person is their own owner and is not named twice (R93). */
const subOf = (c: Card) => {
  const o = ownerName(c);
  return [...kinds(c), o !== nameOf(c) ? o : ''].filter(Boolean).join(' · ');
};
/** A resting thing's strokes: one per day it is still watched. */
const restMarks = (c: Card, v: View) => (c.kind === 'lucru' && c.rests_until >= v.day ? '|'.repeat(c.rests_until - v.day + 1) : '');

/** The kind labels a card carries on its hem: one for a Dor, a place or a Semn; one or two for a thing or a person. */
function kinds(c: Card): string[] {
  switch (c.kind) {
    case 'dor':
    case 'loc':
    case 'semn':
      return [FEL[c.fel].ro];
    case 'lucru':
    case 'om':
      return c.fel.map((f) => FEL[f].ro);
    default:
      return [];
  }
}

/** A card's state without words: the grain row for a Dor, a stroke per resting day for a thing, a count. */
function aspects(cards: Card[], v: View): string {
  const c = cards[0];
  const parts: string[] = [];
  if (c?.kind === 'dor') parts.push(`<span class="chip">${grainRowSVG(c.left, v.config.dor_zile, C.soot)}</span>`);
  const rest = c ? restMarks(c, v) : '';
  if (rest) parts.push(`<span class="n">${rest}</span>`);
  if (cards.length > 1) parts.push(`<span class="n">×${cards.length}</span>`);
  return parts.join('');
}

export class Page {
  focus: Focus = null;
  /** The Dor in hand: a card id, until another tap. */
  inHand: number | null = null;
  private said: string | null = null;

  constructor(
    readonly el: HTMLElement,
    /** The engine's answer: points 0..2 for this Dor on this card, or -1 when the drop would be refused now. */
    private readonly matcher: (dor: number, on: number) => number,
  ) {}

  /** A line the table spoke. Stays until the next touch. */
  say(line: string | null): void {
    this.said = line;
  }

  /** The match with the Dor in hand, as the Amintire it would make; nothing when the engine would refuse. */
  private match(c: Card, inHand: number | null): string {
    if (inHand === null || c.id === inHand || c.kind === 'dor') return '';
    const m = this.matcher(inHand, c.id);
    if (m < 0 || m > 2) return '';
    return `<span class="match">${esc(AMINTIRE[m as 0 | 1 | 2].ro)}</span>`;
  }

  private tallyRows(v: View, cls: string): string {
    return SOURCES.map(
      (om, i) =>
        `<span class="${cls}" data-om="${om}"><span class="nm">${esc(PERSON[om].ro)}</span><span class="asp"><span class="band">${tallyBandSVG(hemOfPerson(v.cards, om), v.amintiri[i] ?? [], v.standing_m[i] ?? 0, v.config.standing_cap_m)}</span></span></span>`,
    ).join('');
  }

  /** The soroc dishes as the engine's stats have them: the label, then one dish per memorial day the demo reaches. */
  private soroaceRow(v: View): string {
    const dishes = sorocDays(v)
      .map((d) => `<span class="soroc" data-soroc="${d}" data-state="${sorocState(v, d)}">${sorocSVG(sorocState(v, d))}</span>`)
      .join('');
    return `<div class="soroace"><span class="n">${esc(SOROC.ro)}</span>${dishes}</div>`;
  }

  /** The strip (charter section 4): the name, the kind labels and the owner, the state, the match. */
  strip(v: View, f: Focus, inHand: number | null): string {
    if (!f) return '';
    if ('tally' in f) return this.tallyRows(v, 'row');
    // the dishes: the memorial's name, then each of its days with its dish
    if ('soroace' in f) {
      return (
        `<span class="nm">${esc(SOROC.ro)}</span>` +
        sorocDays(v)
          .map((d) => `<span class="row"><span class="n">${esc(DAYS[Math.min(d, DAYS.length) - 1].ro)}</span><span class="dish">${sorocSVG(sorocState(v, d))}</span></span>`)
          .join('')
      );
    }
    const cards = v.cards.filter((c) => f.ids.includes(c.id));
    const c = cards[0];
    if (!c) return '';
    // the pile of resting things (R91): each by name with its days
    if (cards.length > 1 && cards.every((x) => x.kind === 'lucru' && x.rests_until >= v.day)) {
      return cards.map((x) => `<span class="row"><span class="nm">${esc(nameOf(x))}</span><span class="n">${restMarks(x, v)}</span></span>`).join('');
    }
    const sub = subOf(c);
    return (
      `<span class="nm">${esc(nameOf(c))}</span>` +
      (sub ? `<span class="sub">${esc(sub)}</span>` : '') +
      `<span class="asp">${aspects(cards, v)}</span>` +
      this.match(c, inHand)
    );
  }

  render(v: View): void {
    const day = `<div class="day">${esc(DAYS[Math.min(v.day, DAYS.length) - 1].ro)}</div>`;
    // her door: the Bride stands and the choice is open, so no title yet (R84)
    if (v.phase === 'door') {
      this.el.innerHTML = `${day}<div class="door"><div class="bride">${brideSVG()}</div></div>`;
      this.el.dataset.phase = v.phase;
      return;
    }
    // an ending: the last soroc's dishes and the last line first, then its title; Uitare says nothing
    // (the page is blank but the day); the Bride stays in the door for Nunta
    if (v.ending && v.phase === 'ended') {
      if (v.ending === 'uitare') {
        this.el.innerHTML = day;
      } else {
        const said = this.said ? `<p class="said">${esc(this.said)}</p>` : '';
        const bride = v.ending === 'nunta' ? `<div class="bride">${brideSVG()}</div>` : '';
        this.el.innerHTML = `${day}${this.soroaceRow(v)}${said}<div class="end" data-ending="${v.ending}"><div class="title">${esc(ENDING[v.ending].ro)}</div>${bride}</div>`;
      }
      this.el.dataset.phase = v.phase;
      return;
    }
    const counts =
      `<div class="counts">` +
      `<span class="n">${esc(UITARE.ro)} ${v.uitare}</span> · <span class="n">${esc(PREVESTIRE.ro)} ${v.forecast.join(' · ')}</span>` +
      `<br><span class="n">${esc(SPAIMA.ro)} ${v.spaima}</span>` +
      `<br><span class="n">${esc(PUTERE.ro)}</span> <span class="drops">${pipsSVG(v.putere, v.config.putere)}</span>` +
      `</div>`;
    const tally = `<div class="tally-rows">${this.tallyRows(v, 'row')}</div>`;
    let focus = '';
    const f = this.focus;
    if (f && 'ids' in f) {
      const cards = v.cards.filter((c) => f.ids.includes(c.id));
      const c = cards[0];
      if (c) {
        const sub = subOf(c);
        focus =
          `<div class="focus"><div class="nm">${esc(nameOf(c))}</div>` +
          (sub ? `<div class="sub">${esc(sub)}</div>` : '') +
          `<div class="asp">${aspects(cards, v)}${this.match(c, this.inHand)}</div></div>`;
      }
    }
    const said = this.said ? `<p class="said">${esc(this.said)}</p>` : '';
    this.el.innerHTML = day + counts + this.soroaceRow(v) + tally + focus + said;
    this.el.dataset.phase = v.phase;
  }
}
