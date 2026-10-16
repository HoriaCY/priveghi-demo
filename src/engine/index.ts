import init, { Engine } from '../../pkg/priveghi_engine.js';
import type { Action, Answer, View } from './types';

export * from './types';

/**
 * One wake held in WebAssembly: the dead's engine (RULINGS R60). Every rule runs there; this side
 * sends actions, reads the state back and asks for the projections only the rules can make.
 */
export class Wake {
  private constructor(private readonly engine: Engine) {}

  /** A new wake in the dark; `now` is the renderer's clock. The economy has no dice: nothing to seed. */
  static async begin(now: number): Promise<Wake> {
    await init();
    return new Wake(new Engine(now));
  }

  /** A wake from a save (`save()`); null if the save does not load. */
  static async load(save: string): Promise<Wake | null> {
    await init();
    try {
      return new Wake(Engine.load(save));
    } catch {
      return null;
    }
  }

  /** The state, with the forecast beside it: Uitare at the next three dawns if nothing is done. */
  state(): View {
    return JSON.parse(this.engine.state()) as View;
  }

  apply(action: Action, now: number): Answer {
    return JSON.parse(this.engine.apply(JSON.stringify(action), now)) as Answer;
  }

  /** What apply would answer, without applying: a target answers by contour weight only if the engine would take the drop. */
  probe(action: Action, now: number): Answer {
    return JSON.parse(this.engine.probe(JSON.stringify(action), now)) as Answer;
  }

  /** What this Dor would make on this card, in points 0..2, or -1 if the drop would be refused now. */
  matches(dor: number, on: number, now: number): number {
    return this.engine.matches(dor, on, now);
  }

  save(): string {
    return this.engine.save();
  }
}
