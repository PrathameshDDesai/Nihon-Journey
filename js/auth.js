/**
 * auth.js - Firebase Authentication & Cloud Sync Interceptor Service for Nihon Journey
 * Handles auth flows and intercepts localStorage/Timer modifications to automatically sync to Realtime Database.
 */

const NihonAuth = {
    currentUser: null,
    isSyncing: false,

    init() {
        // Monitor auth state changes
        window.auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            this.updateUIState();
            
            const currentPage = this.getCurrentPage();
            const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';
            
            if (user) {
                try {
                    // Update user profile in database
                    await this.createOrUpdateUserProfile(user);
                    
                    // Pull user data from cloud database to local storage cache
                    await this.loadDataFromCloud(user.uid);
                    
                    // Dispatch event indicating data is ready
                    window.dispatchEvent(new CustomEvent('nihon_data_loaded', { detail: user }));
                    
                    // Remove loading screen
                    this.hideLoadingScreen();
                    
                    // Redirect to dashboard if on auth page
                    if (isAuthPage) {
                        window.location.href = 'index.html';
                    }
                } catch (error) {
                    console.error("Error initializing user session:", error);
                    this.showToast('Session Error', 'Failed to load study data from cloud.', 'danger');
                    this.hideLoadingScreen();
                }
            } else {
                // Logged out - Clear local cache session
                this.clearLocalCache();
                
                // Redirect to login page if on a restricted page
                if (!isAuthPage) {
                    window.location.href = 'login.html';
                } else {
                    this.hideLoadingScreen();
                }
            }
        });

        // Setup interceptors
        this.setupAuthInterceptors();
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTimerInterceptors();
        });
    },

    getCurrentPage() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    },

    hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => screen.remove(), 500);
        }
    },

    clearLocalCache() {
        localStorage.removeItem('nihon_user_settings');
        localStorage.removeItem('nihon_tasks');
        localStorage.removeItem('nihon_journals');
        localStorage.removeItem('nihon_study_time');
        localStorage.removeItem('nihon_checklists');
        localStorage.removeItem('nihon_streaks');
        localStorage.removeItem('nihon_unlocked_badges');
        localStorage.removeItem('nihon_notifications_history');
        localStorage.removeItem('nihon_gemini_api_key');
        localStorage.removeItem('nihon_ai_goal');
        localStorage.removeItem('nihon_ai_schedule');
        localStorage.removeItem('nihon_ai_coach');
        localStorage.removeItem('nihon_timer_state');
    },

    // Create profile node in Database
    async createOrUpdateUserProfile(user, additionalName = null) {
        if (!user) return;
        const profileRef = window.db.ref(`users/${user.uid}/profile`);
        const snapshot = await profileRef.once('value');
        
        const name = additionalName || user.displayName || user.email.split('@')[0];
        const photoURL = user.photoURL || '';
        const nowStr = new Date().toISOString();
        
        if (!snapshot.exists()) {
            const profileData = {
                uid: user.uid,
                name: name,
                email: user.email,
                photoURL: photoURL,
                createdAt: nowStr,
                lastLogin: nowStr
            };
            await profileRef.set(profileData);
        } else {
            await profileRef.update({
                lastLogin: nowStr,
                email: user.email,
                name: name || snapshot.val().name
            });
        }
    },

    // Pull data from database and cache in localStorage
    async loadDataFromCloud(uid) {
        const data = await window.NihonDatabase.fetchUserData(uid);
        if (data) {
            if (data.settings) localStorage.setItem('nihon_user_settings', JSON.stringify(data.settings));
            if (data.planner) localStorage.setItem('nihon_tasks', JSON.stringify(data.planner));
            if (data.journal) localStorage.setItem('nihon_journals', JSON.stringify(data.journal));
            if (data.analytics) localStorage.setItem('nihon_study_time', JSON.stringify(data.analytics));
            if (data.calendar) localStorage.setItem('nihon_checklists', JSON.stringify(data.calendar));
            if (data.streak) localStorage.setItem('nihon_streaks', JSON.stringify(data.streak));
            if (data.badges) localStorage.setItem('nihon_unlocked_badges', JSON.stringify(data.badges));
            
            if (data.goals) {
                if (data.goals.aiGoal) localStorage.setItem('nihon_ai_goal', JSON.stringify(data.goals.aiGoal));
                if (data.goals.aiSchedule) localStorage.setItem('nihon_ai_schedule', JSON.stringify(data.goals.aiSchedule));
                if (data.goals.aiCoach) localStorage.setItem('nihon_ai_coach', JSON.stringify(data.goals.aiCoach));
            }
            if (data.timer) localStorage.setItem('nihon_timer_state', JSON.stringify(data.timer));
            if (data.apiKey) localStorage.setItem('nihon_gemini_api_key', data.apiKey);
        }
    },

    // Intercept storage updates to trigger automatic synchronization
    setupAuthInterceptors() {
        if (!window.NihonStorage) return;

        const syncField = async (fieldName, data) => {
            if (this.currentUser) {
                try {
                    await window.NihonDatabase.saveField(this.currentUser.uid, fieldName, data);
                } catch (err) {
                    console.error(`Sync error on ${fieldName}:`, err);
                }
            }
        };

        const patch = (methodName, fieldName, dataGetter) => {
            const original = window.NihonStorage[methodName];
            if (original) {
                window.NihonStorage[methodName] = function(...args) {
                    const result = original.apply(this, args);
                    syncField(fieldName, dataGetter());
                    return result;
                };
            }
        };

        patch('saveSettings', 'settings', () => window.NihonStorage.getSettings());
        patch('saveTasks', 'planner', () => window.NihonStorage.getAllTasks());
        patch('addTask', 'planner', () => window.NihonStorage.getAllTasks());
        patch('updateTask', 'planner', () => window.NihonStorage.getAllTasks());
        patch('deleteTask', 'planner', () => window.NihonStorage.getAllTasks());
        patch('saveJournal', 'journal', () => window.NihonStorage.getAllJournals());
        patch('addStudyTime', 'analytics', () => window.NihonStorage.getAllStudyTime());
        patch('saveChecklists', 'calendar', () => window.NihonStorage.getChecklists());
        patch('toggleChecklistItem', 'calendar', () => window.NihonStorage.getChecklists());
        patch('unlockBadge', 'badges', () => window.NihonStorage.getUnlockedBadges());
        patch('saveApiKey', 'apiKey', () => window.NihonStorage.getApiKey());
        patch('saveAiGoal', 'goals/aiGoal', () => window.NihonStorage.getAiGoal());
        patch('saveAiSchedule', 'goals/aiSchedule', () => window.NihonStorage.getAiSchedule());
        patch('saveAiCoach', 'goals/aiCoach', () => window.NihonStorage.getAiCoach());

        const originalDeleteAiPlan = window.NihonStorage.deleteAiPlan;
        if (originalDeleteAiPlan) {
            window.NihonStorage.deleteAiPlan = function(...args) {
                const result = originalDeleteAiPlan.apply(this, args);
                syncField('goals/aiGoal', window.NihonStorage.getAiGoal());
                syncField('goals/aiSchedule', window.NihonStorage.getAiSchedule());
                syncField('goals/aiCoach', window.NihonStorage.getAiCoach());
                return result;
            };
        }

        const originalResetAllData = window.NihonStorage.resetAllData;
        if (originalResetAllData) {
            window.NihonStorage.resetAllData = function(...args) {
                const result = originalResetAllData.apply(this, args);
                if (window.NihonAuth.currentUser) {
                    window.NihonDatabase.saveUserData(window.NihonAuth.currentUser.uid, {
                        profile: {
                            uid: window.NihonAuth.currentUser.uid,
                            name: window.NihonAuth.currentUser.displayName || window.NihonAuth.currentUser.email.split('@')[0],
                            email: window.NihonAuth.currentUser.email,
                            photoURL: window.NihonAuth.currentUser.photoURL || '',
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString()
                        }
                    });
                }
                return result;
            };
        }
    },

    // Intercept Pomodoro Timer updates
    setupTimerInterceptors() {
        if (!window.NihonTimer) return;
        
        const syncTimer = async () => {
            if (this.currentUser) {
                const state = window.NihonTimer.getState();
                try {
                    await window.NihonDatabase.saveField(this.currentUser.uid, 'timer', state);
                } catch (err) {
                    console.error("Timer sync error:", err);
                }
            }
        };

        const patch = (methodName) => {
            const original = window.NihonTimer[methodName];
            if (original) {
                window.NihonTimer[methodName] = function(...args) {
                    const result = original.apply(this, args);
                    syncTimer();
                    return result;
                };
            }
        };

        patch('start');
        patch('pause');
        patch('reset');
        patch('setCustomTime');
        patch('setTimerPreset');

        window.addEventListener('beforeunload', syncTimer);
    },

    // Update UI Elements if they exist (settings page widget)
    updateUIState() {
        const loggedOutState = document.getElementById('auth-logged-out-state');
        const loggedInState = document.getElementById('auth-logged-in-state');
        const loadingState = document.getElementById('auth-loading-state');
        const userEmailEl = document.getElementById('auth-user-email');
        const userAvatarEl = document.getElementById('auth-user-avatar');
        const cloudSyncIcon = document.getElementById('sidebar-cloud-sync');

        if (loadingState) loadingState.style.display = 'none';

        if (this.currentUser) {
            if (loggedOutState) loggedOutState.style.display = 'none';
            if (loggedInState) loggedInState.style.display = 'block';
            if (userEmailEl) userEmailEl.textContent = this.currentUser.email;
            if (userAvatarEl) {
                userAvatarEl.textContent = this.currentUser.email.charAt(0).toUpperCase();
                if (this.currentUser.photoURL) {
                    userAvatarEl.innerHTML = `<img src="${this.currentUser.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                }
            }
            if (cloudSyncIcon) cloudSyncIcon.style.display = 'inline-block';
        } else {
            if (loggedOutState) loggedOutState.style.display = 'block';
            if (loggedInState) loggedInState.style.display = 'none';
            if (cloudSyncIcon) cloudSyncIcon.style.display = 'none';
        }
    },

    // Register with Email
    async signUp(email, password, name) {
        try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.updateProfile({ displayName: name });
            await this.createOrUpdateUserProfile(user, name);
            this.showToast('Account Created! 🎉', 'Welcome to Nihon Journey.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Signup error:", error);
            this.showToast('Registration Failed', error.message, 'danger');
            return { success: false, error: error.message };
        }
    },

    // Sign In with Email
    async signIn(email, password) {
        try {
            await window.auth.signInWithEmailAndPassword(email, password);
            this.showToast('Welcome Back! ⛩️', 'Logged in successfully.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Signin error:", error);
            this.showToast('Sign In Failed', error.message, 'danger');
            return { success: false, error: error.message };
        }
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await window.auth.signInWithPopup(provider);
            this.showToast('Welcome Back! ⛩️', 'Logged in with Google.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Google Signin error:", error);
            this.showToast('Google Sign In Failed', error.message, 'danger');
            return { success: false, error: error.message };
        }
    },

    // Password Reset
    async sendPasswordReset(email) {
        try {
            await window.auth.sendPasswordResetEmail(email);
            this.showToast('Email Sent 📧', 'Check your inbox for reset instructions.', 'success');
            return { success: true };
        } catch (error) {
            console.error("Password reset error:", error);
            this.showToast('Reset Failed', error.message, 'danger');
            return { success: false, error: error.message };
        }
    },

    // Sign Out
    async signOut() {
        try {
            await window.auth.signOut();
            this.showToast('Signed Out', 'Cloud sync disabled.', 'info');
            setTimeout(() => window.location.href = 'login.html', 500);
        } catch (error) {
            console.error("Signout error:", error);
            this.showToast('Sign Out Failed', error.message, 'danger');
        }
    },

    showToast(title, body, type) {
        if (window.NihonApp && window.NihonApp.showToast) {
            window.NihonApp.showToast(title, body, type);
        } else {
            console.log(`[Toast] ${title}: ${body}`);
        }
    }
};

// Initialize auth module immediately to catch session loading
NihonAuth.init();
window.NihonAuth = NihonAuth;
