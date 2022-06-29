export type NoteProperties = {};

export type TimeSlice = { [instrument: string]: NoteProperties };

export type ChannelSettings = {
  beatsPerMinute: number,
  ticksPerBeat: number,
  beatsPerBar: number,
  numBars: number,
};

export type ChannelSettingName = keyof ChannelSettings;

export const defaultChannelSettings: ChannelSettings = {
  beatsPerMinute: 100,
  ticksPerBeat: 4,
  beatsPerBar: 4,
  numBars: 2,
};
