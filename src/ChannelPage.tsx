import React, { ChangeEvent, useEffect, useMemo, useRef } from 'react'
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

type NoteProps = {
  channelId: string,
  instrument: string,
  timeIndex: number,
  deleteNoteCallback: (instrument: string, timeIndex: number) => any,
};

function Note({
  channelId,
  instrument,
  timeIndex,
  deleteNoteCallback,
}: NoteProps) {

  return (
    <div
      id={`${instrument}-${timeIndex}`}
      className="note"
      onClick={() => { deleteNoteCallback(instrument, timeIndex); }}
    />
  );
}

type RestProps = {
  channelId: string,
  instrument: string,
  timeIndex: number,
  addNoteCallback: (instrument: string, timeIndex: number) => any,
};

function Rest({
  channelId,
  instrument,
  timeIndex,
  addNoteCallback,
}: RestProps) {
  return (
    <div
      id={`${instrument}-${timeIndex}`}
      className="rest"
      onClick={() => { addNoteCallback(instrument, timeIndex); }}
    />
  );
}

export default function ChannelPage() {
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
  const currentHeader = useRef<HTMLElement>();

  if (scoreError || channelError) {
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

  const settings: Required<ChannelSettings> = {
    ...defaultChannelSettings,
    ...channelDoc.settings,
  };
  const {
    beatsPerMinute,
    ticksPerBeat,
    beatsPerBar,
    numBars,
  } = settings;
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const ticksInScore = ticksPerBar * numBars;
  const tickDuration = 60 / beatsPerMinute / ticksPerBeat;

  const timeIdToIndex = (id: string) => {
    const bar = Number(id[0]);
    if (bar >= numBars)
      return -1;
    const beat = Number(id[1]);
    if (beat >= beatsPerBar)
      return -1;
    const tick = Number(id[2]);
    if (tick >= ticksPerBeat)
      return -1;
    return bar * ticksPerBar + beat * ticksPerBeat + tick;
  };

  const timeIndexToId = (index: number) => {
    const bar = Math.floor(index / ticksPerBar);
    const beat = Math.floor((index - bar * ticksPerBar) / ticksPerBeat);
    const tick = index % ticksPerBeat;
    return `${bar}${beat}${tick}`;
  };

  function refForTimeSlice(channelId: string, timeIndex: number) {
    return doc(db, `channels/${channelId}/score/${timeIndexToId(timeIndex)}`);
  }

  const deleteNote = (instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: deleteField() },
      { merge: true },
    );
  };

  const addNote = (instrument: string, timeIndex: number) => {
    setDoc(
      refForTimeSlice(channelId, timeIndex),
      { [instrument]: {} },
      { merge: true },
    );
  };

  const score: Array<TimeSlice | null> = new Array(ticksInScore);
  score.fill(null);
  for (const timeSlice of timeSlices.docs) {
    const index = timeIdToIndex(timeSlice.id);
    if (index >= 0)
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
        <Rest
          channelId={channelId}
          instrument={instrument}
          timeIndex={timeIndex}
          addNoteCallback={addNote}
        />
      );
    }
    return (
      <Note
        channelId={channelId}
        instrument={instrument}
        timeIndex={timeIndex}
        deleteNoteCallback={deleteNote}
      />
    );
  };

  const setSetting = (settingName: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setDoc(
      channelRef,
      {
        settings: { [settingName]: Number(event.target.value) },
      },
      { merge: true },
    );
  };

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

  const cellClass = (timeIndex: number) => {
    if (timeIndex % ticksPerBar === 0) {
      return 'cell bar';
    }
    if (timeIndex % ticksPerBeat === 0) {
      return 'cell beat';
    }
    return 'cell';
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
        <button onClick={() => player.play()} className="m-1">Play</button>
        <button onClick={() => player.pause()} className="m-1">Pause</button>
        { numericSetting('Beats per minute', 'beatsPerMinute') }
        { numericSetting('Ticks per beat', 'ticksPerBeat') }
        { numericSetting('Beats per bar', 'beatsPerBar') }
        { numericSetting('# Bars', 'numBars') }
      </h2>
      <table className="score">
        <tbody>
          <tr>
            <td />
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
                <td className={cellClass(timeIndex)} key={timeIndex}>
                  { noteOrRest(timeSlice, instrument, timeIndex) }
                </td>
              )) }
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="m-5">
        To collaborate, copy and share the URL.
      </h2>
    </div>
  );
}
