import init, { Engine } from '../../pkg/priveghi_engine.js';
import type { Action, Answer, State } from './types';

export type * from './types';

/** One wake held in WebAssembly. Every rule runs there; this side sends actions and reads state. */
export class Wake {
  private constructor(private readonly engine: Engine) {}

  static async begin(seed: number, now: number): Promise<Wake> {
    await init();
    return new Wake(new Engine(seed, now));
  }

  state(): State {
    return JSON.parse(this.engine.state()) as State;
  }

  apply(action: Action, now: number): Answer {
    return JSON.parse(this.engine.apply(JSON.stringify(action), now)) as Answer;
  }

  /** What apply would answer, without applying: lights a niche only if the engine would take the cards. */
  probe(action: Action, now: number): Answer {
    return JSON.parse(this.engine.probe(JSON.stringify(action), now)) as Answer;
  }

  save(): string {
    return this.engine.save();
  }
}
