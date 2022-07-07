import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, deleteField, doc, DocumentReference, setDoc } from 'firebase/firestore';

import './App.css';
import { db } from './fb';
import { Player } from './player';
import {
  ChannelDoc,
  ChannelSettingName,
  ChannelSettings,
  defaultChannelSettings,
  maxChannelSettings,
  minChannelSettings,
  TimeSlice,
} from './types';
import ScoreGrid from './ScoreGrid';
import { instruments } from './instruments';

// Component that renders the page for a particular "channel" (basically a
// piano-roll-style drum score with controls for play/pause, tempo, etc.)
export default function ChannelPage() {
  const [playing, setPlaying] = useState(false);
  const channelId: string = useParams().channelId!;
  const channelRef = doc(db, `channels/${channelId}`) as DocumentReference<ChannelDoc>;
  const [channelDoc, channelLoading, channelError] = useDocumentData<ChannelDoc>(
    channelRef,
  );
  const [timeSlices, scoreLoading, scoreError] = useCollection<TimeSlice>(
    collection(db, `channels/${channelId}/score`),
  );
  // Memoize the player object so it's only ever created once.
  const player = useMemo(() => (new Player(instruments)), []);
  // Shut down the player (and hence the Web Audio API) cleanly when this
  // component unmounts.
  useEffect(
    () => () => { player.dispose(); },
    [player],
  );

  const settings: Required<ChannelSettings> = {
    ...defaultChannelSettings,
    ...channelDoc?.settings,
  };
  const {
    beatsPerMinute,
    ticksPerBeat,
    beatsPerBar,
    numBars,
  } = settings;
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const tickDuration = 60 / beatsPerMinute / ticksPerBeat;
  player.tickDuration = tickDuration;

  // Several functions below use React.useCallback because the ScoreGrid
  // component rerenders only when its props change. Its props include the
  // deleteNote and addNote functions, so we need to make sure those don't
  // change every time this component renders.

  // Given a numeric time index (the absolute index of a tick within the
  // playable ticks of the entire score), this returns the string-valued "tick
  // ID" consisting of three digits, one each for the measure, beat, and
  // (within the beat) tick number, each indexed from zero. See README.md for
  // more explanation.
  const timeIndexToId = useCallback((timeIndex: number) => {
    const bar = Math.floor(timeIndex / ticksPerBar);
    const beat = Math.floor((timeIndex - bar * ticksPerBar) / ticksPerBeat);
    const tick = timeIndex % ticksPerBeat;
    return `${bar}${beat}${tick}`;
  }, [ticksPerBar, ticksPerBeat]);

  // Returns the Firestore reference for the TimeSlice document representing a
  // given time index.
  const refForTimeSlice = useCallback((timeIndex: number) => (
    doc(db, `channels/${channelId}/score/${timeIndexToId(timeIndex)}`)
  ), [channelId, timeIndexToId]);

  const deleteNote = useCallback((instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(timeIndex),
      { [instrument]: deleteField() },
      { merge: true },
    );
  }, [refForTimeSlice]);

  const addNote = useCallback((instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(timeIndex),
      { [instrument]: {} },
      { merge: true },
    );
  }, [refForTimeSlice]);

  if (scoreError || channelError) {
    console.log(scoreError || channelError);
    return (
      <div className="text-center">
        <h2>Channel not found</h2>
        <Link to="/">Home</Link>
      </div>
    );
  }
  if (scoreLoading || !timeSlices || channelLoading || !channelDoc) {
    return (
      <div className="text-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Returns an input event handler that updates a particular numeric setting
  // in the channel settings.
  const setSetting = (settingName: ChannelSettingName) => (
    (event: ChangeEvent<HTMLInputElement>) => {
      setDoc(
        channelRef,
        {
          settings: { [settingName]: Number(event.target.value) },
        },
        { merge: true },
      );
    }
  );

  // Creates an HTML control that lets the user update a particular numeric
  // setting for the channel.
  const numericSetting = (
    label: string,
    property: ChannelSettingName,
  ) => (
    <span className="m-1 whitespace-nowrap">
      { label }:&nbsp;
      <input
        type="number"
        min={minChannelSettings[property]}
        max={maxChannelSettings[property]}
        value={settings[property]}
        onChange={setSetting(property)}
        className="border border-slate-400 w-14"
      />
    </span>
  );

  const changeName = (event: ChangeEvent<HTMLInputElement>) => {
    setDoc(
      channelRef,
      { name: event.target.value },
      { merge: true },
    );
  };

  const togglePlaying = () => {
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };

  return (
    <div>
      <h2 className="m-2">
        <Link to="/" className="m-1">← Home</Link>
        Channel name:
        <input
          type="text"
          value={channelDoc.name || ''}
          placeholder="Enter name"
          onChange={changeName}
          className="border border-slate-400 m-1"
        />
      </h2>
      <h2 className="m-2">
        <button onClick={togglePlaying} className="m-1">
          { playing ? '⏸️ Pause' : '▶️ Play' }
        </button>
        { numericSetting('Beats per minute', 'beatsPerMinute') }
        { numericSetting('Ticks per beat', 'ticksPerBeat') }
        { numericSetting('Beats per bar', 'beatsPerBar') }
        { numericSetting('# Bars', 'numBars') }
      </h2>
      <ScoreGrid
        timeSlices={timeSlices}
        ticksPerBeat={ticksPerBeat}
        beatsPerBar={beatsPerBar}
        numBars={numBars}
        deleteNote={deleteNote}
        addNote={addNote}
        player={player}
      />
      <h2 className="m-5">
        To collaborate, copy and share the URL.
      </h2>
    </div>
  );
}
