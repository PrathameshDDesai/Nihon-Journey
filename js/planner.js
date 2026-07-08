/**
 * planner.js - Task CRUD & UI Controller for daily planner
 */

(function () {
    let currentSelectedDate = window.NihonStorage.getLocalDateString();
    let filterStatus = 'all'; // 'all' | 'pending' | 'completed'
    let filterPriority = 'all'; // 'all' | 'high' | 'medium' | 'low'
    let filterCategory = 'all';
    let searchQuery = '';
    let sortBy = 'default'; // 'default' | 'priority-desc' | 'priority-asc' | 'time-desc' | 'time-asc'
    let editingTaskId = null;

    // Helper: Map priority to weight for sorting
    const priorityWeights = { 'high': 3, 'medium': 2, 'low': 1 };

    function init() {
        setupDatePicker();
        setupFilters();
        setupDragAndDrop();
        setupModalHandlers();
        loadTasks();

        // Listen for keyboard shortcut N trigger
        window.addEventListener('nihon_add_task_trigger', () => {
            openAddTaskModal();
        });

        // If redirecting from dashboard with ?add=true, open modal automatically
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('add') === 'true') {
            // Clean URL query parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            openAddTaskModal();
        }
    }

    // Set up Date Navigation
    function setupDatePicker() {
        const dateInput = document.getElementById('planner-date-input');
        const prevBtn = document.getElementById('planner-date-prev');
        const nextBtn = document.getElementById('planner-date-next');
        const todayBtn = document.getElementById('planner-date-today');

        if (dateInput) {
            dateInput.value = currentSelectedDate;
            dateInput.addEventListener('change', (e) => {
                currentSelectedDate = e.target.value;
                loadTasks();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                adjustDate(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                adjustDate(1);
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentSelectedDate = window.NihonStorage.getLocalDateString();
                if (dateInput) dateInput.value = currentSelectedDate;
                loadTasks();
            });
        }
    }

    function adjustDate(days) {
        const dateInput = document.getElementById('planner-date-input');
        const d = new Date(currentSelectedDate);
        d.setDate(d.getDate() + days);
        currentSelectedDate = window.NihonStorage.getLocalDateString(d);
        if (dateInput) dateInput.value = currentSelectedDate;
        loadTasks();
    }

    // Bind Filter Controls
    function setupFilters() {
        // Status tabs
        const tabs = document.querySelectorAll('.status-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filterStatus = tab.dataset.status;
                loadTasks();
            });
        });

        // Search Input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                loadTasks();
            });
        }

        // Priority Dropdown
        const prioSelect = document.getElementById('filter-priority');
        if (prioSelect) {
            prioSelect.addEventListener('change', (e) => {
                filterPriority = e.target.value;
                loadTasks();
            });
        }

        // Category Dropdown
        const catSelect = document.getElementById('filter-category');
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                filterCategory = e.target.value;
                loadTasks();
            });
        }

        // Sort Dropdown
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                sortBy = e.target.value;
                loadTasks();
            });
        }
    }

    // Load tasks from storage, apply filters/sort, and render
    function loadTasks() {
        let tasks = window.NihonStorage.getTasks(currentSelectedDate);

        // Apply filters
        tasks = tasks.filter(task => {
            // Search Query Filter
            const matchesSearch = searchQuery === '' || 
                task.name.toLowerCase().includes(searchQuery) ||
                task.category.toLowerCase().includes(searchQuery) ||
                (task.notes && task.notes.toLowerCase().includes(searchQuery));

            // Status Filter
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'completed' && task.completed) ||
                (filterStatus === 'pending' && !task.completed);

            // Priority Filter
            const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

            // Category Filter
            const matchesCategory = filterCategory === 'all' || task.category === filterCategory;

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });

        // Apply sorting
        if (sortBy === 'priority-desc') {
            tasks.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
        } else if (sortBy === 'priority-asc') {
            tasks.sort((a, b) => priorityWeights[a.priority] - priorityWeights[b.priority]);
        } else if (sortBy === 'time-desc') {
            tasks.sort((a, b) => b.estTime - a.estTime);
        } else if (sortBy === 'time-asc') {
            tasks.sort((a, b) => a.estTime - b.estTime);
        } else if (sortBy === 'category') {
            tasks.sort((a, b) => a.category.localeCompare(b.category));
        }

        renderTasks(tasks);
        updateProgressSummary();
    }

    // Render task cards in DOM
    function renderTasks(tasks) {
        const container = document.getElementById('task-list-container');
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="planner-empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h4>No study tasks found</h4>
                    <p>Change your filters, select another date, or create a task to begin.</p>
                    <button class="btn btn-primary" onclick="openAddTaskModal()"><i class="fas fa-plus"></i> Add Task</button>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => {
            const priorityClass = `tag-priority-${task.priority}`;
            const carriedBadge = task.carriedFrom ? `<span class="tag tag-carried" title="Carried from ${task.carriedFrom}">🔄 Carried</span>` : '';
            const notesBtn = task.notes && task.notes.trim() !== '' 
                ? `<button class="btn-task-action" onclick="toggleTaskNotes('${task.id}')" title="View Notes"><i class="far fa-sticky-note"></i></button>`
                : '';

            const isAi = task.isAiTask || (task.id && task.id.startsWith('ai_task_'));
            const aiBadge = isAi ? `<span class="tag tag-cat" style="background-color:var(--primary-light); color:var(--primary-dark); border-color:var(--primary-light);" title="AI Scheduled Task"><i class="fas fa-brain"></i> AI</span>` : '';

            return `
                <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                    <div class="task-left">
                        <button class="task-check-btn" onclick="toggleTaskCompletion('${task.id}')" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
                            <i class="fas fa-check"></i>
                        </button>
                        <div class="task-details">
                            <span class="task-name">${escapeHTML(task.name)}</span>
                            <div class="task-meta-row">
                                ${aiBadge}
                                <span class="tag tag-cat">${task.category}</span>
                                <span class="tag ${priorityClass}">${task.priority}</span>
                                <span class="task-time-est"><i class="far fa-hourglass"></i> ${task.estTime}m</span>
                                ${carriedBadge}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        ${notesBtn}
                        <button class="btn-task-action" onclick="openEditTaskModal('${task.id}')" title="Edit Task" ${isAi ? 'style="display:none;"' : ''}><i class="fas fa-edit"></i></button>
                        <button class="btn-task-action delete" onclick="deleteTask('${task.id}')" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    ${task.notes ? `<div class="task-notes-box" id="notes-${task.id}">${escapeHTML(task.notes).replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            `;
        }).join('');

        // Re-bind dragging handlers
        bindDragEvents();
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Refresh dashboard stats header counts
    function updateProgressSummary() {
        const tasks = window.NihonStorage.getTasks(currentSelectedDate);
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        const summaryText = document.getElementById('planner-progress-text');
        const fillBar = document.getElementById('planner-progress-fill');
        
        if (summaryText) {
            summaryText.textContent = `${done} of ${total} tasks completed (${pct}%)`;
        }
        if (fillBar) {
            fillBar.style.width = `${pct}%`;
        }
    }

    // Task operations
    window.toggleTaskCompletion = function (taskId) {
        const tasks = window.NihonStorage.getTasks(currentSelectedDate);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const nextCompleted = !task.completed;
            window.NihonStorage.updateTask(currentSelectedDate, taskId, { completed: nextCompleted });
            
            // In-app Notification
            if (nextCompleted && window.NihonApp) {
                window.NihonApp.showToast('Task Completed! 🎉', `"${task.name}" marked as done.`, 'success');
                
                // Trigger native browser notification if allowed
                if (Notification.permission === 'granted') {
                    new Notification('Task Completed!', { body: `"${task.name}" marked as done.` });
                }
            }
            
            loadTasks();
        }
    };

    window.toggleTaskNotes = function (taskId) {
        const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
        if (card) {
            card.classList.toggle('notes-open');
        }
    };

    window.deleteTask = function (taskId) {
        if (confirm('Are you sure you want to delete this study task?')) {
            window.NihonStorage.deleteTask(currentSelectedDate, taskId);
            loadTasks();
        }
    };

    // Drag & Drop reordering
    function setupDragAndDrop() {
        // Drag over container
        const container = document.getElementById('task-list-container');
        if (!container) return;

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingCard = document.querySelector('.task-card.dragging');
            if (!draggingCard) return;

            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggingCard);
            } else {
                container.insertBefore(draggingCard, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Reorder array in storage matching visual reordering
            const cardElements = Array.from(container.querySelectorAll('.task-card'));
            const originalTasks = window.NihonStorage.getTasks(currentSelectedDate);
            
            const reorderedTasks = cardElements.map(el => {
                const id = el.dataset.id;
                return originalTasks.find(t => t.id === id);
            }).filter(Boolean);

            window.NihonStorage.saveTasks(currentSelectedDate, reorderedTasks);
            loadTasks();
        });
    }

    function bindDragEvents() {
        const cards = document.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Modal forms Handlers
    function setupModalHandlers() {
        const modal = document.getElementById('task-modal');
        const addBtn = document.getElementById('planner-add-task-btn');
        const cancelBtn = document.getElementById('task-cancel-btn');
        const closeBtn = document.getElementById('task-modal-close');
        const form = document.getElementById('task-form');

        // Modal triggers
        if (addBtn) addBtn.addEventListener('click', () => openAddTaskModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeTaskModal());
        if (closeBtn) closeBtn.addEventListener('click', () => closeTaskModal());

        // Priority button groups
        const prioBtns = document.querySelectorAll('.priority-select-btn');
        prioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                prioBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('task-priority-value').value = btn.dataset.priority;
            });
        });

        // Form Submit
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const taskData = {
                    name: document.getElementById('task-name-input').value.trim(),
                    category: document.getElementById('task-category-input').value,
                    priority: document.getElementById('task-priority-value').value,
                    estTime: parseInt(document.getElementById('task-est-input').value) || 25,
                    notes: document.getElementById('task-notes-input').value.trim()
                };

                if (taskData.name === '') {
                    alert('Please enter a task name.');
                    return;
                }

                if (editingTaskId) {
                    // Update
                    window.NihonStorage.updateTask(currentSelectedDate, editingTaskId, taskData);
                    if (window.NihonApp) window.NihonApp.showToast('Task Updated', 'Your planner task has been saved.', 'success');
                } else {
                    // Insert
                    window.NihonStorage.addTask(currentSelectedDate, taskData);
                    if (window.NihonApp) window.NihonApp.showToast('Task Created', 'Successfully added to today\'s planner.', 'success');
                }

                closeTaskModal();
                loadTasks();
            });
        }
    }

    window.openAddTaskModal = function () {
        editingTaskId = null;
        document.getElementById('task-modal-title').textContent = 'Add New Study Task';
        
        // Reset inputs
        document.getElementById('task-name-input').value = '';
        document.getElementById('task-category-input').value = 'Hiragana';
        
        // Default priority to Medium
        document.querySelectorAll('.priority-select-btn').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.priority === 'medium') b.classList.add('active');
        });
        document.getElementById('task-priority-value').value = 'medium';
        
        document.getElementById('task-est-input').value = '25';
        document.getElementById('task-notes-input').value = '';

        document.getElementById('task-modal').classList.add('open');
        document.getElementById('task-name-input').focus();
    };

    window.openEditTaskModal = function (taskId) {
        editingTaskId = taskId;
        document.getElementById('task-modal-title').textContent = 'Edit Study Task';

        const tasks = window.NihonStorage.getTasks(currentSelectedDate);
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Populate fields
        document.getElementById('task-name-input').value = task.name;
        document.getElementById('task-category-input').value = task.category;
        
        document.querySelectorAll('.priority-select-btn').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.priority === task.priority) b.classList.add('active');
        });
        document.getElementById('task-priority-value').value = task.priority;
        
        document.getElementById('task-est-input').value = task.estTime;
        document.getElementById('task-notes-input').value = task.notes || '';

        document.getElementById('task-modal').classList.add('open');
    };

    function closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) modal.classList.remove('open');
        editingTaskId = null;
    }

    // Initialize script on document load
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
})();
