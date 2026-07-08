/**
 * calendar.js - Monthly Calendar Logic for Nihon Journey
 */

(function () {
    let currentDate = new Date();
    let selectedMonth = currentDate.getMonth();
    let selectedYear = currentDate.getFullYear();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function init() {
        renderCalendar();
        setupCalendarControls();
    }

    // Set up click handlers for prev/next month
    function setupCalendarControls() {
        const prevBtn = document.getElementById('calendar-month-prev');
        const nextBtn = document.getElementById('calendar-month-next');
        const todayBtn = document.getElementById('calendar-month-today');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                changeMonth(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                changeMonth(1);
            });
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                selectedMonth = currentDate.getMonth();
                selectedYear = currentDate.getFullYear();
                renderCalendar();
            });
        }
    }

    function changeMonth(direction) {
        selectedMonth += direction;
        if (selectedMonth < 0) {
            selectedMonth = 11;
            selectedYear--;
        } else if (selectedMonth > 11) {
            selectedMonth = 0;
            selectedYear++;
        }
        renderCalendar();
    }

    // Render monthly calendar grid
    function renderCalendar() {
        const grid = document.getElementById('calendar-grid-body');
        const monthLabel = document.getElementById('calendar-month-year');
        if (!grid || !monthLabel) return;

        monthLabel.textContent = `${monthNames[selectedMonth]} ${selectedYear}`;
        grid.innerHTML = '';

        // Header days row
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const el = document.createElement('div');
            el.className = 'calendar-day-label';
            el.textContent = day;
            grid.appendChild(el);
        });

        // Date calculations
        const firstDayIdx = new Date(selectedYear, selectedMonth, 1).getDay();
        const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const prevMonthTotalDays = new Date(selectedYear, selectedMonth, 0).getDate();

        // Get User Goals
        const settings = window.NihonStorage.getSettings();
        const dailyTaskGoal = settings.dailyTaskGoal || 3;
        const dailyTimeGoalSec = (settings.dailyHoursGoal || 30) * 60; // Convert mins to secs

        const todayStr = window.NihonStorage.getLocalDateString();

        // 1. Render previous month padded days
        for (let i = firstDayIdx - 1; i >= 0; i--) {
            const dayNum = prevMonthTotalDays - i;
            const el = document.createElement('div');
            el.className = 'calendar-cell other-month';
            el.innerHTML = `<span class="calendar-cell-num">${dayNum}</span>`;
            grid.appendChild(el);
        }

        // 2. Render current month days
        for (let day = 1; day <= totalDays; day++) {
            const cellDate = new Date(selectedYear, selectedMonth, day);
            const dateStr = window.NihonStorage.getLocalDateString(cellDate);

            const el = document.createElement('div');
            el.className = 'calendar-cell';
            
            // Check if day is today
            if (dateStr === todayStr) {
                el.classList.add('today');
            }

            // Calculate status class (completed, partial, missed) for today and past days
            const tasks = window.NihonStorage.getTasks(dateStr);
            const completedTasks = tasks.filter(t => t.completed).length;
            const studySec = window.NihonStorage.getStudyTime(dateStr);

            let statusClass = '';

            // Past days & Today evaluation
            if (cellDate <= currentDate || dateStr === todayStr) {
                const studiedAnything = studySec > 0;
                const completedAnyTask = completedTasks > 0;
                
                const metTaskGoal = completedTasks >= dailyTaskGoal && dailyTaskGoal > 0;
                const metTimeGoal = studySec >= dailyTimeGoalSec && dailyTimeGoalSec > 0;

                if (metTaskGoal || metTimeGoal) {
                    statusClass = 'completed'; // 🟢
                } else if (studiedAnything || completedAnyTask) {
                    statusClass = 'partial'; // 🟡
                } else {
                    // For past days, it is a missed day if nothing was done
                    if (dateStr !== todayStr) {
                        statusClass = 'missed'; // 🔴
                    }
                }
            }

            if (statusClass) {
                el.classList.add(statusClass);
            }

            el.innerHTML = `
                <span class="calendar-cell-num">${day}</span>
                ${statusClass ? `<span class="calendar-cell-status"></span>` : ''}
            `;

            // Open Modal on cell click
            el.addEventListener('click', () => {
                openHistoryModal(dateStr, cellDate);
            });

            grid.appendChild(el);
        }

        // 3. Render next month padded days to complete grid
        const totalRenderedCells = firstDayIdx + totalDays;
        const remainingPads = 42 - totalRenderedCells; // 6 rows standard grid
        for (let pad = 1; pad <= remainingPads; pad++) {
            const el = document.createElement('div');
            el.className = 'calendar-cell other-month';
            el.innerHTML = `<span class="calendar-cell-num">${pad}</span>`;
            grid.appendChild(el);
        }
    }

    // Open Day History Details Modal
    function openHistoryModal(dateStr, dateObj) {
        const modal = document.getElementById('day-history-modal');
        const titleEl = document.getElementById('history-modal-title');
        const bodyEl = document.getElementById('history-modal-body');
        if (!modal || !titleEl || !bodyEl) return;

        // Header Formatting
        const formattedDate = dateObj.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        titleEl.textContent = formattedDate;

        // Fetch logs
        const tasks = window.NihonStorage.getTasks(dateStr);
        const journal = window.NihonStorage.getJournal(dateStr);
        const studySec = window.NihonStorage.getStudyTime(dateStr);

        const studyMinutes = Math.floor(studySec / 60);
        const studySeconds = studySec % 60;

        const hasTasks = tasks.length > 0;
        const hasStudyTime = studySec > 0;
        const hasJournal = Object.values(journal).some(val => val && val.trim() !== '');

        if (!hasTasks && !hasStudyTime && !hasJournal) {
            bodyEl.innerHTML = `
                <div style="text-align:center; padding: 32px 16px; color: var(--text-muted);">
                    <i class="fas fa-history" style="font-size: 2.5rem; color: var(--border-color); margin-bottom: 12px; display:block;"></i>
                    <p>No study logs, tasks, or journal entries recorded on this day.</p>
                </div>
            `;
            modal.classList.add('open');
            return;
        }

        let html = '';

        // Study Time logged
        html += `
            <div class="history-time-badge">
                <i class="far fa-hourglass" style="color:var(--primary);"></i>
                <span>Study Time: ${studyMinutes}m ${studySeconds}s logged</span>
            </div>
        `;

        // Tasks checklist logs
        html += `<div class="history-section">`;
        html += `<h4 class="history-section-title">Completed Planner Tasks</h4>`;
        if (hasTasks) {
            html += `<div style="display:flex; flex-direction:column; gap:4px; margin-bottom: 20px;">`;
            tasks.forEach(t => {
                const icon = t.completed ? '<i class="fas fa-check-circle completed"></i>' : '<i class="far fa-circle pending"></i>';
                const decorationStyle = t.completed ? 'style="text-decoration: line-through; color: var(--text-muted);"' : '';
                html += `
                    <div class="history-task-item">
                        ${icon}
                        <span ${decorationStyle}>${escapeHTML(t.name)} <span class="tag tag-cat" style="font-size:0.6rem; padding: 1px 6px;">${t.category}</span></span>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom: 20px;">No tasks were planned for this day.</p>`;
        }
        html += `</div>`;

        // Journal details logs
        html += `<div class="history-section">`;
        html += `<h4 class="history-section-title">Daily Learning Journal</h4>`;
        if (hasJournal) {
            html += `<div class="nihon-card" style="padding:16px; background-color: var(--bg-washi); font-size:0.9rem; line-height:1.5;">`;
            
            const renderJournalSection = (label, text) => {
                if (!text || text.trim() === '') return '';
                return `
                    <div style="margin-bottom:12px;">
                        <strong style="color: var(--primary-dark); font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom: 2px;">${label}</strong>
                        <span>${escapeHTML(text).replace(/\n/g, '<br>')}</span>
                    </div>
                `;
            };

            html += renderJournalSection("What I learned today", journal.learnedToday);
            html += renderJournalSection("New Kanji", journal.newKanji);
            html += renderJournalSection("New Vocabulary", journal.newVocabulary);
            html += renderJournalSection("Grammar Notes", journal.grammarNotes);
            html += renderJournalSection("Difficult Topics", journal.difficultTopics);
            html += renderJournalSection("Tomorrow's Goal", journal.tomorrowGoal);
            
            html += `</div>`;
        } else {
            html += `<p style="font-size:0.85rem; color:var(--text-muted);">No journal entry was written on this day.</p>`;
        }
        html += `</div>`;

        bodyEl.innerHTML = html;
        modal.classList.add('open');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    window.closeHistoryModal = function () {
        const modal = document.getElementById('day-history-modal');
        if (modal) modal.classList.remove('open');
    };

    document.addEventListener('DOMContentLoaded', () => {
        init();
        
        // Setup close click outside
        const modal = document.getElementById('day-history-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeHistoryModal();
            });
        }
    });
})();
