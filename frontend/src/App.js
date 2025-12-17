import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on('receive_note_update', (data) => {
      setText(data.content);
    });
    return () => socket.off('receive_note_update');
  }, []);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    socket.emit('send_note_update', { content: newText });
  };

  const handleClear = () => {
    console.log("Button clicked, sending clear_note signal...");
    socket.emit('clear_note');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1>Real-Time Notes 📝</h1>
      <textarea 
        rows="15" 
        style={{ width: '80%', fontSize: '18px', padding: '15px', borderRadius: '10px' }}
        value={text} 
        onChange={handleChange} 
      />
      <br />
      <button 
        onClick={handleClear} 
        style={{ marginTop: '20px', padding: '15px 30px', cursor: 'pointer', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
      >
        CLEAR EVERYTHING
      </button>
    </div>
  );
}

export default App;