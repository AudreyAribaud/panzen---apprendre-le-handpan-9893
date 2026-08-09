// --- AUDIO SYNTHESIZER (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHandpanSound(frequency) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator(); // Octave harmonic
  const osc3 = audioCtx.createOscillator(); // Fifth harmonic
  const gainNode = audioCtx.createGain();
  
  // Fundamental
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  // Octave
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, audioCtx.currentTime);
  
  // Perfect Fifth
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 1.5, audioCtx.currentTime);

  // Gain envelope (Zen, resonant decay)
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.01); // Strike
  gainNode.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.4); // Decay
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8); // Release

  // Mix harmonics
  const mixNode = audioCtx.createGain();
  mixNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
  
  const harmonicGain2 = audioCtx.createGain();
  harmonicGain2.gain.setValueAtTime(0.25, audioCtx.currentTime);
  
  const harmonicGain3 = audioCtx.createGain();
  harmonicGain3.gain.setValueAtTime(0.15, audioCtx.currentTime);

  osc.connect(mixNode);
  osc2.connect(harmonicGain2);
  harmonicGain2.connect(mixNode);
  osc3.connect(harmonicGain3);
  harmonicGain3.connect(mixNode);

  mixNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc2.start();
  osc3.start();
  
  osc.stop(audioCtx.currentTime + 2.0);
  osc2.stop(audioCtx.currentTime + 2.0);
  osc3.stop(audioCtx.currentTime + 2.0);
}

// --- SONGS DATABASE (50 Tracks) ---
const songs = [
  // Débutant (1-18)
  { id: 1, title: "Premier Souffle", level: "Débutant", tempo: 80, sequence: ["D3", "A3", "C4", "A3"] },
  { id: 2, title: "La Clé des Champs", level: "Débutant", tempo: 85, sequence: ["D3", "Bb3", "D4", "Bb3"] },
  { id: 3, title: "Éveil Zen", level: "Débutant", tempo: 75, sequence: ["D3", "A3", "D4", "A3"] },
  { id: 4, title: "Goutte d'Eau", level: "Débutant", tempo: 90, sequence: ["C4", "E4", "G4", "E4"] },
  { id: 5, title: "Le Sentier", level: "Débutant", tempo: 80, sequence: ["D3", "A3", "Bb3", "A3"] },
  { id: 6, title: "Brise Légère", level: "Débutant", tempo: 95, sequence: ["A3", "C4", "D4", "C4"] },
  { id: 7, title: "Pas à Pas", level: "Débutant", tempo: 80, sequence: ["D3", "F4", "E4", "D4"] },
  { id: 8, title: "Clairière", level: "Débutant", tempo: 70, sequence: ["D3", "A3", "E4", "A3"] },
  { id: 9, title: "Onde Douce", level: "Débutant", tempo: 85, sequence: ["Bb3", "D4", "F4", "D4"] },
  { id: 10, title: "Murmure", level: "Débutant", tempo: 75, sequence: ["D3", "C4", "Bb3", "C4"] },
  { id: 11, title: "Petit Matin", level: "Débutant", tempo: 90, sequence: ["A3", "D4", "E4", "D4"] },
  { id: 12, title: "Rêverie", level: "Débutant", tempo: 80, sequence: ["D3", "Bb3", "C4", "Bb3"] },
  { id: 13, title: "Source Pure", level: "Débutant", tempo: 85, sequence: ["D3", "A3", "G4", "A3"] },
  { id: 14, title: "L'Écho", level: "Débutant", tempo: 70, sequence: ["D3", "D4", "A4", "D4"] },
  { id: 15, title: "Sable Chaud", level: "Débutant", tempo: 95, sequence: ["A3", "Bb3", "D4", "Bb3"] },
  { id: 16, title: "Pluie Fine", level: "Débutant", tempo: 80, sequence: ["C4", "D4", "E4", "D4"] },
  { id: 17, title: "Horizon", level: "Débutant", tempo: 75, sequence: ["D3", "E4", "F4", "E4"] },
  { id: 18, title: "Simplicité", level: "Débutant", tempo: 85, sequence: ["D3", "A3", "D3", "A3"] },

  // Intermédiaire (19-36)
  { id: 19, title: "Danse des Nuages", level: "Intermédiaire", tempo: 100, sequence: ["D3", "A3", "C4", "D4", "E4", "D4", "C4", "A3"] },
  { id: 20, title: "Voyage Intérieur", level: "Intermédiaire", tempo: 90, sequence: ["D3", "Bb3", "D4", "F4", "G4", "F4", "D4", "Bb3"] },
  { id: 21, title: "Le Vol du Faucon", level: "Intermédiaire", tempo: 110, sequence: ["A3", "C4", "E4", "A4", "G4", "E4", "C4", "A3"] },
  { id: 22, title: "Cascade Dorée", level: "Intermédiaire", tempo: 95, sequence: ["D3", "F4", "E4", "C4", "D4", "C4", "Bb3", "A3"] },
  { id: 23, title: "Sous la Lune", level: "Intermédiaire", tempo: 80, sequence: ["D3", "Bb3", "D4", "E4", "F4", "E4", "D4", "Bb3"] },
  { id: 24, title: "Vent d'Est", level: "Intermédiaire", tempo: 105, sequence: ["A3", "D4", "F4", "G4", "A4", "G4", "F4", "D4"] },
  { id: 25, title: "Brume Matinale", level: "Intermédiaire", tempo: 85, sequence: ["D3", "C4", "E4", "F4", "G4", "F4", "E4", "C4"] },
  { id: 26, title: "Chemin de Pierre", level: "Intermédiaire", tempo: 100, sequence: ["D3", "A3", "Bb3", "C4", "D4", "C4", "Bb3", "A3"] },
  { id: 27, title: "Lumière d'Automne", level: "Intermédiaire", tempo: 90, sequence: ["Bb3", "D4", "F4", "A4", "G4", "F4", "D4", "Bb3"] },
  { id: 28, title: "Reflet d'Eau", level: "Intermédiaire", tempo: 95, sequence: ["C4", "E4", "G4", "A4", "G4", "E4", "C4", "Bb3"] },
  { id: 29, title: "Sillage", level: "Intermédiaire", tempo: 100, sequence: ["D3", "A3", "D4", "E4", "F4", "E4", "D4", "A3"] },
  { id: 30, title: "Oasis", level: "Intermédiaire", tempo: 85, sequence: ["D3", "Bb3", "C4", "D4", "G4", "F4", "E4", "D4"] },
  { id: 31, title: "Crépuscule", level: "Intermédiaire", tempo: 90, sequence: ["A3", "C4", "D4", "F4", "E4", "D4", "C4", "A3"] },
  { id: 32, title: "Souffle Chaud", level: "Intermédiaire", tempo: 105, sequence: ["D3", "F4", "G4", "A4", "G4", "F4", "D4", "C4"] },
  { id: 33, title: "La Source", level: "Intermédiaire", tempo: 80, sequence: ["D3", "A3", "C4", "E4", "D4", "C4", "A3", "D3"] },
  { id: 34, title: "Étoile Filante", level: "Intermédiaire", tempo: 115, sequence: ["A3", "D4", "G4", "A4", "G4", "D4", "A3", "Bb3"] },
  { id: 35, title: "Vague Douce", level: "Intermédiaire", tempo: 95, sequence: ["Bb3", "C4", "D4", "F4", "E4", "D4", "C4", "Bb3"] },
  { id: 36, title: "Sérénité", level: "Intermédiaire", tempo: 85, sequence: ["D3", "E4", "G4", "A4", "G4", "E4", "D3", "A3"] },

  // Avancé (37-50)
  { id: 37, title: "Tempête de Sable", level: "Avancé", tempo: 120, sequence: ["D3", "A3", "Bb3", "D4", "E4", "F4", "G4", "A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3", "D3"] },
  { id: 38, title: "L'Envol du Phénix", level: "Avancé", tempo: 125, sequence: ["D3", "D4", "A3", "E4", "Bb3", "F4", "C4", "G4", "A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3"] },
  { id: 39, title: "Spirale Infinie", level: "Avancé", tempo: 115, sequence: ["D3", "A3", "C4", "D4", "F4", "E4", "D4", "C4", "E4", "G4", "A4", "G4", "F4", "E4", "D4", "A3"] },
  { id: 40, title: "Rhapsodie Zen", level: "Avancé", tempo: 110, sequence: ["Bb3", "D4", "F4", "A4", "G4", "E4", "C4", "A3", "D3", "A3", "C4", "E4", "G4", "F4", "D4", "Bb3"] },
  { id: 41, title: "Le Chant des Étoiles", level: "Avancé", tempo: 130, sequence: ["D3", "A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4"] },
  { id: 42, title: "Odyssée", level: "Avancé", tempo: 120, sequence: ["D3", "Bb3", "D4", "G4", "F4", "D4", "Bb3", "A3", "D3", "C4", "E4", "A4", "G4", "E4", "C4", "D3"] },
  { id: 43, title: "Éclipse", level: "Avancé", tempo: 110, sequence: ["A3", "D4", "F4", "A4", "G4", "E4", "C4", "Bb3", "D3", "A3", "Bb3", "D4", "E4", "G4", "F4", "D4"] },
  { id: 44, title: "Danse du Feu", level: "Avancé", tempo: 135, sequence: ["D3", "A3", "D4", "F4", "E4", "D4", "A3", "D3", "Bb3", "D4", "G4", "F4", "D4", "Bb3", "C4", "E4"] },
  { id: 45, title: "Murmure du Vent", level: "Avancé", tempo: 115, sequence: ["D3", "E4", "F4", "A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3", "Bb3", "C4", "D4", "E4", "A4"] },
  { id: 46, title: "Le Grand Canyon", level: "Avancé", tempo: 120, sequence: ["D3", "A3", "C4", "E4", "G4", "A4", "F4", "D4", "Bb3", "D4", "F4", "G4", "E4", "C4", "A3", "D3"] },
  { id: 47, title: "Satori", level: "Avancé", tempo: 100, sequence: ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "G4", "F4", "E4", "D4", "C4", "Bb3", "A3"] },
  { id: 48, title: "Labyrinthe", level: "Avancé", tempo: 125, sequence: ["A3", "C4", "E4", "D4", "F4", "G4", "A4", "E4", "D3", "Bb3", "D4", "C4", "E4", "F4", "G4", "A4"] },
  { id: 49, title: "Énergie Pure", level: "Avancé", tempo: 130, sequence: ["D3", "F4", "D4", "A4", "G4", "E4", "C4", "A3", "Bb3", "D4", "G4", "F4", "E4", "C4", "D4", "A4"] },
  { id: 50, title: "L'Éveil Final", level: "Avancé", tempo: 105, sequence: ["D3", "A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4"] }
];

// --- NAVIGATION ---
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    
    btn.classList.add('active');
    const target = btn.getAttribute('data-target');
    document.getElementById(target).classList.add('active');
  });
});

// --- RENDER SONGS LIST ---
const songsContainer = document.getElementById('songs-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';
let searchQuery = '';

function renderSongs() {
  songsContainer.innerHTML = '';
  
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = currentFilter === 'all' || song.level === currentFilter;
    return matchesSearch && matchesFilter;
  });

  filteredSongs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <div class="song-header">
        <span class="song-title">${song.title}</span>
        <span class="badge ${song.level.toLowerCase()}">${song.level}</span>
      </div>
      <div class="song-preview">${song.sequence.join(' - ')}</div>
      <div class="song-footer">
        <span>⏱️ ${song.tempo} BPM</span>
        <span>${song.sequence.length} notes</span>
      </div>
    `;
    
    card.addEventListener('click', () => openPlayerModal(song));
    songsContainer.appendChild(card);
  });
}

// Search & Filter Listeners
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderSongs();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-level');
    renderSongs();
  });
});

// --- VIRTUAL HANDPAN LOGIC ---
const notes = document.querySelectorAll('.note');

notes.forEach(note => {
  // Touch and Click support
  const playNote = () => {
    const freq = parseFloat(note.getAttribute('data-freq'));
    playHandpanSound(freq);
    note.classList.add('active');
    setTimeout(() => note.classList.remove('active'), 150);
  };

  note.addEventListener('mousedown', playNote);
  note.addEventListener('touchstart', (e) => {
    e.preventDefault();
    playNote();
  });
});

// --- MODAL PLAYER & PRACTICE ---
const modal = document.getElementById('player-modal');
const closeModalBtn = document.querySelector('.close-modal');
const modalTitle = document.getElementById('modal-song-title');
const modalLevel = document.getElementById('modal-song-level');
const modalTempo = document.getElementById('modal-song-tempo');
const modalSequence = document.getElementById('modal-song-sequence');
const playSongBtn = document.getElementById('play-song-btn');
const stopSongBtn = document.getElementById('stop-song-btn');

let currentSong = null;
let playbackInterval = null;
let isPlaying = false;

function openPlayerModal(song) {
  currentSong = song;
  modalTitle.textContent = song.title;
  modalLevel.textContent = song.level;
  modalLevel.className = `badge ${song.level.toLowerCase()}`;
  modalTempo.textContent = `⏱️ ${song.tempo} BPM`;
  
  // Render sequence
  modalSequence.innerHTML = '';
  song.sequence.forEach((note, index) => {
    const noteSpan = document.createElement('span');
    noteSpan.className = 'tab-note';
    noteSpan.textContent = note;
    noteSpan.setAttribute('data-index', index);
    modalSequence.appendChild(noteSpan);
  });

  modal.classList.add('active');
}

function stopSongPlayback() {
  clearInterval(playbackInterval);
  isPlaying = false;
  const tabNotes = document.querySelectorAll('.tab-note');
  tabNotes.forEach(n => n.classList.remove('playing'));
  playSongBtn.disabled = false;
}

function playSongSequence() {
  if (!currentSong || isPlaying) return;
  isPlaying = true;
  playSongBtn.disabled = true;

  const intervalMs = (60 / currentSong.tempo) * 1000;
  let currentIndex = 0;
  const tabNotes = document.querySelectorAll('.tab-note');

  playbackInterval = setInterval(() => {
    if (currentIndex >= currentSong.sequence.length) {
      stopSongPlayback();
      return;
    }

    // Highlight current note in tab
    tabNotes.forEach(n => n.classList.remove('playing'));
    const activeTabNote = tabNotes[currentIndex];
    if (activeTabNote) activeTabNote.classList.add('playing');

    // Play sound
    const noteName = currentSong.sequence[currentIndex];
    const noteElement = document.querySelector(`.handpan [data-note="${noteName}"]`);
    if (noteElement) {
      const freq = parseFloat(noteElement.getAttribute('data-freq'));
      playHandpanSound(freq);
      
      // Visual feedback on mini-handpan if visible
      const miniNote = document.querySelector(`.mini-handpan [data-note="${noteName}"]`);
      if (miniNote) {
        miniNote.classList.add('active');
        setTimeout(() => miniNote.classList.remove('active'), 150);
      }
    }

    currentIndex++;
  }, intervalMs);
}

playSongBtn.addEventListener('click', playSongSequence);
stopSongBtn.addEventListener('click', stopSongPlayback);

closeModalBtn.addEventListener('click', () => {
  stopSongPlayback();
  modal.classList.remove('active');
});

// Close modal on background click
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    stopSongPlayback();
    modal.classList.remove('active');
  }
});

// --- ZEN METRONOME ---
const tempoSlider = document.getElementById('tempo-slider');
const tempoVal = document.getElementById('tempo-val');
const metronomeToggle = document.getElementById('metronome-toggle');
const beatIndicators = document.querySelectorAll('.beat-indicator');

let metronomeInterval = null;
let isMetronomeRunning = false;
let currentBeat = 0;

tempoSlider.addEventListener('input', (e) => {
  tempoVal.textContent = e.target.value;
  if (isMetronomeRunning) {
    stopMetronome();
    startMetronome();
  }
});

function startMetronome() {
  const bpm = parseInt(tempoSlider.value);
  const intervalMs = (60 / bpm) * 1000;
  isMetronomeRunning = true;
  metronomeToggle.textContent = "Arrêter";
  metronomeToggle.style.background = "#ea4335";

  metronomeInterval = setInterval(() => {
    // Visual feedback
    beatIndicators.forEach(ind => ind.classList.remove('active'));
    beatIndicators[currentBeat].classList.add('active');

    // Sound feedback (woodblock/click sound)
    playMetronomeClick(currentBeat === 0 ? 880 : 440);

    currentBeat = (currentBeat + 1) % 4;
  }, intervalMs);
}

function stopMetronome() {
  clearInterval(metronomeInterval);
  isMetronomeRunning = false;
  metronomeToggle.textContent = "Démarrer";
  metronomeToggle.style.background = "var(--primary-gradient)";
  beatIndicators.forEach(ind => ind.classList.remove('active'));
  currentBeat = 0;
}

function playMetronomeClick(freq) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.06);
}

metronomeToggle.addEventListener('click', () => {
  if (isMetronomeRunning) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  renderSongs();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker enregistré avec succès.'))
    .catch(err => console.log('Échec de l\'enregistrement du Service Worker:', err));
}
