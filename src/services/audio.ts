/**
 * Audio synthesis & recording service for mobile ringtones,
 * message alerts, and voice messages.
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private isRingtonePlaying = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play mobile ringtone (harmonic marimba ring chime cycle)
   */
  startMobileRingtone(): void {
    if (this.isRingtonePlaying) return;
    this.isRingtonePlaying = true;

    const playRingPattern = () => {
      if (!this.isRingtonePlaying) return;
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Realistic marimba phone melody notes (E5, G#5, B5, E6, etc.)
      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.12 },
        { freq: 830.61, time: 0.14, dur: 0.12 },
        { freq: 987.77, time: 0.28, dur: 0.12 },
        { freq: 1318.5, time: 0.42, dur: 0.2 },
        { freq: 987.77, time: 0.68, dur: 0.12 },
        { freq: 1318.5, time: 0.82, dur: 0.35 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        // Natural percussive envelope
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.4, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    };

    playRingPattern();
    this.ringtoneInterval = window.setInterval(playRingPattern, 2200);
  }

  /**
   * Stop ringtone
   */
  stopMobileRingtone(): void {
    this.isRingtonePlaying = false;
    if (this.ringtoneInterval !== null) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Play modern text message notification chime
   */
  playMessageChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio context error
    }
  }

  /**
   * Play consent granted confirmation chime
   */
  playConsentChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  }

  /**
   * Start microphone recording for voice notes
   */
  async startRecording(): Promise<boolean> {
    try {
      this.audioChunks = [];
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.onerror = () => {
        // Stop stream tracks on error
        try {
          stream.getTracks().forEach(t => t.stop());
        } catch {
          // ignore
        }
      };
      this.mediaRecorder.start();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stop recording and get audio blob URL + duration
   */
  async stopRecording(): Promise<{ blobUrl: string; duration: number } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      const recorder = this.mediaRecorder;
      const stream = recorder.stream;

      recorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const blobUrl = URL.createObjectURL(audioBlob);
          
          // Stop stream tracks
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
          
          // Estimate approx duration based on chunk count or default
          const approxDuration = Math.max(2, Math.round(this.audioChunks.length * 0.8));
          resolve({ blobUrl, duration: approxDuration });
        } catch {
          resolve(null);
        }
      };

      try {
        recorder.stop();
      } catch {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        resolve(null);
      }
    });
  }

  /**
   * Play geofence safe-zone arrival / departure chime
   */
  playGeofenceChime(type: 'entry' | 'exit' = 'entry'): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = type === 'entry'
        ? [440, 554.37, 659.25, 880] // A4, C#5, E5, A5 (bright ascending chime)
        : [880, 659.25, 554.37, 440]; // descending chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.28);
      });
    } catch {
      // Audio context fallback
    }
  }

  /**
   * Play urgent SOS emergency sound (rapid alternating siren tone)
   */
  playSosAlert(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = i % 2 === 0 ? 980 : 750;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.16);

        gain.gain.setValueAtTime(0.001, now + i * 0.16);
        gain.gain.linearRampToValueAtTime(0.35, now + i * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.15);
      }
    } catch {
      // Audio context fallback
    }
  }

  /**
   * Haptic vibration feedback for mobile devices
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') navigator.vibrate(20);
      else if (type === 'medium') navigator.vibrate([40, 30, 40]);
      else navigator.vibrate([80, 50, 80, 50, 120]);
    }
  }
}

export const audioService = new AudioService();
