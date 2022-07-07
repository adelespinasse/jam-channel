// Fundamental types used throughout the app. See the README.md for more
// explanation.

import { Timestamp } from 'firebase/firestore';

// Properties that a note might have. Currently there aren't any, but it could
// someday include velocity/volume and other expressive parameters.
export type NoteProperties = {};

// Represents the notes to be played at a particular time. There is a property
// for each note to be played. The key is an instrument ID (a capital letter
// A-J, see instruments.ts) and the value contains properties of that note.
export type TimeSlice = { [instrument: string]: NoteProperties };

// Basic numeric settings for a score. A channel's score consists of some
// number of measures, which are divided into some number of beats, which are
// divided into ticks.
//
// When adding a new property to this, make sure it's optional so that the
// values stored in Firestore don't all need to be updated.
export type ChannelSettings = {
  beatsPerMinute?: number,
  ticksPerBeat?: number,
  beatsPerBar?: number,
  numBars?: number,
};

// Can be the name of any property in ChannelSettings above.
export type ChannelSettingName = keyof ChannelSettings;

// Defaults to be used when a property is missing in a ChannelSettings object.
export const defaultChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 100,
  ticksPerBeat: 4,
  beatsPerBar: 4,
  numBars: 2,
};

// The minimum values for each property of ChannelSettings.
export const minChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 20,
  ticksPerBeat: 1,
  beatsPerBar: 1,
  numBars: 1,
}

// The maximum values for each property of ChannelSettings.
export const maxChannelSettings: Required<ChannelSettings> = {
  beatsPerMinute: 300,
  ticksPerBeat: 8,
  beatsPerBar: 8,
  numBars: 8,
};

// The format of the document stored at `channels/${channelId}`. If adding a
// new property, make it optional so that all the documents in Firestore don't
// need to be updated.
export type ChannelDoc = {
  createdAt: Timestamp,
  createdBy: string, // The user's UID
  name?: string,
  settings?: ChannelSettings,
}
