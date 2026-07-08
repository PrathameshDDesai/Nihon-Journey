/**
 * journal.js - Learning Journal Logic with Debounced Autosave & History Search
 */

(function () {
    let activeDate = window.NihonStorage.getLocalDateString();
    let autosaveTimeout = null;
    let historySearchQuery = '';

    const textareas = {
        learnedToday: 'journal-learned-today',
        newKanji: 'journal-new-kanji',
        newVocabulary: 'journal-new-vocab',
        grammarNotes: 'journal-grammar-notes',
        difficultTopics: 'journal-difficult',
        tomorrowGoal: 'journal-tomorrow-goal'
    };

    function init() {
        loadJournal(activeDate);
        setupAutosave();
        setupHistorySidebar();
        setupDateInput();

        // Listen for new task shortcut from app.js to keep navigation friendly
        window.addEventListener('nihon_add_task_trigger', () => {
            window.location.href = 'planner.html?add=true';
        });
    }

    // Set Date Input field
    function setupDateInput() {
        const dateInput = document.getElementById('journal-date-picker');
        if (dateInput) {
            dateInput.value = activeDate;
            dateInput.addEventListener('change', (e) => {
                saveImmediate(); // Save current work before switching
                activeDate = e.target.value;
                loadJournal(activeDate);
                renderHistoryList();
            });
        }
    }

    // Load Journal entry from storage and populate textareas
    function loadJournal(date) {
        activeDate = date;
        const dateInput = document.getElementById('journal-date-picker');
        if (dateInput) dateInput.value = date;

        // Display Header Date
        const dateHeader = document.getElementById('journal-header-date-text');
        if (dateHeader) {
            const d = new Date(date);
            dateHeader.textContent = d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        const journal = window.NihonStorage.getJournal(date);
        
        // Populate inputs
        Object.keys(textareas).forEach(key => {
            const el = document.getElementById(textareas[key]);
            if (el) {
                el.value = journal[key] || '';
            }
        });

        updateSaveStatus('idle');
    }

    // Setup Event Listeners for Autosave
    function setupAutosave() {
        Object.values(textareas).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Debounced save as user types
                el.addEventListener('input', () => {
                    triggerAutosave();
                });
                // Instant save when focus leaves the textarea
                el.addEventListener('blur', () => {
                    saveImmediate();
                });
            }
        });

        // Instant save when user leaves the page, refreshes, or switches tabs
        window.addEventListener('beforeunload', () => {
            saveImmediate();
        });
        window.addEventListener('pagehide', () => {
            saveImmediate();
        });
    }

    function updateSaveStatus(status) {
        const statusEl = document.getElementById('journal-save-status');
        if (!statusEl) return;

        statusEl.className = 'save-status';
        if (status === 'saving') {
            statusEl.classList.add('saving');
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        } else if (status === 'saved') {
            statusEl.classList.add('saved');
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved to Scroll';
            setTimeout(() => {
                if (statusEl.classList.contains('saved')) {
                    updateSaveStatus('idle');
                }
            }, 3000);
        } else {
            statusEl.classList.add('idle');
            statusEl.innerHTML = '<i class="far fa-edit"></i> Auto-saving enabled';
        }
    }

    // Trigger debounced save
    function triggerAutosave() {
        updateSaveStatus('saving');
        
        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        
        autosaveTimeout = setTimeout(() => {
            saveImmediate();
        }, 1200); // 1.2s debounce
    }

    // Save inputs immediately
    function saveImmediate() {
        if (autosaveTimeout) clearTimeout(autosaveTimeout);

        const journalData = {};
        Object.keys(textareas).forEach(key => {
            const el = document.getElementById(textareas[key]);
            journalData[key] = el ? el.value.trim() : '';
        });

        window.NihonStorage.saveJournal(activeDate, journalData);
        updateSaveStatus('saved');
        renderHistoryList();
    }

    // Setup History List
    function setupHistorySidebar() {
        const searchInput = document.getElementById('journal-history-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                historySearchQuery = e.target.value.toLowerCase();
                renderHistoryList();
            });
        }
        renderHistoryList();
    }

    // Render list of dates that have entries in localStorage
    function renderHistoryList() {
        const container = document.getElementById('journal-history-list');
        if (!container) return;

        const journals = window.NihonStorage.getAllJournals();
        
        // Filter out dates that have completely empty fields
        const validDates = Object.keys(journals).filter(date => {
            const entry = journals[date];
            const hasContent = Object.values(entry).some(val => val && val.trim() !== '');
            
            if (!hasContent) return false;

            // Apply search query filter
            if (historySearchQuery !== '') {
                const matchesText = Object.values(entry).some(val => val && val.toLowerCase().includes(historySearchQuery));
                const matchesDate = date.includes(historySearchQuery);
                return matchesText || matchesDate;
            }
            return true;
        }).sort((a, b) => new Date(b) - new Date(a)); // Descending order

        if (validDates.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 24px 8px; color:var(--text-muted); font-size:0.8rem;">
                    No entries found.
                </div>
            `;
            return;
        }

        container.innerHTML = validDates.map(date => {
            const isActive = date === activeDate ? 'active' : '';
            const entry = journals[date];
            const snippet = entry.learnedToday || entry.newKanji || entry.newVocabulary || 'View journal details...';
            
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            return `
                <button class="history-card-item ${isActive}" onclick="switchJournalDate('${date}')">
                    <div class="history-card-date">${formattedDate}</div>
                    <div class="history-card-snippet">${escapeHTML(snippet)}</div>
                </button>
            `;
        }).join('');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Expose global switch date handler
    window.switchJournalDate = function (date) {
        saveImmediate(); // Save active entry first
        loadJournal(date);
        renderHistoryList();
    };

    window.jumpToTodayJournal = function () {
        const todayStr = window.NihonStorage.getLocalDateString();
        switchJournalDate(todayStr);
    };

    // Initialize Page
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
})();
