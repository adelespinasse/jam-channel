import React, { useState } from 'react';
import { collection, addDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

import { db } from './fb';
import { defaultChannelSettings, maxChannelSettings } from './types';
import ChannelList from './ChannelList';

const auth = getAuth();

export default function HomePage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const newChannel = async () => {
     setCreating(true);
    try {
      const docRef = await addDoc(
        collection(db, 'channels'),
        {
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
          name: 'Rename Me',
          settings: defaultChannelSettings,
        },
      );
      const batch = writeBatch(db);
      for (let bar = 0; bar < maxChannelSettings.numBars; bar++) {
        for (let beat = 0; beat < maxChannelSettings.beatsPerBar; beat++) {
          const timeId = `${bar}${beat}${0}`;
          batch.set(
            doc(db, `channels/${docRef.id}/score/${timeId}`),
            { J: {} },
          );
        }
      }
      await batch.commit();
      navigate(`/${docRef.id}`);
    } catch (error) {
      console.log(error);
      window.alert('Something went wrong.');
    } finally {
      setCreating(false);
    }
  };

  if (!user)
    return null;

  if (creating) {
    return (
      <div className="text-center">
        <h2>Creating new channel...</h2>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="mt-20">JamChannel</h1>
      <h2 className="mt-5">Collaborative rhythm machine</h2>
      <button onClick={newChannel} className="mt-10">Create Channel</button>
      <ChannelList user={user} />
    </div>
  );
}
