from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
# The * allows your frontend to talk to this backend without being blocked
socketio = SocketIO(app, cors_allowed_origins="*")

def init_db():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, content TEXT)')
    c.execute('SELECT COUNT(*) FROM notes')
    if c.fetchone()[0] == 0:
        c.execute('INSERT INTO notes (content) VALUES ("")')
    conn.commit()
    conn.close()

init_db()

@socketio.on('connect')
def handle_connect():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('SELECT content FROM notes WHERE id = 1')
    content = c.fetchone()[0]
    conn.close()
    emit('receive_note_update', {'content': content})
    print('✅ User connected and synced')

@socketio.on('send_note_update')
def handle_message(data):
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('UPDATE notes SET content = ? WHERE id = 1', (data['content'],))
    conn.commit()
    conn.close()
    emit('receive_note_update', data, broadcast=True)

@socketio.on('clear_note')
def handle_clear():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('UPDATE notes SET content = "" WHERE id = 1')
    conn.commit()
    conn.close()
    # This sends the "empty" signal to everyone
    emit('receive_note_update', {'content': ""}, broadcast=True)
    print('🔥 NOTE WAS CLEARED!')

if __name__ == '__main__':
    # This runs the server on port 5000
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)