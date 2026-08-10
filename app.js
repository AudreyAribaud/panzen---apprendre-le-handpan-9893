// Audio Engine Setup
let audioCtx = null;
let analyser = null;
let metronomeInterval = null;
let isMetronomePlaying = false;
let bpm = 120;

// Song Database (D Kurd Scale: D3, A3, Bb3, C4, D4, E4, F4, G4, A4)
const songs = [
    {
        id: 'zen-sunrise',
        title: 'Zen Sunrise',
        difficulty: 'Facile',
        difficultyClass: 'easy',
        notes: ['D3', 'A3', 'C4', 'D4', 'A3', 'C4', 'D3'],
        tempo: 100
    },
    {
        id: 'desert-wind',
        title: 'Le Vent du Désert',
        difficulty: 'Facile',
        difficultyClass: 'easy',
        notes: ['D3', 'Bb3', 'A3', 'G4', 'F4', 'E4', 'D4', 'D3'],
        tempo: 110
    },
    {
        id: 'raindrops',
        title: 'Gouttes de Pluie',
        difficulty: 'Moyen',
        difficultyClass: 'medium',
        notes: ['A3', 'C4', 'E4', 'A4', 'G4', 'F4', 'E4', 'C4', 'D3'],
        tempo: 130
    },
    {
        id: 'mystic-journey',
        title: 'Voyage Mystique',
        difficulty: 'Moyen',
        difficultyClass: 'medium',
        notes: ['D3', 'A3', 'Bb3', 'D4', 'C4', 'F4', 'E4', 'D4', 'A3', 'D3'],
        tempo: 95
    },
    {
        id: 'ocean-breeze',
        title: 'Brise de l\'Océan',
        difficulty: 'Difficile',
        difficultyClass: 'hard',
        notes: ['D3', 'A3', 'D4', 'E4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4', 'D4', 'A3', 'Bb3', 'A3', 'D3'],
        tempo: 120
    }
];

// App State
let currentSong = null;
let currentNoteIndex = 0;
let isDemoPlaying = false;
let demoTimeout = null;

// Initialize Audio Context on first user interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(audioCtx.destination);
        startVisualizer();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Synthesize Handpan Sound
function playHandpanSound(frequency) {
    if (!audioCtx) initAudio();
    
    const now = audioCtx.currentTime;
    
    // Fundamental node
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    
    // Harmonic 1 (Octave)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    
    // Harmonic 2 (Compound 5th/3rd)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();

    // Metal resonance/noise tap
    const noise = audioCtx.createBufferSource();
    const noiseGain = audioCtx.createGain();

    // Configure Oscillators
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);

    // Create quick tap noise
    const bufferSize = audioCtx.sampleRate * 0.02; // 20ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Envelopes
    // Fundamental: quick attack, long decay
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.005);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    // Octave: slightly quieter, faster decay
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    // Harmonic: quiet, fast decay
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Noise tap envelope
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    noise.connect(noiseGain);

    gain1.connect(analyser);
    gain2.connect(analyser);
    gain3.connect(analyser);
    noiseGain.connect(analyser);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    noise.start(now);

    osc1.stop(now + 2);
    osc2.stop(now + 1.5);
    osc3.stop(now + 1);
    noise.stop(now + 0.1);
}

// Visualizer Canvas
function startVisualizer() {
    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            // Gold/Amber gradient for zen feel
            canvasCtx.fillStyle = `rgba(245, 158, 11, ${barHeight / 100})`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
    
    // Resize canvas to fit container
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();
}

// Render Song List
function renderSongs() {
    const songListContainer = document.getElementById('song-list');
    songListContainer.innerHTML = '';

    songs.forEach(song => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.dataset.id = song.id;
        songItem.innerHTML = `
            <div class="song-info">
                <span class="song-title">${song.title}</span>
                <span class="song-difficulty ${song.difficultyClass}">${song.difficulty} • ${song.notes.length} notes</span>
            </div>
            <i class="fa-solid fa-chevron-right song-play-icon"></i>
        `;
        songItem.addEventListener('click', () => selectSong(song));
        songListContainer.appendChild(songItem);
    });
}

// Select Song & Build Partition
function selectSong(song) {
    // Stop any active demo
    stopDemo();

    currentSong = song;
    currentNoteIndex = 0;
    bpm = song.tempo;
    document.getElementById('bpm-display').textContent = `${bpm} BPM`;

    // Update active class in list
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === song.id);
    });

    // Switch header mode button
    document.getElementById('btn-freeplay').classList.remove('active');

    // Build Partition Flow
    const flowContainer = document.getElementById('partition-flow');
    flowContainer.innerHTML = '';

    song.notes.forEach((note, index) => {
        const noteBadge = document.createElement('div');
        noteBadge.className = `partition-note ${index === 0 ? 'active' : ''}`;
        noteBadge.dataset.index = index;
        noteBadge.innerHTML = `<span>${note.replace('b', '♭')}</span>`;
        flowContainer.appendChild(noteBadge);

        if (index < song.notes.length - 1) {
            const connector = document.createElement('div');
            connector.className = 'partition-note-connector';
            connector.dataset.connectorIndex = index;
            flowContainer.appendChild(connector);
        }
    });

    // Highlight first note on virtual handpan
    highlightNextNoteOnHandpan();
}

// Highlight Next Note
function highlightNextNoteOnHandpan() {
    // Clear all highlights
    document.querySelectorAll('.handpan-note').forEach(note => {
        note.classList.remove('highlight');
    });

    if (currentSong && currentNoteIndex < currentSong.notes.length) {
        const nextNoteName = currentSong.notes[currentNoteIndex];
        const noteEl = document.querySelector(`.handpan-note[data-note="${nextNoteName}"]`);
        if (noteEl) {
            noteEl.classList.add('highlight');
        }
    }
}

// Advance Partition
function advancePartition(playedNote) {
    if (!currentSong) return;

    const expectedNote = currentSong.notes[currentNoteIndex];
    if (playedNote === expectedNote) {
        // Mark current as played
        const currentBadge = document.querySelector(`.partition-note[data-index="${currentNoteIndex}"]`);
        if (currentBadge) {
            currentBadge.classList.remove('active');
            currentBadge.classList.add('played');
        }

        // Color connector
        const connector = document.querySelector(`.partition-note-connector[data-connector-index="${currentNoteIndex}"]`);
        if (connector) {
            connector.classList.add('active');
        }

        currentNoteIndex++;

        // Check if song finished
        if (currentNoteIndex >= currentSong.notes.length) {
            setTimeout(() => {
                alert('Félicitations ! Vous avez terminé le morceau ! 🎉');
                resetSong();
            }, 300);
        } else {
            // Highlight next
            const nextBadge = document.querySelector(`.partition-note[data-index="${currentNoteIndex}"]`);
            if (nextBadge) {
                nextBadge.classList.add('active');
                // Scroll partition flow to keep active note visible
                nextBadge.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
            highlightNextNoteOnHandpan();
        }
    }
}

// Reset Song
function resetSong() {
    if (currentSong) {
        selectSong(currentSong);
    }
}

// Play Demo Automatically
function playDemo() {
    if (!currentSong || isDemoPlaying) return;
    isDemoPlaying = true;
    currentNoteIndex = 0;
    
    // Reset partition visual state
    document.querySelectorAll('.partition-note').forEach(badge => {
        badge.className = 'partition-note';
    });
    document.querySelectorAll('.partition-note-connector').forEach(conn => {
        conn.classList.remove('active');
    });

    const playNextDemoNote = () => {
        if (!isDemoPlaying || currentNoteIndex >= currentSong.notes.length) {
            stopDemo();
            return;
        }

        const noteName = currentSong.notes[currentNoteIndex];
        const noteEl = document.querySelector(`.handpan-note[data-note="${noteName}"]`);
        
        if (noteEl) {
            // Trigger visual play
            noteEl.classList.add('active-play');
            setTimeout(() => noteEl.classList.remove('active-play'), 200);
            
            // Play sound
            const freq = parseFloat(noteEl.dataset.frequency);
            playHandpanSound(freq);

            // Update partition visual
            const currentBadge = document.querySelector(`.partition-note[data-index="${currentNoteIndex}"]`);
            if (currentBadge) {
                currentBadge.classList.add('played');
            }
            const connector = document.querySelector(`.partition-note-connector[data-connector-index="${currentNoteIndex}"]`);
            if (connector) {
                connector.classList.add('active');
            }

            currentNoteIndex++;
            
            if (currentNoteIndex < currentSong.notes.length) {
                const nextBadge = document.querySelector(`.partition-note[data-index="${currentNoteIndex}"]`);
                if (nextBadge) {
                    nextBadge.classList.add('active');
                    nextBadge.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }

        const interval = (60 / bpm) * 1000;
        demoTimeout = setTimeout(playNextDemoNote, interval);
    };

    // Highlight first note immediately
    const firstBadge = document.querySelector(`.partition-note[data-index="0"]`);
    if (firstBadge) firstBadge.classList.add('active');
    
    playNextDemoNote();
}

function stopDemo() {
    isDemoPlaying = false;
    clearTimeout(demoTimeout);
    if (currentSong) {
        currentNoteIndex = 0;
        // Restore interactive learning state
        document.querySelectorAll('.partition-note').forEach((badge, idx) => {
            badge.className = `partition-note ${idx === 0 ? 'active' : ''}`;
        });
        document.querySelectorAll('.partition-note-connector').forEach(conn => {
            conn.classList.remove('active');
        });
        highlightNextNoteOnHandpan();
    }
}

// Metronome Logic
function toggleMetronome() {
    const btn = document.getElementById('btn-metronome');
    if (isMetronomePlaying) {
        clearInterval(metronomeInterval);
        isMetronomePlaying = false;
        btn.classList.remove('active');
    } else {
        initAudio();
        isMetronomePlaying = true;
        btn.classList.add('active');
        const interval = (60 / bpm) * 1000;
        metronomeInterval = setInterval(() => {
            playMetronomeClick();
        }, interval);
    }
}

function playMetronomeClick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch click
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
}

// Event Listeners
function setupEventListeners() {
    // Handpan Notes Click/Touch
    document.querySelectorAll('.handpan-note').forEach(noteEl => {
        const playNote = (e) => {
            e.preventDefault();
            initAudio();
            
            const note = noteEl.dataset.note;
            const frequency = parseFloat(noteEl.dataset.frequency);
            
            // Play sound
            playHandpanSound(frequency);
            
            // Visual feedback
            noteEl.classList.add('active-play');
            setTimeout(() => noteEl.classList.remove('active-play'), 150);

            // Advance learning mode if active
            if (currentSong && !isDemoPlaying) {
                advancePartition(note);
            }
        };

        noteEl.addEventListener('mousedown', playNote);
        noteEl.addEventListener('touchstart', playNote, { passive: false });
    });

    // Free Play Button
    document.getElementById('btn-freeplay').addEventListener('click', () => {
        stopDemo();
        currentSong = null;
        document.getElementById('btn-freeplay').classList.add('active');
        document.querySelectorAll('.song-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.handpan-note').forEach(note => note.classList.remove('highlight'));
        document.getElementById('partition-flow').innerHTML = '<p class="empty-msg">Sélectionnez un morceau pour afficher sa partition.</p>';
    });

    // Metronome Button
    document.getElementById('btn-metronome').addEventListener('click', toggleMetronome);

    // Demo Play Button
    document.getElementById('btn-play-demo').addEventListener('click', () => {
        if (isDemoPlaying) {
            stopDemo();
        } else {
            playDemo();
        }
    });

    // Reset Song Button
    document.getElementById('btn-reset-song').addEventListener('click', resetSong);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered successfully.'))
            .catch(err => console.log('Service Worker registration failed: ', err));
    });
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
    renderSongs();
    setupEventListeners();
});