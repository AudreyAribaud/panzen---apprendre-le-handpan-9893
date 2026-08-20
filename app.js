// Web Audio API Setup
let audioCtx = null;

// Handpan Scale: D Minor (Kurd / Celtic)
const NOTES = {
  'D3': { freq: 146.83, label: 'Ding (D3)' },
  'A3': { freq: 220.00, label: 'A3' },
  'Bb3': { freq: 233.08, label: 'B♭3' },
  'C4': { freq: 261.63, label: 'C4' },
  'D4': { freq: 293.66, label: 'D4' },
  'E4': { freq: 329.63, label: 'E4' },
  'F4': { freq: 349.23, label: 'F4' },
  'G4': { freq: 392.00, label: 'G4' },
  'A4': { freq: 440.00, label: 'A4' }
};

// Exercises List
const EXERCISES = [
  {
    name: "1. Échelle Ascendante",
    sequence: ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4"],
    description: "Montez doucement la gamme du Ding jusqu'à la note la plus aiguë."
  },
  {
    name: "2. Vague Zen",
    sequence: ["D3", "A3", "D4", "A3", "F4", "D4", "A4", "G4"],
    description: "Un motif fluide alternant entre notes graves et aiguës."
  },
  {
    name: "3. Battement de Cœur",
    sequence: ["D3", "Bb3", "G4", "Bb3", "D3", "A3", "F4", "A3"],
    description: "Un rythme méditatif et ancré."
  },
  {
    name: "4. Voyage Intérieur",
    sequence: ["D3", "C4", "E4", "G4", "F4", "D4", "Bb3", "A3"],
    description: "Une mélodie complexe et enveloppante."
  }
];

// App State
let currentMode = 'free-play'; // 'free-play' or 'lessons'
let currentExerciseIndex = 0;
let isPlayingDemo = false;
let isPracticeMode = false;
let practiceStep = 0;
let demoTimeoutIds = [];

// DOM Elements
const btnFreePlay = document.getElementById('btn-free-play');
const btnLessons = document.getElementById('btn-lessons');
const exercisePanel = document.getElementById('exercise-panel');
const exerciseSelect = document.getElementById('exercise-select');
const sequenceDisplay = document.getElementById('sequence-display');
const btnDemo = document.getElementById('btn-demo');
const btnPractice = document.getElementById('btn-practice');
const feedbackMessage = document.getElementById('feedback-message');
const handpanSvg = document.getElementById('handpan-svg');

// Initialize Audio Context on first user interaction
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Synthesize Handpan Sound
function playHandpanSound(noteId) {
  initAudio();
  if (!audioCtx) return;

  const note = NOTES[noteId];
  if (!note) return;

  const now = audioCtx.currentTime;
  const freq = note.freq;

  // Create nodes
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.6, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

  // 1. Fundamental Frequency
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  gain1.gain.setValueAtTime(0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

  // 2. Harmonic 1 (Octave - typical of handpan tuning)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  gain2.gain.setValueAtTime(0.3, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

  // 3. Harmonic 2 (Compound Fifth / Octave + Fifth)
  const osc3 = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 3, now);
  gain3.gain.setValueAtTime(0.15, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  // Connections
  osc1.connect(gain1).connect(masterGain);
  osc2.connect(gain2).connect(masterGain);
  osc3.connect(gain3).connect(masterGain);
  
  masterGain.connect(audioCtx.destination);

  // Start and Stop
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  osc1.stop(now + 2.6);
  osc2.stop(now + 1.6);
  osc3.stop(now + 1.1);
}

// Inject SVG Gradients dynamically for beautiful metallic look
function injectGradients() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <radialGradient id="metallic-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#334155" />
      <stop offset="85%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
  `;
  handpanSvg.insertBefore(defs, handpanSvg.firstChild);
}

// Trigger visual feedback on Handpan Note
function triggerVisualNote(noteId, type = 'active') {
  const noteEl = document.getElementById(`note-${noteId}`);
  if (noteEl) {
    noteEl.classList.add(type);
    setTimeout(() => {
      noteEl.classList.remove(type);
    }, 400);
  }
}

// Handle Note Input (Click/Touch)
function handleNoteInput(noteId) {
  playHandpanSound(noteId);
  triggerVisualNote(noteId, 'active');

  if (currentMode === 'lessons' && isPracticeMode && !isPlayingDemo) {
    checkPracticeInput(noteId);
  }
}

// Populate Exercises Dropdown
function populateExercises() {
  exerciseSelect.innerHTML = '';
  EXERCISES.forEach((ex, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = ex.name;
    exerciseSelect.appendChild(option);
  });
}

// Render Fixed Sequence Display (Requested Feature)
function renderSequence() {
  const exercise = EXERCISES[currentExerciseIndex];
  sequenceDisplay.innerHTML = '';
  
  exercise.sequence.forEach((note, index) => {
    const noteBadge = document.createElement('div');
    noteBadge.classList.add('seq-note');
    noteBadge.id = `seq-step-${index}`;
    noteBadge.textContent = note.replace('Bb', 'B♭');
    sequenceDisplay.appendChild(noteBadge);
  });
}

// Play Demo (Requested Feature: plays sequence and highlights notes)
function playDemo() {
  if (isPlayingDemo) return;
  stopAllDemoTimeouts();
  
  isPlayingDemo = true;
  isPracticeMode = false;
  btnDemo.disabled = true;
  btnPractice.disabled = true;
  
  feedbackMessage.textContent = "Écoutez et observez la séquence...";
  feedbackMessage.style.color = "#f59e0b";

  // Reset sequence badges styling
  const badges = document.querySelectorAll('.seq-note');
  badges.forEach(b => b.className = 'seq-note');

  const exercise = EXERCISES[currentExerciseIndex];
  
  exercise.sequence.forEach((noteId, index) => {
    const timeoutId = setTimeout(() => {
      // Highlight sequence badge
      const badge = document.getElementById(`seq-step-${index}`);
      if (badge) {
        badge.classList.add('demo-highlight');
      }

      // Highlight handpan note visually and play sound
      playHandpanSound(noteId);
      triggerVisualNote(noteId, 'demo-highlight');

      // Remove badge highlight after delay
      setTimeout(() => {
        if (badge) badge.classList.remove('demo-highlight');
      }, 500);

      // End of demo check
      if (index === exercise.sequence.length - 1) {
        setTimeout(() => {
          isPlayingDemo = false;
          btnDemo.disabled = false;
          btnPractice.disabled = false;
          feedbackMessage.textContent = "À vous de jouer ! Cliquez sur 'S'entraîner'.";
          feedbackMessage.style.color = "#38bdf8";
        }, 800);
      }
    }, index * 800);
    
    demoTimeoutIds.push(timeoutId);
  });
}

// Stop any running demo timeouts
function stopAllDemoTimeouts() {
  demoTimeoutIds.forEach(id => clearTimeout(id));
  demoTimeoutIds = [];
  isPlayingDemo = false;
  btnDemo.disabled = false;
  btnPractice.disabled = false;
  
  // Clean up highlights
  document.querySelectorAll('.seq-note').forEach(b => b.className = 'seq-note');
  document.querySelectorAll('.handpan-note').forEach(n => n.classList.remove('demo-highlight', 'practice-target'));
}

// Start Practice Mode
function startPractice() {
  stopAllDemoTimeouts();
  isPracticeMode = true;
  practiceStep = 0;
  
  feedbackMessage.textContent = "C'est parti ! Jouez la première note.";
  feedbackMessage.style.color = "#38bdf8";

  updatePracticeUI();
}

// Update Practice UI elements
function updatePracticeUI() {
  const exercise = EXERCISES[currentExerciseIndex];
  const badges = document.querySelectorAll('.seq-note');
  
  badges.forEach((badge, index) => {
    badge.className = 'seq-note';
    if (index < practiceStep) {
      badge.classList.add('completed');
    } else if (index === practiceStep) {
      badge.classList.add('active');
    }
  });

  // Highlight target note on handpan subtly
  document.querySelectorAll('.handpan-note').forEach(n => n.classList.remove('practice-target'));
  if (practiceStep < exercise.sequence.length) {
    const targetNoteId = exercise.sequence[practiceStep];
    const targetEl = document.getElementById(`note-${targetNoteId}`);
    if (targetEl) {
      targetEl.classList.add('practice-target');
    }
  }
}

// Check Practice Input
function checkPracticeInput(noteId) {
  const exercise = EXERCISES[currentExerciseIndex];
  const expectedNote = exercise.sequence[practiceStep];

  if (noteId === expectedNote) {
    practiceStep++;
    if (practiceStep >= exercise.sequence.length) {
      // Exercise Completed!
      isPracticeMode = false;
      document.querySelectorAll('.handpan-note').forEach(n => n.classList.remove('practice-target'));
      
      // Mark all completed
      document.querySelectorAll('.seq-note').forEach(b => b.className = 'seq-note completed');
      
      feedbackMessage.textContent = "Félicitations ! Exercice réussi ! 🎉";
      feedbackMessage.style.color = "#10b981";
      
      // Play a small success chord
      setTimeout(() => {
        playHandpanSound('D3');
        playHandpanSound('D4');
        playHandpanSound('A4');
      }, 300);
    } else {
      feedbackMessage.textContent = "Bien joué ! Continuez...";
      feedbackMessage.style.color = "#10b981";
      updatePracticeUI();
    }
  } else {
    // Wrong note - reset step to encourage learning
    practiceStep = 0;
    feedbackMessage.textContent = "Oups ! Recommençons du début.";
    feedbackMessage.style.color = "#ef4444";
    updatePracticeUI();
  }
}

// Event Listeners
function setupEventListeners() {
  // Mode Switcher
  btnFreePlay.addEventListener('click', () => {
    currentMode = 'free-play';
    btnFreePlay.classList.add('active');
    btnLessons.classList.remove('active');
    exercisePanel.classList.add('hidden');
    stopAllDemoTimeouts();
    isPracticeMode = false;
    document.querySelectorAll('.handpan-note').forEach(n => n.classList.remove('practice-target'));
  });

  btnLessons.addEventListener('click', () => {
    currentMode = 'lessons';
    btnLessons.classList.add('active');
    btnFreePlay.classList.remove('active');
    exercisePanel.classList.remove('hidden');
    selectExercise(exerciseSelect.value);
  });

  // Exercise Selector
  exerciseSelect.addEventListener('change', (e) => {
    selectExercise(e.target.value);
  });

  // Demo & Practice Buttons
  btnDemo.addEventListener('click', playDemo);
  btnPractice.addEventListener('click', startPractice);

  // Handpan Note Interactions (Mouse & Touch)
  const notes = document.querySelectorAll('.handpan-note');
  notes.forEach(noteEl => {
    const noteId = noteEl.getAttribute('data-note');
    
    noteEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleNoteInput(noteId);
    });

    noteEl.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent double trigger with click
      handleNoteInput(noteId);
    }, { passive: false });
  });
}

// Select and Load Exercise
function selectExercise(index) {
  currentExerciseIndex = parseInt(index, 10);
  stopAllDemoTimeouts();
  isPracticeMode = false;
  renderSequence();
  feedbackMessage.textContent = EXERCISES[currentExerciseIndex].description;
  feedbackMessage.style.color = "#94a3b8";
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  injectGradients();
  populateExercises();
  setupEventListeners();
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Registry Failed', err));
  }
});