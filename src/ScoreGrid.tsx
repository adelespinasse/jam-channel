import React, { useRef } from 'react';
import { QuerySnapshot } from 'firebase/firestore';

import { TimeSlice } from './types';
import { Player } from './player';
import { instruments, instrumentNames } from './instruments';

type NoteProps = {
  instrument: string,
  timeIndex: number,
  deleteNoteCallback: (instrument: string, timeIndex: number) => void,
};

function Note({
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
  instrument: string,
  timeIndex: number,
  addNoteCallback: (instrument: string, timeIndex: number) => void,
};

function Rest({
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

type ScoreGridProps = {
  timeSlices: QuerySnapshot<TimeSlice>,
  ticksPerBeat: number,
  beatsPerBar: number,
  numBars: number,
  deleteNote: (instrument: string, timeIndex: number) => void,
  addNote: (instrument: string, timeIndex: number) => void,
  player: Player,
};

export function ScoreGrid({
  timeSlices,
  ticksPerBeat,
  beatsPerBar,
  numBars,
  deleteNote,
  addNote,
  player,
}: ScoreGridProps) {
  const currentHeader = useRef<HTMLElement>();

  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const ticksInScore = ticksPerBar * numBars;

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

  const score: Array<TimeSlice | null> = new Array(ticksInScore);
  score.fill(null);
  for (const timeSlice of timeSlices.docs) {
    const index = timeIdToIndex(timeSlice.id);
    if (index >= 0)
      score[index] = timeSlice.data();
  }
  player.score = score;

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
          instrument={instrument}
          timeIndex={timeIndex}
          addNoteCallback={addNote}
        />
      );
    }
    return (
      <Note
        instrument={instrument}
        timeIndex={timeIndex}
        deleteNoteCallback={deleteNote}
      />
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
  };

  return (
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
  );
}

export default React.memo(ScoreGrid);
