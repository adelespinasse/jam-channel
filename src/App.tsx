import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import HomePage from './HomePage';
import ChannelPage from './ChannelPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:channelId" element={<ChannelPage />} />
      </Routes>
    </BrowserRouter>
  );
}
