// Web Audio API Synthesizer for Handpan Sounds
class HandpanSynth {
  constructor() {
    this.ctx = null;
    this.frequencies = {
      'D3': 146.83,
      'A3': 220.00,
      'Bb3': 233.08,
      'C4': 261.63,
      'D4': 293.66,
      'E4': 329.63,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00
    };
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(noteName) {
    this.init();
    const freq = this.frequencies[noteName];
    if (!freq) return;

    const now = this.ctx.currentTime;

    // Fundamental
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Octave overtone (typical of handpan)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    // Compound fifth overtone (typical of handpan)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);

    // Bandpass filter to simulate the steel chamber resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(1.5, now);

    // Envelopes
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.8, now + 0.005); // Quick strike
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8); // Long decay

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);

    filter.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
    osc3.stop(now + 2.0);
  }
}

const synth = new HandpanSynth();

// State Management
const state = {
  currentView: 'play',
  soundEnabled: false,
  bpm: 90,
  metronomeInterval: null,
  isMetronomePlaying: false,
  completedLessons: JSON.parse(localStorage.getItem('panzen_completed_lessons')) || [],
  history: JSON.parse(localStorage.getItem('panzen_history')) || [],
  currentPracticeLesson: null,
  practiceActive: false,
  practiceNotes: [],
  practiceScore: 0,
  practiceTotal: 0
};

// Lessons Data
const lessons = [
  {
    id: 'lesson-1',
    title: 'Le Ding Fondamental',
    desc: 'Apprenez à frapper le Ding central avec le pouce gauche.',
    difficulty: 'Facile',
    difficultyClass: 'difficulty-easy',
    notes: ['D3', 'D3', 'D3', 'D3'],
    hands: ['G', 'G', 'G', 'G']
  },
  {
    id: 'lesson-2',
    title: 'Alternance Gauche-Droite',
    desc: 'Jouez une alternance simple entre le Ding et la note A3.',
    difficulty: 'Facile',
    difficultyClass: 'difficulty-easy',
    notes: ['D3', 'A3', 'D3', 'A3'],
    hands: ['G', 'D', 'G', 'D']
  },
  {
    id: 'lesson-3',
    title: 'La Valse du Handpan',
    desc: 'Un rythme à 3 temps fluide et mélodique.',
    difficulty: 'Moyen',
    difficultyClass: 'difficulty-medium',
    notes: ['D3', 'A3', 'Bb3', 'D3', 'A3', 'Bb3'],
    hands: ['G', 'D', 'G', 'G', 'D', 'G']
  },
  {
    id: 'lesson-4',
    title: 'Ascension de la Gamme',
    desc: 'Montez la gamme de D Kurd pas à pas.',
    difficulty: 'Moyen',
    difficultyClass: 'difficulty-medium',
    notes: ['A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    hands: ['G', 'G', 'D', 'D', 'G', 'D', 'D', 'G']
  },
  {
    id: 'lesson-5',
    title: 'Le Rythme Takadimi',
    desc: 'Un motif rythmique rapide et dynamique.',
    difficulty: 'Difficile',
    difficultyClass: 'difficulty-hard',
    notes: ['D3', 'F4', 'E4', 'D4', 'D3', 'F4', 'E4', 'D4'],
    hands: ['G', 'D', 'G', 'D', 'G', 'D', 'G', 'D']
  }
];

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const btnSoundInit = document.getElementById('btn-sound-init');
const soundIcon = document.getElementById('sound-icon');
const bpmRange = document.getElementById('bpm-range');
const bpmDisplay = document.getElementById('bpm-display');
const btnMetronomeToggle = document.getElementById('btn-metronome-toggle');
const lessonsContainer = document.getElementById('lessons-container');
const practiceHandpanSvg = document.getElementById('practice-handpan-svg');
const btnStartPractice = document.getElementById('btn-start-practice');
const feedbackText = document.getElementById('feedback-text');
const scrollingNotesContainer = document.getElementById('scrolling-notes-container');

// Initialize App
function init() {
  setupNavigation();
  setupHandpanInteraction();
  setupSoundActivation();
  setupMetronome();
  renderLessons();
  updateProgressUI();
  cloneHandpanToPractice();
}

// Navigation
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });
}

function switchView(viewId) {
  views.forEach(view => view.classList.remove('active'));
  navItems.forEach(item => item.classList.remove('active'));

  const activeView = document.getElementById(`view-${viewId}`);
  const activeNavItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);

  if (activeView) activeView.classList.add('active');
  if (activeNavItem) activeNavItem.classList.add('active');

  state.currentView = viewId;

  // Stop practice if leaving practice view
  if (viewId !== 'practice' && state.practiceActive) {
    stopPractice();
  }
}

// Sound Activation
function setupSoundActivation() {
  btnSoundInit.addEventListener('click', () => {
    synth.init();
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      soundIcon.className = 'fas fa-volume-up';
      btnSoundInit.style.color = 'var(--primary)';
    } else {
      soundIcon.className = 'fas fa-volume-mute';
      btnSoundInit.style.color = 'var(--text-light)';
    }
  });
}

// Handpan Interaction
function setupHandpanInteraction() {
  const notes = document.querySelectorAll('.handpan-ding, .handpan-note');
  notes.forEach(note => {
    const triggerPlay = (e) => {
      e.preventDefault();
      const noteName = note.getAttribute('data-note');
      synth.playNote(noteName);
      
      // Visual feedback
      note.classList.add('active');
      setTimeout(() => note.classList.remove('active'), 150);

      // Practice Mode Hit Detection
      if (state.practiceActive) {
        handlePracticeHit(noteName);
      }
    };

    note.addEventListener('mousedown', triggerPlay);
    note.addEventListener('touchstart', triggerPlay, { passive: false });
  });
}

// Clone Handpan SVG to Practice View
function cloneHandpanToPractice() {
  const originalSvg = document.querySelector('.handpan-svg');
  practiceHandpanSvg.innerHTML = originalSvg.innerHTML;
  // Re-bind events for the cloned SVG
  const notes = practiceHandpanSvg.querySelectorAll('.handpan-ding, .handpan-note');
  notes.forEach(note => {
    const triggerPlay = (e) => {
      e.preventDefault();
      const noteName = note.getAttribute('data-note');
      synth.playNote(noteName);
      note.classList.add('active');
      setTimeout(() => note.classList.remove('active'), 150);
      if (state.practiceActive) {
        handlePracticeHit(noteName);
      }
    };
    note.addEventListener('mousedown', triggerPlay);
    note.addEventListener('touchstart', triggerPlay, { passive: false });
  });
}

// Metronome Logic
function setupMetronome() {
  bpmRange.addEventListener('input', (e) => {
    state.bpm = e.target.value;
    bpmDisplay.textContent = `${state.bpm} BPM`;
    if (state.isMetronomePlaying) {
      stopMetronome();
      startMetronome();
    }
  });

  btnMetronomeToggle.addEventListener('click', () => {
    if (state.isMetronomePlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  });
}

function startMetronome() {
  synth.init();
  state.isMetronomePlaying = true;
  btnMetronomeToggle.innerHTML = '<i class="fas fa-stop"></i> Arrêter';
  btnMetronomeToggle.style.background = 'var(--accent)';

  const intervalMs = (60 / state.bpm) * 1000;
  state.metronomeInterval = setInterval(() => {
    // Play a high-pitched click for metronome beat
    if (synth.ctx) {
      const osc = synth.ctx.createOscillator();
      const gain = synth.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, synth.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, synth.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, synth.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(synth.ctx.destination);
      osc.start();
      osc.stop(synth.ctx.currentTime + 0.06);
    }
  }, intervalMs);
}

function stopMetronome() {
  state.isMetronomePlaying = false;
  btnMetronomeToggle.innerHTML = '<i class="fas fa-play"></i> Métronome';
  btnMetronomeToggle.style.background = 'var(--primary)';
  clearInterval(state.metronomeInterval);
}

// Render Lessons
function renderLessons() {
  lessonsContainer.innerHTML = '';
  lessons.forEach(lesson => {
    const isCompleted = state.completedLessons.includes(lesson.id);
    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.innerHTML = `
      <div class="lesson-info">
        <div class="lesson-title">${lesson.title}</div>
        <div class="lesson-desc">${lesson.desc}</div>
        <div class="lesson-meta">
          <span class="badge ${lesson.difficultyClass}">${lesson.difficulty}</span>
          <span class="badge">${lesson.notes.length} notes</span>
          ${isCompleted ? '<span class="badge" style="background: var(--success); color: white;">Complété</span>' : ''}
        </div>
      </div>
      <div class="lesson-action">
        <button class="btn-primary btn-start-lesson" data-id="${lesson.id}">S'entraîner</button>
      </div>
    `;
    lessonsContainer.appendChild(card);
  });

  // Bind lesson buttons
  document.querySelectorAll('.btn-start-lesson').forEach(btn => {
    btn.addEventListener('click', () => {
      const lessonId = btn.getAttribute('data-id');
      startLessonPractice(lessonId);
    });
  });
}

// Practice Mode Logic
function startLessonPractice(lessonId) {
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  state.currentPracticeLesson = lesson;
  switchView('practice');

  document.getElementById('practice-title').textContent = lesson.title;
  document.getElementById('practice-desc').textContent = lesson.desc;
  feedbackText.textContent = "Prêt ? Appuyez sur Commencer !";
  scrollingNotesContainer.innerHTML = '';
}

btnStartPractice.addEventListener('click', () => {
  if (state.practiceActive) {
    stopPractice();
  } else {
    startPractice();
  }
});

function startPractice() {
  if (!state.currentPracticeLesson) {
    state.currentPracticeLesson = lessons[0]; // Fallback to first lesson
  }

  synth.init();
  state.practiceActive = true;
  state.practiceScore = 0;
  state.practiceTotal = 0;
  btnStartPractice.textContent = "Arrêter";
  btnStartPractice.style.background = 'var(--accent)';
  feedbackText.textContent = "Écoutez le rythme...";

  // Generate scrolling notes based on lesson
  const lesson = state.currentPracticeLesson;
  state.practiceNotes = [];
  scrollingNotesContainer.innerHTML = '';

  let delay = 1000; // Initial delay
  const interval = (60 / state.bpm) * 1000;

  lesson.notes.forEach((note, index) => {
    const hand = lesson.hands[index];
    const targetTime = Date.now() + delay + (index * interval);
    
    state.practiceNotes.push({
      note,
      hand,
      targetTime,
      hit: false
    });

    // Create visual note element
    const noteEl = document.createElement('div');
    noteEl.className = `target-note hand-${hand}`;
    noteEl.style.borderColor = hand === 'G' ? 'var(--left-hand)' : 'var(--right-hand)';
    noteEl.style.background = 'rgba(0,0,0,0.8)';
    noteEl.style.color = '#fff';
    noteEl.innerHTML = `<div>${note}</div><div style="font-size:8px;">${hand}</div>`;
    noteEl.style.left = '100%';
    scrollingNotesContainer.appendChild(noteEl);

    // Animate note
    const animationDuration = interval * 2;
    noteEl.animate([
      { left: '100%' },
      { left: '0%' }
    ], {
      duration: animationDuration,
      easing: 'linear',
      delay: delay + (index * interval) - animationDuration,
      fill: 'forwards'
    });

    // Remove element after animation
    setTimeout(() => {
      noteEl.remove();
    }, delay + (index * interval) + 500);
  });

  state.practiceTotal = lesson.notes.length;

  // End of practice session check
  setTimeout(() => {
    finishPractice();
  }, delay + (lesson.notes.length * interval) + 1000);
}

function handlePracticeHit(noteName) {
  const now = Date.now();
  // Find closest unhit note
  const target = state.practiceNotes.find(n => !n.hit && Math.abs(n.targetTime - now) < 400);

  if (target) {
    target.hit = true;
    const diff = Math.abs(target.targetTime - now);
    if (target.note === noteName) {
      if (diff < 100) {
        feedbackText.textContent = "PARFAIT !";
        feedbackText.style.color = 'var(--success)';
        state.practiceScore += 100;
      } else if (diff < 250) {
        feedbackText.textContent = "BIEN !";
        feedbackText.style.color = 'var(--primary)';
        state.practiceScore += 70;
      } else {
        feedbackText.textContent = "TROP TARD / TÔT";
        feedbackText.style.color = 'var(--accent)';
        state.practiceScore += 40;
      }
    } else {
      feedbackText.textContent = "MAUVAISE NOTE !";
      feedbackText.style.color = '#ff4d6d';
    }
  }
}

function stopPractice() {
  state.practiceActive = false;
  btnStartPractice.textContent = "Commencer l'exercice";
  btnStartPractice.style.background = 'var(--primary)';
  feedbackText.textContent = "Prêt ?";
  scrollingNotesContainer.innerHTML = '';
}

function finishPractice() {
  if (!state.practiceActive) return;
  state.practiceActive = false;
  btnStartPractice.textContent = "Recommencer";
  btnStartPractice.style.background = 'var(--primary)';

  const maxPossibleScore = state.practiceTotal * 100;
  const accuracy = maxPossibleScore > 0 ? Math.round((state.practiceScore / maxPossibleScore) * 100) : 0;

  feedbackText.textContent = `Session terminée ! Précision : ${accuracy}%`;
  feedbackText.style.color = 'var(--primary)';

  // Save progress
  if (accuracy >= 70 && state.currentPracticeLesson) {
    if (!state.completedLessons.includes(state.currentPracticeLesson.id)) {
      state.completedLessons.push(state.currentPracticeLesson.id);
      localStorage.setItem('panzen_completed_lessons', JSON.stringify(state.completedLessons));
      renderLessons();
    }
  }

  // Save history
  const session = {
    date: new Date().toLocaleDateString('fr-FR'),
    lessonTitle: state.currentPracticeLesson ? state.currentPracticeLesson.title : "Pratique Libre",
    accuracy: accuracy
  };
  state.history.unshift(session);
  if (state.history.length > 10) state.history.pop();
  localStorage.setItem('panzen_history', JSON.stringify(state.history));

  updateProgressUI();
}

// Update Progress View
function updateProgressUI() {
  document.getElementById('stat-completed').textContent = `${state.completedLessons.length}/${lessons.length}`;
  
  const avgAccuracy = state.history.length > 0 
    ? Math.round(state.history.reduce((acc, curr) => acc + curr.accuracy, 0) / state.history.length) 
    : 0;
  document.getElementById('stat-accuracy').textContent = `${avgAccuracy}%`;

  const historyContainer = document.getElementById('history-container');
  if (state.history.length === 0) {
    historyContainer.innerHTML = '<div class="text-center text-muted" style="padding: 20px;">Aucune session enregistrée pour le moment.</div>';
  } else {
    historyContainer.innerHTML = state.history.map(item => `
      <div class="history-item">
        <div>
          <strong>${item.lessonTitle}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.date}</div>
        </div>
        <div style="font-weight: bold; color: ${item.accuracy >= 70 ? 'var(--success)' : 'var(--primary)'}">${item.accuracy}%</div>
      </div>
    `).join('');
  }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}

// Run App
init();