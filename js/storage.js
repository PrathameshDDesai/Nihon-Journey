/**
 * storage.js - Local Storage Service for Nihon Journey
 * Handles data persistence, daily task carryovers, streak calculations, and badges.
 */

const STORAGE_KEYS = {
    SETTINGS: 'nihon_user_settings',
    TASKS: 'nihon_tasks',
    JOURNALS: 'nihon_journals',
    STUDY_TIME: 'nihon_study_time',
    CHECKLISTS: 'nihon_checklists',
    STREAKS: 'nihon_streaks',
    BADGES: 'nihon_unlocked_badges',
    NOTIFICATIONS: 'nihon_notifications_history',
    API_KEY: 'nihon_gemini_api_key',
    AI_GOAL: 'nihon_ai_goal',
    AI_SCHEDULE: 'nihon_ai_schedule',
    AI_COACH: 'nihon_ai_coach'
};

// Default Hiragana (46 standard characters)
const DEFAULT_HIRAGANA = [
    { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' }, { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' }, { char: 'お', romaji: 'o' },
    { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
    { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi' }, { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
    { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi' }, { char: 'つ', romaji: 'tsu' }, { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
    { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
    { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
    { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
    { char: 'や', romaji: 'ya' }, { char: '', romaji: '' }, { char: 'ゆ', romaji: 'yu' }, { char: '', romaji: '' }, { char: 'よ', romaji: 'yo' },
    { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
    { char: 'わ', romaji: 'wa' }, { char: '', romaji: '' }, { char: '', romaji: '' }, { char: '', romaji: '' }, { char: 'を', romaji: 'wo' },
    { char: 'ん', romaji: 'n' }
].filter(item => item.char !== '');

// Default Katakana (46 standard characters)
const DEFAULT_KATAKANA = [
    { char: 'ア', romaji: 'a' }, { char: 'イ', romaji: 'i' }, { char: 'ウ', romaji: 'u' }, { char: 'エ', romaji: 'e' }, { char: 'オ', romaji: 'o' },
    { char: 'カ', romaji: 'ka' }, { char: 'キ', romaji: 'ki' }, { char: 'ク', romaji: 'ku' }, { char: 'ケ', romaji: 'ke' }, { char: 'コ', romaji: 'ko' },
    { char: 'サ', romaji: 'sa' }, { char: 'シ', romaji: 'shi' }, { char: 'ス', romaji: 'su' }, { char: 'セ', romaji: 'se' }, { char: 'ソ', romaji: 'so' },
    { char: 'タ', romaji: 'ta' }, { char: 'チ', romaji: 'chi' }, { char: 'ツ', romaji: 'tsu' }, { char: 'テ', romaji: 'te' }, { char: 'ト', romaji: 'to' },
    { char: 'ナ', romaji: 'na' }, { char: 'ニ', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ネ', romaji: 'ne' }, { char: 'ノ', romaji: 'no' },
    { char: 'ハ', romaji: 'ha' }, { char: 'ヒ', romaji: 'hi' }, { char: 'フ', romaji: 'fu' }, { char: 'ヘ', romaji: 'he' }, { char: 'ホ', romaji: 'ho' },
    { char: 'マ', romaji: 'ma' }, { char: 'ミ', romaji: 'mi' }, { char: 'ム', romaji: 'mu' }, { char: 'メ', romaji: 'me' }, { char: 'モ', romaji: 'mo' },
    { char: 'ヤ', romaji: 'ya' }, { char: '', romaji: '' }, { char: 'ユ', romaji: 'yu' }, { char: '', romaji: '' }, { char: 'ヨ', romaji: 'yo' },
    { char: 'ラ', romaji: 'ra' }, { char: 'リ', romaji: 'ri' }, { char: 'ル', romaji: 'ru' }, { char: 'レ', romaji: 're' }, { char: 'ロ', romaji: 'ro' },
    { char: 'ワ', romaji: 'wa' }, { char: '', romaji: '' }, { char: '', romaji: '' }, { char: '', romaji: '' }, { char: 'ヲ', romaji: 'wo' },
    { char: 'ン', romaji: 'n' }
].filter(item => item.char !== '');

// Default Kanji (25 essential JLPT N5 characters)
const DEFAULT_KANJI = [
    { char: '一', romaji: 'ichi / hito', mean: 'one' },
    { char: '二', romaji: 'ni / futa', mean: 'two' },
    { char: '三', romaji: 'san / mi', mean: 'three' },
    { char: '四', romaji: 'yon / shi', mean: 'four' },
    { char: '五', romaji: 'go / itsu', mean: 'five' },
    { char: '六', romaji: 'roku / mu', mean: 'six' },
    { char: '七', romaji: 'nana / shichi', mean: 'seven' },
    { char: '八', romaji: 'hachi / ya', mean: 'eight' },
    { char: '九', romaji: 'kyuu / kokono', mean: 'nine' },
    { char: '十', romaji: 'juu / too', mean: 'ten' },
    { char: '日', romaji: 'hi / nichi / bi', mean: 'day / sun' },
    { char: '本', romaji: 'hon / moto', mean: 'book / origin' },
    { char: '人', romaji: 'hito / jin / nin', mean: 'person' },
    { char: '月', romaji: 'tsuki / getsu / gatsu', mean: 'month / moon' },
    { char: '火', romaji: 'hi / ka', mean: 'fire' },
    { char: '水', romaji: 'mizu / sui', mean: 'water' },
    { char: '木', romaji: 'ki / moku', mean: 'tree / wood' },
    { char: '金', romaji: 'kane / kin', mean: 'gold / money' },
    { char: '土', romaji: 'tsuchi / do', mean: 'soil / earth' },
    { char: '山', romaji: 'yama / san', mean: 'mountain' },
    { char: '川', romaji: 'kawa / sen', mean: 'river' },
    { char: '田', romaji: 'ta / den', mean: 'rice field' },
    { char: '中', romaji: 'naka / chuu', mean: 'inside / middle' },
    { char: '国', romaji: 'kuni / koku', mean: 'country' },
    { char: '日本語', romaji: 'nihongo', mean: 'Japanese language' }
];

// Essential N5 vocabulary check off items
const DEFAULT_VOCABULARY = [
    { phrase: 'こんにちは (Konnichiwa)', mean: 'Hello / Good afternoon' },
    { phrase: 'ありがとう (Arigatou)', mean: 'Thank you' },
    { phrase: 'すみません (Sumimasen)', mean: 'Excuse me / Sorry' },
    { phrase: 'はい (Hai) / いいえ (Iie)', mean: 'Yes / No' },
    { phrase: 'さようなら (Sayounara)', mean: 'Goodbye' },
    { phrase: 'おいしい (Oishii)', mean: 'Delicious' },
    { phrase: 'ともだち (Tomodachi)', mean: 'Friend' },
    { phrase: 'せんせい (Sensei)', mean: 'Teacher' },
    { phrase: 'がくせい (Gakusei)', mean: 'Student' },
    { phrase: 'べんきょうする (Benkyou suru)', mean: 'To study' }
];

// Essential N5 grammar items
const DEFAULT_GRAMMAR = [
    { rule: 'X は Y です (X wa Y desu)', mean: 'X is Y' },
    { rule: 'Particle か (ka)', mean: 'Question marker' },
    { rule: 'Particle の (no)', mean: 'Possessive marker' },
    { rule: 'Particle を (o / wo)', mean: 'Direct object marker' },
    { rule: 'Particle に / へ (ni / e)', mean: 'Direction / destination' },
    { rule: 'X があります (X ga arimasu)', mean: 'There is X (inanimate)' },
    { rule: 'X がいます (X ga imasu)', mean: 'There is X (animate)' },
    { rule: 'Verb 〜ます (masu) form', mean: 'Polite verb form' },
    { rule: 'Verb 〜てください (te kudasai)', mean: 'Please do (request)' },
    { rule: '〜たいです (tai desu)', mean: 'Want to do X' }
];

const DEFAULT_SKILLS = ['Listening', 'Reading', 'Speaking', 'Writing'];

const Quotes = [
    { jp: "継続は力なり", romaji: "Keizoku wa chikara nari", en: "Continuity is strength. (Perseverance pays off)" },
    { jp: "七転び八起き", romaji: "Nanakorobi yaoki", en: "Fall down seven times, stand up eight." },
    { jp: "千里の道も一歩から", romaji: "Senri no michi mo ippo kara", en: "A journey of a thousand miles begins with a single step." },
    { jp: "明日は明日の風が吹く", romaji: "Ashita wa ashita no kaze ga fuku", en: "Tomorrow's wind will blow tomorrow. (Don't worry about tomorrow)" },
    { jp: "初心忘るべからず", romaji: "Shoshin wasuru bekarazu", en: "Never forget your original humble intention." },
    { jp: "一期一会", romaji: "Ichigo ichie", en: "Once in a lifetime encounter. (Treasure every moment)" }
];

const Badges = {
    'first-task': { title: 'First Steps', icon: '🏆', desc: 'Complete your first task!' },
    'streak-7': { title: 'Dedicated Learner', icon: '🔥', desc: 'Maintain a 7-day study streak.' },
    'vocab-10': { title: 'Word Collector', icon: '📚', desc: 'Learn 10 essential vocabulary words.' },
    'learn-hiragana': { title: 'Kana Master (ひ)', icon: '🈶', desc: 'Complete the Hiragana checklist.' },
    'learn-katakana': { title: 'Kana Master (カ)', icon: '🈷', desc: 'Complete the Katakana checklist.' },
    'first-journal': { title: 'My Diary', icon: '✍', desc: 'Write your first journal entry.' },
    'finish-daily-goal': { title: 'Goal Crusher', icon: '🎯', desc: 'Complete your daily tasks target.' },
    'time-scholar': { title: 'Time Scholar', icon: '⏳', desc: 'Log at least 1 hour of active study time.' }
};

const NihonStorage = {
    // Utility helpers
    getLocalDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Initializer
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            const defaultSettings = {
                username: 'Tabi-bito (旅人)',
                dailyTaskGoal: 3,
                dailyHoursGoal: 30, // in minutes
                theme: 'light'
            };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
        }

        if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify({}));
        }

        if (!localStorage.getItem(STORAGE_KEYS.JOURNALS)) {
            localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify({}));
        }

        if (!localStorage.getItem(STORAGE_KEYS.STUDY_TIME)) {
            localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify({}));
        }

        if (!localStorage.getItem(STORAGE_KEYS.CHECKLISTS)) {
            const defaultChecklists = {
                hiragana: [],
                katakana: [],
                kanji: [],
                vocabulary: [],
                grammar: [],
                listening: [],
                reading: [],
                speaking: [],
                writing: []
            };
            localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(defaultChecklists));
        }

        if (!localStorage.getItem(STORAGE_KEYS.STREAKS)) {
            const defaultStreaks = {
                currentStreak: 0,
                longestStreak: 0,
                totalStudyDays: 0,
                lastStudyDate: ''
            };
            localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(defaultStreaks));
        }

        if (!localStorage.getItem(STORAGE_KEYS.BADGES)) {
            localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify([]));
        }

        if (!localStorage.getItem(STORAGE_KEYS.API_KEY)) {
            localStorage.setItem(STORAGE_KEYS.API_KEY, '');
        }

        if (!localStorage.getItem(STORAGE_KEYS.AI_GOAL)) {
            localStorage.setItem(STORAGE_KEYS.AI_GOAL, JSON.stringify({ status: 'none' }));
        }

        if (!localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) {
            localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify([]));
        }

        if (!localStorage.getItem(STORAGE_KEYS.AI_COACH)) {
            localStorage.setItem(STORAGE_KEYS.AI_COACH, JSON.stringify({}));
        }

        this.processDailyCarryover();
    },

    // Carryover unfinished tasks and update streak
    processDailyCarryover() {
        const todayStr = this.getLocalDateString();
        const taskDb = this.getAllTasks();

        // If today's planner doesn't exist
        if (!taskDb[todayStr]) {
            taskDb[todayStr] = [];

            // Find the most recent day before today with tasks
            const dates = Object.keys(taskDb).sort((a, b) => new Date(b) - new Date(a));
            const lastDateWithTasks = dates.find(d => d < todayStr);

            let carriedOverCount = 0;
            if (lastDateWithTasks) {
                const pastTasks = taskDb[lastDateWithTasks];
                const incompleteTasks = pastTasks.filter(t => !t.completed);
                const completeTasks = pastTasks.filter(t => t.completed);

                if (incompleteTasks.length > 0) {
                    // Move incomplete tasks to today
                    incompleteTasks.forEach(task => {
                        taskDb[todayStr].push({
                            ...task,
                            carriedFrom: lastDateWithTasks
                        });
                    });
                    carriedOverCount = incompleteTasks.length;

                    // Update last date tasks to keep only completed ones in history
                    taskDb[lastDateWithTasks] = completeTasks;
                }
            }

            // Save tasks
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(taskDb));

            // Carry over incomplete AI tasks
            let aiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
            let aiCarriedOverCount = 0;
            
            aiSchedule = aiSchedule.map(t => {
                if (!t.completed && t.date < todayStr) {
                    aiCarriedOverCount++;
                    return {
                        ...t,
                        carriedFrom: t.carriedFrom || t.date, // Track where it came from originally
                        date: todayStr // Move date to today
                    };
                }
                return t;
            });
            
            if (aiCarriedOverCount > 0) {
                localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(aiSchedule));
                this.recalculateScheduleDates();
                carriedOverCount += aiCarriedOverCount;
            }

            // Set session indicator to trigger notification in UI
            if (carriedOverCount > 0) {
                sessionStorage.setItem('nihon_carryover_msg', `${carriedOverCount} unfinished task${carriedOverCount > 1 ? 's were' : ' was'} moved to today.`);
            }

            // Also check if today is a new day and we should trigger "New Day Started"
            sessionStorage.setItem('nihon_new_day_triggered', 'true');
        }

        // Recalculate streaks
        this.recalculateStreaks();
    },

    // Settings
    getSettings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    },

    // Tasks API
    getAllTasks() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || {};
    },

    getTasks(date = this.getLocalDateString()) {
        const tasks = this.getAllTasks();
        const manualTasks = tasks[date] || [];

        // Load AI tasks matching this date
        const aiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
        const aiTasksForDate = aiSchedule.filter(t => t.date === date).map((t, idx) => {
            const catSlug = t.category ? t.category.toLowerCase().replace(/\s+/g, '_') : idx;
            return {
                ...t,
                id: t.id || `ai_task_${t.dayNumber}_${catSlug}_${t.date}`,
                name: t.title,   // Map AI title to task name for checklist UI
                notes: t.details, // Map AI details to notes for details boxes
                isAiTask: true
            };
        });

        return [...manualTasks, ...aiTasksForDate];
    },

    saveTasks(date, tasks) {
        const manualTasks = [];
        const aiTasks = [];

        tasks.forEach(t => {
            if (t.isAiTask || (t.id && t.id.startsWith('ai_task_'))) {
                aiTasks.push(t);
            } else {
                manualTasks.push(t);
            }
        });

        // Save manual tasks
        const taskDb = this.getAllTasks();
        taskDb[date] = manualTasks;
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(taskDb));

        // Save AI tasks (sync back to active schedule)
        if (aiTasks.length > 0) {
            let fullAiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
            aiTasks.forEach(aiT => {
                const idx = fullAiSchedule.findIndex(item => item.id === aiT.id);
                if (idx > -1) {
                    fullAiSchedule[idx] = {
                        ...fullAiSchedule[idx],
                        completed: aiT.completed,
                        completedDate: aiT.completed ? (aiT.completedDate || date) : null
                    };
                }
            });
            localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(fullAiSchedule));
            this.recalculateScheduleDates();
        }

        this.checkTaskAchievements(date);
        this.recalculateStreaks();
    },

    addTask(date, task) {
        const tasks = this.getTasks(date).filter(t => !t.isAiTask); // Append only to manual tasks
        tasks.push({
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            completed: false,
            carriedFrom: null,
            ...task
        });
        this.saveTasks(date, tasks);
    },

    updateTask(date, taskId, updatedFields) {
        if (taskId && taskId.startsWith('ai_task_')) {
            let fullAiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
            fullAiSchedule = fullAiSchedule.map(t => {
                if (t.id === taskId) {
                    const completed = updatedFields.completed !== undefined ? updatedFields.completed : t.completed;
                    return {
                        ...t,
                        ...updatedFields,
                        completed: completed,
                        completedDate: completed ? (t.completedDate || date) : null
                    };
                }
                return t;
            });
            localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(fullAiSchedule));
            this.recalculateScheduleDates();

            this.checkTaskAchievements(date);
            this.recalculateStreaks();
        } else {
            let tasks = this.getTasks(date).filter(t => !t.isAiTask);
            tasks = tasks.map(t => t.id === taskId ? { ...t, ...updatedFields } : t);
            this.saveTasks(date, tasks);
        }
    },

    deleteTask(date, taskId) {
        if (taskId && taskId.startsWith('ai_task_')) {
            let fullAiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
            fullAiSchedule = fullAiSchedule.filter(t => t.id !== taskId);
            localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(fullAiSchedule));

            this.recalculateStreaks();
        } else {
            let tasks = this.getTasks(date).filter(t => !t.isAiTask);
            tasks = tasks.filter(t => t.id !== taskId);
            this.saveTasks(date, tasks);
        }
    },

    // Journals API
    getAllJournals() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOURNALS)) || {};
    },

    getJournal(date = this.getLocalDateString()) {
        const journals = this.getAllJournals();
        return journals[date] || {
            learnedToday: '',
            newKanji: '',
            newVocabulary: '',
            grammarNotes: '',
            difficultTopics: '',
            tomorrowGoal: ''
        };
    },

    saveJournal(date, journal) {
        const journals = this.getAllJournals();
        journals[date] = journal;
        localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));

        // Check if journal has content
        const hasContent = Object.values(journal).some(val => val && val.trim() !== '');
        if (hasContent) {
            this.unlockBadge('first-journal');
        }
    },

    // Study Time API (values in seconds)
    getAllStudyTime() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_TIME)) || {};
    },

    getStudyTime(date = this.getLocalDateString()) {
        const timeDb = this.getAllStudyTime();
        return timeDb[date] || 0;
    },

    addStudyTime(date, seconds) {
        const timeDb = this.getAllStudyTime();
        timeDb[date] = (timeDb[date] || 0) + seconds;
        localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(timeDb));

        // Check for time badges
        let totalSeconds = 0;
        Object.values(timeDb).forEach(s => totalSeconds += s);
        if (totalSeconds >= 3600) { // 1 hour
            this.unlockBadge('time-scholar');
        }

        this.recalculateStreaks();
    },

    // Checklists API
    getChecklists() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLISTS)) || {};
    },

    saveChecklists(checklists) {
        localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
        this.checkChecklistAchievements();
    },

    toggleChecklistItem(category, itemKey) {
        const lists = this.getChecklists();
        if (!lists[category]) {
            lists[category] = [];
        }

        const idx = lists[category].indexOf(itemKey);
        if (idx > -1) {
            lists[category].splice(idx, 1);
        } else {
            lists[category].push(itemKey);
        }

        this.saveChecklists(lists);
        return lists[category].includes(itemKey);
    },

    // Streak Logic
    recalculateStreaks() {
        const taskDb = this.getAllTasks();
        const timeDb = this.getAllStudyTime();

        const studyDates = new Set();

        // Add task completion days from manual tasks
        Object.keys(taskDb).forEach(dateStr => {
            const completedTasks = taskDb[dateStr].filter(t => t.completed);
            if (completedTasks.length > 0) {
                studyDates.add(dateStr);
            }
        });

        // Add task completion days from AI tasks
        const aiSchedule = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
        aiSchedule.forEach(t => {
            if (t.completed && t.completedDate) {
                studyDates.add(t.completedDate);
            }
        });

        // Add study timer days
        Object.keys(timeDb).forEach(dateStr => {
            if (timeDb[dateStr] > 0) {
                studyDates.add(dateStr);
            }
        });

        const sortedDates = Array.from(studyDates).sort((a, b) => new Date(a) - new Date(b));

        let currentStreak = 0;
        let longestStreak = 0;
        const totalStudyDays = studyDates.size;

        if (totalStudyDays > 0) {
            const todayStr = this.getLocalDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = this.getLocalDateString(yesterday);

            const hasStudiedRecently = studyDates.has(todayStr) || studyDates.has(yesterdayStr);

            if (hasStudiedRecently) {
                let checkDate = studyDates.has(todayStr) ? new Date() : yesterday;
                while (true) {
                    const checkStr = this.getLocalDateString(checkDate);
                    if (studyDates.has(checkStr)) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            } else {
                currentStreak = 0;
            }

            let tempStreak = 0;
            let prevDate = null;

            sortedDates.forEach(dateStr => {
                const currentDate = new Date(dateStr);
                if (prevDate === null) {
                    tempStreak = 1;
                } else {
                    const diffTime = Math.abs(currentDate - prevDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        tempStreak++;
                    } else if (diffDays > 1) {
                        if (tempStreak > longestStreak) {
                            longestStreak = tempStreak;
                        }
                        tempStreak = 1;
                    }
                }
                prevDate = currentDate;
            });
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        const prevStreakData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAKS)) || {};
        const streaks = {
            currentStreak,
            longestStreak,
            totalStudyDays,
            lastStudyDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : ''
        };

        localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaks));

        if (currentStreak > (prevStreakData.currentStreak || 0)) {
            sessionStorage.setItem('nihon_streak_increased', 'true');
            if (currentStreak >= 7) {
                this.unlockBadge('streak-7');
            }
        }
    },

    getStreaks() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.STREAKS)) || {
            currentStreak: 0,
            longestStreak: 0,
            totalStudyDays: 0,
            lastStudyDate: ''
        };
    },

    // Badges / Achievements API
    getUnlockedBadges() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.BADGES)) || [];
    },

    unlockBadge(badgeId) {
        const unlocked = this.getUnlockedBadges();
        if (!unlocked.includes(badgeId)) {
            unlocked.push(badgeId);
            localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(unlocked));
            sessionStorage.setItem('nihon_badge_unlocked_now', badgeId);
            return true;
        }
        return false;
    },

    checkTaskAchievements(date) {
        const tasks = this.getTasks(date);
        const completedTasks = tasks.filter(t => t.completed);

        if (completedTasks.length > 0) {
            this.unlockBadge('first-task');
        }

        const settings = this.getSettings();
        const goal = settings.dailyTaskGoal || 3;
        if (completedTasks.length >= goal) {
            this.unlockBadge('finish-daily-goal');
        }
    },

    checkChecklistAchievements() {
        const lists = this.getChecklists();

        if (lists.hiragana && lists.hiragana.length >= DEFAULT_HIRAGANA.length) {
            this.unlockBadge('learn-hiragana');
        }

        if (lists.katakana && lists.katakana.length >= DEFAULT_KATAKANA.length) {
            this.unlockBadge('learn-katakana');
        }

        if (lists.vocabulary && lists.vocabulary.length >= 10) {
            this.unlockBadge('vocab-10');
        }
    },

    // Backup & Restore
    exportData() {
        const backup = {
            settings: this.getSettings(),
            tasks: this.getAllTasks(),
            journals: this.getAllJournals(),
            studyTime: this.getAllStudyTime(),
            checklists: this.getChecklists(),
            streaks: this.getStreaks(),
            badges: this.getUnlockedBadges()
        };
        return JSON.stringify(backup, null, 2);
    },

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (!data.settings || !data.tasks || !data.journals) {
                return { success: false, error: 'Invalid file format. Missing core keys.' };
            }

            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
            localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(data.journals));
            
            if (data.studyTime) localStorage.setItem(STORAGE_KEYS.STUDY_TIME, JSON.stringify(data.studyTime));
            if (data.checklists) localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(data.checklists));
            if (data.streaks) localStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(data.streaks));
            if (data.badges) localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(data.badges));

            this.recalculateStreaks();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    resetAllData() {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        localStorage.removeItem(STORAGE_KEYS.JOURNALS);
        localStorage.removeItem(STORAGE_KEYS.STUDY_TIME);
        localStorage.removeItem(STORAGE_KEYS.CHECKLISTS);
        localStorage.removeItem(STORAGE_KEYS.STREAKS);
        localStorage.removeItem(STORAGE_KEYS.BADGES);
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
        localStorage.removeItem(STORAGE_KEYS.AI_GOAL);
        localStorage.removeItem(STORAGE_KEYS.AI_SCHEDULE);
        localStorage.removeItem(STORAGE_KEYS.AI_COACH);
        
        this.init();
    },

    getApiKey() {
        return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    },

    saveApiKey(key) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    },

    getAiGoal() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_GOAL)) || { status: 'none' };
    },

    saveAiGoal(goal) {
        localStorage.setItem(STORAGE_KEYS.AI_GOAL, JSON.stringify(goal));
    },

    getAiSchedule() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_SCHEDULE)) || [];
    },

    saveAiSchedule(schedule) {
        localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(schedule));
    },

    getAiCoach() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_COACH)) || {};
    },

    saveAiCoach(coach) {
        localStorage.setItem(STORAGE_KEYS.AI_COACH, JSON.stringify(coach));
    },

    deleteAiPlan() {
        localStorage.setItem(STORAGE_KEYS.AI_GOAL, JSON.stringify({ status: 'none' }));
        localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.AI_COACH, JSON.stringify({}));
        this.recalculateStreaks();
    },

    redistributeAiSchedule() {
        const goal = this.getAiGoal();
        if (goal.status !== 'active') return { success: false, error: 'No active AI goal.' };

        const schedule = this.getAiSchedule();
        const todayStr = this.getLocalDateString();
        const todayObj = new Date(todayStr);
        const endObj = new Date(goal.endDate);

        if (todayObj > endObj) {
            return { success: false, error: 'Goal end date has passed. Please create a new goal.' };
        }

        // Find past incomplete tasks
        const pastIncomplete = schedule.filter(t => !t.completed && new Date(t.date) < todayObj);
        if (pastIncomplete.length === 0) {
            return { success: true, count: 0, message: 'No past incomplete tasks to redistribute!' };
        }

        // Get future dates in the plan (from today to end date)
        const futureDates = [];
        let tempDate = new Date(todayObj);
        while (tempDate <= endObj) {
            futureDates.push(this.getLocalDateString(tempDate));
            tempDate.setDate(tempDate.getDate() + 1);
        }

        if (futureDates.length === 0) {
            return { success: false, error: 'No remaining future days in plan.' };
        }

        // Distribute past incomplete tasks across future dates (round robin)
        pastIncomplete.forEach((task, idx) => {
            const targetDate = futureDates[idx % futureDates.length];
            task.date = targetDate; // Move task to target date
        });

        // Save schedule
        this.saveAiSchedule(schedule);
        this.recalculateStreaks();
        return { success: true, count: pastIncomplete.length };
    },

    recalculateScheduleDates() {
        const goal = this.getAiGoal();
        if (goal.status !== 'active') return;

        let schedule = this.getAiSchedule();
        const todayStr = this.getLocalDateString();
        const todayObj = new Date(todayStr);
        const endObj = new Date(goal.endDate);

        if (todayObj > endObj) return;

        // 1. Separate completed and incomplete tasks
        const completedTasks = schedule.filter(t => t.completed);
        const incompleteTasks = schedule.filter(t => !t.completed);

        // Sort incomplete tasks by their original Day index and then their category order
        incompleteTasks.sort((a, b) => {
            if (a.dayNumber !== b.dayNumber) {
                return a.dayNumber - b.dayNumber;
            }
            const order = {
                'Vocabulary': 1,
                'Grammar': 2,
                'Reading': 3,
                'Listening': 4,
                'Kanji': 5,
                'Exercises': 6,
                'Revision': 7
            };
            const aOrder = order[a.category] || 8;
            const bOrder = order[b.category] || 8;
            return aOrder - bOrder;
        });

        // 2. Get remaining future calendar dates (from today onwards)
        const futureDates = [];
        let tempDate = new Date(todayObj);
        while (tempDate <= endObj) {
            futureDates.push(this.getLocalDateString(tempDate));
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const totalRemainingDays = futureDates.length;
        if (totalRemainingDays === 0) return;

        // 3. Balance the tasks evenly across remaining dates
        const totalIncomplete = incompleteTasks.length;
        let taskIndex = 0;
        
        for (let i = 0; i < totalRemainingDays; i++) {
            const dateStr = futureDates[i];
            const remainingDays = totalRemainingDays - i;
            const remainingTasks = totalIncomplete - taskIndex;
            const tasksForToday = Math.ceil(remainingTasks / remainingDays);

            for (let j = 0; j < tasksForToday && taskIndex < totalIncomplete; j++) {
                incompleteTasks[taskIndex].date = dateStr;
                taskIndex++;
            }
        }

        // Save new schedule
        const newSchedule = [...completedTasks, ...incompleteTasks];
        localStorage.setItem(STORAGE_KEYS.AI_SCHEDULE, JSON.stringify(newSchedule));
    },

    getQuotes() {
        return Quotes;
    },

    getRandomQuote() {
        const idx = Math.floor(Math.random() * Quotes.length);
        return Quotes[idx];
    },

    getBadgesMetadata() {
        return Badges;
    },

    getStaticChecklistData() {
        return {
            hiragana: DEFAULT_HIRAGANA,
            katakana: DEFAULT_KATAKANA,
            kanji: DEFAULT_KANJI,
            vocabulary: DEFAULT_VOCABULARY,
            grammar: DEFAULT_GRAMMAR,
            skills: DEFAULT_SKILLS
        };
    }
};

NihonStorage.init();
window.NihonStorage = NihonStorage;
