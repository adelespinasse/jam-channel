export type NoteProperties = {};
export type TimeSlice = { [instrument: string]: NoteProperties };

const extraLatency = 0.2;

export class Player {
  score: Array<TimeSlice | null>;
  #audioContext?: AudioContext;
  #nextClickTime: number;
  #nextClick: number;
  clickDuration: number;
  #instruments: { [name: string]: AudioBuffer };
  #instrumentBuffers: { [name: string]: Promise<ArrayBuffer> };
  #timer: number;

  constructor(instruments: Array<string>) {
    console.log('Player constructor');
    this.score = [{}];
    this.#nextClickTime = 0;
    this.#nextClick = 0;
    this.clickDuration = 60/400;
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
    this.#nextClickTime = this.#audioContext!.currentTime + extraLatency;
    console.log(this.#nextClickTime);
    console.log(this.score[this.#nextClick]);
    this.#playNextClick();
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

  #playNextClick() {
    const timeSlice = this.score[this.#nextClick];
    if (timeSlice) {
      for (const instrName in timeSlice) {
        const buffer = this.#instruments[instrName];
        if (buffer) {
          const node = new AudioBufferSourceNode(this.#audioContext!, { buffer });
          node.connect(this.#audioContext!.destination);
          node.start(this.#nextClickTime);
        }
      }
    }
    this.#nextClick++;
    if (this.#nextClick >= this.score.length) {
      this.#nextClick = 0;
    }
    this.#nextClickTime += this.clickDuration;
    const nextClickInterval = 1000 * (this.#nextClickTime - this.#audioContext!.currentTime - extraLatency);
    this.#timer = window.setTimeout(
      () => { this.#playNextClick() },
      nextClickInterval,
    );
  }
}
