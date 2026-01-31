/**
 * AudioManager - Web Audio API の管理クラス
 */
class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.bgmOscillators = [];
        this.isMuted = true; // User requested audio to be muted by default
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    resumeContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playTone(freq, type, duration, startTime = 0, vol = 0.1) {
        if (this.isMuted) return;
        if (!this.audioCtx) this.init();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);

        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + startTime);
        osc.stop(this.audioCtx.currentTime + startTime + duration);
    }

    playBGM(type) {
        if (this.isMuted) return;
        if (!this.audioCtx) this.init();

        this.stopBGM();

        if (type === 'main') {
            // Dark pad sound
            const freqs = [55, 110, 165]; // Low A chord
            freqs.forEach(f => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = f;

                // LFO for suspense
                const lfo = this.audioCtx.createOscillator();
                const lfoGain = this.audioCtx.createGain();
                lfo.frequency.value = 0.2; // Slow pulse
                lfo.connect(lfoGain);
                lfoGain.gain.value = 200;
                lfoGain.connect(osc.detune);
                lfo.start();

                gain.gain.value = 0.03;

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();

                this.bgmOscillators.push({ osc, gain, lfo });
            });
        }
    }

    stopBGM() {
        this.bgmOscillators.forEach(o => {
            try {
                o.osc.stop();
                if (o.lfo) o.lfo.stop();
            } catch (e) { }
        });
        this.bgmOscillators = [];
    }

    playSFX(type) {
        if (this.isMuted) return;
        this.resumeContext();

        switch (type) {
            case 'correct':
                // Fanfare
                this.playTone(440, 'triangle', 0.1, 0); // A4
                this.playTone(554, 'triangle', 0.1, 0.1); // C#5
                this.playTone(659, 'triangle', 0.4, 0.2); // E5
                this.playTone(880, 'triangle', 0.8, 0.3); // A5
                break;
            case 'wrong':
                // Low shock
                this.playTone(100, 'sawtooth', 0.5, 0, 0.2);
                this.playTone(90, 'sawtooth', 0.5, 0.1, 0.2);
                break;
            case 'suspense':
                // Heartbeat
                this.playTone(60, 'sine', 0.1, 0, 0.3);
                this.playTone(60, 'sine', 0.1, 0.3, 0.2);
                break;
            case 'select':
                this.playTone(800, 'sine', 0.05, 0, 0.1);
                break;
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stopBGM();
        }
    }

    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }
}
