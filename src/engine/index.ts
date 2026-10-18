import init, { Engine } from '../../pkg/priveghi_engine.js';
import type { Action, Answer, SaveRefusal, View } from './types';

export * from './types';

/**
 * One wake held in WebAssembly: the dead's engine (RULINGS R60). Every rule runs there; this side
 * sends actions, reads the state back and asks for the projections only the rules can make. Every
 * move names its seat (docs/ENGINE_API.md): there is no default, so no call site implies one; a seat
 * that is not an integer in 0..255 (one left out included) throws `seat`.
 */
export class Wake {
  private constructor(private readonly engine: Engine) {}

  /** A new wake in the dark; `now` is the renderer's clock. The economy has no dice: nothing to seed. */
  static async begin(now: number): Promise<Wake> {
    await init();
    return new Wake(new Engine(now));
  }

  /** A wake from a save (`save()`, or one from before the version), or why the engine would not load it. */
  static async load(save: string): Promise<{ wake: Wake } | { refused: SaveRefusal }> {
    await init();
    try {
      return { wake: new Wake(Engine.load(save)) };
    } catch (e) {
      return { refused: e instanceof Error && e.message === 'newer' ? 'newer' : 'unreadable' };
    }
  }

  /** The state, with the forecast beside it: Uitare at the next three dawns if nothing is done. */
  state(): View {
    return JSON.parse(this.engine.state()) as View;
  }

  apply(action: Action, now: number, seat: number): Answer {
    return JSON.parse(this.engine.apply(JSON.stringify(action), now, seat)) as Answer;
  }

  /** What apply would answer, without applying: a target answers by contour weight only if the engine would take the drop. */
  probe(action: Action, now: number, seat: number): Answer {
    return JSON.parse(this.engine.probe(JSON.stringify(action), now, seat)) as Answer;
  }

  /** What this Dor would make on this card, in points 0..2, or -1 if the drop would be refused now. */
  matches(dor: number, on: number, now: number, seat: number): number {
    return this.engine.matches(dor, on, now, seat);
  }

  /** The journal replays from its origin to exactly this state: the WebAssembly side of the determinism check. */
  replays(): boolean {
    return this.engine.replays();
  }

  save(): string {
    return this.engine.save();
  }
}
