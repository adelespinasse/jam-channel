import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { collection, orderBy, query, Query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';

import { ChannelDoc } from './types';
import { db } from './fb';

type ChannelListProps = {
  user: User,
};

export default function ChannelList({
  user,
}: ChannelListProps) {
  const [docs, docsLoading, docsError] = useCollection(
    query(
      collection(db, 'channels'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc'),
    ) as Query<ChannelDoc>,
  );

  if (docsError) {
    console.log(docsError);
    return (<h2>Error loading channels</h2>);
  }
  if (docsLoading || !docs) {
    return null;
  }

  if (docs.empty) {
    return (
      <h3 className="m-10">You haven&apos;t created any channels yet.</h3>
    )
  }

  return (
    <div className="m-10">
      <h2>Your channels:</h2>
      <table className="inline-block text-left border border-black">
        <tbody>
          <tr>
            <th className="p-1">name</th>
            <th className="p-1">Created</th>
          </tr>
          { docs.docs.map((doc) => (
            <tr key={doc.id}>
              <td className="p-1">
                <Link to={`/${doc.id}`}>
                  { doc.data().name || 'unnamed' }
                </Link>
              </td>
              <td className="p-1">
                <Link to={`/${doc.id}`}>
                  { doc.data().createdAt?.toDate()?.toLocaleString() }
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
