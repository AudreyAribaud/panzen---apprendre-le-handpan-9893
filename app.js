// Web Audio API Synthesizer for Handpan
class HandpanSynth {
  constructor() {
    this.ctx = null;
    this.reverbLevel = 0.5;
    this.convolver = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.setupReverb();
  }

  setupReverb() {
    // Create a simple synthetic impulse response for reverb
    const rate = this.ctx.sampleRate;
    const len = rate * 2.5; // 2.5 seconds reverb
    const impulse = this.ctx.createBuffer(2, len, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < len; i++) {
      const decay = Math.exp(-i / (rate * 0.8));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.reverbLevel;

    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.ctx.destination);
  }

  setReverbLevel(val) {
    this.reverbLevel = parseFloat(val);
    if (this.reverbGain) {
      this.reverbGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);
    }
  }

  playNote(frequency) {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // Handpan sound synthesis: Fundamental + Octave + Compound 5th
    const osc1 = this.ctx.createOscillator(); // Fundamental
    const osc2 = this.ctx.createOscillator(); // Octave
    const osc3 = this.ctx.createOscillator(); // 5th / Harmonic

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const gain3 = this.ctx.createGain();

    const masterGain = this.ctx.createGain();

    // Frequencies
    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency * 2, now);
    osc3.frequency.setValueAtTime(frequency * 3, now);

    // Waveforms (sine/triangle mix gives a warm handpan tone)
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc3.type = 'sine';

    // Envelopes
    // Fundamental: slow decay
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.6, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    // Octave: faster decay
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Harmonic: very fast decay
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    // Strike sound (noise burst for the finger impact)
    const strikeBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
    const strikeData = strikeBuffer.getChannelData(0);
    for (let i = 0; i < strikeData.length; i++) {
      strikeData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.005));
    }
    const strikeSource = this.ctx.createBufferSource();
    strikeSource.buffer = strikeBuffer;
    const strikeGain = this.ctx.createGain();
    strikeGain.gain.setValueAtTime(0.15, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    strikeSource.connect(strikeGain);
    strikeGain.connect(masterGain);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);

    // Route to output and reverb
    masterGain.connect(this.ctx.destination);
    if (this.convolver) {
      masterGain.connect(this.convolver);
    }

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    strikeSource.start(now);

    osc1.stop(now + 1.6);
    osc2.stop(now + 1.6);
    osc3.stop(now + 1.6);
  }
}

const synth = new HandpanSynth();

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.app-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.getAttribute('data-target');
    
    navItems.forEach(nav => nav.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));

    item.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Handpan Touch/Play Logic
const notes = document.querySelectorAll('.handpan-note');
let activeLessonPattern = [];
let currentLessonStep = 0;

notes.forEach(note => {
  // Support both touch and mouse events for fast response
  const playHandler = (e) => {
    e.preventDefault();
    const freq = parseFloat(note.getAttribute('data-freq'));
    const noteName = note.getAttribute('data-note');
    
    synth.playNote(freq);
    
    // Visual feedback
    note.classList.add('active');
    setTimeout(() => note.classList.remove('active'), 150);

    // Check lesson progress
    checkLessonStep(noteName);
  };

  note.addEventListener('touchstart', playHandler, { passive: false });
  note.addEventListener('mousedown', playHandler);
});

// Reverb Control
const reverbControl = document.getElementById('reverb-control');
reverbControl.addEventListener('input', (e) => {
  synth.setReverbLevel(e.target.value);
});

// Lessons & Practice Logic
const lessonCards = document.querySelectorAll('.lesson-card');
const practiceGuide = document.getElementById('practice-guide');
const currentLessonTitle = document.getElementById('current-lesson-title');
const visualSequenceContainer = document.getElementById('visual-sequence-container');
const btnClosePractice = document.getElementById('btn-close-practice');

lessonCards.forEach(card => {
  const btn = card.querySelector('.btn-play-lesson');
  btn.addEventListener('click', () => {
    const patternStr = card.getAttribute('data-pattern');
    const title = card.querySelector('h3').innerText;
    
    activeLessonPattern = patternStr.split(',');
    currentLessonStep = 0;
    
    currentLessonTitle.innerText = title;
    practiceGuide.classList.remove('hidden');
    
    // Build visual steps
    visualSequenceContainer.innerHTML = '';
    activeLessonPattern.forEach((note, index) => {
      const stepEl = document.createElement('div');
      stepEl.className = `sequence-step ${index === 0 ? 'active' : ''}`;
      stepEl.innerText = note;
      visualSequenceContainer.appendChild(stepEl);
    });

    // Scroll to practice guide smoothly on mobile
    practiceGuide.scrollIntoView({ behavior: 'smooth' });
  });
});

btnClosePractice.addEventListener('click', () => {
  practiceGuide.classList.add('hidden');
  activeLessonPattern = [];
});

function checkLessonStep(playedNote) {
  if (activeLessonPattern.length === 0) return;

  const expectedNote = activeLessonPattern[currentLessonStep];
  if (playedNote === expectedNote) {
    currentLessonStep++;
    
    // Update visual steps
    const steps = visualSequenceContainer.querySelectorAll('.sequence-step');
    steps.forEach((step, idx) => {
      if (idx === currentLessonStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    if (currentLessonStep >= activeLessonPattern.length) {
      // Lesson completed!
      setTimeout(() => {
        alert('Félicitations ! Enchaînement réussi ! 🎉');
        currentLessonStep = 0;
        steps.forEach((step, idx) => {
          if (idx === 0) step.classList.add('active');
          else step.classList.remove('active');
        });
      }, 300);
    }
  }
}

// Metronome Logic
let metronomeInterval = null;
let isMetronomePlaying = false;
let bpm = 120;
let currentBeat = 0;

const tempoValue = document.getElementById('tempo-value');
const tempoSlider = document.getElementById('tempo-slider');
const tempoMinus = document.getElementById('tempo-minus');
const tempoPlus = document.getElementById('tempo-plus');
const btnToggleMetronome = document.getElementById('btn-toggle-metronome');
const beatIndicators = document.querySelectorAll('.beat-indicator');

function updateBpm(newBpm) {
  bpm = Math.max(40, Math.min(210, newBpm));
  tempoValue.innerText = bpm;
  tempoSlider.value = bpm;
  if (isMetronomePlaying) {
    stopMetronome();
    startMetronome();
  }
}

tempoSlider.addEventListener('input', (e) => updateBpm(parseInt(e.target.value)));
tempoMinus.addEventListener('click', () => updateBpm(bpm - 5));
tempoPlus.addEventListener('click', () => updateBpm(bpm + 5));

function playBeatSound() {
  synth.init();
  const now = synth.ctx.currentTime;
  const osc = synth.ctx.createOscillator();
  const gain = synth.ctx.createGain();
  
  // High pitch for beat 1, lower for others
  const freq = currentBeat === 0 ? 880 : 440;
  osc.frequency.setValueAtTime(freq, now);
  osc.type = 'triangle';
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc.connect(gain);
  gain.connect(synth.ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.06);
}

function tick() {
  // Update visual indicators
  beatIndicators.forEach((ind, idx) => {
    if (idx === currentBeat) {
      ind.classList.add('active');
    } else {
      ind.classList.remove('active');
    }
  });

  playBeatSound();

  currentBeat = (currentBeat + 1) % 4;
}

function startMetronome() {
  const intervalMs = (60 / bpm) * 1000;
  currentBeat = 0;
  tick(); // First tick immediately
  metronomeInterval = setInterval(tick, intervalMs);
  btnToggleMetronome.innerText = 'Arrêter';
  btnToggleMetronome.style.backgroundColor = '#ef4444';
  isMetronomePlaying = true;
}

function stopMetronome() {
  clearInterval(metronomeInterval);
  beatIndicators.forEach(ind => ind.classList.remove('active'));
  btnToggleMetronome.innerText = 'Démarrer';
  btnToggleMetronome.style.backgroundColor = 'var(--accent-gold)';
  isMetronomePlaying = false;
}

btnToggleMetronome.addEventListener('click', () => {
  if (isMetronomePlaying) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

// Connection Status Monitoring
window.addEventListener('online', () => {
  const status = document.getElementById('connection-status');
  status.innerText = 'En ligne';
  status.className = 'badge online';
});

window.addEventListener('offline', () => {
  const status = document.getElementById('connection-status');
  status.innerText = 'Hors ligne';
  status.className = 'badge offline';
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.warn('Erreur d\'enregistrement du Service Worker', err));
  });
}
