import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import HomePage from './HomePage';
import ChannelPage from './ChannelPage';

const auth = getAuth();

// Main app component. This logs the user in and routes to different page
// components depending on the URL path.
export default function App() {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    // Using Firebase anonymous authentication. This way we can have security
    // rules that depend on the user's UID, but we (and the user) don't have to
    // deal with a login screen. The rules are: anyone can create a channel,
    // and technically anyone can read/write within a channel, but they have no
    // way of finding an existing channel unless someone shares the link with
    // them.
    if (!user && !loading && !error) {
      signInAnonymously(auth);
    }
  }, [error, loading, user]);

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
        <h2>Loading...</h2>
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
