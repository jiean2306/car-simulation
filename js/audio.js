const TRACKS = [
  { name: 'FM 1 · Sahara Synthwave',     bpm: 118, bass: [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4], lead: [220, 261.6, 329.6, 392, 329.6, 293.7, 261.6, 220], wave: 'sawtooth' },
  { name: 'FM 2 · Downtown Night Funk',  bpm: 112, bass: [65.4, 0, 73.4, 82.4, 98, 0, 82.4, 73.4], lead: [261.6, 329.6, 392, 440, 392, 329.6, 293.7, 329.6], wave: 'triangle' },
  { name: 'FM 3 · Tundra Chill Lo-Fi',   bpm: 88,  bass: [73.4, 73.4, 65.4, 65.4, 55, 55, 61.7, 65.4], lead: [293.7, 349.2, 440, 392, 349.2, 329.6, 293.7, 261.6], wave: 'sine' },
  { name: 'FM 4 · Rainforest Hyper-D&B', bpm: 134, bass: [49, 49, 58.3, 65.4, 73.4, 65.4, 58.3, 49], lead: [392, 466.2, 523.3, 587.3, 523.3, 466.2, 392, 349.2], wave: 'square' }
];

// Acoustic harmonic profiles for each engine architecture
const ENGINE_ACOUSTICS = {
  i3_compact:      { baseMult: 0.75, h2: 1.50, h3: 3.00, w1: 'sawtooth', w2: 'triangle', w3: 'sawtooth', filterBase: 380, filterSpan: 1100, gainMult: 0.90 },
  i4_vtec:         { baseMult: 1.00, h2: 2.00, h3: 4.00, w1: 'sawtooth', w2: 'square',   w3: 'sawtooth', filterBase: 420, filterSpan: 1650, gainMult: 1.00 },
  i4_turbo:        { baseMult: 0.95, h2: 2.00, h3: 3.00, w1: 'sawtooth', w2: 'triangle', w3: 'sawtooth', filterBase: 360, filterSpan: 1250, gainMult: 0.95 },
  i5_turbo:        { baseMult: 0.85, h2: 1.25, h3: 2.50, w1: 'sawtooth', w2: 'sawtooth', w3: 'triangle', filterBase: 370, filterSpan: 1350, gainMult: 1.00 },
  i6_turbo:        { baseMult: 1.05, h2: 1.50, h3: 3.00, w1: 'sawtooth', w2: 'sawtooth', w3: 'triangle', filterBase: 400, filterSpan: 1450, gainMult: 1.00 },
  flat6_na:        { baseMult: 1.10, h2: 1.50, h3: 3.00, w1: 'sawtooth', w2: 'square',   w3: 'sawtooth', filterBase: 460, filterSpan: 1750, gainMult: 1.05 },
  flat6_turbo:     { baseMult: 1.00, h2: 1.50, h3: 3.00, w1: 'sawtooth', w2: 'triangle', w3: 'sawtooth', filterBase: 390, filterSpan: 1400, gainMult: 1.00 },
  v6_tt:           { baseMult: 1.00, h2: 1.50, h3: 2.25, w1: 'sawtooth', w2: 'triangle', w3: 'sawtooth', filterBase: 390, filterSpan: 1400, gainMult: 1.00 },
  v8_muscle:       { baseMult: 0.68, h2: 1.00, h3: 2.00, w1: 'sawtooth', w2: 'square',   w3: 'triangle', filterBase: 260, filterSpan: 950,  gainMult: 1.15 },
  v8_supercharged: { baseMult: 0.70, h2: 1.00, h3: 2.00, w1: 'sawtooth', w2: 'square',   w3: 'sawtooth', filterBase: 280, filterSpan: 1100, gainMult: 1.18 },
  v8_flatplane:    { baseMult: 1.15, h2: 2.00, h3: 4.00, w1: 'sawtooth', w2: 'sawtooth', w3: 'triangle', filterBase: 480, filterSpan: 1800, gainMult: 1.05 },
  v10_scream:      { baseMult: 1.25, h2: 2.50, h3: 5.00, w1: 'sawtooth', w2: 'sawtooth', w3: 'sawtooth', filterBase: 540, filterSpan: 2100, gainMult: 1.05 },
  v12_exotic:      { baseMult: 1.35, h2: 3.00, h3: 6.00, w1: 'sawtooth', w2: 'triangle', w3: 'sawtooth', filterBase: 580, filterSpan: 2300, gainMult: 1.05 },
  w12_luxury:      { baseMult: 0.85, h2: 1.50, h3: 3.00, w1: 'triangle', w2: 'sine',     w3: 'triangle', filterBase: 240, filterSpan: 720,  gainMult: 0.72 }
};

export function createAudioSystem() {
  let audioCtx = null;
  let osc1 = null, osc2 = null, osc3 = null;
  let forcedIndOsc = null; // Turbo spool whistle or Supercharger whine
  let forcedIndGain = null;
  let engineFilter = null;
  let engineGain = null;
  let analyser = null;
  let waveDataArray = null;
  let noiseBuffer = null;

  let musicMasterGain = null;
  let soundEnabled = true;
  let musicPlaying = false;
  let trackIdx = 0;
  let musicTimer = null;
  let musicStep = 0;
  let currentProfileKey = '';

  const eqBars = Array.from(document.querySelectorAll('#eq-bars .eq-bar'));
  const btnPlayMusic = document.getElementById('btn-play-music');
  const btnSound = document.getElementById('btn-sound');

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();

      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      osc3 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc3.type = 'sawtooth';

      const osc3Gain = audioCtx.createGain();
      osc3Gain.gain.value = 0.35;

      // Forced induction oscillator (Turbo spool whistle / Supercharger whine)
      forcedIndOsc = audioCtx.createOscillator();
      forcedIndOsc.type = 'sine';
      forcedIndGain = audioCtx.createGain();
      forcedIndGain.gain.value = 0.0;

      engineFilter = audioCtx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 460;
      engineFilter.Q.value = 2.2;

      engineGain = audioCtx.createGain();
      engineGain.gain.value = 0.0;

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      waveDataArray = new Uint8Array(analyser.frequencyBinCount);

      osc1.connect(engineFilter);
      osc2.connect(engineFilter);
      osc3.connect(osc3Gain);
      osc3Gain.connect(engineFilter);
      engineFilter.connect(engineGain);

      forcedIndOsc.connect(forcedIndGain);
      forcedIndGain.connect(analyser);
      engineGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc3.start();
      forcedIndOsc.start();

      // White noise buffer for Turbo Blow-Off Valve (BOV) & Tire Screech
      const bufSize = audioCtx.sampleRate * 0.5;
      noiseBuffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      musicMasterGain = audioCtx.createGain();
      const volInput = document.getElementById('music-vol');
      musicMasterGain.gain.value = (volInput ? parseFloat(volInput.value) : 0.55) * 0.25;
      musicMasterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  /**
   * Triggers a realistic Turbo Blow-Off Valve (BOV) 'Psshh / Stu-tu-tu' flutter when
   * lifting off the throttle or upshifting under positive turbo boost.
   */
  function triggerTurboBOV(boostBar) {
    if (!soundEnabled || !audioCtx || !noiseBuffer || boostBar < 0.25) return;
    const now = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;

    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2800, now);
    bp.frequency.exponentialRampToValueAtTime(1200, now + 0.28);
    bp.Q.value = 3.5;

    const g = audioCtx.createGain();
    const peak = Math.min(0.14, boostBar * 0.07);
    // Flutter envelope (stu-tu-tu)
    g.gain.setValueAtTime(peak, now);
    g.gain.setValueAtTime(peak * 0.35, now + 0.055);
    g.gain.setValueAtTime(peak * 0.80, now + 0.095);
    g.gain.setValueAtTime(peak * 0.25, now + 0.145);
    g.gain.setValueAtTime(peak * 0.55, now + 0.185);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    src.connect(bp);
    bp.connect(g);
    g.connect(analyser);
    src.start(now);
    src.stop(now + 0.34);
  }

  /**
   * Triggers an exhaust overrun crackle/pop on manual or high-RPM gearshifts.
   */
  function triggerShiftPop() {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(115, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.09);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    o.connect(g);
    g.connect(analyser);
    o.start(now);
    o.stop(now + 0.1);
  }

  function updateEngineAudio(rpm, redline, throttle, wantNos, isPlaying, soundProfile, aspiration, boostBar) {
    if (!audioCtx || !engineGain) return;
    if (!isPlaying || !soundEnabled) {
      engineGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.08);
      if (forcedIndGain) forcedIndGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.08);
      return;
    }

    const prof = ENGINE_ACOUSTICS[soundProfile] || ENGINE_ACOUSTICS.v8_flatplane;
    if (currentProfileKey !== soundProfile) {
      currentProfileKey = soundProfile;
      osc1.type = prof.w1;
      osc2.type = prof.w2;
      osc3.type = prof.w3;
    }

    const rpmNorm = Math.max(0, Math.min(1.1, rpm / Math.max(4000, redline)));
    const baseFreq = (38 + rpmNorm * 165 + (wantNos ? 22 : 0)) * prof.baseMult;

    // VTEC high-cam harmonic crossover above 68% of redline on NA I4/Flat6/V10/V12
    const vtecBoost = (aspiration === 'NA' && rpmNorm > 0.68) ? 1.35 : 1.0;

    osc1.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.03);
    osc2.frequency.setTargetAtTime(baseFreq * prof.h2, audioCtx.currentTime, 0.03);
    osc3.frequency.setTargetAtTime(baseFreq * prof.h3, audioCtx.currentTime, 0.03);

    const cutoff = (prof.filterBase + rpmNorm * prof.filterSpan + (throttle ? 340 : 0)) * vtecBoost;
    engineFilter.frequency.setTargetAtTime(Math.min(5500, cutoff), audioCtx.currentTime, 0.035);

    const targetGain = (0.036 + (throttle ? 0.056 : 0.012) + rpmNorm * 0.025) * prof.gainMult;
    engineGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.04);

    // Forced Induction Whine: Supercharger whine or Turbocharger spool whistle
    if (aspiration === 'SUPERCHARGED') {
      forcedIndOsc.type = 'triangle';
      forcedIndOsc.frequency.setTargetAtTime(750 + rpmNorm * 2650, audioCtx.currentTime, 0.03);
      forcedIndGain.gain.setTargetAtTime((0.008 + boostBar * 0.024) * (throttle ? 1.0 : 0.25), audioCtx.currentTime, 0.04);
    } else if (aspiration === 'TURBO' || aspiration === 'TWIN-TURBO') {
      forcedIndOsc.type = 'sine';
      forcedIndOsc.frequency.setTargetAtTime(1600 + boostBar * 1850, audioCtx.currentTime, 0.04);
      forcedIndGain.gain.setTargetAtTime(Math.max(0, boostBar * 0.016), audioCtx.currentTime, 0.05);
    } else {
      forcedIndGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.05);
    }
  }

  /**
   * Renders the live engine acoustic sound wave on the HUD oscilloscope canvas.
   */
  function drawEngineWaveform(canvasCtx, w, h, rpm, redline, aspiration, boostBar) {
    if (!canvasCtx) return;
    canvasCtx.clearRect(0, 0, w, h);

    // Subtle oscilloscope grid
    canvasCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, h / 2);
    canvasCtx.lineTo(w, h / 2);
    canvasCtx.stroke();

    const waveColor = aspiration === 'NA'
      ? '#4ade80'
      : (aspiration === 'SUPERCHARGED' ? '#f59e0b' : '#38bdf8');
    canvasCtx.strokeStyle = waveColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();

    if (analyser && waveDataArray && audioCtx && audioCtx.state === 'running' && soundEnabled) {
      analyser.getByteTimeDomainData(waveDataArray);
      const len = waveDataArray.length;
      for (let i = 0; i < len; i++) {
        const x = (i / (len - 1)) * w;
        const v = (waveDataArray[i] - 128) / 128;
        const y = h / 2 + v * (h * 0.42) * 3.2;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
    } else {
      // Synthetic harmonic wave preview when audio is muted or before first click
      const t = performance.now() * 0.005;
      const freq = 2.0 + (rpm / Math.max(4000, redline)) * 8.0;
      const amp = (0.3 + (rpm / Math.max(4000, redline)) * 0.65) * (h * 0.36);
      for (let x = 0; x <= w; x += 2) {
        const phase = (x / w) * Math.PI * 2 * freq + t;
        const y = h / 2 + (Math.sin(phase) * 0.65 + Math.sin(phase * 2 + boostBar) * 0.35) * amp;
        if (x === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
    }
    canvasCtx.stroke();
  }

  // Stereo Radio Synth
  function playNote(freq, dur, type, vol, target) {
    if (!audioCtx || !freq) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g);
    g.connect(target);
    o.start(now);
    o.stop(now + dur);
  }

  function playKick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.setValueAtTime(135, now);
    o.frequency.exponentialRampToValueAtTime(36, now + 0.14);
    g.gain.setValueAtTime(0.55, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o.connect(g);
    g.connect(musicMasterGain);
    o.start(now);
    o.stop(now + 0.17);
  }

  function startMusicLoop() {
    stopMusicLoop();
    ensureAudio();
    const tr = TRACKS[trackIdx];
    const trackEl = document.getElementById('stereo-track');
    if (trackEl) trackEl.textContent = tr.name;
    const stepMs = (60 / tr.bpm / 2) * 1000;
    musicTimer = setInterval(() => {
      if (!musicPlaying || !audioCtx) return;
      const idx = musicStep % 8;
      if (musicStep % 2 === 0) playKick();
      playNote(tr.bass[idx], stepMs * 0.0011, 'sawtooth', 0.22, musicMasterGain);
      if (musicStep % 2 === 1 || idx % 3 === 0) {
        playNote(tr.lead[idx], stepMs * 0.0014, tr.wave, 0.13, musicMasterGain);
      }
      eqBars.forEach(b => { b.style.height = (4 + Math.floor(Math.random() * 11)) + 'px'; });
      musicStep++;
    }, stepMs);
  }

  function stopMusicLoop() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    eqBars.forEach(b => { b.style.height = '3px'; });
  }

  function toggleMusic(forcePlay) {
    musicPlaying = typeof forcePlay === 'boolean' ? forcePlay : !musicPlaying;
    if (btnPlayMusic) {
      btnPlayMusic.textContent = musicPlaying ? '⏸ Pause' : '▶ Music';
      btnPlayMusic.classList.toggle('playing', musicPlaying);
    }
    if (musicPlaying) startMusicLoop(); else stopMusicLoop();
  }

  if (btnPlayMusic) btnPlayMusic.addEventListener('click', () => toggleMusic());
  const prevBtn = document.getElementById('btn-prev-track');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    trackIdx = (trackIdx - 1 + TRACKS.length) % TRACKS.length;
    document.getElementById('stereo-track').textContent = TRACKS[trackIdx].name;
    if (musicPlaying) startMusicLoop();
  });
  const nextBtn = document.getElementById('btn-next-track');
  if (nextBtn) nextBtn.addEventListener('click', () => {
    trackIdx = (trackIdx + 1) % TRACKS.length;
    document.getElementById('stereo-track').textContent = TRACKS[trackIdx].name;
    if (musicPlaying) startMusicLoop();
  });
  const volSlider = document.getElementById('music-vol');
  if (volSlider) volSlider.addEventListener('input', e => {
    if (musicMasterGain && audioCtx) {
      musicMasterGain.gain.setTargetAtTime(parseFloat(e.target.value) * 0.25, audioCtx.currentTime, 0.04);
    }
  });

  if (btnSound) btnSound.addEventListener('click', () => {
    ensureAudio();
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? 'Engine: ON' : 'Engine: OFF';
    btnSound.classList.toggle('active', soundEnabled);
  });

  function playChime(freq, dur, type = 'triangle', vol = 0.14) {
    if (!soundEnabled || !audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), now = audioCtx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(freq * 1.45, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + dur);
  }

  function playFanfare() {
    if (!soundEnabled || !audioCtx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => playChime(f, 0.22, 'triangle', 0.16), idx * 75);
    });
  }

  return {
    ensureAudio,
    playChime,
    playFanfare,
    triggerTurboBOV,
    triggerShiftPop,
    updateEngineAudio,
    drawEngineWaveform
  };
}
