import React, { useEffect, useState } from 'react';
import * as shared from 'autoplus-shared';

export default function TestShared() {
  const [exports, setExports] = useState([]);
  
  useEffect(() => {
    console.log('Available exports from shared:', Object.keys(shared));
    setExports(Object.keys(shared));
  }, []);
  
  return (
    <div>
      <h2>Shared Package Exports</h2>
      <ul>
        {exports.map(exp => (
          <li key={exp}>{exp}: {typeof shared[exp]}</li>
        ))}
      </ul>
    </div>
  );
} 