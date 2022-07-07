import { TimeSlice } from './types';

// extraLatency is how far ahead of AudioContext.currentTime we try to add note
// events. There is of course additional system-dependent latency before the
// sounds at currentTime are actually heard.
const extraLatency = 0.1;

// Class of object that handles playback of the sounds. Uses the Web Audio API.
//
// It is not necessary to understand this code in order to follow the article
// on React+Firebase data abstractions.
//
// The constructor is called with an array of instrument names as its only
// parameter. Other settings are set by directly assigning values to the
// object's public properties. These can be changed at any time, including
// while sound is playing.
//
// Steps to produce sound:
//
// 1. Construct the object, `player = new Player(instruments)`.
//
// 2. Set `player.tickDuration`, the length of each tick in seconds.
//
// 3. Set `player.score`. This is an array of TimeSlice objects, representing
//    every tick in the playable score (array entries may also be null,
//    representing no notes, equivalent to an empty TimeSlice). The slice at
//    index n represents sounds to be played at time n*tickDuration (and again
//    when the loop repeats).
//
// 4. Optionally set `player.timeCallback`, a function to be called for each
//    tick. The Player attempts to call this when the relevant TimeSlice is
//    heard (i.e., it compensates for audio latency).
//
// 5. Call `player.play()`. The first time this is called, it initializes the
//    AudioContext and starts it running. This should be done in response to a
//    user input event, such as a click; otherwise the browser may refuse to
//    play sound.
//
// 6. Optionally, repeatedly call `player.pause()` to pause and/or
//    `player.play()` to start again.
//
// 7. When done, call `player.dispose()` to clean up. This is not necessary if
//    the app is being unloaded (i.e. tab is closed or user navigates away).
export class Player {
  score: Array<TimeSlice | null>;
  tickDuration: number;
  timeCallback?: (timeIndex: number, timeSlice: TimeSlice | null) => void;

  #playing: boolean;
  #audioContext?: AudioContext;
  #nextTickTime: number;
  #nextTick: number;
  #instruments: { [name: string]: AudioBuffer };
  #instrumentBuffers: { [name: string]: Promise<ArrayBuffer> };
  #timer: number;

  constructor(instruments: Array<string>) {
    this.score = [{}];
    this.tickDuration = 1;
    this.#playing = false;
    this.#nextTickTime = 0;
    this.#nextTick = 0;
    this.#instruments = {};
    this.#instrumentBuffers = {};
    for (const instrName of instruments) {
      // We want to start the fetching of the instrument samples right away,
      // without waiting for the audio context, which is created the first time
      // play() is called. But that might happen before or after all of the
      // samples are fetched. And the AudioBuffer objects have to be created
      // from the audio context. So what we do here is just save an array of
      // Promises that resolve to ArrayBuffers of the raw data; when
      // initializing the audio context, we then chain the AudioBuffer creation
      // onto those Promises.
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
    this.#audioContext = new AudioContext();
    // iOS starts the AudioContext in suspended mode (even if it's started by a
    // user action), so we have to resume here.
    await this.#audioContext.resume();
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
    if (this.#playing)
      return;
    this.#playing = true;
    await this.#init();
    this.#nextTickTime = this.#audioContext!.currentTime + extraLatency;
    this.#playNextTick();
  }

  pause() {
    if (!this.#playing)
      return;
    this.#playing = false;
    this.#audioContext?.suspend();
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = 0;
    }
  }

  dispose() {
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
    const nextTickInterval = 1000
      * (this.#nextTickTime - this.#audioContext!.currentTime - extraLatency);
    this.#timer = window.setTimeout(
      () => { this.#playNextTick(); },
      nextTickInterval,
    );
  }
}
