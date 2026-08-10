// Web Audio Context Setup
let audioCtx = null;
let mainGainNode = null;

// Scales Database
const SCALES = {
    kurd: {
        name: "D Mineur Kurd",
        notes: [
            { note: "D3", freq: 146.83, label: "Ding D3" },
            { note: "A3", freq: 220.00, label: "A3" },
            { note: "Bb3", freq: 233.08, label: "Bb3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "D4", freq: 293.66, label: "D4" },
            { note: "E4", freq: 329.63, label: "E4" },
            { note: "F4", freq: 349.23, label: "F4" },
            { note: "G4", freq: 392.00, label: "G4" },
            { note: "A4", freq: 440.00, label: "A4" },
            { note: "C5", freq: 523.25, label: "C5" },
            { note: "D5", freq: 587.33, label: "D5" },
            { note: "E5", freq: 659.25, label: "E5" }
        ]
    },
    celtic: {
        name: "Amara / Celtic Minor",
        notes: [
            { note: "D3", freq: 146.83, label: "Ding D3" },
            { note: "A3", freq: 220.00, label: "A3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "D4", freq: 293.66, label: "D4" },
            { note: "E4", freq: 329.63, label: "E4" },
            { note: "F4", freq: 349.23, label: "F4" },
            { note: "G4", freq: 392.00, label: "G4" },
            { note: "A4", freq: 440.00, label: "A4" },
            { note: "C5", freq: 523.25, label: "C5" },
            { note: "D5", freq: 587.33, label: "D5" },
            { note: "E5", freq: 659.25, label: "E5" }
        ]
    },
    pygmy: {
        name: "F Pygmy",
        notes: [
            { note: "F3", freq: 174.61, label: "Ding F3" },
            { note: "G3", freq: 196.00, label: "G3" },
            { note: "Ab3", freq: 207.65, label: "Ab3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "Eb4", freq: 311.13, label: "Eb4" },
            { note: "F4", freq: 349.23, label: "F4" },
            { note: "G4", freq: 392.00, label: "G4" },
            { note: "Ab4", freq: 415.30, label: "Ab4" },
            { note: "C5", freq: 523.25, label: "C5" },
            { note: "Eb5", freq: 622.25, label: "Eb5" },
            { note: "F5", freq: 698.46, label: "F5" }
        ]
    },
    hijaz: {
        name: "G Hijaz",
        notes: [
            { note: "G3", freq: 196.00, label: "Ding G3" },
            { note: "Ab3", freq: 207.65, label: "Ab3" },
            { note: "B3", freq: 246.94, label: "B3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "D4", freq: 293.66, label: "D4" },
            { note: "Eb4", freq: 311.13, label: "Eb4" },
            { note: "F4", freq: 349.23, label: "F4" },
            { note: "G4", freq: 392.00, label: "G4" },
            { note: "Ab4", freq: 415.30, label: "Ab4" },
            { note: "B4", freq: 493.88, label: "B4" },
            { note: "C5", freq: 523.25, label: "C5" }
        ]
    },
    integral: {
        name: "D Integral",
        notes: [
            { note: "D3", freq: 146.83, label: "Ding D3" },
            { note: "A3", freq: 220.00, label: "A3" },
            { note: "Bb3", freq: 233.08, label: "Bb3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "D4", freq: 293.66, label: "D4" },
            { note: "E4", freq: 329.63, label: "E4" },
            { note: "F4", freq: 349.23, label: "F4" },
            { note: "A4", freq: 440.00, label: "A4" },
            { note: "Bb4", freq: 466.16, label: "Bb4" },
            { note: "C5", freq: 523.25, label: "C5" },
            { note: "D5", freq: 587.33, label: "D5" }
        ]
    },
    equinox: {
        name: "E Equinox",
        notes: [
            { note: "E3", freq: 164.81, label: "Ding E3" },
            { note: "G3", freq: 196.00, label: "G3" },
            { note: "B3", freq: 246.94, label: "B3" },
            { note: "C4", freq: 261.63, label: "C4" },
            { note: "D4", freq: 293.66, label: "D4" },
            { note: "E4", freq: 329.63, label: "E4" },
            { note: "F#4", freq: 369.99, label: "F#4" },
            { note: "G4", freq: 392.00, label: "G4" },
            { note: "B4", freq: 493.88, label: "B4" },
            { note: "C5", freq: 523.25, label: "C5" },
            { note: "D5", freq: 587.33, label: "D5" }
        ]
    }
};

// App State
let currentScaleKey = "kurd";
let currentNotesCount = 9;
let activeNotes = [];
let isRecording = false;
let recordedSequence = [];
let recordStartTime = 0;
let isPlayingRecord = false;
let metronomeInterval = null;
let isMetronomePlaying = false;
let currentTempo = 100;

// Lesson State
let currentLessonSequence = [];
let lessonUserStep = 0;
let isPlayingLesson = false;

const LESSONS = {
    "zen-breath": [0, 1, 2, 3, 2, 1],
    "celtic-wind": [0, 2, 4, 5, 3, 1, 2],
    "desert-caravan": [0, 1, 3, 2, 5, 4, 6, 3],
    "circular-flow": [1, 2, 3, 4, 5, 6, 7, 8]
};

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    populateScaleSelector();
    renderHandpan();
    setupEventListeners();
    setupTabs();
});

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mainGainNode = audioCtx.createGain();
        mainGainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        mainGainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function populateScaleSelector() {
    const select = document.getElementById('scale-select');
    select.innerHTML = '';
    for (const [key, scale] of Object.entries(SCALES)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = scale.name;
        select.appendChild(option);
    }
}

function renderHandpan() {
    const container = document.getElementById('handpan-instrument');
    container.innerHTML = '';

    const scale = SCALES[currentScaleKey];
    // Slice notes based on user selection
    activeNotes = scale.notes.slice(0, currentNotesCount);

    // Ding (Center Note)
    const dingData = activeNotes[0];
    const dingEl = document.createElement('div');
    dingEl.className = 'note ding';
    dingEl.dataset.index = 0;
    dingEl.innerHTML = `<span class="note-label">${dingData.label}</span>`;
    container.appendChild(dingEl);

    // Outer Notes
    const outerNotesCount = activeNotes.length - 1;
    const radius = 35; // percentage from center

    for (let i = 1; i < activeNotes.length; i++) {
        const noteData = activeNotes[i];
        const noteEl = document.createElement('div');
        noteEl.className = 'note';
        noteEl.dataset.index = i;

        // Calculate position around circle
        const angle = ((i - 1) / outerNotesCount) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        // Dynamic sizing based on frequency (lower notes are slightly larger)
        const size = Math.max(18, Math.min(26, 1000 / Math.sqrt(noteData.freq)));

        noteEl.style.left = `${x - size / 2}%`;
        noteEl.style.top = `${y - size / 2}%`;
        noteEl.style.width = `${size}%`;
        noteEl.style.height = `${size}%`;

        noteEl.innerHTML = `<span class="note-label">${noteData.label}</span>`;
        container.appendChild(noteEl);
    }

    // Re-bind touch/click events
    bindNoteEvents();
}

function playHandpanSound(freq) {
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    
    // Fundamental
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Octave Harmonic (2x freq)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    // Compound Fifth Harmonic (3x freq)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);

    // Envelopes
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    // Strike Noise (simulates finger tap)
    const noise = audioCtx.createBufferSource();
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.02, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 2.0;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    gain1.connect(mainGainNode);
    gain2.connect(mainGainNode);
    gain3.connect(mainGainNode);
    noiseGain.connect(mainGainNode);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    noise.start(now);

    osc1.stop(now + 2.6);
    osc2.stop(now + 1.6);
    osc3.stop(now + 1.1);
}

function triggerNote(index) {
    initAudio();
    const noteData = activeNotes[index];
    if (!noteData) return;

    playHandpanSound(noteData.freq);

    // Visual feedback
    const noteEl = document.querySelector(`.note[data-index="${index}"]`);
    if (noteEl) {
        noteEl.classList.add('active');
        setTimeout(() => noteEl.classList.remove('active'), 150);
    }

    // Record sequence
    if (isRecording) {
        const timeOffset = Date.now() - recordStartTime;
        recordedSequence.push({ index, time: timeOffset });
    }

    // Lesson verification
    if (currentLessonSequence.length > 0 && !isPlayingLesson) {
        verifyLessonStep(index);
    }
}

function bindNoteEvents() {
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        const handleTrigger = (e) => {
            e.preventDefault();
            const index = parseInt(note.dataset.index);
            triggerNote(index);
        };
        note.addEventListener('mousedown', handleTrigger);
        note.addEventListener('touchstart', handleTrigger);
    });
}

function setupEventListeners() {
    // Scale Select
    document.getElementById('scale-select').addEventListener('change', (e) => {
        currentScaleKey = e.target.value;
        renderHandpan();
    });

    // Notes Count
    document.getElementById('notes-count').addEventListener('change', (e) => {
        currentNotesCount = parseInt(e.target.value);
        renderHandpan();
    });

    // Volume Slider
    document.getElementById('volume-slider').addEventListener('input', (e) => {
        if (mainGainNode) {
            mainGainNode.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
        }
    });

    // Recording Controls
    const recordBtn = document.getElementById('record-btn');
    const playRecBtn = document.getElementById('play-rec-btn');
    const clearRecBtn = document.getElementById('clear-rec-btn');
    const recordStatus = document.getElementById('record-status');

    recordBtn.addEventListener('click', () => {
        initAudio();
        if (!isRecording) {
            isRecording = true;
            recordedSequence = [];
            recordStartTime = Date.now();
            recordBtn.textContent = 'Arrêter';
            recordBtn.classList.add('recording');
            recordStatus.textContent = 'Enregistrement en cours... Jouez sur le handpan.';
            playRecBtn.disabled = true;
            clearRecBtn.disabled = true;
        } else {
            isRecording = false;
            recordBtn.textContent = 'Enregistrer';
            recordBtn.classList.remove('recording');
            recordStatus.textContent = `Enregistré : ${recordedSequence.length} notes.`;
            if (recordedSequence.length > 0) {
                playRecBtn.disabled = false;
                clearRecBtn.disabled = false;
            }
        }
    });

    playRecBtn.addEventListener('click', () => {
        if (recordedSequence.length === 0 || isPlayingRecord) return;
        initAudio();
        isPlayingRecord = true;
        playRecBtn.disabled = true;
        recordStatus.textContent = 'Lecture de l\'enregistrement...';

        recordedSequence.forEach((step) => {
            setTimeout(() => {
                triggerNote(step.index);
            }, step.time);
        });

        const totalDuration = recordedSequence[recordedSequence.length - 1].time + 1000;
        setTimeout(() => {
            isPlayingRecord = false;
            playRecBtn.disabled = false;
            recordStatus.textContent = 'Lecture terminée.';
        }, totalDuration);
    });

    clearRecBtn.addEventListener('click', () => {
        recordedSequence = [];
        playRecBtn.disabled = true;
        clearRecBtn.disabled = true;
        recordStatus.textContent = 'Enregistrement effacé.';
    });

    // Lesson Controls
    const playLessonBtn = document.getElementById('play-lesson-btn');
    const lessonSelect = document.getElementById('lesson-select');
    const lessonFeedback = document.getElementById('lesson-feedback');

    playLessonBtn.addEventListener('click', () => {
        initAudio();
        const lessonKey = lessonSelect.value;
        const pattern = LESSONS[lessonKey];
        
        // Map pattern to current notes count safely
        currentLessonSequence = pattern.map(idx => idx % currentNotesCount);
        lessonUserStep = 0;
        isPlayingLesson = true;
        playLessonBtn.disabled = true;
        lessonFeedback.textContent = 'Écoutez attentivement le motif...';

        // Play sequence visually and audibly
        currentLessonSequence.forEach((noteIdx, step) => {
            setTimeout(() => {
                triggerNote(noteIdx);
                highlightGuideNote(noteIdx);
            }, step * 600);
        });

        setTimeout(() => {
            isPlayingLesson = false;
            playLessonBtn.disabled = false;
            lessonFeedback.textContent = 'À vous de jouer ! Reproduisez le motif.';
            highlightGuideNote(currentLessonSequence[0]);
        }, currentLessonSequence.length * 600);
    });

    // Metronome Controls
    const tempoSlider = document.getElementById('tempo-slider');
    const tempoVal = document.getElementById('tempo-val');
    const metroToggle = document.getElementById('metro-toggle');

    tempoSlider.addEventListener('input', (e) => {
        currentTempo = parseInt(e.target.value);
        tempoVal.textContent = currentTempo;
        if (isMetronomePlaying) {
            stopMetronome();
            startMetronome();
        }
    });

    metroToggle.addEventListener('click', () => {
        initAudio();
        if (isMetronomePlaying) {
            stopMetronome();
            metroToggle.textContent = 'Démarrer';
        } else {
            startMetronome();
            metroToggle.textContent = 'Arrêter';
        }
    });
}

function highlightGuideNote(index) {
    document.querySelectorAll('.note').forEach(n => n.classList.remove('guide-highlight'));
    const target = document.querySelector(`.note[data-index="${index}"]`);
    if (target) {
        target.classList.add('guide-highlight');
    }
}

function verifyLessonStep(index) {
    const expectedIndex = currentLessonSequence[lessonUserStep];
    const lessonFeedback = document.getElementById('lesson-feedback');

    if (index === expectedIndex) {
        lessonUserStep++;
        if (lessonUserStep >= currentLessonSequence.length) {
            lessonFeedback.textContent = 'Félicitations ! Motif reproduit avec succès ! 🎉';
            document.querySelectorAll('.note').forEach(n => n.classList.remove('guide-highlight'));
            currentLessonSequence = [];
        } else {
            lessonFeedback.textContent = `Bien ! Continuez... (${lessonUserStep}/${currentLessonSequence.length})`;
            highlightGuideNote(currentLessonSequence[lessonUserStep]);
        }
    } else {
        lessonFeedback.textContent = 'Oups, mauvaise note ! Réessayez ou réécoutez le motif.';
        lessonUserStep = 0;
        highlightGuideNote(currentLessonSequence[0]);
    }
}

function startMetronome() {
    isMetronomePlaying = true;
    const intervalMs = (60 / currentTempo) * 1000;
    metronomeInterval = setInterval(() => {
        playMetronomeClick();
    }, intervalMs);
}

function stopMetronome() {
    isMetronomePlaying = false;
    clearInterval(metronomeInterval);
}

function playMetronomeClick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(mainGainNode);
    
    osc.start(now);
    osc.stop(now + 0.06);
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration failed:', err));
}