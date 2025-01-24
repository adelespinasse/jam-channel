Try this app online [here](https://jam-channel.firebaseapp.com/).

# JamChannel

A web app that demonstrates some techniques for React/Firestore apps. The
version in this Git branch uses "Firestore IS the model": no attempt is made to
wrap the documents fetched from Firestore in a data abstraction, and changes
are made by directly modifying Firestore in the functions that handle user
input.

The app is a collaborative drum machine. A user can create a "channel" which
contains a piano-roll-style drum score. The score can be edited while it's
playing, and most importantly, it can be edited in real time by more than one
person in different locations, with their changes showing up immediately for
all other users.

A score consists of a number of measures, each of which consists of a number of
beats, each of which consists of a number of ticks. The ticks define the
maximum "resolution" of the score; that is, every note happens on a particular
tick. For example, to represent measures of 4/4 time with each beat divided
into sixteenth notes, you would set both ticksPerBeat and beatsPerBar to 4. For
a 12/8 feel, you could set ticksPerBeat to 3 (or 6 if you want to be able to
use sixteenth notes, etc.)

There are 10 predefined instruments, each consisting of a single sound sample
(taken from the public domain [Sample Pi sample
pack](https://www.reddit.com/r/WeAreTheMusicMakers/comments/mxopbn/a_good_resource_for_beginners_sample_pi_a/)).
In the current, simple version of the app, the samples are just played "as is",
with no variation in pitch or volume. Each instrument is either played on a
given tick, or not.

## Source organization

All TypeScript source code is in the `src/` directory. The main entry point is
`index.tsx`, which renders the base `App.tsx` component. This renders the
component in `HomePage.tsx` if the URL path is `/`, or the component in
`ChannelPage.tsx` if the path contains a single segment, which is taken as the
channel ID.

Important data types used throughout the app are defined in `types.h`.

`player.ts` defines a class that generates the sounds, using the Web Audio API.

`App.tsx` uses [Firebase anonymous
authentication](https://firebase.google.com/docs/auth/web/anonymous-auth#web-version-9)
to identify users without requiring them to log in (which saves some trouble,
both for the implementation and for the users). The drawback is that a user is
always identified as a different "user" on different devices, so they won't
have access to the same channels; we may give an option to log in eventually.

## Firestore data representation

All data for a channel is stored in Firestore. The main document defining a
channel is stored at path `channels/{channelId}`, and note data is stored in
the `score` subcollection under that. See [src/types.ts](src/types.ts) for
formal definitions of the object types stored there.

The representation of notes in the score was chosen very carefully. Each
document in the `score` subcollection represents a "time slice", aka a moment
in the score, and contains a property for each note that plays at that time
(see type TimeSlice in [src/types.ts](src/types.ts)). The name of each of those
properties represents the instrument that plays it.

Here's the clever part: The ID of the document consists of 3 digits
representing its time within the score. The first digit is the measure number
(starting from 0), the second is the beat number within the measure (starting
from 0), and the third is the tick number within the beat (starting from 0). If
any of those digits is higher than the maximum "allowed" value (for example, if
the measure number is greater than or equal to the total number of measures),
then that time slice is simply ignored by the app, as if the document did not
exist.

This arrangment provides some nice properties:
* For any given point in time, there can only be one TimeSlice document,
  because the document's ID corresponds to its time. If two users
  simultaneously create a note at a point where there were no notes yet, they
  can't accidentally create two separate documents.
* Similarly, since the name of each property within the TimeSlice corresponds
  to the instrument, there can't be more than one note played by the same
  instrument at the same time. If two users simultaneously create the same
  note, one simply overwrites the other. (Notes are created and deleted using
  Firestore `setDoc` operations with `{ merge: true }`, so operations on
  different notes within the same slice don't interfere with each other.)
* If there are notes in the second measure, and then you reduce the length of
  the score to one measure, the notes in the second measure are "gone" in that
  they are not played or shown in the UI. There is no need to delete all the
  data representing those notes. Even better, if you then increase the number
  of measures again, the notes reappear.
* Similarly, if you decrease the number of beats per measure or the number of
  ticks per beat, some notes "disappear", although they are still there in
  Firestore and can appear again if you change the score settings again.
* Overall, there is no configuration of data within Firestore that is
  "invalid"; there can be data that is not used, but it does no harm.

Note that since a single digit is used for each of (measure, beat, tick), none
of these can be higher than 9. But we have lower limits than this anyway (as
defined in types.ts).

# Dependencies

This project was bootstrapped with [Create React
App](https://github.com/facebook/create-react-app). It uses TypeScript, React
18, the Firebase web client library version 9, React Firebase Hooks, React
Router, TailwindCSS, and Lodash.
