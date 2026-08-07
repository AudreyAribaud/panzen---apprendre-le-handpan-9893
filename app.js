// Configuration des Gammes de Handpan (Fréquences en Hz)
const SCALES = {
  celtic: {
    name: "Ré Celtique Mineur",
    notes: [
      { name: "D3", freq: 146.83, label: "0" }, // Ding
      { name: "A3", freq: 220.00, label: "1" },
      { name: "C4", freq: 261.63, label: "2" },
      { name: "D4", freq: 293.66, label: "3" },
      { name: "E4", freq: 329.63, label: "4" },
      { name: "F4", freq: 349.23, label: "5" },
      { name: "G4", freq: 392.00, label: "6" },
      { name: "A4", freq: 440.00, label: "7" },
      { name: "C5", freq: 523.25, label: "8" }
    ]
  },
  kurd: {
    name: "Ré Kurd",
    notes: [
      { name: "D3", freq: 146.83, label: "0" },
      { name: "A3", freq: 220.00, label: "1" },
      { name: "Bb3", freq: 233.08, label: "2" },
      { name: "C4", freq: 261.63, label: "3" },
      { name: "D4", freq: 293.66, label: "4" },
      { name: "E4", freq: 329.63, label: "5" },
      { name: "F4", freq: 349.23, label: "6" },
      { name: "G4", freq: 392.00, label: "7" },
      { name: "A4", freq: 440.00, label: "8" }
    ]
  },
  hijaz: {
    name: "Ré Hijaz",
    notes: [
      { name: "D3", freq: 146.83, label: "0" },
      { name: "A3", freq: 220.00, label: "1" },
      { name: "Bb3", freq: 233.08, label: "2" },
      { name: "C#4", freq: 277.18, label: "3" },
      { name: "D4", freq: 293.66, label: "4" },
      { name: "E4", freq: 329.63, label: "5" },
      { name: "F4", freq: 349.23, label: "6" },
      { name: "G4", freq: 392.00, label: "7" },
      { name: "A4", freq: 440.00, label: "8" }
    ]
  },
  pygmy: {
    name: "Fa Pygmée",
    notes: [
      { name: "F3", freq: 174.61, label: "0" },
      { name: "G3", freq: 196.00, label: "1" },
      { name: "Ab3", freq: 207.65, label: "2" },
      { name: "C4", freq: 261.63, label: "3" },
      { name: "Eb4", freq: 311.13, label: "4" },
      { name: "F4", freq: 349.23, label: "5" },
      { name: "G4", freq: 392.00, label: "6" },
      { name: "Ab4", freq: 415.30, label: "7" },
      { name: "C5", freq: 523.25, label: "8" }
    ]
  }
};

// Mappage clavier physique
const KEY_MAP = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8
};

let currentScaleKey = 'celtic';
let audioCtx = null;

// Initialisation de l'Audio Context au premier clic
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Synthétiseur de Handpan réaliste (Modélisation physique simplifiée)
function playHandpanSound(freq) {
  initAudio();
  const now = audioCtx.currentTime;

  // 1. Harmonique Fondamentale (f0)
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.5, now + 0.008); // Attaque ultra rapide
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Longue résonance

  // 2. Harmonique Octave (2 * f0) - Très présente sur le handpan
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.006);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  // 3. Harmonique Quinte ou Tierce (3 * f0) - Donne la couleur métallique
  const osc3 = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 3, now);
  gain3.gain.setValueAtTime(0, now);
  gain3.gain.linearRampToValueAtTime(0.12, now + 0.005);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  // 4. Bruit d'impact initial (Le "Slap" de la main)
  const bufferSize = audioCtx.sampleRate * 0.015; // 15ms
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 3.0;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

  // Connexions
  osc1.connect(gain1);
  osc2.connect(gain2);
  osc3.connect(gain3);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.9, now);

  gain1.connect(masterGain);
  gain2.connect(masterGain);
  gain3.connect(masterGain);
  noiseGain.connect(masterGain);

  masterGain.connect(audioCtx.destination);

  // Démarrage
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  noise.start(now);

  // Arrêt propre
  osc1.stop(now + 3);
  osc2.stop(now + 3);
  osc3.stop(now + 3);
  noise.stop(now + 3);
}

// Génération visuelle du Handpan
function renderHandpan() {
  const scale = SCALES[currentScaleKey];
  const container = document.getElementById('outer-notes-container');
  container.innerHTML = '';

  // Mettre à jour le Ding
  const ding = document.getElementById('note-ding');
  ding.querySelector('.note-name').textContent = scale.notes[0].name;

  // Générer les 8 notes périphériques en cercle
  const totalNotes = scale.notes.length - 1;
  const radius = 125; // Rayon de placement en pixels

  for (let i = 1; i <= totalNotes; i++) {
    const noteData = scale.notes[i];
    const angle = ((i - 1) * (360 / totalNotes) - 90) * (Math.PI / 180);
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const noteEl = document.createElement('div');
    noteEl.className = 'note outer-note';
    noteEl.style.left = `calc(50% + ${x}px - 40px)`;
    noteEl.style.top = `calc(50% + ${y}px - 40px)`;
    noteEl.setAttribute('data-note-index', i);
    noteEl.innerHTML = `
      <span class="note-name">${noteData.name}</span>
      <span class="note-num">${noteData.label}</span>
    `;

    // Événements tactiles et clics
    noteEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerNote(i);
    });

    container.appendChild(noteEl);
  }
}

// Déclenchement d'une note (Son + Visuel)
function triggerNote(index) {
  const scale = SCALES[currentScaleKey];
  if (index >= 0 && index < scale.notes.length) {
    const noteData = scale.notes[index];
    playHandpanSound(noteData.freq);
    
    // Animation visuelle
    const noteEl = document.querySelector(`[data-note-index="${index}"]`);
    if (noteEl) {
      noteEl.classList.add('active');
      setTimeout(() => noteEl.classList.remove('active'), 150);
    }

    // Logique d'apprentissage
    checkPracticeStep(index);
  }
}

// Gestion du Clavier Physique
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (KEY_MAP[e.key] !== undefined) {
    triggerNote(KEY_MAP[e.key]);
  }
});

// Ding tactile
document.getElementById('note-ding').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  triggerNote(0);
});

// Changement de Gamme
document.getElementById('scale-select').addEventListener('change', (e) => {
  currentScaleKey = e.target.value;
  renderHandpan();
});

// Navigation par Onglets
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

/* --- SYSTEME D'APPRENTISSAGE (COURS) --- */
let activeLesson = null;
let practiceSequence = [];
let currentStepIndex = 0;

const LESSONS_DATA = {
  1: [0, 1, 0, 1],
  2: [0, 2, 3],
  3: [1, 3, 5, 4, 2]
};

const lessonCards = document.querySelectorAll('.lesson-card');
const practiceZone = document.getElementById('practice-zone');
const stepsContainer = document.getElementById('practice-steps-container');
const stopPracticeBtn = document.getElementById('stop-practice-btn');

lessonCards.forEach(card => {
  const startBtn = card.querySelector('.start-lesson-btn');
  startBtn.addEventListener('click', () => {
    const lessonId = card.dataset.lesson;
    startLesson(lessonId);
  });
});

function startLesson(id) {
  activeLesson = id;
  practiceSequence = LESSONS_DATA[id];
  currentStepIndex = 0;
  
  practiceZone.classList.remove('hidden');
  document.getElementById('practice-title').textContent = `Exercice ${id} en cours`;
  
  // Générer les indicateurs d'étapes
  stepsContainer.innerHTML = '';
  practiceSequence.forEach((noteIdx, i) => {
    const step = document.createElement('div');
    step.className = `step-indicator ${i === 0 ? 'active' : ''}`;
    step.textContent = noteIdx;
    stepsContainer.appendChild(step);
  });

  highlightNextNote();
}

function highlightNextNote() {
  // Retirer tous les highlights précédents
  document.querySelectorAll('.note').forEach(n => n.classList.remove('highlight'));
  
  if (currentStepIndex < practiceSequence.length) {
    const targetNoteIndex = practiceSequence[currentStepIndex];
    const noteEl = document.querySelector(`[data-note-index="${targetNoteIndex}"]`);
    if (noteEl) {
      noteEl.classList.add('highlight');
    }
  }
}

function checkPracticeStep(playedIndex) {
  if (!activeLesson) return;

  const expectedIndex = practiceSequence[currentStepIndex];
  if (playedIndex === expectedIndex) {
    // Succès de l'étape
    const steps = stepsContainer.querySelectorAll('.step-indicator');
    steps[currentStepIndex].classList.remove('active');
    steps[currentStepIndex].classList.add('success');
    
    currentStepIndex++;
    
    if (currentStepIndex < practiceSequence.length) {
      steps[currentStepIndex].classList.add('active');
      highlightNextNote();
    } else {
      // Exercice terminé avec succès !
      document.getElementById('practice-feedback').textContent = "Félicitations ! Exercice réussi ! 🎉";
      document.querySelectorAll('.note').forEach(n => n.classList.remove('highlight'));
      setTimeout(() => {
        resetPractice();
      }, 2000);
    }
  }
}

function resetPractice() {
  activeLesson = null;
  practiceSequence = [];
  currentStepIndex = 0;
  practiceZone.classList.add('hidden');
  document.querySelectorAll('.note').forEach(n => n.classList.remove('highlight'));
}

stopPracticeBtn.addEventListener('click', resetPractice);

/* --- METRONOME --- */
let metronomeInterval = null;
let isMetronomeRunning = false;
let bpm = 100;
let currentBeat = 0;

const bpmValueDisplay = document.getElementById('bpm-value');
const tempoSlider = document.getElementById('tempo-slider');
const metronomeToggle = document.getElementById('metronome-toggle');
const beatIndicators = document.querySelectorAll('.beat-indicator');

tempoSlider.addEventListener('input', (e) => {
  bpm = e.target.value;
  bpmValueDisplay.textContent = bpm;
  if (isMetronomeRunning) {
    stopMetronome();
    startMetronome();
  }
});

metronomeToggle.addEventListener('click', () => {
  if (isMetronomeRunning) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

function startMetronome() {
  initAudio();
  isMetronomeRunning = true;
  metronomeToggle.textContent = "Arrêter";
  metronomeToggle.classList.add('btn-danger');
  
  const intervalMs = (60 / bpm) * 1000;
  metronomeInterval = setInterval(playBeat, intervalMs);
}

function stopMetronome() {
  isMetronomeRunning = false;
  clearInterval(metronomeInterval);
  metronomeToggle.textContent = "Démarrer";
  metronomeToggle.classList.remove('btn-danger');
  beatIndicators.forEach(b => b.classList.remove('active'));
  currentBeat = 0;
}

function playBeat() {
  // Son du métronome
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  // Premier temps plus aigu
  osc.frequency.setValueAtTime(currentBeat === 0 ? 880 : 440, now);
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + 0.06);

  // Mise à jour visuelle
  beatIndicators.forEach((b, i) => {
    if (i === currentBeat) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  currentBeat = (currentBeat + 1) % 4;
}

// Initialisation au démarrage
window.addEventListener('DOMContentLoaded', () => {
  renderHandpan();
  
  // Enregistrement du Service Worker pour le support PWA hors-ligne
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log("Service Worker registration failed: ", err);
    });
  }
});