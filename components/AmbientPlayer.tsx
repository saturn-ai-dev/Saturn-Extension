import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';

// ─── MELODY DEFINITIONS ──────────────────────────────────────────────────────
// Each note: [frequency Hz, duration beats]  (1 beat = 60000/bpm ms)
// Using pentatonic / modal scales for ambient feel

const MELODIES = [
    {
        name: 'Cosmos',
        bpm: 72,
        notes: [
            // Main theme — dum dum dum dum dum dum dumdum
            [261.63, 1], [293.66, 1], [329.63, 1], [392.00, 1],
            [440.00, 1], [392.00, 1], [329.63, 0.5], [293.66, 0.5],
            [261.63, 2],
            // Variation
            [196.00, 1], [220.00, 1], [261.63, 1], [329.63, 1],
            [293.66, 1], [261.63, 1], [220.00, 0.5], [196.00, 0.5],
            [174.61, 2],
        ]
    },
    {
        name: 'Drift',
        bpm: 60,
        notes: [
            [220.00, 1.5], [261.63, 0.5], [293.66, 1], [329.63, 1],
            [349.23, 2],
            [329.63, 1], [293.66, 1], [261.63, 1.5], [220.00, 0.5],
            [196.00, 2],
            [174.61, 1], [196.00, 1], [220.00, 1], [261.63, 1],
            [246.94, 1.5], [220.00, 0.5], [196.00, 1],
            [174.61, 3],
        ]
    },
    {
        name: 'Pulsar',
        bpm: 80,
        notes: [
            [329.63, 0.5], [329.63, 0.5], [392.00, 0.5], [329.63, 0.5],
            [293.66, 0.5], [261.63, 0.5], [293.66, 0.5], [261.63, 0.5],
            [246.94, 0.5], [246.94, 0.5], [261.63, 0.5], [293.66, 0.5],
            [329.63, 2],
            [392.00, 0.5], [440.00, 0.5], [392.00, 0.5], [349.23, 0.5],
            [329.63, 0.5], [293.66, 0.5], [261.63, 0.5], [246.94, 0.5],
            [220.00, 3],
        ]
    },
    {
        name: 'Nebula',
        bpm: 55,
        notes: [
            [130.81, 2], [146.83, 2], [164.81, 2], [174.61, 2],
            [164.81, 1], [155.56, 1], [146.83, 2],
            [138.59, 2], [130.81, 4],
            [196.00, 2], [185.00, 1], [174.61, 1],
            [164.81, 2], [155.56, 2], [146.83, 4],
        ]
    },
];

// ─── SYNTH ENGINE ─────────────────────────────────────────────────────────────

class AmbientSynth {
    ctx: AudioContext;
    masterGain: GainNode;
    reverbNode: ConvolverNode;
    reverbGain: GainNode;
    dryGain: GainNode;
    compressor: DynamicsCompressorNode;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;

        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = 0.55;

        // Reverb impulse (synthetic)
        this.reverbNode = ctx.createConvolver();
        this.reverbNode.buffer = this.makeReverb(3.5);

        this.reverbGain = ctx.createGain();
        this.reverbGain.gain.value = 0.55;

        this.dryGain = ctx.createGain();
        this.dryGain.gain.value = 0.5;

        // Routing: masterGain → dry + reverb → compressor → destination
        this.masterGain.connect(this.dryGain);
        this.masterGain.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbGain);
        this.dryGain.connect(this.compressor);
        this.reverbGain.connect(this.compressor);
        this.compressor.connect(ctx.destination);
    }

    makeReverb(durationSec: number): AudioBuffer {
        const sr = this.ctx.sampleRate;
        const len = sr * durationSec;
        const buf = this.ctx.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) {
            const data = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
            }
        }
        return buf;
    }

    playNote(freq: number, startTime: number, duration: number, volume = 0.4) {
        const ctx = this.ctx;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator(); // subtle detune for warmth
        const envGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.004; // slight detune

        filter.type = 'lowpass';
        filter.frequency.value = 1800;
        filter.Q.value = 0.8;

        const attackEnd = startTime + 0.06;
        const decayEnd = attackEnd + 0.1;
        const sustainEnd = startTime + duration * 0.75;
        const releaseEnd = startTime + duration + 0.3;

        envGain.gain.setValueAtTime(0, startTime);
        envGain.gain.linearRampToValueAtTime(volume, attackEnd);
        envGain.gain.linearRampToValueAtTime(volume * 0.75, decayEnd);
        envGain.gain.setValueAtTime(volume * 0.75, sustainEnd);
        envGain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(envGain);
        envGain.connect(this.masterGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(releaseEnd);
        osc2.stop(releaseEnd);

        // Low sub pad for texture
        if (freq < 400) {
            const sub = ctx.createOscillator();
            const subGain = ctx.createGain();
            sub.type = 'sine';
            sub.frequency.value = freq * 0.5;
            subGain.gain.setValueAtTime(0, startTime);
            subGain.gain.linearRampToValueAtTime(volume * 0.2, attackEnd);
            subGain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);
            sub.connect(subGain);
            subGain.connect(this.masterGain);
            sub.start(startTime);
            sub.stop(releaseEnd);
        }
    }

    setVolume(v: number) {
        this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.3);
    }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const AMBIENT_PLAYER_KEY = 'saturn_ambient_player';

interface AmbientPlayerProps {
    defaultOpen?: boolean;
}

const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ defaultOpen = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultOpen);
    const [isPlaying, setIsPlaying] = useState(false);
    const [melodyIdx, setMelodyIdx] = useState(0);
    const [volume, setVolume] = useState(0.45);
    const [currentNote, setCurrentNote] = useState(-1);

    const ctxRef = useRef<AudioContext | null>(null);
    const synthRef = useRef<AmbientSynth | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const noteIdxRef = useRef(0);
    const playingRef = useRef(false);

    // Load persisted state
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(AMBIENT_PLAYER_KEY) || '{}');
            if (saved.melodyIdx !== undefined) setMelodyIdx(saved.melodyIdx);
            if (saved.volume !== undefined) setVolume(saved.volume);
        } catch {}
    }, []);

    const persist = useCallback((patch: object) => {
        try {
            const existing = JSON.parse(localStorage.getItem(AMBIENT_PLAYER_KEY) || '{}');
            localStorage.setItem(AMBIENT_PLAYER_KEY, JSON.stringify({ ...existing, ...patch }));
        } catch {}
    }, []);

    const ensureCtx = useCallback(() => {
        if (!ctxRef.current || ctxRef.current.state === 'closed') {
            ctxRef.current = new AudioContext();
            synthRef.current = new AmbientSynth(ctxRef.current);
        }
        if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
        return { ctx: ctxRef.current, synth: synthRef.current! };
    }, []);

    const scheduleNext = useCallback((idx: number, melody: typeof MELODIES[0]) => {
        if (!playingRef.current) return;
        const { ctx, synth } = ensureCtx();
        const beatMs = (60 / melody.bpm) * 1000;
        const [freq, beats] = melody.notes[idx] as [number, number];
        const durationSec = (beats * beatMs) / 1000;

        synth.playNote(freq, ctx.currentTime, durationSec, volume);
        setCurrentNote(idx);

        const nextIdx = (idx + 1) % melody.notes.length;
        timeoutRef.current = setTimeout(() => {
            scheduleNext(nextIdx, melody);
        }, durationSec * 1000 * 0.92); // slight overlap for legato

        noteIdxRef.current = nextIdx;
    }, [ensureCtx, volume]);

    const start = useCallback(() => {
        playingRef.current = true;
        setIsPlaying(true);
        const melody = MELODIES[melodyIdx];
        scheduleNext(noteIdxRef.current, melody);
    }, [melodyIdx, scheduleNext]);

    const stop = useCallback(() => {
        playingRef.current = false;
        setIsPlaying(false);
        setCurrentNote(-1);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Gentle fade out
        if (synthRef.current) synthRef.current.setVolume(0);
        setTimeout(() => {
            if (ctxRef.current && ctxRef.current.state !== 'closed') {
                ctxRef.current.suspend();
            }
        }, 400);
    }, []);

    const toggle = useCallback(() => {
        if (isPlaying) stop();
        else start();
    }, [isPlaying, start, stop]);

    // Restart when melody changes while playing
    useEffect(() => {
        if (isPlaying) {
            stop();
            noteIdxRef.current = 0;
            setTimeout(start, 300);
        }
    }, [melodyIdx]); // eslint-disable-line

    // Update volume live
    useEffect(() => {
        if (synthRef.current) synthRef.current.setVolume(volume);
        persist({ volume });
    }, [volume, persist]);

    useEffect(() => {
        persist({ melodyIdx });
    }, [melodyIdx, persist]);

    // Cleanup
    useEffect(() => () => {
        playingRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const melody = MELODIES[melodyIdx];
    const totalNotes = melody.notes.length;

    return (
        <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-2">
            {/* Expanded panel */}
            {isExpanded && (
                <div className="w-72 bg-zen-surface/95 backdrop-blur-2xl border border-zen-border/50 rounded-[20px] shadow-[0_8px_40px_var(--accent-glow)] overflow-hidden animate-dropdown-open">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zen-border/30">
                        <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-zen-accent" />
                            <span className="text-sm font-fraunces font-bold text-zen-text">Ambient</span>
                            {isPlaying && (
                                <div className="flex items-end gap-[2px] h-3">
                                    {[0,1,2].map(i => (
                                        <div key={i} className="w-[3px] bg-zen-accent rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s`, height: `${6 + (currentNote % 3 === i ? 6 : 0)}px` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsExpanded(false)} className="text-zen-muted/50 hover:text-zen-text transition-colors">
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Melody selector */}
                    <div className="px-4 pt-4 pb-2">
                        <div className="text-[10px] font-bold text-zen-muted/60 uppercase tracking-widest mb-2">Melody</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {MELODIES.map((m, i) => (
                                <button
                                    key={m.name}
                                    onClick={() => setMelodyIdx(i)}
                                    className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-all ${i === melodyIdx ? 'bg-zen-accent/20 text-zen-accent border border-zen-accent/40' : 'bg-zen-bg/60 text-zen-muted hover:text-zen-text border border-zen-border/40 hover:border-zen-border'}`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note visualizer */}
                    <div className="px-4 pb-3">
                        <div className="flex items-end gap-[3px] h-8 bg-zen-bg/40 rounded-lg px-2 py-1">
                            {melody.notes.map(([, beats], i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-sm transition-all duration-150"
                                    style={{
                                        height: `${Math.min(100, (beats as number) * 40)}%`,
                                        backgroundColor: i === currentNote
                                            ? 'var(--accent-color)'
                                            : i < currentNote
                                                ? 'var(--accent-color)40'
                                                : 'rgba(255,255,255,0.08)',
                                        boxShadow: i === currentNote ? '0 0 8px var(--accent-color)' : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Volume */}
                    <div className="px-4 pb-3">
                        <div className="flex items-center gap-3">
                            <VolumeX className="w-3.5 h-3.5 text-zen-muted/50 shrink-0" />
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={volume}
                                onChange={e => setVolume(parseFloat(e.target.value))}
                                className="flex-1 h-1 accent-zen-accent appearance-none bg-zen-border rounded-full cursor-pointer"
                            />
                            <Volume2 className="w-3.5 h-3.5 text-zen-muted/50 shrink-0" />
                        </div>
                    </div>

                    {/* Play/Stop */}
                    <div className="px-4 pb-4">
                        <button
                            onClick={toggle}
                            className={`w-full py-2.5 rounded-[12px] text-sm font-semibold transition-all duration-200 ${isPlaying ? 'bg-zen-accent/10 text-zen-accent border border-zen-accent/40 hover:bg-zen-accent/20' : 'bg-zen-accent text-white hover:opacity-90'}`}
                            style={{ boxShadow: isPlaying ? '0 0 20px var(--accent-glow)' : undefined }}
                        >
                            {isPlaying ? 'Stop' : 'Play'}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating pill button */}
            <button
                onClick={() => setIsExpanded(e => !e)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 select-none ${isPlaying ? 'bg-zen-surface/90 border-zen-accent/50 text-zen-accent' : 'bg-zen-surface/80 border-zen-border/40 text-zen-muted hover:text-zen-text hover:border-zen-border'}`}
                style={{
                    backdropFilter: 'blur(20px)',
                    boxShadow: isPlaying ? '0 4px 24px var(--accent-glow)' : '0 2px 12px rgba(0,0,0,0.15)'
                }}
            >
                {isPlaying ? (
                    <div className="flex items-end gap-[2px] h-4">
                        {[0,1,2,3].map(i => (
                            <div key={i} className="w-[3px] bg-zen-accent rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.12}s`, height: `${8 + (i % 2 === 0 ? 6 : 0)}px` }} />
                        ))}
                    </div>
                ) : (
                    <Music className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{isPlaying ? melody.name : 'Ambient'}</span>
                {isExpanded ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronUp className="w-3 h-3 opacity-50" />}
            </button>
        </div>
    );
};

export default AmbientPlayer;
