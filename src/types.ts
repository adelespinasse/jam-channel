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

export const minChannelSettings: ChannelSettings = {
  beatsPerMinute: 20,
  ticksPerBeat: 1,
  beatsPerBar: 1,
  numBars: 1,
}

export const maxChannelSettings: ChannelSettings = {
  beatsPerMinute: 300,
  ticksPerBeat: 8,
  beatsPerBar: 8,
  numBars: 8,
};
