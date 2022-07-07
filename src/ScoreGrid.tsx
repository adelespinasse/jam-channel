import React, { useRef } from 'react';
import { QuerySnapshot } from 'firebase/firestore';

import { TimeSlice } from './types';
import { Player } from './player';
import { instruments, instrumentNames } from './instruments';

// Note component: a cell in the grid where a note occurs.

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

// Rest component: a cell in the grid where no note occurs.

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

// ScoreGrid: Component that renders the "piano roll" style score. It consists
// of an HTML table, with a column for each time slice and a row for each
// instrument (also a header row, where a cursor for the "current time" is
// shown, and a column of instrument names at the left). Cells have special IDs
// that allow us to find and animate the cells' contents without having to do
// any React rendering.

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
  const currentHeader = useRef<HTMLElement>(); // The header cell of the current time slice

  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const ticksInScore = ticksPerBar * numBars;

  // Given a 3-digit "time slice ID" string, this returns the absolute index of
  // the time slice within the visible score, i.e. the number of ticks from the
  // beginning of the score to this tick. If any of (bar, beat, tick) is
  // outside the range specified by the score settings, this returns -1.
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

  // Create an array of time slices representing the visible/playable score. An
  // empty TimeSlice and a null value have the same effect.
  const score: Array<TimeSlice | null> = new Array(ticksInScore);
  score.fill(null);
  for (const timeSlice of timeSlices.docs) {
    const index = timeIdToIndex(timeSlice.id);
    if (index >= 0)
      score[index] = timeSlice.data();
  }
  player.score = score;

  // This callback is called by the Player each time the playback cursor moves
  // to a new index. Rather than re-rendering the grid, it finds the relevant
  // cell elements in the DOM and directly modifies them. This makes the
  // animation much more efficient. (It's also a somewhat unprincipled design,
  // making use of effectively global-scope data; one symptom of this is that
  // it won't work to have more than one ScoreGrid rendered on the same page.)
  player.timeCallback = (timeIndex: number, timeSlice: TimeSlice | null) => {
    // Move the "current time" cursor
    if (currentHeader.current) {
      currentHeader.current.classList.remove('current');
    }
    const header = document.getElementById(`header-${timeIndex}`);
    if (header) {
      header.classList.add('current');
      currentHeader.current = header;
    }
    if (timeSlice) {
      // Trigger an animation for each note in the current time slice
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

  // Renders a Note or Rest component, as appropriate, for a given cell.
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

  // Determines how heavy the vertical line should be at a given time index.
  // Bar lines are heaviest, beat lines are medium, and tick lines between
  // beats are lightest.
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
