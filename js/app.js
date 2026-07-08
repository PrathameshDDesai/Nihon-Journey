/**
 * app.js - Core UI Controller & Router for Nihon Journey
 * Injects sidebar, header, global Pomodoro modal, handles toasts, keyboard shortcuts, and animations.
 */

(function () {
    const NihonApp = {
        init() {
            this.injectSidebar();
            this.injectHeader();
            this.injectPomodoroModal();
            this.setupToastContainer();
            this.setupMobileMenu();
            this.setupGlobalEvents();
            this.setupKeyboardShortcuts();
            this.handleLoadingScreen();
            this.checkSessionNotifications();
        },

        // Get Current Page Name based on URL path
        getCurrentPage() {
            const path = window.location.pathname;
            const page = path.split('/').pop() || 'index.html';
            return page;
        },

        // Inject Sidebar HTML
        injectSidebar() {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (!sidebarContainer) return;

            const currentPage = this.getCurrentPage();
            const settings = window.NihonStorage.getSettings();
            
            // Check active nav link
            const isActive = (page) => {
                if (currentPage === page) return 'active';
                // Handle default route
                if (page === 'index.html' && (currentPage === '' || currentPage === '/')) return 'active';
                return '';
            };

            const html = `
                <div class="sidebar-logo">
                    <span class="logo-icon">⛩️</span>
                    <div class="logo-text">
                        <span>Nihon Journey</span>
                        <span class="logo-subtitle">日本旅行</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <a href="index.html" class="nav-link ${isActive('index.html')}">
                        <i class="fas fa-home"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="planner.html" class="nav-link ${isActive('planner.html')}">
                        <i class="fas fa-calendar-day"></i>
                        <span>Daily Planner</span>
                    </a>
                    <a href="ai-planner.html" class="nav-link ${isActive('ai-planner.html')}">
                        <i class="fas fa-brain"></i>
                        <span>AI Planner</span>
                    </a>
                    <a href="calendar.html" class="nav-link ${isActive('calendar.html')}">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Calendar</span>
                    </a>
                    <a href="journal.html" class="nav-link ${isActive('journal.html')}">
                        <i class="fas fa-book-open"></i>
                        <span>Journal</span>
                    </a>
                    <a href="stats.html" class="nav-link ${isActive('stats.html')}">
                        <i class="fas fa-chart-line"></i>
                        <span>Statistics</span>
                    </a>
                    <a href="settings.html" class="nav-link ${isActive('settings.html')}">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </a>
                </nav>
                <div class="sidebar-footer">
                    <!-- Mini Pomodoro Timer -->
                    <div class="mini-timer">
                        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 600;">
                            Study Timer
                        </div>
                        <div id="mini-timer-time" class="mini-timer-time">25:00</div>
                        <div class="mini-timer-controls">
                            <button id="mini-timer-play" class="mini-timer-btn" title="Start/Pause">
                                <i class="fas fa-play"></i>
                            </button>
                            <button id="mini-timer-reset" class="mini-timer-btn" title="Reset">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button id="mini-timer-maximize" class="mini-timer-btn" title="Maximize Timer">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <!-- User Profile Quick Card -->
                    <div class="user-widget" onclick="window.location.href='settings.html'">
                        <div class="user-avatar" id="sidebar-user-avatar">
                            ${settings.username ? settings.username.charAt(0).toUpperCase() : 'T'}
                        </div>
                        <div class="user-info">
                            <span class="user-name" id="sidebar-user-name">${settings.username || 'Tabi-bito'}</span>
                            <span class="user-status">Level ${this.calculateLevel()} Learner</span>
                        </div>
                    </div>
                </div>
            `;

            sidebarContainer.className = 'sidebar';
            sidebarContainer.innerHTML = html;
        },

        // Ingest Level based on total study time and task completions
        calculateLevel() {
            const streaks = window.NihonStorage.getStreaks();
            const tasks = window.NihonStorage.getAllTasks();
            
            let totalTasksCompleted = 0;
            Object.values(tasks).forEach(dayList => {
                totalTasksCompleted += dayList.filter(t => t.completed).length;
            });

            // Count AI tasks
            const aiSchedule = window.NihonStorage.getAiSchedule();
            totalTasksCompleted += aiSchedule.filter(t => t.completed).length;
            
            const studyTimeDb = window.NihonStorage.getAllStudyTime();
            let totalStudyMinutes = 0;
            Object.values(studyTimeDb).forEach(sec => totalStudyMinutes += (sec / 60));

            // Level formula: level = 1 + floor((completed tasks * 2 + study minutes) / 30)
            const points = (totalTasksCompleted * 2) + totalStudyMinutes;
            const level = Math.floor(points / 30) + 1;
            return level;
        },

        // Inject Header HTML
        injectHeader() {
            const headerContainer = document.getElementById('header-container');
            if (!headerContainer) return;

            const currentPage = this.getCurrentPage();
            const streaks = window.NihonStorage.getStreaks();
            const currentTheme = window.NihonTheme.getTheme();

            let pageTitle = 'Dashboard';
            let pageSub = 'Welcome back to your study path.';

            switch (currentPage) {
                case 'planner.html':
                    pageTitle = 'Daily Planner';
                    pageSub = 'Organize your tasks and crush your study targets.';
                    break;
                case 'ai-planner.html':
                    pageTitle = 'AI Study Planner';
                    pageSub = 'Schedule custom month-long learning paths and revision with Gemini.';
                    break;
                case 'calendar.html':
                    pageTitle = 'Monthly Progress';
                    pageSub = 'Reflect on your consistency and view study history.';
                    break;
                case 'journal.html':
                    pageTitle = 'Learning Journal';
                    pageSub = 'Document new grammar, vocabulary, and daily logs.';
                    break;
                case 'stats.html':
                    pageTitle = 'Performance Statistics';
                    pageSub = 'Visualize study hours, task categories, and badges.';
                    break;
                case 'settings.html':
                    pageTitle = 'Settings';
                    pageSub = 'Configure your learning targets, export backup, or reset.';
                    break;
            }

            const html = `
                <div class="mobile-nav-toggle" id="mobile-nav-toggle">
                    <i class="fas fa-bars"></i>
                </div>
                <div class="header-title-section">
                    <h1 id="page-display-title">${pageTitle}</h1>
                    <p id="page-display-subtitle">${pageSub}</p>
                </div>
                <div class="header-right">
                    <!-- Streak badge -->
                    <div class="streak-badge ${streaks.currentStreak > 0 ? 'active' : ''}" onclick="window.location.href='stats.html'" title="View Streaks and Achievements">
                        <i class="fas fa-fire"></i>
                        <span id="header-streak-count">${streaks.currentStreak} Days</span>
                    </div>
                    <!-- Theme switch -->
                    <button class="theme-toggle-btn" id="theme-toggle-btn" title="Toggle Theme (D)">
                        <i class="fas ${currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
                    </button>
                </div>
            `;

            headerContainer.className = 'main-header';
            headerContainer.innerHTML = html;
        },

        // Inject Global Pomodoro Overlay Modal
        injectPomodoroModal() {
            if (document.getElementById('global-timer-modal')) return;

            const modalHtml = `
                <div id="global-timer-modal" class="nihon-modal">
                    <div class="modal-content" style="max-width: 450px;">
                        <div class="modal-header">
                            <span class="modal-title"><i class="fas fa-hourglass-half" style="color: var(--primary); margin-right: 8px;"></i>Study Timer</span>
                            <button class="modal-close" id="global-timer-close">&times;</button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 32px 24px;">
                            <!-- Radial Progress for Pomodoro -->
                            <div class="progress-ring-container" style="margin-bottom: 24px;">
                                <svg width="200" height="200">
                                    <circle stroke="var(--border-color)" stroke-width="12" fill="transparent" r="85" cx="100" cy="100"/>
                                    <circle id="timer-progress-ring" stroke="var(--primary)" stroke-width="12" fill="transparent" r="85" cx="100" cy="100"
                                            class="progress-ring-circle" stroke-dasharray="534.07" stroke-dashoffset="0"/>
                                </svg>
                                <div class="progress-text">
                                    <span id="timer-modal-time" style="font-size: 2.5rem; font-weight: 800; font-family: monospace;">25:00</span>
                                    <span id="timer-modal-mode" style="font-size: 0.75rem; text-transform: uppercase; color: var(--primary); font-weight: 700; margin-top: 4px; letter-spacing: 1px;">Work Mode</span>
                                </div>
                            </div>
                            
                            <!-- Timer Preset Options -->
                            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 24px;">
                                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="NihonTimer.setTimerPreset('WORK_25')">Work 25m</button>
                                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="NihonTimer.setTimerPreset('WORK_50')">Work 50m</button>
                                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="NihonTimer.setTimerPreset('BREAK_5')">Break 5m</button>
                                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem;" onclick="NihonTimer.setTimerPreset('BREAK_10')">Break 10m</button>
                            </div>

                            <!-- Custom Timer Slider -->
                            <div class="form-group" style="margin-bottom: 24px; text-align: left;">
                                <label class="form-label" style="display:flex; justify-content:space-between;">
                                    <span>Custom Duration:</span>
                                    <span id="custom-minutes-display" style="font-weight: 700; color: var(--primary);">30 mins</span>
                                </label>
                                <input type="range" id="custom-minutes-slider" min="1" max="120" value="30" class="form-control" style="padding:0; cursor:pointer;">
                            </div>

                            <!-- Controls -->
                            <div style="display: flex; justify-content: center; gap: 16px;">
                                <button id="timer-modal-play" class="btn btn-primary" style="padding: 12px 32px;"><i class="fas fa-play"></i> Start</button>
                                <button id="timer-modal-reset" class="btn btn-outline" style="padding: 12px 24px;"><i class="fas fa-undo"></i> Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHtml;
            document.body.appendChild(wrapper.firstElementChild);

            // Bind Event listeners for the timer modal
            const modal = document.getElementById('global-timer-modal');
            const closeBtn = document.getElementById('global-timer-close');
            const maximizeBtn = document.getElementById('mini-timer-maximize');
            
            const openModal = () => modal.classList.add('open');
            const closeModal = () => modal.classList.remove('open');

            if (maximizeBtn) maximizeBtn.addEventListener('click', openModal);
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            
            // Close on click outside content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Slider input handler
            const slider = document.getElementById('custom-minutes-slider');
            const sliderDisplay = document.getElementById('custom-minutes-display');
            if (slider && sliderDisplay) {
                slider.addEventListener('input', (e) => {
                    const val = e.target.value;
                    sliderDisplay.textContent = `${val} mins`;
                    window.NihonTimer.setCustomTime(val);
                });
            }

            // Modal Play / Pause
            const modalPlay = document.getElementById('timer-modal-play');
            const modalReset = document.getElementById('timer-modal-reset');

            if (modalPlay) {
                modalPlay.addEventListener('click', () => {
                    window.NihonTimer.toggle();
                });
            }
            if (modalReset) {
                modalReset.addEventListener('click', () => {
                    window.NihonTimer.reset();
                });
            }

            // Sync with ticks
            window.addEventListener('nihon_timer_tick', (e) => {
                const state = e.detail;
                const modalTime = document.getElementById('timer-modal-time');
                const modalMode = document.getElementById('timer-modal-mode');
                const modalPlayBtn = document.getElementById('timer-modal-play');
                const ring = document.getElementById('timer-progress-ring');
                
                if (modalTime) {
                    modalTime.textContent = window.NihonTimer.formatTime(state.secondsRemaining);
                }
                
                if (modalMode) {
                    modalMode.textContent = state.mode === 'work' ? 'Work Session' : (state.mode === 'break' ? 'Break Time' : 'Custom Session');
                }

                if (modalPlayBtn) {
                    if (state.isRunning) {
                        modalPlayBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                        modalPlayBtn.className = 'btn btn-secondary';
                    } else {
                        modalPlayBtn.innerHTML = '<i class="fas fa-play"></i> Start';
                        modalPlayBtn.className = 'btn btn-primary';
                    }
                }

                if (ring) {
                    // Circle circumference is 534.07 (2 * pi * r, r=85)
                    const circ = 534.07;
                    const percentRemaining = state.secondsRemaining / state.totalDuration;
                    const offset = circ - (percentRemaining * circ);
                    ring.style.strokeDashoffset = offset;
                }
            });
        },

        // Setup Toast Notification Structure
        setupToastContainer() {
            if (!document.getElementById('toast-container')) {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
        },

        // Show a custom Toast in-app
        showToast(title, body, type = 'primary') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            // Type styles
            let iconClass = 'fa-info-circle';
            if (type === 'success') iconClass = 'fa-check-circle';
            if (type === 'warning') iconClass = 'fa-exclamation-triangle';
            if (type === 'danger') iconClass = 'fa-times-circle';

            const toastId = 'toast_' + Date.now();
            const toastHtml = `
                <div class="toast toast-${type}" id="${toastId}">
                    <i class="fas ${iconClass} toast-icon"></i>
                    <div class="toast-content">
                        <div class="toast-title">${title}</div>
                        <div class="toast-desc">${body}</div>
                    </div>
                    <button class="toast-close" onclick="this.parentElement.classList.remove('show'); setTimeout(() => this.parentElement.remove(), 400)"><i class="fas fa-times"></i></button>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', toastHtml);

            // Trigger animation
            const toastEl = document.getElementById(toastId);
            setTimeout(() => {
                if (toastEl) toastEl.classList.add('show');
            }, 50);

            // Auto dismiss after 5 seconds
            setTimeout(() => {
                if (toastEl) {
                    toastEl.classList.remove('show');
                    setTimeout(() => toastEl.remove(), 400);
                }
            }, 5500);
        },

        // Setup Hamburger Menu on Mobile
        setupMobileMenu() {
            document.addEventListener('click', (e) => {
                const mobileNavToggle = e.target.closest('#mobile-nav-toggle');
                const sidebar = document.getElementById('sidebar-container');
                
                if (mobileNavToggle && sidebar) {
                    sidebar.classList.toggle('open');
                } else if (sidebar && sidebar.classList.contains('open') && !e.target.closest('.sidebar')) {
                    // Close sidebar if clicking outside of it on mobile
                    sidebar.classList.remove('open');
                }
            });
        },

        // Setup theme click and update headers
        setupGlobalEvents() {
            document.addEventListener('click', (e) => {
                // Theme Toggle handler
                const btn = e.target.closest('#theme-toggle-btn');
                if (btn) {
                    const newTheme = window.NihonTheme.toggleTheme();
                    btn.innerHTML = `<i class="fas ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
                    this.showToast('Theme Changed', `Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode.`, 'info');
                    
                    // Dispatch event for components to re-draw if necessary (e.g. stats charts)
                    window.dispatchEvent(new Event('nihon_theme_changed'));
                }
            });
        },

        // Keyboard Shortcuts
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Do not trigger if typing in inputs/textareas
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                    return;
                }

                const key = e.key.toLowerCase();

                if (key === 'd') {
                    // Toggle Dark Mode
                    const toggleBtn = document.getElementById('theme-toggle-btn');
                    if (toggleBtn) toggleBtn.click();
                } else if (key === 't') {
                    // Open Timer Modal
                    const timerModal = document.getElementById('global-timer-modal');
                    if (timerModal) {
                        timerModal.classList.toggle('open');
                    }
                } else if (key === '/') {
                    // Focus Search
                    e.preventDefault();
                    const searchInput = document.getElementById('search-input') || document.querySelector('.search-input') || document.querySelector('input[type="search"]');
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                } else if (key === 'n') {
                    // Trigger add task modal
                    e.preventDefault();
                    // Dispatch event so planner.js or dashboard can catch it
                    window.dispatchEvent(new CustomEvent('nihon_add_task_trigger'));
                }
            });
        },

        // Hide loading screen after DOM loads
        handleLoadingScreen() {
            const screen = document.getElementById('loading-screen');
            if (screen) {
                setTimeout(() => {
                    screen.classList.add('hidden');
                    setTimeout(() => screen.remove(), 500);
                }, 400); // Quick load transition
            }
        },

        // Inspect sessionStorage for notifications to alert on load
        checkSessionNotifications() {
            // Unfinished tasks carryover notification
            const carryoverMsg = sessionStorage.getItem('nihon_carryover_msg');
            if (carryoverMsg) {
                setTimeout(() => {
                    this.showToast('Daily Task Carryover', carryoverMsg, 'warning');
                    sessionStorage.removeItem('nihon_carryover_msg');
                }, 1000);
            }

            // Streak increased notification
            const streakTriggered = sessionStorage.getItem('nihon_streak_increased');
            if (streakTriggered) {
                setTimeout(() => {
                    const streaks = window.NihonStorage.getStreaks();
                    this.showToast('Streak Extended! 🔥', `You have studied for ${streaks.currentStreak} consecutive days. Keep it up!`, 'success');
                    this.triggerStreakAnimation();
                    sessionStorage.removeItem('nihon_streak_increased');
                }, 1500);
            }

            // New day started
            const newDayTriggered = sessionStorage.getItem('nihon_new_day_triggered');
            if (newDayTriggered) {
                setTimeout(() => {
                    this.showToast('Good Morning! ☀️', 'A new study planner is ready for you today. Ganbatte!', 'success');
                    sessionStorage.removeItem('nihon_new_day_triggered');
                }, 2000);
            }

            // Badge unlocked notification
            const unlockedBadge = sessionStorage.getItem('nihon_badge_unlocked_now');
            if (unlockedBadge) {
                setTimeout(() => {
                    const badgesMeta = window.NihonStorage.getBadgesMetadata();
                    const badge = badgesMeta[unlockedBadge];
                    if (badge) {
                        this.showToast(`Achievement Unlocked! ${badge.icon}`, `Congratulations! You unlocked the "${badge.title}" badge.`, 'success');
                        this.triggerBadgeConfetti();
                    }
                    sessionStorage.removeItem('nihon_badge_unlocked_now');
                }, 2500);
            }
        },

        // Simple visual streak extension animation
        triggerStreakAnimation() {
            const flame = document.querySelector('.streak-badge');
            if (flame) {
                flame.classList.add('celebrate');
                flame.style.transform = 'scale(1.3) rotate(5deg)';
                flame.style.borderColor = 'var(--primary)';
                setTimeout(() => {
                    flame.style.transform = '';
                    flame.style.borderColor = '';
                    flame.classList.remove('celebrate');
                }, 1000);
            }
        },

        // Visual flash overlay for badge unlock celebration
        triggerBadgeConfetti() {
            // Draw colorful particles on the viewport
            const canvas = document.createElement('canvas');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '99999';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const colors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#ffb703', '#fb8500', '#ffc6ff'];

            for (let i = 0; i < 120; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height - canvas.height,
                    r: Math.random() * 6 + 4,
                    d: Math.random() * canvas.height,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    tilt: Math.random() * 10 - 5,
                    tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                    tiltAngle: 0
                });
            }

            let animationFrameId;
            let frames = 0;

            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                particles.forEach((p, idx) => {
                    p.tiltAngle += p.tiltAngleIncremental;
                    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                    p.x += Math.sin(p.tiltAngle);
                    p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

                    ctx.beginPath();
                    ctx.lineWidth = p.r;
                    ctx.strokeStyle = p.color;
                    ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                    ctx.stroke();
                });

                update();
            }

            function update() {
                frames++;
                let active = false;
                particles.forEach(p => {
                    if (p.y < canvas.height) {
                        active = true;
                    }
                });

                if (active && frames < 240) {
                    animationFrameId = requestAnimationFrame(draw);
                } else {
                    cancelAnimationFrame(animationFrameId);
                    canvas.remove();
                }
            }

            draw();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        NihonApp.init();
    });

    window.NihonApp = NihonApp;
})();
