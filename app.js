// PanZen - Handpan Learning App Core Logic

// --- Audio Engine (Web Audio API Synthesizer) ---
class HandpanSynth {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.reverbLevel = 0.6;
    this.volumeLevel = 0.8;
    this.convolver = null;
    this.delayNode = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master Gain
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = this.volumeLevel;

    // Delay/Reverb simulation for beautiful zen resonance
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.4;
    
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = this.reverbLevel * 0.4;

    // Connect Delay Loop
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);

    // Connections
    this.masterVolume.connect(this.ctx.destination);
    this.masterVolume.connect(this.delayNode);
    this.delayNode.connect(this.ctx.destination);
  }

  setVolume(val) {
    this.volumeLevel = val;
    if (this.masterVolume) {
      this.masterVolume.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  setReverb(val) {
    this.reverbLevel = val;
    if (this.delayFeedback) {
      this.delayFeedback.gain.setValueAtTime(val * 0.45, this.ctx.currentTime);
    }
  }

  // Synthesize a rich, resonant metallic handpan note
  playNote(frequency) {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // Fundamental frequency oscillator
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);

    // Octave partial (Handpan characteristic)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);

    // Compound fifth partial
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);

    // Strike transient (noise burst for the finger tap sound)
    const noise = this.ctx.createBufferSource();
    const noiseGain = this.ctx.createGain();
    const bufferSize = this.ctx.sampleRate * 0.02; // 20ms burst
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Bandpass filter for the strike noise to make it sound like metal tap
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 1.5, now);
    filter.Q.setValueAtTime(3, now);

    // Envelopes
    // Fundamental: fast attack, long decay
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.6, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    // Octave: fast attack, medium decay
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    // Fifth: fast attack, shorter decay
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.15, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    // Strike noise envelope
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    noise.connect(filter);
    filter.connect(noiseGain);

    gain1.connect(this.masterVolume);
    gain2.connect(this.masterVolume);
    gain3.connect(this.masterVolume);
    noiseGain.connect(this.masterVolume);

    // Start & Stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    noise.start(now);

    osc1.stop(now + 2.6);
    osc2.stop(now + 1.6);
    osc3.stop(now + 1.1);
  }
}

const synth = new HandpanSynth();

// --- Scale Definitions ---
const SCALES = {
  kurd: {
    name: "D Kurd",
    notes: {
      "D3": 146.83, "A3": 220.00, "Bb3": 233.08, "C4": 261.63, 
      "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00
    }
  },
  celtic: {
    name: "D Celtic Minor",
    notes: {
      "D3": 146.83, "A3": 220.00, "C4": 261.63, "D4": 293.66, 
      "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "C5": 523.25
    }
  },
  pygmy: {
    name: "F Pygmy",
    notes: {
      "D3": 174.61, "A3": 196.00, "Bb3": 207.65, "C4": 261.63, 
      "D4": 311.13, "E4": 349.23, "F4": 392.00, "G4": 415.30, "A4": 523.25
    }
  }
};

let currentScaleKey = "kurd";

// --- Rich Song Database ("Pleins de morceaux") ---
const SONGS = [
  {
    id: "zen-garden",
    title: "Le Jardin Zen",
    difficulty: "easy",
    desc: "Une mélodie d'introduction douce et cyclique pour s'initier au rythme ternaire.",
    tempo: 100,
    sequence: ["D3", "A3", "C4", "D4", "C4", "A3"]
  },
  {
    id: "desert-wind",
    title: "Le Vent du Désert",
    difficulty: "easy",
    desc: "Un voyage mystique utilisant des sauts de notes amples et envoûtants.",
    tempo: 90,
    sequence: ["D3", "Bb3", "D4", "Bb3", "C4", "A3", "D3"]
  },
  {
    id: "raindrops",
    title: "Gouttes de Pluie",
    difficulty: "easy",
    desc: "Imitez le clapotis de l'eau avec des notes aiguës et cristallines.",
    tempo: 120,
    sequence: ["F4", "G4", "A4", "G4", "F4", "E4", "D4"]
  },
  {
    id: "first-steps",
    title: "Premiers Pas",
    difficulty: "easy",
    desc: "Un motif simple et rassurant pour caler son premier rythme régulier.",
    tempo: 80,
    sequence: ["D3", "A3", "D3", "Bb3", "D3", "C4"]
  },
  {
    id: "mystic-river",
    title: "La Rivière Mystique",
    difficulty: "medium",
    desc: "Un enchaînement fluide qui fait chanter le Ding central en alternance.",
    tempo: 110,
    sequence: ["D3", "A3", "D4", "D3", "Bb3", "E4", "C4", "A3"]
  },
  {
    id: "lunar-eclipse",
    title: "Éclipse Lunaire",
    difficulty: "medium",
    desc: "Un motif envoûtant qui joue sur les contrastes de hauteurs de notes.",
    tempo: 95,
    sequence: ["D3", "A4", "G4", "F4", "D3", "Bb3", "C4", "D4"]
  },
  {
    id: "forest-path",
    title: "Le Sentier de la Forêt",
    difficulty: "medium",
    desc: "Une marche tranquille et boisée, idéale pour travailler la régularité.",
    tempo: 105,
    sequence: ["A3", "C4", "E4", "D4", "Bb3", "D4", "F4", "E4"]
  },
  {
    id: "ocean-waves",
    title: "Vagues de l'Océan",
    difficulty: "hard",
    desc: "Un motif complexe simulant le flux et le reflux de la mer avec des variations rapides.",
    tempo: 130,
    sequence: ["D3", "A3", "D4", "F4", "A4", "G4", "E4", "C4", "Bb3", "A3"]
  },
  {
    id: "zenith",
    title: "Le Zénith",
    difficulty: "hard",
    desc: "Une ascension rythmique intense qui sollicite l'ensemble des notes de la gamme.",
    tempo: 140,
    sequence: ["D3", "Bb3", "D4", "F4", "A4", "G4", "E4", "C4", "D4", "A3", "D3"]
  },
  {
    id: "pan-master",
    title: "L'Éveil du Maître",
    difficulty: "hard",
    desc: "Le défi ultime : un enchaînement asymétrique très rapide et hypnotique.",
    tempo: 125,
    sequence: ["D3", "A4", "Bb3", "G4", "C4", "F4", "D4", "E4", "D3", "A3"]
  }
];

// --- App State ---
let currentSong = null;
let currentStepIndex = 0;
let isRecording = false;
let recordedSequence = [];
let isPlayingDemo = false;
let metronomeInterval = null;
let isMetronomeOn = false;
let metronomeBpm = 120;

// --- DOM Elements ---
const handpanEl = document.getElementById("handpan");
const noteElements = document.querySelectorAll(".handpan-note");
const songsContainer = document.getElementById("songs-container");
const songCountEl = document.getElementById("song-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const guideBanner = document.getElementById("guide-banner");
const currentSongTitle = document.getElementById("current-song-title");
const currentSongInstruction = document.getElementById("current-song-instruction");
const btnPlayDemo = document.getElementById("btn-play-demo");
const btnResetLesson = document.getElementById("btn-reset-lesson");
const sequenceTracker = document.getElementById("sequence-tracker");
const volumeSlider = document.getElementById("volume-slider");
const reverbSlider = document.getElementById("reverb-slider");
const btnRecord = document.getElementById("btn-record");
const btnPlayRecorded = document.getElementById("btn-play-recorded");
const btnMetronome = document.getElementById("btn-metronome");
const bpmDisplay = document.getElementById("bpm-display");
const btnScale = document.getElementById("btn-scale");
const scaleDisplay = document.getElementById("scale-display");
const scaleModal = document.getElementById("scale-modal");
const closeScaleModal = document.getElementById("close-scale-modal");
const scaleOptions = document.querySelectorAll(".scale-option");
const toastEl = document.getElementById("toast");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  renderSongs("all");
  setupEventListeners();
  updateHandpanNoteLabels();
});

// --- Render Songs ---
function renderSongs(filter = "all") {
  songsContainer.innerHTML = "";
  const filtered = SONGS.filter(s => filter === "all" || s.difficulty === filter);
  songCountEl.textContent = `${filtered.length} Morceau${filtered.length > 1 ? 's' : ''}`;

  filtered.forEach(song => {
    const card = document.createElement("div");
    card.className = `song-card ${currentSong && currentSong.id === song.id ? 'active' : ''}`;
    card.dataset.id = song.id;
    
    card.innerHTML = `
      <div class="song-header">
        <span class="song-title">${song.title}</span>
        <span class="difficulty-dot ${song.difficulty}" title="Difficulté: ${song.difficulty}"></span>
      </div>
      <p class="song-desc">${song.desc}</p>
      <div class="song-meta">
        <span><i class="fa-solid fa-music"></i> ${song.sequence.length} notes</span>
        <span><i class="fa-solid fa-gauge-high"></i> ${song.tempo} BPM</span>
        <span class="learn-badge">Apprendre</span>
      </div>
    `;

    card.addEventListener("click", () => selectSong(song));
    songsContainer.appendChild(card);
  });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Note Clicks / Touches
  noteElements.forEach(noteEl => {
    noteEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      triggerNote(noteEl.dataset.note);
    });
    noteEl.addEventListener("touchstart", (e) => {
      e.preventDefault();
      triggerNote(noteEl.dataset.note);
    });
  });

  // Keyboard Support
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    let key = e.key.toUpperCase();
    if (e.code === "Space") key = "Space";
    
    const matchedNote = Array.from(noteElements).find(el => el.dataset.key === key);
    if (matchedNote) {
      triggerNote(matchedNote.dataset.note);
    }
  });

  // Filters
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderSongs(btn.dataset.filter);
    });
  });

  // Audio Settings
  volumeSlider.addEventListener("input", (e) => {
    synth.setVolume(parseFloat(e.target.value));
  });
  reverbSlider.addEventListener("input", (e) => {
    synth.setReverb(parseFloat(e.target.value));
  });

  // Recording
  btnRecord.addEventListener("click", toggleRecording);
  btnPlayRecorded.addEventListener("click", playRecording);

  // Metronome
  btnMetronome.addEventListener("click", toggleMetronome);

  // Scale Modal
  btnScale.addEventListener("click", () => scaleModal.classList.remove("hidden"));
  closeScaleModal.addEventListener("click", () => scaleModal.classList.add("hidden"));
  scaleOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      scaleOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      changeScale(opt.dataset.scale);
      scaleModal.classList.add("hidden");
    });
  });

  // Lesson Controls
  btnPlayDemo.addEventListener("click", playDemo);
  btnResetLesson.addEventListener("click", resetLesson);
}

// --- Play Note Logic ---
function triggerNote(noteName) {
  const scaleNotes = SCALES[currentScaleKey].notes;
  const freq = scaleNotes[noteName];
  
  if (freq) {
    synth.playNote(freq);
    
    // Visual feedback on the handpan
    const noteEl = Array.from(noteElements).find(el => el.dataset.note === noteName);
    if (noteEl) {
      noteEl.classList.add("playing");
      setTimeout(() => noteEl.classList.remove("playing"), 150);
    }

    // Record if active
    if (isRecording) {
      recordedSequence.push({ note: noteName, time: Date.now() });
    }

    // Check lesson progress
    if (currentSong && !isPlayingDemo) {
      checkLessonStep(noteName);
    }
  }
}

// --- Scale Management ---
function changeScale(scaleKey) {
  currentScaleKey = scaleKey;
  scaleDisplay.textContent = SCALES[scaleKey].name;
  updateHandpanNoteLabels();
  showToast(`Gamme changée pour : ${SCALES[scaleKey].name}`);
}

function updateHandpanNoteLabels() {
  const scale = SCALES[currentScaleKey];
  const noteKeys = Object.keys(scale.notes);
  
  noteElements.forEach((el, index) => {
    if (noteKeys[index]) {
      el.dataset.note = noteKeys[index];
      el.querySelector(".note-name").textContent = noteKeys[index];
    }
  });
}

// --- Song Selection & Lesson Engine ---
function selectSong(song) {
  currentSong = song;
  currentStepIndex = 0;
  isPlayingDemo = false;

  // Update active card state
  document.querySelectorAll(".song-card").forEach(card => {
    card.classList.remove("active");
    if (card.dataset.id === song.id) card.classList.add("active");
  });

  // Update UI
  currentSongTitle.textContent = song.title;
  currentSongInstruction.textContent = "Suivez les notes en surbrillance pour jouer le morceau.";
  
  btnPlayDemo.classList.remove("hidden");
  btnResetLesson.classList.remove("hidden");
  sequenceTracker.classList.remove("hidden");

  // Set Metronome BPM to match song tempo
  metronomeBpm = song.tempo;
  bpmDisplay.textContent = `${metronomeBpm} BPM`;

  buildSequenceTracker();
  highlightNextNote();
}

function buildSequenceTracker() {
  sequenceTracker.innerHTML = "";
  currentSong.sequence.forEach((note, index) => {
    const step = document.createElement("div");
    step.className = "seq-step";
    step.innerHTML = `<span>${note}</span>`;
    sequenceTracker.appendChild(step);
  });
}

function highlightNextNote() {
  // Clear previous highlights
  noteElements.forEach(el => el.classList.remove("highlighted"));
  
  const steps = sequenceTracker.querySelectorAll(".seq-step");
  steps.forEach((step, idx) => {
    step.className = "seq-step";
    if (idx < currentStepIndex) step.classList.add("completed");
    if (idx === currentStepIndex) step.classList.add("active");
  });

  if (currentStepIndex < currentSong.sequence.length) {
    const nextNote = currentSong.sequence[currentStepIndex];
    const targetEl = Array.from(noteElements).find(el => el.dataset.note === nextNote);
    if (targetEl) {
      targetEl.classList.add("highlighted");
    }
  } else {
    // Song Completed!
    currentSongInstruction.textContent = "Félicitations ! Vous avez joué le morceau parfaitement. 🎉";
    showToast("Morceau terminé ! Magnifique ! ✨", "success");
    confettiEffect();
  }
}

function checkLessonStep(playedNote) {
  const expectedNote = currentSong.sequence[currentStepIndex];
  if (playedNote === expectedNote) {
    currentStepIndex++;
    highlightNextNote();
  }
}

function resetLesson() {
  currentStepIndex = 0;
  highlightNextNote();
  currentSongInstruction.textContent = "Suivez les notes en surbrillance pour jouer le morceau.";
}

// --- Play Demo Automatically ---
async function playDemo() {
  if (!currentSong || isPlayingDemo) return;
  isPlayingDemo = true;
  btnPlayDemo.disabled = true;
  currentSongInstruction.textContent = "Écoute de la démonstration...";
  
  // Clear highlights during demo
  noteElements.forEach(el => el.classList.remove("highlighted"));

  const delayMs = (60 / currentSong.tempo) * 1000;

  for (let i = 0; i < currentSong.sequence.length; i++) {
    if (!isPlayingDemo) break;
    const note = currentSong.sequence[i];
    
    // Highlight current demo note
    const targetEl = Array.from(noteElements).find(el => el.dataset.note === note);
    if (targetEl) targetEl.classList.add("playing");
    
    triggerNote(note);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    if (targetEl) targetEl.classList.remove("playing");
  }

  isPlayingDemo = false;
  btnPlayDemo.disabled = false;
  resetLesson();
}

// --- Recording Feature ---
function toggleRecording() {
  if (!isRecording) {
    isRecording = true;
    recordedSequence = [];
    btnRecord.classList.add("recording");
    btnRecord.innerHTML = `<i class="fa-solid fa-stop"></i> Arrêter`;
    btnPlayRecorded.disabled = true;
    showToast("Enregistrement démarré... Jouez vos notes !");
  } else {
    isRecording = false;
    btnRecord.classList.remove("recording");
    btnRecord.innerHTML = `<i class="fa-solid fa-circle"></i> Enregistrer`;
    if (recordedSequence.length > 0) {
      btnPlayRecorded.disabled = false;
      showToast("Enregistrement sauvegardé !");
    } else {
      showToast("Aucune note enregistrée.");
    }
  }
}

async function playRecording() {
  if (recordedSequence.length === 0) return;
  showToast("Lecture de votre composition...");
  
  const startTime = recordedSequence[0].time;
  
  for (let i = 0; i < recordedSequence.length; i++) {
    const item = recordedSequence[i];
    const delay = i === 0 ? 0 : item.time - recordedSequence[i-1].time;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    triggerNote(item.note);
  }
}

// --- Metronome ---
function toggleMetronome() {
  if (isMetronomeOn) {
    clearInterval(metronomeInterval);
    isMetronomeOn = false;
    btnMetronome.classList.remove("active");
    showToast("Métronome désactivé");
  } else {
    synth.init();
    const intervalMs = (60 / metronomeBpm) * 1000;
    metronomeInterval = setInterval(() => {
      // Play a subtle high-pitched click for metronome
      if (synth.ctx) {
        const osc = synth.ctx.createOscillator();
        const gain = synth.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, synth.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, synth.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, synth.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(synth.ctx.destination);
        osc.start();
        osc.stop(synth.ctx.currentTime + 0.06);
      }
    }, intervalMs);
    isMetronomeOn = true;
    btnMetronome.classList.add("active");
    showToast("Métronome activé");
  }
}

// --- Toast Notification Helper ---
function showToast(message, type = "info") {
  toastEl.textContent = message;
  toastEl.className = `toast ${type}`;
  toastEl.classList.remove("hidden");
  
  setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 3000);
}

// --- Simple Confetti Effect for Success ---
function confettiEffect() {
  // Simple visual flash on the handpan to celebrate
  let flashes = 0;
  const interval = setInterval(() => {
    noteElements.forEach(el => {
      el.classList.toggle("playing");
    });
    flashes++;
    if (flashes > 5) {
      clearInterval(interval);
      noteElements.forEach(el => el.classList.remove("playing"));
    }
  }, 150);
}

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.warn('Erreur de Service Worker', err));
  });
}
