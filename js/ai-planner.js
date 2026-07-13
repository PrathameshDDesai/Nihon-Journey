/**
 * ai-planner.js - AI Study Planner Logic with Gemini API & Local fallbacks
 */

(function () {
    function init() {
        setupFormDates();
        bindSetupEvents();
        checkActiveGoal();
    }

    // Set default dates on setup form
    function setupFormDates() {
        const startInput = document.getElementById('ai-goal-start');
        const endInput = document.getElementById('ai-goal-end');
        if (startInput && endInput) {
            const today = new Date();
            const end = new Date();
            end.setDate(end.getDate() + 30); // Default to 30 days plan

            startInput.value = window.NihonStorage.getLocalDateString(today);
            endInput.value = window.NihonStorage.getLocalDateString(end);
        }
    }

    // Toggle Suggestion prompt tags
    window.selectPromptSuggestion = function (element) {
        const text = element.textContent;
        const titleInput = document.getElementById('ai-goal-title');
        if (titleInput) {
            titleInput.value = text;
            titleInput.focus();
        }
    };

    // Check if goal is active on page load
    function checkActiveGoal() {
        const goal = window.NihonStorage.getAiGoal();
        const setupView = document.getElementById('ai-planner-setup-view');
        const activeView = document.getElementById('ai-planner-active-view');

        if (goal.status === 'active') {
            setupView.style.display = 'none';
            activeView.style.display = 'grid';
            renderActiveGoalView();
        } else {
            setupView.style.display = 'flex';
            activeView.style.display = 'none';
            setupFormDates();
        }
    }

    // Bind Setup Form Actions
    function bindSetupEvents() {
        const form = document.getElementById('ai-setup-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await generateStudyPlan();
            });
        }
    }

    // AI Study Plan Generation Trigger
    async function generateStudyPlan() {
        const title = document.getElementById('ai-goal-title').value.trim();
        const desc = document.getElementById('ai-goal-desc').value.trim();
        const startDate = document.getElementById('ai-goal-start').value;
        const endDate = document.getElementById('ai-goal-end').value;
        const dailyTime = parseInt(document.getElementById('ai-goal-time').value) || 60;
        const priority = document.getElementById('ai-goal-priority').value;
        const resourceLink = document.getElementById('ai-goal-resource').value.trim();
        const notes = document.getElementById('ai-goal-notes').value.trim();

        // Calculate available days
        const startD = new Date(startDate);
        const endD = new Date(endDate);
        const diffTime = Math.abs(endD - startD);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            alert('Start Date must be on or before the End Date.');
            return;
        }

        const overlay = document.getElementById('ai-loading-overlay');
        if (overlay) overlay.classList.add('open');

        const apiKey = window.NihonStorage.getApiKey();

        if (apiKey) {
            try {
                // Gemini AI Path
                const prompt = buildGeminiPrompt(title, desc, totalDays, startDate, endDate, dailyTime, priority, resourceLink, notes);
                const schema = buildGeminiSchema();
                
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            responseSchema: schema
                        }
                    })
                });

                const data = await response.json();
                if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                    const jsonResponse = JSON.parse(data.candidates[0].content.parts[0].text);
                    saveGeneratedPlan(title, desc, startDate, endDate, dailyTime, priority, resourceLink, notes, jsonResponse);
                    
                    if (overlay) overlay.classList.remove('open');
                    checkActiveGoal();
                    if (window.NihonApp) window.NihonApp.showToast('AI Plan Generated! 🧙‍♂️', 'Gemini created a personalized study course.', 'success');
                    return;
                } else {
                    console.warn('Gemini API call failed, falling back to local generation. Details:', data);
                }
            } catch (e) {
                console.error('Gemini connection error. Falling back to local generation:', e);
            }
        }

        // Local Fallback Generator
        setTimeout(() => {
            const plan = generateLocalPlan(title, desc, totalDays, startDate, dailyTime, priority, resourceLink, notes);
            saveGeneratedPlan(title, desc, startDate, endDate, dailyTime, priority, resourceLink, notes, plan);
            
            if (overlay) overlay.classList.remove('open');
            checkActiveGoal();
            if (window.NihonApp) window.NihonApp.showToast('Fallback Plan Loaded', 'Generated schedule locally using JavaScript.', 'warning');
        }, 1500); // Small delay to feel premium
    }

    // Build Prompt for Gemini
    function buildGeminiPrompt(title, desc, totalDays, startDate, dailyTime, priority, resourceLink, notes) {
        return `
            You are a professional Japanese language tutor and study planner.
            Please create a personalized daily study plan for a student who wants to achieve the following goal:
            Goal: "${title}"
            Description/Workload: "${desc || 'Not specified'}"
            Priority: "${priority}"
            Total Available Study Days: ${totalDays}
            Start Date: "${startDate}"
            Study Commitment: ${dailyTime} minutes per day.
            Optional Learning Resource Context: "${resourceLink || 'None provided'}"
            Special Instructions / Student Notes: "${notes || 'None provided'}"

            CRITICAL DESIGN REQUIREMENT (SUB-TASKS BREAKDOWN):
            Do NOT create a single card task for a day. Instead, for each day's study topic or chapter, you MUST break it down into the following 7 separate, independent sub-tasks, each with its own checkboxes and status:
            1. "Learn Vocabulary - [Topic/Chapter]" (category: "Vocabulary"): Study all new vocabulary, practice pronunciation, and review meanings.
            2. "Learn Grammar - [Topic/Chapter]" (category: "Grammar"): Study every grammar point, read explanations, and write 5-10 example sentences.
            3. "Reading Practice - [Topic/Chapter]" (category: "Reading"): Read dialogues, understand translations, and practice aloud.
            4. "Listening Practice - [Topic/Chapter]" (category: "Listening"): Listen to chapter audio tracks, repeat sentences, and shadow speakers.
            5. "Kanji Practice - [Topic/Chapter]" (category: "Kanji"): Learn all kanji stroke orders, readings, and write down example vocabulary.
            6. "Exercises - [Topic/Chapter]" (category: "Exercises"): Complete workbook questions and textbook practice drills.
            7. "Revision - [Topic/Chapter]" (category: "Revision"): Review vocabulary cards, grammar summaries, and take self-test.

            If a day is a Revision Milestone day, break it down into 3 sub-tasks:
            1. "Milestone Vocabulary Review" (category: "Vocabulary")
            2. "Milestone Grammar Check-in" (category: "Grammar")
            3. "Milestone Practice Quiz" (category: "Revision")

            If a day is a JLPT Practice Mock Test, break it down into 4 sub-tasks:
            1. "Exam Prep & Setup" (category: "Revision")
            2. "JLPT Vocab & Grammar Sections" (category: "JLPT Practice")
            3. "JLPT Reading & Listening Sections" (category: "JLPT Practice")
            4. "Test Score Correction & Revision" (category: "Revision")

            Ensure every single sub-task is a separate element in the generated schedule array. Adjust estTime for each sub-task based on the daily commitment time share.
        `;
    }

    // Gemini Structured JSON Schema
    function buildGeminiSchema() {
        return {
            type: "OBJECT",
            properties: {
                schedule: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            dayNumber: { type: "INTEGER" },
                            title: { type: "STRING" },
                            details: { type: "STRING" },
                            category: { type: "STRING" },
                            priority: { type: "STRING" },
                            estTime: { type: "INTEGER" },
                            isRevision: { type: "BOOLEAN" },
                            isMockTest: { type: "BOOLEAN" }
                        },
                        required: ["dayNumber", "title", "details", "category", "priority", "estTime", "isRevision", "isMockTest"]
                    }
                },
                coachAdvice: {
                    type: "OBJECT",
                    properties: {
                        estimatedCompletionDate: { type: "STRING" },
                        totalStudyHours: { type: "INTEGER" },
                        avgDailyWorkload: { type: "STRING" },
                        tipList: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        motivationalMessage: { type: "STRING" }
                    },
                    required: ["estimatedCompletionDate", "totalStudyHours", "avgDailyWorkload", "tipList", "motivationalMessage"]
                }
            },
            required: ["schedule", "coachAdvice"]
        };
    }

    // Local Plan Fallback Generator (Pure JavaScript)
    function generateLocalPlan(title, desc, totalDays, startDate, dailyTime, priority, resourceLink, notes) {
        const schedule = [];
        let chaptersCount = 10; // Default estimate

        // Try to parse chapters if number matches (e.g. "10 chapters" or "Chapter 5")
        const chkMatch = title.match(/(\d+)\s*chapter/i) || (desc && desc.match(/(\d+)\s*chapter/i));
        if (chkMatch) {
            chaptersCount = parseInt(chkMatch[1]);
        }

        let currentChapter = 1;
        let studyDayCounter = 1;

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(startDate);
            dateObj.setDate(dateObj.getDate() + (day - 1));
            const dateStr = window.NihonStorage.getLocalDateString(dateObj);

            if (day === totalDays) {
                // Last Day: Final Review split
                const subtasks = [
                    { title: "Review Vocabulary - Final Review", details: "Review all chapter vocabulary cards and pronunciation logs.", category: "Vocabulary", timeShare: 0.3 },
                    { title: "Review Grammar - Final Review", details: "Self-test all grammatical patterns in journal entries.", category: "Grammar", timeShare: 0.4 },
                    { title: "Final Reflection", details: "Document total hours, complete stats survey, write final entry in learning scroll.", category: "Revision", timeShare: 0.3 }
                ];
                subtasks.forEach(st => {
                    schedule.push({
                        dayNumber: day,
                        date: dateStr,
                        title: st.title,
                        details: st.details,
                        category: st.category,
                        priority: priority,
                        estTime: Math.max(5, Math.round(dailyTime * st.timeShare)),
                        isRevision: true,
                        isMockTest: false
                    });
                });
            } else if (day === totalDays - 1) {
                // Penultimate Day: Mock Test split
                const subtasks = [
                    { title: "Exam Prep & Setup", details: "Silence notifications, open practice answer sheet, start Pomodoro timer.", category: "Revision", timeShare: 0.1 },
                    { title: "JLPT Vocab & Grammar Sections", details: "Complete Section 1 (Vocabulary) and Section 2 (Grammar) under timed test conditions.", category: "JLPT Practice", timeShare: 0.4 },
                    { title: "JLPT Reading & Listening Sections", details: "Complete Section 3 (Reading) and Section 4 (Listening audio track).", category: "JLPT Practice", timeShare: 0.35 },
                    { title: "Test Score Correction & Revision", details: "Grade mock test, review wrong questions, and write grammar corrections in journal.", category: "Revision", timeShare: 0.15 }
                ];
                subtasks.forEach(st => {
                    schedule.push({
                        dayNumber: day,
                        date: dateStr,
                        title: st.title,
                        details: st.details,
                        category: st.category,
                        priority: priority,
                        estTime: Math.max(5, Math.round(dailyTime * st.timeShare)),
                        isRevision: false,
                        isMockTest: true
                    });
                });
            } else if (studyDayCounter % 4 === 0) {
                // Every 4th study day is revision milestone
                const subtasks = [
                    { title: "Milestone Vocabulary Review", details: "Review vocabulary from the past 3 days, drill spelling and meanings.", category: "Vocabulary", timeShare: 0.3 },
                    { title: "Milestone Grammar Check-in", details: "Re-read example grammar blocks, verify correct particle usages.", category: "Grammar", timeShare: 0.4 },
                    { title: "Milestone Practice Quiz", details: "Self-test using worksheets or textbook drills, check answers.", category: "Revision", timeShare: 0.3 }
                ];
                subtasks.forEach(st => {
                    schedule.push({
                        dayNumber: day,
                        date: dateStr,
                        title: st.title,
                        details: st.details,
                        category: st.category,
                        priority: priority,
                        estTime: Math.max(5, Math.round(dailyTime * st.timeShare)),
                        isRevision: true,
                        isMockTest: false
                    });
                });
                studyDayCounter = 1; // Reset counter
            } else {
                // Normal Study Day: 7 sub-tasks
                const label = currentChapter <= chaptersCount ? `Chapter ${currentChapter}` : "Practice N5";
                const isChapterMode = currentChapter <= chaptersCount;

                const subtasks = [
                    { title: `Learn Vocabulary - ${label}`, details: "Study all new vocabulary, practice pronunciation, review meanings, and mark complete independently.", category: "Vocabulary", timeShare: 0.2 },
                    { title: `Learn Grammar - ${label}`, details: "Study every grammar point, read explanations, write 5-10 example sentences, and mark complete independently.", category: "Grammar", timeShare: 0.25 },
                    { title: `Reading Practice - ${label}`, details: "Read all dialogues, understand translations, practice reading aloud, and mark complete independently.", category: "Reading", timeShare: 0.15 },
                    { title: `Listening Practice - ${label}`, details: "Listen to chapter audio, repeat sentences, shadow the speakers, and mark complete independently.", category: "Listening", timeShare: 0.15 },
                    { title: `Kanji Practice - ${label}`, details: "Learn all kanji stroke order, readings, write example vocabulary, and mark complete independently.", category: "Kanji", timeShare: 0.1 },
                    { title: `Exercises - ${label}`, details: "Complete workbook questions and textbook practice drills, and mark complete independently.", category: "Exercises", timeShare: 0.1 },
                    { title: `Revision - ${label}`, details: "Review vocabulary cards, grammar summaries, complete self-test quiz, and mark complete independently.", category: "Revision", timeShare: 0.05 }
                ];

                subtasks.forEach(st => {
                    schedule.push({
                        dayNumber: day,
                        date: dateStr,
                        title: st.title,
                        details: st.details,
                        category: st.category,
                        priority: priority,
                        estTime: Math.max(5, Math.round(dailyTime * st.timeShare)),
                        isRevision: false,
                        isMockTest: false
                    });
                });

                if (isChapterMode) {
                    currentChapter++;
                }
                studyDayCounter++;
            }
        }

        // Generate advice
        const hoursTotal = Math.round((totalDays * dailyTime) / 60);
        const endDateObj = new Date(startDate);
        endDateObj.setDate(endDateObj.getDate() + (totalDays - 1));

        const coachAdvice = {
            estimatedCompletionDate: endDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
            totalStudyHours: hoursTotal,
            avgDailyWorkload: `${Math.round(dailyTime)} mins per day`,
            tipList: [
                "Consistency is key! Try to study at the same time each day.",
                "Say vocabulary words out loud to engage auditory memory.",
                "Take brief 5-minute Pomodoro breaks between intensive reading.",
                "Don't worry if you miss a day; the schedule dynamically balances your future workload."
            ],
            motivationalMessage: "お疲れ様でした (Otsukaresama)! You have built a solid foundation. Take it step-by-step!"
        };

        return { schedule, coachAdvice };
    }

    // Save plan to localStorage
    function saveGeneratedPlan(title, desc, startDate, endDate, dailyTime, priority, resourceLink, notes, planPayload) {
        const goalData = {
            title,
            description: desc,
            startDate,
            endDate,
            dailyHours: dailyTime,
            priority,
            resourceLink,
            notes,
            status: 'active'
        };

        const scheduleTasks = planPayload.schedule.map((t, idx) => {
            const catSlug = t.category ? t.category.toLowerCase().replace(/\s+/g, '_') : idx;
            return {
                id: `ai_task_${t.dayNumber}_${catSlug}_${t.date}`,
                completed: false,
                completedDate: null,
                ...t
            };
        });

        window.NihonStorage.saveAiGoal(goalData);
        window.NihonStorage.saveAiSchedule(scheduleTasks);
        window.NihonStorage.saveAiCoach(planPayload.coachAdvice);
    }

    // Render Active Planner view
    function renderActiveGoalView() {
        const goal = window.NihonStorage.getAiGoal();
        const schedule = window.NihonStorage.getAiSchedule();
        const coach = window.NihonStorage.getAiCoach();

        // Title and description
        document.getElementById('active-goal-title').textContent = goal.title;
        document.getElementById('active-goal-desc').textContent = goal.description || 'Personalized Japanese learning schedule.';
        
        // Priority
        const prioBadge = document.getElementById('active-goal-priority');
        if (prioBadge) {
            prioBadge.className = `tag tag-priority-${goal.priority}`;
            prioBadge.textContent = `${goal.priority} priority`;
        }

        // Dates and countdown
        const endObj = new Date(goal.endDate);
        const todayObj = new Date(window.NihonStorage.getLocalDateString());
        const diffDays = Math.ceil((endObj - todayObj) / (1000 * 60 * 60 * 24));
        document.getElementById('active-goal-days-remain').textContent = diffDays >= 0 ? `${diffDays} days remaining` : 'Deadline passed';

        // Progress Ratio
        const total = schedule.length;
        const done = schedule.filter(t => t.completed).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        
        document.getElementById('active-goal-progress-text').textContent = `${done} of ${total} days completed (${pct}%)`;
        document.getElementById('active-goal-progress-fill').style.width = `${pct}%`;

        // Render stats card
        document.getElementById('stats-plan-time').textContent = `${coach.totalStudyHours} hours`;
        document.getElementById('stats-plan-load').textContent = coach.avgDailyWorkload;
        document.getElementById('stats-plan-deadline').textContent = coach.estimatedCompletionDate;
        
        const resourceEl = document.getElementById('stats-plan-resource');
        if (goal.resourceLink) {
            resourceEl.innerHTML = `<a href="${goal.resourceLink}" target="_blank" style="color:var(--primary); font-weight:700;">Link <i class="fas fa-external-link-alt"></i></a>`;
        } else {
            resourceEl.textContent = 'None';
        }

        // Render Day-by-day list
        renderScheduleList(schedule);

        // Render Coach advice speech bubble
        renderCoachAdvice(schedule, coach);

        // Render milestones
        renderMilestones(schedule);
    }

    // Render schedule list items
    function renderScheduleList(schedule) {
        const container = document.getElementById('ai-schedule-list-container');
        if (!container) return;

        const todayStr = window.NihonStorage.getLocalDateString();

        container.innerHTML = schedule.map(t => {
            const isCompleted = t.completed;
            const completedClass = isCompleted ? 'completed' : '';
            const statusIcon = isCompleted ? '<i class="fas fa-check"></i>' : '';
            const dateObj = new Date(t.date);
            const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

            const isToday = t.date === todayStr;
            const highlightBorder = isToday ? 'style="border-color:var(--primary); box-shadow: var(--shadow-sm);"' : '';

            // Badges
            let badgeHtml = '';
            if (t.isRevision) badgeHtml += `<span class="tag tag-cat" style="background-color:hsl(270,50%,93%); color:hsl(270,60%,45%);">Revision</span>`;
            if (t.isMockTest) badgeHtml += `<span class="tag tag-priority-high">Mock Test</span>`;
            if (!t.isRevision && !t.isMockTest) badgeHtml += `<span class="tag tag-cat">${t.category}</span>`;

            return `
                <div class="ai-day-card ${completedClass}" ${highlightBorder} data-id="${t.id}">
                    <button class="task-check-btn" onclick="toggleAiTaskCompletion('${t.id}')" title="${isCompleted ? 'Mark incomplete' : 'Mark complete'}">
                        ${statusIcon}
                    </button>
                    <div class="ai-day-badge">
                        Day <span>${t.dayNumber}</span>
                    </div>
                    <div class="ai-day-details">
                        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                            <span class="ai-day-title">${escapeHTML(t.title)}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">${formattedDate}</span>
                        </div>
                        <span class="ai-day-desc">${escapeHTML(t.details)}</span>
                        <div class="ai-day-tags">
                            ${badgeHtml}
                            <span class="task-time-est" style="font-size:0.65rem;"><i class="far fa-hourglass"></i> ${t.estTime}m</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Toggle completion for AI task cell
    window.toggleAiTaskCompletion = function (taskId) {
        const schedule = window.NihonStorage.getAiSchedule();
        const task = schedule.find(t => t.id === taskId);
        if (task) {
            const nextVal = !task.completed;
            const todayStr = window.NihonStorage.getLocalDateString();
            
            // Central wrapper update will also check achievements & update streaks
            window.NihonStorage.updateTask(task.date, taskId, { completed: nextVal });

            if (nextVal && window.NihonApp) {
                window.NihonApp.showToast('AI Target Achieved! 🏆', `"${task.title}" checked off.`, 'success');
            }

            renderActiveGoalView();
        }
    };

    // Render Coach balloon recommendations
    function renderCoachAdvice(schedule, coach) {
        const bubble = document.getElementById('coach-speech-bubble');
        if (!bubble) return;

        const todayStr = window.NihonStorage.getLocalDateString();
        const todayTask = schedule.find(t => t.date === todayStr);

        let coachText = '';
        if (todayTask) {
            if (todayTask.completed) {
                coachText = `🎉 Fantastic! You completed today's AI target: <strong>"${todayTask.title}"</strong>. If you feel energized, try practicing some extra vocab check-offs or writing tomorrow's goal in your journal!`;
            } else {
                coachText = `👋 Hello! Today's study target is: <strong>"${todayTask.title}"</strong> (${todayTask.details}). Focus on this for ${todayTask.estTime} minutes today. You've got this!`;
            }
        } else {
            // Check if plan has ended or not started yet
            const firstDateStr = schedule.length > 0 ? schedule[0].date : '';
            const lastDateStr = schedule.length > 0 ? schedule[schedule.length - 1].date : '';
            
            if (new Date(todayStr) < new Date(firstDateStr)) {
                coachText = `⏳ Your plan hasn't started yet. Prepare your study materials! It begins on <strong>${firstDateStr}</strong>.`;
            } else if (new Date(todayStr) > new Date(lastDateStr)) {
                coachText = `🏁 Congratulations! Your N5 study plan has concluded. View your Statistics and print your badges. You did a great job!`;
            } else {
                coachText = `📝 Review your milestones and study schedule below. Click "Redistribute" if you need to catch up.`;
            }
        }

        // Append random tip from list
        if (coach.tipList && coach.tipList.length > 0) {
            const randomTip = coach.tipList[Math.floor(Math.random() * coach.tipList.length)];
            coachText += `<br><br>💡 <strong>Study Tip:</strong> ${randomTip}`;
        }

        // Add motivational text
        if (coach.motivationalMessage) {
            coachText += `<br><br>💬 <em>"${coach.motivationalMessage}"</em>`;
        }

        bubble.innerHTML = coachText;
    }

    // Render Milestones Checkpoints card
    function renderMilestones(schedule) {
        const listContainer = document.getElementById('coach-milestones-list');
        if (!listContainer) return;

        const milestones = schedule.filter(t => t.isRevision || t.isMockTest);
        if (milestones.length === 0) {
            listContainer.innerHTML = `<span style="font-size:0.8rem; color:var(--text-muted);">No major checkpoints scheduled.</span>`;
            return;
        }

        listContainer.innerHTML = milestones.map(m => {
            const icon = m.completed ? '<i class="fas fa-check-circle completed" style="color:var(--success);"></i>' : '<i class="far fa-circle" style="color:var(--text-muted);"></i>';
            const textStyle = m.completed ? 'style="text-decoration: line-through; color: var(--text-muted); font-size:0.8rem;"' : 'style="font-size:0.8rem;"';
            
            const dateObj = new Date(m.date);
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const badgeText = m.isMockTest ? 'Mock Test' : 'Revision';

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:4px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${icon}
                        <span ${textStyle}>Day ${m.dayNumber}: ${escapeHTML(m.title)}</span>
                    </div>
                    <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">${dateStr}</span>
                </div>
            `;
        }).join('');
    }

    // Shift past incomplete tasks to remaining future days
    window.triggerRedistributeSchedule = function () {
        if (confirm('Do you want to redistribute past unfinished tasks across future days? This will reschedule incomplete tasks evenly to prevent overloading today.')) {
            const result = window.NihonStorage.redistributeAiSchedule();
            if (result.success) {
                if (result.count > 0) {
                    if (window.NihonApp) {
                        window.NihonApp.showToast('Schedule Respaced! 🔄', `${result.count} past task${result.count > 1 ? 's were' : ' was'} distributed across future days.`, 'success');
                    }
                    renderActiveGoalView();
                } else {
                    alert(result.message || 'No past incomplete tasks found to reschedule.');
                }
            } else {
                alert(`Redistribution failed: ${result.error}`);
            }
        }
    };

    // Delete Active Plan
    window.deleteActiveGoal = function () {
        if (confirm('ARE YOU SURE you want to delete this study plan? All generated AI schedule tasks will be wiped from your planner and calendar.')) {
            window.NihonStorage.deleteAiPlan();
            if (window.NihonApp) {
                window.NihonApp.showToast('AI Plan Deleted', 'Planner reset back to original manual mode.', 'danger');
            }
            checkActiveGoal();
        }
    };

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    // Page Init
    window.addEventListener('nihon_data_loaded', () => {
        init();
    });
})();
