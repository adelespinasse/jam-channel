import React from 'react'
import { useParams } from 'react-router-dom';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from "firebase/firestore";

import { db } from './fb';

export default function ChannelPage() {
  const { channelId } = useParams();
  const [notes] = useCollection(collection(db, `channels/${channelId}/notes`));

  if (!notes) {
    return (
      <h2>Loading...</h2>
    );
  }

  return (
    <div>
      <h2>{ channelId }</h2>
      { notes.docs.map(doc => (<div>{ doc.id }</div>)) }
    </div>
  );
}
