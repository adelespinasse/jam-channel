// This defines the 10 instruments. The keys (A-J) are used throughout the app
// as IDs for instruments/samples. The samples themselves are named A.flac
// through J.flac.
export const instrumentNames: { [name: string]: string } = {
  A: 'Snap',
  B: 'Cowbell',
  C: 'Splash',
  D: 'Hat',
  E: 'High Tom',
  F: 'Med Tom',
  G: 'Low Tom',
  H: 'Snare',
  I: 'Soft Snare',
  J: 'Kick',
};

// Instrument IDs in an array for convenience.
export const instruments: Array<string> = Object.keys(instrumentNames);
