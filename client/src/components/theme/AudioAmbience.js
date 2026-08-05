"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function createNoiseBuffer(ctx, seconds = 2) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.992 + white * 0.035;
        data[i] = last * 3.4;
    }
    return buffer;
}

const CHORDS = [
    { notes: [220.0, 261.63, 329.63], bass: 110.0 },
    { notes: [174.61, 220.0, 261.63], bass: 87.31 },
    { notes: [196.0, 246.94, 293.66], bass: 98.0 },
    { notes: [164.81, 196.0, 246.94], bass: 82.41 },
];

const CHORD_DURATION = 10;
const AMBIENT_VOLUME = 0.15;

export default function AudioAmbience() {
    const [enabled, setEnabled] = useState(false);
    const ctxRef = useRef(null);
    const masterRef = useRef(null);
    const startedRef = useRef(false);
    const chordIndexRef = useRef(0);
    const engineRef = useRef({ playChord: null, bassOsc: null, bassGain: null, cleanup: null });

    const buildScene = useCallback((ctx) => {
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.connect(ctx.destination);
        masterRef.current = master;

        // ── Vinyl crackle + hiss ─────────────────────────────
        const noise = createNoiseBuffer(ctx);
        const crackleSrc = ctx.createBufferSource();
        crackleSrc.buffer = noise;
        crackleSrc.loop = true;

        const crackleFilter = ctx.createBiquadFilter();
        crackleFilter.type = "bandpass";
        crackleFilter.frequency.value = 1900;
        crackleFilter.Q.value = 0.35;

        const crackleGain = ctx.createGain();
        crackleGain.gain.value = 0.32;
        crackleSrc.connect(crackleFilter).connect(crackleGain).connect(master);
        crackleSrc.start();

        // Occasional soft pops (rescheduled forever)
        let popTimer = null;
        const schedulePop = () => {
            const popBuf = createNoiseBuffer(ctx, 0.06);
            const src = ctx.createBufferSource();
            src.buffer = popBuf;
            const g = ctx.createGain();
            const delay = 0.5 + Math.random() * 2.4;
            const t0 = ctx.currentTime + delay;
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(0.22 + Math.random() * 0.3, t0 + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
            src.connect(g).connect(master);
            src.start(t0);
            src.stop(t0 + 0.1);
            popTimer = setTimeout(schedulePop, 700 + Math.random() * 2600);
        };
        schedulePop();

        // ── Warm lo-fi pad ────────────────────────────────────
        const padGain = ctx.createGain();
        padGain.gain.value = 0.0001;

        const padFilter = ctx.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.value = 560;
        padFilter.Q.value = 0.4;
        padGain.connect(padFilter).connect(master);

        // Slow filter wobble for the analog feel
        const filterLfo = ctx.createOscillator();
        filterLfo.frequency.value = 0.07;
        const filterLfoGain = ctx.createGain();
        filterLfoGain.gain.value = 42;
        filterLfo.connect(filterLfoGain).connect(padFilter.frequency);
        filterLfo.start();

        // Gentle tremolo
        const tremolo = ctx.createOscillator();
        tremolo.frequency.value = 0.13;
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 0.035;
        tremolo.connect(tremoloGain).connect(padGain.gain);
        tremolo.start();

        // ── Soft bass ─────────────────────────────────────────
        const bassOsc = ctx.createOscillator();
        bassOsc.type = "sine";
        bassOsc.frequency.value = 110;
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0.0001;
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = "lowpass";
        bassFilter.frequency.value = 320;
        bassOsc.connect(bassFilter).connect(bassGain).connect(master);
        bassOsc.start();

        engineRef.current.bassOsc = bassOsc;
        engineRef.current.bassGain = bassGain;

        // ── Chord scheduler ───────────────────────────────────
        const playChord = (chord, delay) => {
            const now = ctx.currentTime + delay;
            const attack = now + 1.3;
            const release = now + CHORD_DURATION - 1.0;
            for (const note of chord.notes) {
                for (const detune of [-5, 5]) {
                    const osc = ctx.createOscillator();
                    osc.type = "triangle";
                    osc.frequency.value = note;
                    osc.detune.value = detune;
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.0001, now);
                    g.gain.linearRampToValueAtTime(0.05, attack);
                    g.gain.setValueAtTime(0.05, release);
                    g.gain.linearRampToValueAtTime(0.0001, release + 0.9);
                    osc.connect(g).connect(padGain);
                    osc.start(now);
                    osc.stop(release + 1);
                }
            }
            if (engineRef.current.bassOsc) {
                engineRef.current.bassOsc.frequency.setTargetAtTime(chord.bass, now + 0.3, 0.5);
            }
        };
        engineRef.current.playChord = playChord;

        const interval = setInterval(() => {
            if (!startedRef.current) return;
            const idx = chordIndexRef.current;
            chordIndexRef.current += 1;
            playChord(CHORDS[idx % CHORDS.length], 0);
        }, CHORD_DURATION * 1000);

        engineRef.current.cleanup = () => {
            clearInterval(interval);
            if (engineRef.current.cleanupTimer) clearTimeout(engineRef.current.cleanupTimer);
            if (popTimer) clearTimeout(popTimer);
            try { crackleSrc.stop(); } catch {}
            try { filterLfo.stop(); } catch {}
            try { tremolo.stop(); } catch {}
            try { bassOsc.stop(); } catch {}
        };
    }, []);

    const startAmbience = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;
        if (!startedRef.current) {
            startedRef.current = true;
            chordIndexRef.current = 0;
            if (engineRef.current.playChord) {
                engineRef.current.playChord(CHORDS[0], 0.4);
                chordIndexRef.current = 1;
            }
            if (engineRef.current.bassGain) {
                engineRef.current.bassGain.gain.cancelScheduledValues(now);
                engineRef.current.bassGain.gain.setValueAtTime(0.0001, now);
                engineRef.current.bassGain.gain.linearRampToValueAtTime(0.14, now + 2.5);
            }
        }
        if (masterRef.current) {
            masterRef.current.gain.cancelScheduledValues(now);
            masterRef.current.gain.setValueAtTime(0.0001, now);
            masterRef.current.gain.exponentialRampToValueAtTime(AMBIENT_VOLUME, now + 2.5);
        }
        setEnabled(true);
    }, []);

    const stopAmbience = useCallback(() => {
        const ctx = ctxRef.current;
        startedRef.current = false;
        if (ctx && masterRef.current) {
            const now = ctx.currentTime;
            masterRef.current.gain.cancelScheduledValues(now);
            masterRef.current.gain.setValueAtTime(Math.max(masterRef.current.gain.value, 0.0001), now);
            masterRef.current.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        }
        setEnabled(false);
    }, []);

    const toggle = useCallback(() => {
        if (enabled) {
            stopAmbience();
        } else {
            startAmbience();
        }
    }, [enabled, startAmbience, stopAmbience]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;

        const ctx = new AC();
        ctxRef.current = ctx;
        buildScene(ctx);
        const engine = engineRef.current;

        // Attempt autoplay on load (may be blocked by the browser)
        if (ctx.state === "running") {
            const t = setTimeout(() => startAmbience(), 0);
            engine.cleanupTimer = t;
        }

        // Fallback: start on the first user gesture
        const unlock = () => {
            if (!ctxRef.current) return;
            if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
            if (!startedRef.current) startAmbience();
        };
        window.addEventListener("pointerdown", unlock);
        window.addEventListener("keydown", unlock);

        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
            if (engine.cleanup) engine.cleanup();
            try { ctx.close(); } catch {}
            ctxRef.current = null;
        };
    }, [buildScene, startAmbience]);

    return (
        <button
            type="button"
            className="ambient-toggle fixed bottom-5 right-5 z-50"
            onClick={toggle}
            aria-label={enabled ? "Mute ambient audio" : "Play ambient audio"}
            aria-pressed={enabled}
            title={enabled ? "Mute ambient audio" : "Play ambient audio"}
        >
            {enabled ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
                    <path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
                    <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
        </button>
    );
}
