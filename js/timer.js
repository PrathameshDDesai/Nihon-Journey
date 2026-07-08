/**
 * timer.js - Persistent Pomodoro & Study Timer Service for Nihon Journey
 * Synchronizes timer state in localStorage to persist countdowns across page loads.
 */

(function () {
    const TIMER_STATE_KEY = 'nihon_timer_state';

    const TimerPresets = {
        WORK_25: { label: 'Work (25m)', seconds: 25 * 60, mode: 'work' },
        BREAK_5: { label: 'Short Break (5m)', seconds: 5 * 60, mode: 'break' },
        WORK_50: { label: 'Work (50m)', seconds: 50 * 60, mode: 'work' },
        BREAK_10: { label: 'Long Break (10m)', seconds: 10 * 60, mode: 'break' }
    };

    let state = {
        mode: 'work', // 'work' | 'break' | 'custom'
        totalDuration: 25 * 60,
        secondsRemaining: 25 * 60,
        isRunning: false,
        lastUpdated: Date.now()
    };

    let intervalId = null;

    // Web Audio Synthesizer for notifications
    function playNotificationSound() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            const audioCtx = new AudioContextClass();
            const now = audioCtx.currentTime;
            
            // Dual-tone high-pitch chime (Japanese Temple Bell inspired soft synth)
            const playTone = (freq, startTime, duration, vol = 0.2) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);
                
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
            };
            
            playTone(523.25, now, 0.4, 0.15); // C5
            playTone(659.25, now + 0.12, 0.4, 0.15); // E5
            playTone(783.99, now + 0.24, 0.6, 0.2); // G5
        } catch (e) {
            console.warn('AudioContext sound failed to play:', e);
        }
    }

    function loadState() {
        const saved = localStorage.getItem(TIMER_STATE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
                
                // If it was running, calculate elapsed time and catch up
                if (state.isRunning) {
                    const elapsedSeconds = Math.floor((Date.now() - state.lastUpdated) / 1000);
                    state.secondsRemaining -= elapsedSeconds;
                    
                    if (state.secondsRemaining <= 0) {
                        // Timer completed while away
                        const completedDuration = state.secondsRemaining + elapsedSeconds;
                        if (completedDuration > 0 && state.mode === 'work') {
                            window.NihonStorage.addStudyTime(window.NihonStorage.getLocalDateString(), completedDuration);
                        }
                        
                        state.secondsRemaining = 0;
                        state.isRunning = false;
                        
                        // Notify completed
                        setTimeout(() => {
                            triggerTimerCompletion();
                        }, 500);
                    } else {
                        // Still has time, resume
                        startCountdown();
                    }
                }
            } catch (e) {
                console.error('Failed to load timer state:', e);
            }
        }
    }

    function saveState() {
        state.lastUpdated = Date.now();
        localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    }

    function startCountdown() {
        if (intervalId) clearInterval(intervalId);
        
        intervalId = setInterval(() => {
            if (state.secondsRemaining > 0) {
                state.secondsRemaining--;
                
                // Track study time if in work mode
                if (state.mode === 'work') {
                    window.NihonStorage.addStudyTime(window.NihonStorage.getLocalDateString(), 1);
                }
                
                saveState();
                updateUI();
            } else {
                clearInterval(intervalId);
                state.isRunning = false;
                saveState();
                updateUI();
                triggerTimerCompletion();
            }
        }, 1000);
    }

    function triggerTimerCompletion() {
        playNotificationSound();
        
        const title = state.mode === 'work' ? 'Study Session Finished!' : 'Break Finished!';
        const body = state.mode === 'work' 
            ? 'お疲れ様でした (Otsukaresama deshita)! Take a short break.' 
            : 'Time to study! Let\'s go!';
        
        // In-app Toast notification
        if (window.NihonApp && window.NihonApp.showToast) {
            window.NihonApp.showToast(title, body, 'success');
        }
        
        // System notification
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        }
        
        // Dispatch custom event so pages can react (e.g. reload progress)
        window.dispatchEvent(new CustomEvent('nihon_timer_done', { detail: { mode: state.mode } }));
        
        // Auto reset to default mode preset
        if (state.mode === 'work') {
            setPreset('BREAK_5');
        } else {
            setPreset('WORK_25');
        }
    }

    function updateUI() {
        // Dispatch event for any active page listeners
        window.dispatchEvent(new CustomEvent('nihon_timer_tick', { detail: state }));
        
        // Update sidebar mini timer if it exists
        const timeEl = document.getElementById('mini-timer-time');
        const playBtn = document.getElementById('mini-timer-play');
        
        if (timeEl) {
            timeEl.textContent = formatTime(state.secondsRemaining);
        }
        if (playBtn) {
            if (state.isRunning) {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playBtn.title = 'Pause';
            } else {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                playBtn.title = 'Start';
            }
        }
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function setPreset(presetKey) {
        const preset = TimerPresets[presetKey];
        if (preset) {
            state.mode = preset.mode;
            state.totalDuration = preset.seconds;
            state.secondsRemaining = preset.seconds;
            state.isRunning = false;
            if (intervalId) clearInterval(intervalId);
            saveState();
            updateUI();
        }
    }

    // Public API
    const NihonTimer = {
        init() {
            loadState();
            updateUI();
            
            // Listen for play/pause from sidebar buttons (using event delegation on document)
            document.addEventListener('click', (e) => {
                const target = e.target.closest('#mini-timer-play');
                if (target) {
                    NihonTimer.toggle();
                }
                
                const resetTarget = e.target.closest('#mini-timer-reset');
                if (resetTarget) {
                    NihonTimer.reset();
                }
            });
        },
        
        start() {
            if (!state.isRunning && state.secondsRemaining > 0) {
                state.isRunning = true;
                saveState();
                startCountdown();
                updateUI();
                
                // Request notification permission
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }
        },
        
        pause() {
            if (state.isRunning) {
                state.isRunning = false;
                if (intervalId) clearInterval(intervalId);
                saveState();
                updateUI();
            }
        },
        
        toggle() {
            if (state.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },
        
        reset() {
            this.pause();
            state.secondsRemaining = state.totalDuration;
            saveState();
            updateUI();
        },
        
        setCustomTime(minutes) {
            this.pause();
            const sec = parseInt(minutes) * 60;
            state.mode = 'custom';
            state.totalDuration = sec;
            state.secondsRemaining = sec;
            saveState();
            updateUI();
        },
        
        setTimerPreset(key) {
            setPreset(key);
        },
        
        getState() {
            return state;
        },
        
        formatTime(sec) {
            return formatTime(sec);
        }
    };

    // Initialize on script load
    document.addEventListener('DOMContentLoaded', () => {
        NihonTimer.init();
    });

    window.NihonTimer = NihonTimer;
})();
