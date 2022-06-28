import React, { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, deleteField, doc, setDoc } from "firebase/firestore";

import './App.css';
import { db } from './fb';
import { Player } from './player';

type NoteProperties = {};
type TimeSlice = { [instrument: string]: NoteProperties };

const instruments: Array<string> = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
];

const clicksInScore = 32;

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
  const [timeSlices, loading, error] = useCollection<TimeSlice>(collection(db, `channels/${channelId}/score`));
  const player = useMemo(() => (new Player(instruments)), []);
  useEffect(() => () => { player.dispose() }, [player]);

  if (error) {
    return (
      <div className="text-center">
        <h2>Channel not found</h2>
        <Link to="/">Home</Link>
      </div>
    );
  }
  if (loading || !timeSlices) {
    return (
      <div className="text-center">
        <h2>Loading...</h2>
      </div>
    );
  }

  const score: Array<TimeSlice | null> = new Array(clicksInScore);
  score.fill(null);
  for (const timeSlice of timeSlices.docs) {
    const index = Number(timeSlice.id);
    if (index < clicksInScore)
      score[index] = timeSlice.data();
  }
  player.score = score;

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

  return (
    <div>
      <h2>
        <Link to="/">Home</Link>
        <button onClick={() => player.play()}>Play</button>
        <button onClick={() => player.pause()}>Pause</button>
      </h2>
      <table className="score">
        <tbody>
          { instruments.map((instrument) => (
            <tr key={instrument}>
              { score.map((timeSlice, timeIndex) => (
                <td className="cell" key={timeIndex}>
                  { noteOrRest(timeSlice, instrument, timeIndex) }
                </td>
              )) }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
