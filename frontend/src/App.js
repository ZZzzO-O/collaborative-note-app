import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [notes, setNotes] = useState([{ 
    id: 1, 
    title: 'My Thoughts', 
    content: '', 
    theme: 'forest',
    updatedAt: new Date().toLocaleString() 
  }]);
  const [activeNoteId, setActiveNoteId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const themes = {
    light: { bg: '#f8f9fa', text: '#212529', card: 'rgba(255, 255, 255, 0.9)', border: '#ddd', accent: '#4CAF50', font: "'Inter', sans-serif" },
    dark: { bg: '#121212', text: '#e0e0e0', card: 'rgba(30, 30, 30, 0.9)', border: '#333', accent: '#bb86fc', font: "'Inter', sans-serif" },
    forest: { bg: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920")', text: '#f1f8e9', card: 'rgba(20, 35, 25, 0.8)', border: '#4f772d', accent: '#689f38', font: "'Special Elite', cursive" },
    midnight: { bg: 'url("https://images.unsplash.com/photo-1592666452220-529326e2588e?fm=jpg&q=80&w=4000")', text: '#ffffff', card: 'rgba(10, 5, 20, 0.75)', border: '#a855f7', accent: '#a855f7', font: "'Orbitron', sans-serif" },
    sunset: { bg: 'url("https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?q=80&w=1920")', text: '#fff3e0', card: 'rgba(46, 26, 71, 0.7)', border: '#ff9800', accent: '#f57c00', font: "'Playfair Display', serif" }
  };

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];
  const current = themes[activeNote.theme || 'light'];

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Orbitron:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Special+Elite&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    socket.on('receive_note_update', (data) => {
      setNotes(prev => prev.map(n => n.id === data.id ? { ...n, content: data.content, updatedAt: new Date().toLocaleString() } : n));
    });
    return () => socket.off('receive_note_update');
  }, []);

  const handleTextChange = (e) => {
    const newContent = typeof e === 'string' ? e : e.target.value;
    const time = new Date().toLocaleString();
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content: newContent, updatedAt: time } : n));
    socket.emit('send_note_update', { id: activeNoteId, content: newContent });
  };

  const changeNoteTheme = (newTheme) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, theme: newTheme } : n));
  };

  const addNewNote = () => {
    const newId = Date.now();
    const newNote = { id: newId, title: 'New Entry', content: '', theme: 'light', updatedAt: new Date().toLocaleString() };
    setNotes([...notes, newNote]);
    setActiveNoteId(newId);
  };

  const renameNote = (id) => {
    const currentNote = notes.find(n => n.id === id);
    const newTitle = window.prompt("Rename this page:", currentNote.title);
    if (newTitle) setNotes(prev => prev.map(n => n.id === id ? { ...n, title: newTitle } : n));
  };

  const deleteWholePage = (id) => {
    if (notes.length > 1 && window.confirm("Delete this page completely?")) {
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      setActiveNoteId(filtered[0].id);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      backgroundImage: current.bg.startsWith('url') ? current.bg : 'none',
      backgroundColor: !current.bg.startsWith('url') ? current.bg : '#0a0a0a',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      color: current.text, minHeight: '100vh', display: 'flex', transition: 'all 1.2s ease'
    }}>
      
      {/* 📂 SIDEBAR */}
      <div style={{ width: '300px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(25px)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>The Note Book 📝</h3>
        
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: '15px', outline: 'none' }}
        />

        <button onClick={addNewNote} style={{ padding: '12px', marginBottom: '20px', cursor: 'pointer', borderRadius: '30px', border: 'none', backgroundColor: current.accent, color: 'white', fontWeight: 'bold' }}>+ New Page</button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredNotes.map(note => (
            <div key={note.id} onClick={() => setActiveNoteId(note.id)} style={{ padding: '15px', cursor: 'pointer', borderRadius: '15px', marginBottom: '10px', backgroundColor: activeNoteId === note.id ? 'rgba(255,255,255,0.15)' : 'transparent', border: activeNoteId === note.id ? `1px solid ${current.accent}` : '1px solid transparent' }}>
              <div style={{ color: 'white', fontWeight: activeNoteId === note.id ? 'bold' : 'normal' }}>{note.title}</div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <span onClick={(e) => { e.stopPropagation(); renameNote(note.id); }} style={{ fontSize: '12px', color: '#3498db' }}>✏️ Rename</span>
                <span onClick={(e) => { e.stopPropagation(); deleteWholePage(note.id); }} style={{ fontSize: '12px', color: '#ff4d4d' }}>🗑️ Delete Page</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✍️ MAIN AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <div style={{ width: '90%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', textShadow: '1px 1px 3px black' }}>Mood: {activeNote.theme}</span>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '25px' }}>
            {Object.keys(themes).map((t) => (
              <button key={t} onClick={() => changeNoteTheme(t)} style={{ padding: '6px 14px', cursor: 'pointer', borderRadius: '20px', border: activeNote.theme === t ? `2px solid white` : '1px solid transparent', backgroundColor: activeNote.theme === t ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', textTransform: 'capitalize', fontSize: '12px' }}>{t}</button>
            ))}
          </div>
        </div>

        <textarea rows="22" style={{ width: '100%', maxWidth: '800px', fontSize: '20px', padding: '40px', borderRadius: '24px', backgroundColor: current.card, color: current.text, border: `1px solid ${current.border}`, outline: 'none', resize: 'vertical', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', transition: 'all 0.5s ease', lineHeight: '1.7', fontFamily: current.font }}
          value={activeNote.content} onChange={handleTextChange} placeholder="Write something..."
        />
        
        <div style={{ marginTop: '15px', textAlign: 'center', opacity: 0.8, fontSize: '14px', fontStyle: 'italic' }}>
          Last edited: {activeNote.updatedAt}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
          <button onClick={() => {
            const element = document.createElement("a");
            element.href = URL.createObjectURL(new Blob([activeNote.content], {type: 'text/plain'}));
            element.download = `${activeNote.title}.txt`;
            element.click();
          }} style={{ padding: '12px 25px', backgroundColor: current.accent, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>📥 Save .txt</button>

          {/* 🧹 THE CLEAR TEXT BUTTON IS BACK! */}
          <button onClick={() => window.confirm("Clear all text on this page?") && handleTextChange('')} 
            style={{ padding: '12px 25px', backgroundColor: '#f70509ff', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>
            Clear Text
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;