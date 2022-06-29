import React, { ChangeEvent, useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, deleteField, doc, DocumentReference, setDoc } from "firebase/firestore";

import './App.css';
import { db } from './fb';
import { Player } from './player';
import {
  ChannelSettingName,
  ChannelSettings,
  defaultChannelSettings,
  TimeSlice,
} from './types';

const instrumentNames: { [name: string]: string } = {
  'A': 'Snap',
  'B': 'Cowbell',
  'C': 'Splash',
  'D': 'Hat',
  'E': 'High Tom',
  'F': 'Med Tom',
  'G': 'Low Tom',
  'H': 'Snare',
  'I': 'Soft Snare',
  'J': 'Kick',
};

const instruments: Array<string> = Object.keys(instrumentNames);

function idForTimeIndex(timeIndex: number) {
  return String(timeIndex).padStart(5, '00000');
}

function refForTimeSlice(channelId: string, timeIndex: number) {
  return doc(db, `channels/${channelId}/score/${idForTimeIndex(timeIndex)}`);
}

type NoteProps = {
  channelId: string,
  instrument: string,
  timeIndex: number,
};

function Note({ channelId, instrument, timeIndex }: NoteProps) {

  const deleteNote = () => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: deleteField() },
      { merge: true },
    );
  };

  return (
    <div
      id={`${instrument}-${timeIndex}`}
      className="note"
      onClick={deleteNote}
    />
  );
}

function Rest({ channelId, instrument, timeIndex }: NoteProps) {

  const addNote = () => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: {} },
      { merge: true },
    );
  };

  return (
    <div
      id={`${instrument}-${timeIndex}`}
      className="rest"
      onClick={addNote}
    />
  );
}

export default function ChannelPage() {
  const channelId: string = useParams().channelId!;
  const settingsRef = doc(db, `channels/${channelId}/misc/settings`) as DocumentReference<ChannelSettings>;
  const [channelSettings, settingsLoading, settingsError] = useDocumentData<Partial<ChannelSettings>>(
    settingsRef,
  );
  const [timeSlices, loading, error] = useCollection<TimeSlice>(collection(db, `channels/${channelId}/score`));
  const player = useMemo(() => (new Player(instruments)), []);
  useEffect(() => () => { player.dispose() }, [player]);
  const currentHeader = useRef<HTMLElement>();

  if (error || settingsError) {
    return (
      <div className="text-center">
        <h2>Channel not found</h2>
        <Link to="/">Home</Link>
      </div>
    );
  }
  if (loading || !timeSlices || settingsLoading) {
    return (
      <div className="text-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  const settings = { ...defaultChannelSettings, ...channelSettings };
  const {
    beatsPerMinute,
    ticksPerBeat,
    beatsPerBar,
    numBars,
  } = settings;
  const ticksInScore = ticksPerBeat * beatsPerBar * numBars;
  const tickDuration = 60 / beatsPerMinute / ticksPerBeat;
  const score: Array<TimeSlice | null> = new Array(ticksInScore);
  score.fill(null);
  for (const timeSlice of timeSlices.docs) {
    const index = Number(timeSlice.id);
    if (index < ticksInScore)
      score[index] = timeSlice.data();
  }
  player.score = score;
  player.tickDuration = tickDuration;

  player.timeCallback = (timeIndex: number, timeSlice: TimeSlice | null) => {
    if (currentHeader.current) {
      currentHeader.current.classList.remove('current');
    }
    const header = document.getElementById(`header-${timeIndex}`);
    if (header) {
      header.classList.add('current');
      currentHeader.current = header;
    }
    if (timeSlice) {
      for (const instrument in timeSlice) {
        const el = document.getElementById(`${instrument}-${timeIndex}`);
        if (el) {
          el.style.animationName = 'hit';
          setTimeout(
            () => { el.style.animationName = ''; },
            600,
          );
        }
      }
    }
  };

  const noteOrRest = (timeSlice: TimeSlice | null, instrument: string, timeIndex: number) => {
    const noteProps = timeSlice?.[instrument];
    if (!noteProps) {
      return (
        <Rest channelId={channelId} instrument={instrument} timeIndex={timeIndex} />
      );
    }
    return (
      <Note channelId={channelId} instrument={instrument} timeIndex={timeIndex} />
    );
  };

  const setSetting = (settingName: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setDoc(
      settingsRef,
      { [settingName]: Number(event.target.value) },
      { merge: true },
    );
  };

  const numericSetting = (
    label: string,
    property: ChannelSettingName,
    min: number,
    max: number,
  ) => {
    return (
      <span className="m-1 whitespace-nowrap">
        { label }:&nbsp;
        <input
          type="number"
          min={min}
          max={max}
          value={settings[property]}
          onChange={setSetting(property)}
          className="border border-slate-400"
        />
      </span>
    );
  };

  return (
    <div>
      <h2 className="m-2">
        <Link to="/" className="m-1">← Home</Link>
        <button onClick={() => player.play()} className="m-1">Play</button>
        <button onClick={() => player.pause()} className="m-1">Pause</button>
        { numericSetting('Beats per minute', 'beatsPerMinute', 40, 300) }
        { numericSetting('Ticks per beat', 'ticksPerBeat', 1, 6) }
        { numericSetting('Beats per bar', 'beatsPerBar', 1, 7) }
        { numericSetting('# Bars', 'numBars', 1, 8) }
      </h2>
      <table className="score">
        <tbody>
          <tr>
            { score.map((timeSlice, timeIndex) => (
              <th key={timeIndex} id={`header-${timeIndex}`} className="column-header">
                ▼
              </th>
            ))}
          </tr>
          { instruments.map((instrument) => (
            <tr key={instrument}>
              <td className="instrument">{ instrumentNames[instrument] }</td>
              { score.map((timeSlice, timeIndex) => (
                <td className="cell" key={timeIndex}>
                  { noteOrRest(timeSlice, instrument, timeIndex) }
                </td>
              )) }
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="m-5">
        To collaborate, copy and send the URL.
      </h2>
    </div>
  );
}
