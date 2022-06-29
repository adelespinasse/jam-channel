export type NoteProperties = {};

export type TimeSlice = { [instrument: string]: NoteProperties };

export type ChannelSettings = {
  beatsPerMinute: number,
  ticksPerBeat: number,
  beatsPerMeasure: number,
  numMeasures: number,
};

export const defaultChannelSettings: ChannelSettings = {
  beatsPerMinute: 100,
  ticksPerBeat: 4,
  beatsPerMeasure: 4,
  numMeasures: 2,
};
