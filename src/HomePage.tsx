import React from 'react';

export default function HomePage() {
  const newChannel = () => {

  };

  return (
    <div className="text-center">
      <h1 className="mt-20">JamChannel</h1>
      <h2 className="mt-5">Collaborative rhythm machine</h2>
      <button onClick={newChannel} className="mt-10">Create Channel</button>
    </div>
  );
}
