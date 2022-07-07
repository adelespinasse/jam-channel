import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
  const player = useMemo(() => (new Player(instruments)), []);
  useEffect(() => () => { player.dispose() }, [player]);

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

  const timeIndexToId = useCallback((index: number) => {
    const bar = Math.floor(index / ticksPerBar);
    const beat = Math.floor((index - bar * ticksPerBar) / ticksPerBeat);
    const tick = index % ticksPerBeat;
    return `${bar}${beat}${tick}`;
  }, [ticksPerBar, ticksPerBeat]);

  const refForTimeSlice = useCallback((channelId: string, timeIndex: number) => {
    return doc(db, `channels/${channelId}/score/${timeIndexToId(timeIndex)}`);
  }, [timeIndexToId]);

  const deleteNote = useCallback((instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: deleteField() },
      { merge: true },
    );
  }, [channelId, refForTimeSlice]);

  const addNote = useCallback((instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: {} },
      { merge: true },
    );
  }, [channelId, refForTimeSlice]);

  const setSetting = (settingName: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setDoc(
      channelRef,
      {
        settings: { [settingName]: Number(event.target.value) },
      },
      { merge: true },
    );
  };

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

  const numericSetting = (
    label: string,
    property: ChannelSettingName,
  ) => {
    return (
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
  };

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
  }

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
