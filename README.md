# ⛩️ Nihon Journey (日本旅行) — Japanese Learning Tracker

**Nihon Journey** is a modern, responsive, and portfolio-ready static web application designed to help Japanese language learners organize daily tasks, carry unfinished tasks forward automatically, log learning reflections, maintain study streaks, track active Pomodoro study time, and visualize progress.

Built entirely with semantic **HTML5, CSS3, and Vanilla JavaScript (ES6)**, it requires **no external backend or database**. It uses the browser's `localStorage` to persist all data, making it 100% compatible with free, static hosting platforms like **GitHub Pages**.

---

## 🎨 Theme & Design System

Inspired by **Japanese minimalism**, the user interface provides a premium, tactile experience:
- **Google Fonts**: Uses `Outfit` for modern, legible numbers and English labels, alongside `Noto Sans JP` for high-quality Hiragana, Katakana, and Kanji rendering.
- **Traditional Accents**: Incorporates a CSS-generated Japanese traditional wave pattern (*Seigaiha*) overlaid on card backdrops.
- **Modern Styling**: Subtle glassmorphism shadows, soft borders, fluid scales on button hover, and high-performance GPU-accelerated page transitions.
- **Dual Themes**: Supports a warm, off-white **Washi paper** light mode and a deep, charcoal **Sumi ink** dark mode. Settings are remembered automatically.

---

## 🚀 Key Features

### 1. Home Dashboard (`index.html`)
- **Konnichiwa Greeting**: A dynamic header greeting that changes based on local computer hours (e.g. *Ohayou gozaimasu* in the morning, *Konnichiwa* in the afternoon, *Konbanwa* in the evening).
- **Daily Progress Circle**: An animated SVG progress ring displaying the percentage of today's completed tasks.
- **Interactive Checklist Cards**: Progress bars for Hiragana, Katakana, Kanji, and Vocabulary. Clicking a card opens a modal overlay showing grids/lists of items. Users can check off elements (e.g. あ, い, う) to increase their overall progress.
- **Inspirational Scrolls**: Random traditional Japanese idioms (*Yojijukugo*) with romaji readings and English translations (e.g. *Nanakorobi yaoki* — "Fall down seven times, stand up eight").

### 2. Daily Planner (`planner.html`)
- **Task CRUD**: Add, edit, or delete items. Set categories (Hiragana, Kanji, Grammar, Anime, etc.), priorities (High, Medium, Low), estimated study minutes, and notes.
- **Daily Date Navigator**: A date switcher panel at the top lets users navigate to past dates to check histories, or set future schedules.
- **Real-Time Filters & Sorting**: Filter tasks dynamically by category, status (Pending vs. Completed), priority, or text search query. Sort by priority weight, estimated time, or category name.
- **HTML5 Drag & Drop**: Grab task cards to reorder priorities visually. Reorderings are automatically saved to local storage.
- **Daily Task Carryover System**: When opening the app on a new calendar day, any uncompleted tasks from yesterday are automatically migrated to today's planner. A warning toast alerts the user: *"X unfinished tasks were moved from yesterday."* Completed tasks remain in past history.

### 3. Monthly Calendar Heatmap (`calendar.html`)
- **Consistency Coloring**: Grid cells representing the current month are automatically highlighted based on targets:
  - 🟢 **Completed**: Daily task target or study hour goal achieved.
  - 🟡 **Partial**: Some study hours logged or at least one task completed.
  - 🔴 **Missed**: Past days with zero activity (no study time and zero tasks done).
- **Day History Popup**: Clicking any day in the calendar opens a details modal showing total study minutes logged, list of tasks planned (marked with checkbox completion status), and the learning journal written on that specific date.

### 4. Learning Journal (`journal.html`)
- **Interactive Notebook Editor**: Lined journaling boxes for logging *What I learned today*, *New Kanji*, *New Vocabulary*, *Grammar Notes*, *Difficult Topics*, and *Tomorrow's Goal*.
- **Debounced Autosave**: Saves text inputs in the background dynamically as the user types (throttled/debounced to 1.2s to prevent lag). A status indicator displays `Saving...` or `Saved`.
- **Chronological History Search**: A sidebar showing past entries. Selecting any past date loads it into the editor. A search bar filters past entries by date or text snippet contents.

### 5. Persistent Study Timer (`js/timer.js`)
- **Multi-page Synchronization**: A Pomodoro timer is integrated directly into the sidebar footer. The timer's countdown state is saved in local storage on every second tick. Navigating between different HTML pages parses the elapsed time since last save and resumes the timer seamlessly without resetting.
- **Web Audio Chimes**: Dual-tone temple chime audio is synthesized programmatically using the browser's Web Audio API when a timer hits 0—removing the need for heavy MP3 audio assets.
- **Presets & Custom modes**: Supports standard presets (Work 25m, Work 50m, Break 5m, Break 10m) and custom minute sliders.

### 6. SVGs Statistics & Achievement Badges (`stats.html`)
- **Weekly Bar Chart**: Custom-written, responsive SVG bar chart visualizing study minutes over the last 7 days.
- **Category Progress Chart**: A breakdown of completed tasks versus planned tasks across all subject areas.
- **Achievement Badges Grid**: Grayscale cards that illuminate in color with a falling confetti animation upon unlocking:
  - 🏆 **First Steps**: Completed first task.
  - 🎯 **Goal Crusher**: Met daily task target.
  - 🔥 **Dedicated Learner**: 7-Day study streak.
  - ✍️ **My Diary**: Completed first journal entry.
  - 🈶 **Kana Master (ひ)**: Completed Hiragana checklist.
  - 🈷️ **Kana Master (カ)**: Completed Katakana checklist.
  - 📚 **Word Collector**: Checked off 10 vocabulary words.
  - ⏳ **Time Scholar**: Logged 1 hour of cumulative study time.

### 7. Backup Export / Import (`settings.html`)
- **Data Export**: Downloads a `.json` backup file containing settings, tasks, checklists, journals, and streaks.
- **Data Import**: Restores all progress from a previously exported JSON backup file.
- **Secure Reset**: A double-confirmation sequence that requires typing `RESET` before wiping the browser database.

---

## ⌨️ Keyboard Shortcuts

Interact with the app quickly from anywhere:
- `N` ➔ Add New Task (opens form modal or redirects to planner with modal open).
- `T` ➔ Toggle Study Timer Modal (displays large countdown progress ring, presets, and custom sliders).
- `/` ➔ Focus Search bar (works on the Planner and Journal pages).
- `D` ➔ Toggle Light / Dark Mode.

---

## 📂 Folder Structure

```text
/
│── index.html              # Home Dashboard & Kana Checklists
│── planner.html            # Daily Planner (Drag & Drop, filters)
│── calendar.html           # Monthly Consistency Heatmap & Details
│── journal.html            # Lined Learning Journal & Autosave Editor
│── stats.html              # Weekly Charts & Achievement Badges Showcase
│── settings.html           # Profiles, JSON Backup/Restore, Progress Reset
│
├── css/
│   ├── style.css           # Global typography, color schemes, sidebar grid, modals, toasts
│   ├── planner.css         # Task lists, priority tags, and dragging state styles
│   ├── calendar.css        # Monthly grid cells, status highlights, and legend indicators
│   ├── journal.css         # Lined notebook page card and auto-save textareas
│   └── dark.css            # Sumi black override variables for dark mode
│
└── js/
    ├── storage.js          # Central storage engine, streaks manager, and badges verifier
    ├── theme.js            # Initializer and toggler for dark mode (non-flashing)
    ├── timer.js            # Persistent Pomodoro timer & Web Audio synthesizer
    ├── planner.js          # Task CRUD controllers, filters, sorting, and drag-and-drop
    ├── calendar.js         # Month renderer, day evaluators, and day history overlay
    ├── journal.js          # Debounced input logger, sidebar loader, and diary search
    ├── stats.js            # Custom SVG graph renderers and badge showcases
    └── app.js              # Global layout controller, toasts, and keyboard shortcuts
```

---

## ⚙️ Setup and Installation

As a client-only static application, you don't need to configure node packages or databases.

### Running Locally
1. Clone or download this project.
2. Double-click `index.html` to open it directly in your browser.
3. For the best development experience (auto-reloads and hotkeys), run a local development server in the project directory:
   - **Using VS Code**: Install the *Live Server* extension and click **Go Live**.
   - **Using Node/npm**: Run `npx serve` in the project root folder.
   - **Using Python**: Run `python -m http.server 8000`.

### Deploying to GitHub Pages (Free)
1. Initialize a Git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initialize Nihon Journey Japanese Learning Tracker"
   ```
2. Create a repository on GitHub and push your code.
3. In your GitHub repository, navigate to **Settings** ➔ **Pages**.
4. Set the Source build to **Deploy from a branch**, select `main` (or `master`) and `/root`, then click **Save**.
5. Your application will be live at `https://<username>.github.io/<repository-name>/` in a few minutes!
