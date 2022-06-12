import React from 'react'
import { useParams } from 'react-router-dom';

export default function ChannelPage() {
  const { channelId } = useParams();

  return (
    <div>{ channelId }</div>
  );
}
