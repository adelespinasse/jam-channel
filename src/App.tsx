import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { getAuth, signInAnonymously,  } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import HomePage from './HomePage';
import ChannelPage from './ChannelPage';

const auth = getAuth();

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  console.log(user, loading, error);
  useEffect(() => {
    if (!user && !loading && !error) {
      signInAnonymously(auth);
    }
  });

  if (error) {
    return (
      <div className="text-center">
        <h2>Error logging in:</h2>
        { error.message }
      </div>
    );
  }
  if (loading || !user) {
    return (
      <div className="text-center">
        <h2>Logging In...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:channelId" element={<ChannelPage />} />
      </Routes>
    </BrowserRouter>
  );
}
