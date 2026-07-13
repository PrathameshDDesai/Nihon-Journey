/**
 * stats.js - Performance Statistics & SVG Charts Engine
 */

(function () {
    function init() {
        renderWeeklyProgressChart();
        renderTaskCompletionRate();
        renderCategoryProgressChart();
        renderStatsCounters();
        renderBadgesGrid();

        // Re-draw charts when theme is updated to sync SVG text colors
        window.addEventListener('nihon_theme_changed', () => {
            renderWeeklyProgressChart();
            renderTaskCompletionRate();
            renderCategoryProgressChart();
        });
    }

    // Render Stats Counters cards
    function renderStatsCounters() {
        const tasks = window.NihonStorage.getAllTasks();
        const studyTimeDb = window.NihonStorage.getAllStudyTime();
        const streaks = window.NihonStorage.getStreaks();

        let totalCreated = 0;
        let totalCompleted = 0;
        Object.values(tasks).forEach(list => {
            totalCreated += list.length;
            totalCompleted += list.filter(t => t.completed).length;
        });

        let totalSecondsStudied = 0;
        Object.values(studyTimeDb).forEach(sec => totalSecondsStudied += sec);
        const totalMinutesStudied = Math.round(totalSecondsStudied / 60);

        // Update DOM
        const totalTimeEl = document.getElementById('stat-counter-total-time');
        const totalCompletedEl = document.getElementById('stat-counter-total-completed');
        const currentStreakEl = document.getElementById('stat-counter-current-streak');
        const longestStreakEl = document.getElementById('stat-counter-longest-streak');

        if (totalTimeEl) totalTimeEl.textContent = `${totalMinutesStudied}m`;
        if (totalCompletedEl) totalCompletedEl.textContent = `${totalCompleted}/${totalCreated}`;
        if (currentStreakEl) currentStreakEl.textContent = `${streaks.currentStreak} Days`;
        if (longestStreakEl) longestStreakEl.textContent = `${streaks.longestStreak} Days`;
    }

    // Render 7-day Study Time Bar Chart (SVG-based)
    function renderWeeklyProgressChart() {
        const container = document.getElementById('weekly-progress-chart-container');
        if (!container) return;

        // Get past 7 dates
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(window.NihonStorage.getLocalDateString(d));
        }

        const studyMinutes = dates.map(date => {
            const sec = window.NihonStorage.getStudyTime(date);
            return Math.round(sec / 60);
        });

        const maxMinutes = Math.max(...studyMinutes, 30); // At least scale to 30 mins

        // Chart dimensions
        const width = container.clientWidth || 500;
        const height = 220;
        const padding = 35;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        const barWidth = (chartWidth / 7) - 16;

        // Colors based on active theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const labelColor = isDark ? '#a0aec0' : '#4a5568';
        const gridColor = isDark ? '#2d3748' : '#e2e8f0';
        const barColor = 'var(--primary)';

        let svgHtml = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

        // Horizontal Gridlines
        const gridSteps = 3;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding + (chartHeight * (i / gridSteps));
            const val = Math.round(maxMinutes * (1 - (i / gridSteps)));
            svgHtml += `
                <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="${gridColor}" stroke-dasharray="4"/>
                <text x="${padding - 8}" y="${y + 4}" fill="${labelColor}" font-size="10" text-anchor="end" font-weight="700">${val}m</text>
            `;
        }

        // Draw Bars
        studyMinutes.forEach((minutes, idx) => {
            const dateStr = dates[idx];
            const dateObj = new Date(dateStr);
            const label = dateObj.toLocaleDateString([], { weekday: 'short' });

            const barHeight = minutes > 0 ? (minutes / maxMinutes) * chartHeight : 4; // Min 4px line for zero
            const x = padding + (idx * (chartWidth / 7)) + 8;
            const y = height - padding - barHeight;

            svgHtml += `
                <!-- Bar -->
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${barColor}" class="chart-bar-hover">
                    <title>${minutes} mins studied on ${dateObj.toLocaleDateString()}</title>
                </rect>
                <!-- X Label -->
                <text x="${x + (barWidth / 2)}" y="${height - padding + 18}" fill="${labelColor}" font-size="10" text-anchor="middle" font-weight="700">${label}</text>
            `;
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    // Render Circular Task Completion Ring (SVG)
    function renderTaskCompletionRate() {
        const container = document.getElementById('task-completion-chart-container');
        if (!container) return;

        const tasks = window.NihonStorage.getAllTasks();
        let created = 0;
        let completed = 0;

        Object.values(tasks).forEach(list => {
            created += list.length;
            completed += list.filter(t => t.completed).length;
        });

        const pct = created > 0 ? Math.round((completed / created) * 100) : 0;
        const circumference = 2 * Math.PI * 55; // Radius 55
        const offset = circumference - (pct / 100) * circumference;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#1a202c';

        container.innerHTML = `
            <svg width="150" height="150" viewBox="0 0 150 150" class="progress-ring-container" xmlns="http://www.w3.org/2000/svg">
                <circle stroke="var(--border-color)" stroke-width="10" fill="transparent" r="55" cx="75" cy="75"/>
                <circle stroke="var(--secondary)" stroke-width="10" fill="transparent" r="55" cx="75" cy="75"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        style="transform: rotate(-90deg); transform-origin: 50% 50%; transition: stroke-dashoffset 0.8s ease;"/>
                <text x="75" y="72" text-anchor="middle" font-size="20" font-weight="800" fill="${textColor}">${pct}%</text>
                <text x="75" y="90" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-muted)" style="text-transform:uppercase; letter-spacing:0.5px;">All-Time Done</text>
            </svg>
        `;
    }

    // Render Category Completion Progress (Bar list)
    function renderCategoryProgressChart() {
        const container = document.getElementById('category-progress-chart-container');
        if (!container) return;

        const tasks = window.NihonStorage.getAllTasks();
        const categoryCounts = {};

        // Tally up completions per category
        Object.values(tasks).forEach(list => {
            list.forEach(t => {
                if (!categoryCounts[t.category]) {
                    categoryCounts[t.category] = { total: 0, completed: 0 };
                }
                categoryCounts[t.category].total++;
                if (t.completed) categoryCounts[t.category].completed++;
            });
        });

        const categories = Object.keys(categoryCounts).sort();

        if (categories.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 24px; color:var(--text-muted); font-size:0.9rem;">
                    No task history recorded yet. Complete planner items to see category details.
                </div>
            `;
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:16px;">';
        categories.forEach(cat => {
            const data = categoryCounts[cat];
            const pct = Math.round((data.completed / data.total) * 100);

            html += `
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:4px;">
                        <span>${cat}</span>
                        <span style="color:var(--primary);">${data.completed}/${data.total} completed (${pct}%)</span>
                    </div>
                    <div class="nihon-progress-bar" style="height:6px;">
                        <div class="nihon-progress-fill" style="width:${pct}%; background-color: var(--primary);"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // Render Badge Showcase
    function renderBadgesGrid() {
        const container = document.getElementById('badges-showcase-container');
        if (!container) return;

        const badgesMetadata = window.NihonStorage.getBadgesMetadata();
        const unlockedBadges = window.NihonStorage.getUnlockedBadges();

        let html = '';
        Object.keys(badgesMetadata).forEach(badgeId => {
            const badge = badgesMetadata[badgeId];
            const isUnlocked = unlockedBadges.includes(badgeId);

            html += `
                <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
                    <div class="badge-icon">${badge.icon}</div>
                    <span class="badge-title">${badge.title}</span>
                    <span class="badge-desc">${badge.desc}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Initialize Page
    window.addEventListener('nihon_data_loaded', () => {
        init();
    });
})();
