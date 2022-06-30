import { Timestamp } from 'firebase/firestore';

export type NoteProperties = {};

export type TimeSlice = { [instrument: string]: NoteProperties };

export type ChannelSettings = {
  beatsPerMinute?: number,
  ticksPerBeat?: number,
  beatsPerBar?: number,
  numBars?: number,
};

export type ChannelSettingName = keyof ChannelSettings;

export const defaultChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 100,
  ticksPerBeat: 4,
  beatsPerBar: 4,
  numBars: 2,
};

export const minChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 20,
  ticksPerBeat: 1,
  beatsPerBar: 1,
  numBars: 1,
}

export const maxChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 300,
  ticksPerBeat: 8,
  beatsPerBar: 8,
  numBars: 8,
};

export type ChannelDoc = {
  createdAt: Timestamp,
  createdBy: string,
  name?: string,
  settings?: ChannelSettings,
}
