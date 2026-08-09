// Web Audio API Setup
let audioCtx = null;
let activeScale = 'kurd';
let metronomeInterval = null;
let isMetronomePlaying = false;
let bpm = 90;
let currentLessonIndex = 0;
let currentStepIndex = 0;

// Scales definition (Frequencies in Hz)
const scales = {
    kurd: {
        name: "D Kurd",
        notes: [
            { label: "Ding", pitch: "D3", freq: 146.83 },
            { label: "1", pitch: "A3", freq: 220.00 },
            { label: "2", pitch: "Bb3", freq: 233.08 },
            { label: "3", pitch: "C4", freq: 261.63 },
            { label: "4", pitch: "D4", freq: 293.66 },
            { label: "5", pitch: "E4", freq: 329.63 },
            { label: "6", pitch: "F4", freq: 349.23 },
            { label: "7", pitch: "G4", freq: 392.00 },
            { label: "8", pitch: "A4", freq: 440.00 }
        ]
    },
    celtic: {
        name: "Am Celtic",
        notes: [
            { label: "Ding", pitch: "A2", freq: 110.00 },
            { label: "1", pitch: "C3", freq: 130.81 },
            { label: "2", pitch: "D3", freq: 146.83 },
            { label: "3", pitch: "E3", freq: 164.81 },
            { label: "4", pitch: "G3", freq: 196.00 },
            { label: "5", pitch: "A3", freq: 220.00 },
            { label: "6", pitch: "C4", freq: 261.63 },
            { label: "7", pitch: "D4", freq: 293.66 },
            { label: "8", pitch: "E4", freq: 329.63 }
        ]
    },
    pygmy: {
        name: "F Pygmy",
        notes: [
            { label: "Ding", pitch: "F2", freq: 87.31 },
            { label: "1", pitch: "Ab2", freq: 103.83 },
            { label: "2", pitch: "C3", freq: 130.81 },
            { label: "3", pitch: "Eb3", freq: 155.56 },
            { label: "4", pitch: "F3", freq: 174.61 },
            { label: "5", pitch: "Ab3", freq: 207.65 },
            { label: "6", pitch: "C4", freq: 261.63 },
            { label: "7", pitch: "Eb4", freq: 311.13 },
            { label: "8", pitch: "F4", freq: 349.23 }
        ]
    }
};

// Lessons definition (indices of notes to play)
const lessons = [
    {
        title: "Premiers Pas (Alternance)",
        instructions: "Jouez alternativement le Ding et les notes de gauche à droite.",
        sequence: [0, 1, 0, 2, 0, 3, 0, 4]
    },
    {
        title: "Le Voyage du Ding",
        instructions: "Un motif circulaire classique pour s'habituer au mouvement.",
        sequence: [0, 1, 3, 5, 7, 6, 4, 2]
    },
    {
        title: "Mélodie Zen",
        instructions: "Une mélodie douce et méditative.",
        sequence: [0, 3, 4, 1, 0, 5, 6, 2]
    }
];

// Initialize Audio Context
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        document.getElementById('btn-audio-init').style.display = 'none';
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Synthesize Handpan Sound
function playHandpanTone(freq) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // Handpan sound consists of a fundamental, an octave, and a compound fifth
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const osc3 = audioCtx.createOscillator();

    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    const gain3 = audioCtx.createGain();

    // Fundamental
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    // Octave harmonic
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);


    // Compound Fifth harmonic
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.8, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);

    masterGain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 2.0);
    osc2.stop(now + 1.5);
    osc3.stop(now + 1.0);
}

// Update UI with selected scale notes
function updateScaleUI() {
    const currentScaleData = scales[activeScale];
    const pads = document.querySelectorAll('.pad');
    
    pads.forEach(pad => {
        const index = parseInt(pad.getAttribute('data-note-index'));
        const noteData = currentScaleData.notes[index];
        if (noteData) {
            pad.setAttribute('data-note-name', noteData.pitch);
            pad.querySelector('.note-pitch').textContent = noteData.pitch;
        }
    });
}

// Play Note by Index
function playNoteByIndex(index) {
    initAudio();
    const currentScaleData = scales[activeScale];
    const noteData = currentScaleData.notes[index];
    if (noteData) {
        playHandpanTone(noteData.freq);
        document.getElementById('current-played-note').textContent = `${noteData.pitch} (${noteData.label})`;
        
        // Check lesson progress
        checkLessonProgress(index);
    }
}

// Lesson Logic
function loadLesson(index) {
    currentLessonIndex = index;
    currentStepIndex = 0;
    const lesson = lessons[index];
    
    document.getElementById('lesson-text').textContent = lesson.instructions;
    
    // Render sequence steps
    const seqDisplay = document.getElementById('sequence-display');
    seqDisplay.innerHTML = '';
    
    lesson.sequence.forEach((noteIdx, stepIdx) => {
        const stepEl = document.createElement('span');
        stepEl.classList.add('seq-step');
        if (stepIdx === 0) stepEl.classList.add('active-step');
        
        const noteLabel = scales[activeScale].notes[noteIdx].label;
        stepEl.textContent = noteLabel;
        seqDisplay.appendChild(stepEl);
    });

    highlightNextNote();
}

function highlightNextNote() {
    // Remove all highlights
    document.querySelectorAll('.pad').forEach(pad => pad.classList.remove('highlight'));
    
    const lesson = lessons[currentLessonIndex];
    const nextNoteIndex = lesson.sequence[currentStepIndex];
    
    const targetPad = document.querySelector(`.pad[data-note-index="${nextNoteIndex}"]`);
    if (targetPad) {
        targetPad.classList.add('highlight');
    }
}

function checkLessonProgress(playedIndex) {
    const lesson = lessons[currentLessonIndex];
    const expectedIndex = lesson.sequence[currentStepIndex];
    
    if (playedIndex === expectedIndex) {
        // Move to next step
        currentStepIndex++;
        if (currentStepIndex >= lesson.sequence.length) {
            // Lesson completed, loop back
            currentStepIndex = 0;
        }
        
        // Update sequence display active step
        const steps = document.querySelectorAll('.seq-step');
        steps.forEach((step, idx) => {
            if (idx === currentStepIndex) {
                step.classList.add('active-step');
            } else {
                step.classList.remove('active-step');
            }
        });
        
        highlightNextNote();
    }
}

// Metronome Logic
function toggleMetronome() {
    initAudio();
    const btn = document.getElementById('btn-metronome');
    if (isMetronomePlaying) {
        clearInterval(metronomeInterval);
        isMetronomePlaying = false;
        btn.textContent = "Démarrer";
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    } else {
        isMetronomePlaying = true;
        btn.textContent = "Arrêter";
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        
        const intervalMs = (60 / bpm) * 1000;
        metronomeInterval = setInterval(playMetronomeTick, intervalMs);
    }
}

function playMetronomeTick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // High pitch tick
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    // Audio Init Button
    document.getElementById('btn-audio-init').addEventListener('click', () => {
        initAudio();
    });

    // Handpan Pads Interaction
    const pads = document.querySelectorAll('.pad');
    pads.forEach(pad => {
        // Support both touch and click instantly
        const triggerPlay = (e) => {
            e.preventDefault();
            const index = parseInt(pad.getAttribute('data-note-index'));
            playNoteByIndex(index);
            
            // Instant visual feedback without transition/animation
            pad.classList.add('active');
            setTimeout(() => {
                pad.classList.remove('active');
            }, 100);
        };

        pad.addEventListener('mousedown', triggerPlay);
        pad.addEventListener('touchstart', triggerPlay, { passive: false });
    });

    // Scale Selector
    const scaleButtons = document.querySelectorAll('.btn-scale');
    scaleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            scaleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeScale = btn.getAttribute('data-scale');
            updateScaleUI();
            loadLesson(currentLessonIndex); // Reload lesson to update note labels
        });
    });

    // Metronome BPM Slider
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmValue = document.getElementById('bpm-value');
    bpmSlider.addEventListener('input', (e) => {
        bpm = parseInt(e.target.value);
        bpmValue.textContent = bpm;
        if (isMetronomePlaying) {
            // Restart metronome with new speed
            toggleMetronome();
            toggleMetronome();
        }
    });

    // Metronome Button
    document.getElementById('btn-metronome').addEventListener('click', toggleMetronome);

    // Lesson Selector
    const lessonButtons = document.querySelectorAll('.btn-lesson');
    lessonButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            lessonButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const index = parseInt(btn.getAttribute('data-lesson'));
            loadLesson(index);
        });
    });

    // Initial Load
    updateScaleUI();
    loadLesson(0);
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker registered successfully.', reg.scope);
        }).catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    });
}