import { TimeSlice } from './types';

const extraLatency = 0.2;

export class Player {
  score: Array<TimeSlice | null>;
  timeCallback?: (timeIndex: number, timeSlice: TimeSlice | null) => any;
  #audioContext?: AudioContext;
  #nextTickTime: number;
  #nextTick: number;
  tickDuration: number;
  #instruments: { [name: string]: AudioBuffer };
  #instrumentBuffers: { [name: string]: Promise<ArrayBuffer> };
  #timer: number;

  constructor(instruments: Array<string>) {
    console.log('Player constructor');
    this.score = [{}];
    this.#nextTickTime = 0;
    this.#nextTick = 0;
    this.tickDuration = 60/440;
    this.#instruments = {};
    this.#instrumentBuffers = {};
    for (const instrName of instruments) {
      this.#instrumentBuffers[instrName] = fetch(`/sounds/${instrName}.flac`)
        .then((response) => response.arrayBuffer());
    }
    this.#timer = 0;
  }

  async #init() {
    if (this.#audioContext) {
      await this.#audioContext.resume();
      return;
    }
    console.log('Player initializing');
    this.#audioContext = new AudioContext();
    this.#instruments = Object.fromEntries(
      await Promise.all(
        Object.entries(this.#instrumentBuffers).map(async ([instrName, buf]) => ([
          instrName,
          await this.#audioContext!.decodeAudioData(await buf),
        ])),
      ),
    );
  }

  async play() {
    await this.#init();
    console.log(this.#audioContext!.currentTime);
    this.#nextTickTime = this.#audioContext!.currentTime + extraLatency;
    console.log(this.#nextTickTime);
    console.log(this.score[this.#nextTick]);
    this.#playNextTick();
  }

  pause() {
    this.#audioContext?.suspend();
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = 0;
    }
  }

  dispose() {
    console.log('Player dispose');
    this.pause();
    this.#audioContext?.close();
  }

  #playNextTick() {
    const timeSlice = this.score[this.#nextTick];
    if (this.timeCallback) {
      const nextTick = this.#nextTick;
      const latency = this.#audioContext!.baseLatency
        + (this.#nextTickTime - this.#audioContext!.currentTime);
      setTimeout(
        () => { this.timeCallback!(nextTick, timeSlice); },
        1000 * latency,
      );
    }
    if (timeSlice) {
      for (const instrName in timeSlice) {
        const buffer = this.#instruments[instrName];
        if (buffer) {
          const node = new AudioBufferSourceNode(this.#audioContext!, { buffer });
          node.connect(this.#audioContext!.destination);
          node.start(this.#nextTickTime);
        }
      }
    }
    this.#nextTick++;
    if (this.#nextTick >= this.score.length) {
      this.#nextTick = 0;
    }
    this.#nextTickTime += this.tickDuration;
    const nextTickInterval = 1000 * (this.#nextTickTime - this.#audioContext!.currentTime - extraLatency);
    this.#timer = window.setTimeout(
      () => { this.#playNextTick() },
      nextTickInterval,
    );
  }
}
