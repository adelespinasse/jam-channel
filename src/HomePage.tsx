import React from 'react';
import { collection, addDoc, serverTimestamp  } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

import { db } from './fb';

const auth = getAuth();

export default function HomePage() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const newChannel = async () => {
    const docRef = await addDoc(collection(db, "channels"), {
      // These properties are required by the security rules.
      createdAt: serverTimestamp(),
      createdBy: user?.uid,
    });
    navigate(`/${docRef.id}`);
  };

  return (
    <div className="text-center">
      <h1 className="mt-20">JamChannel</h1>
      <h2 className="mt-5">Collaborative rhythm machine</h2>
      <button onClick={newChannel} className="mt-10">Create Channel</button>
    </div>
  );
}
