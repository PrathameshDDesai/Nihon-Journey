/**
 * database.js - Handles user-specific data reading and writing in Firebase Realtime Database
 */

const NihonDatabase = {
    /**
     * Fetch all data for a specific user.
     * @param {string} uid User ID
     * @returns {Promise<Object|null>} User data object or null if not found
     */
    async fetchUserData(uid) {
        if (!uid) return null;
        try {
            const ref = window.db.ref('users/' + uid);
            const snapshot = await ref.once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error("Database fetch failed:", error);
            throw error;
        }
    },

    /**
     * Set the entire data structure for a user.
     * @param {string} uid User ID
     * @param {Object} data Entire user state
     */
    async saveUserData(uid, data) {
        if (!uid) return;
        try {
            await window.db.ref('users/' + uid).set(data);
        } catch (error) {
            console.error("Database save failed:", error);
            throw error;
        }
    },

    /**
     * Save or update a specific field under a user's node.
     * @param {string} uid User ID
     * @param {string} field Field name (e.g. 'planner', 'settings', 'profile')
     * @param {*} data Data to set
     */
    async saveField(uid, field, data) {
        if (!uid) return;
        try {
            // Keep value in database clean of undefined values
            const cleanData = JSON.parse(JSON.stringify(data === undefined ? null : data));
            await window.db.ref(`users/${uid}/${field}`).set(cleanData);
        } catch (error) {
            console.error(`Database save field '${field}' failed:`, error);
            throw error;
        }
    }
};

window.NihonDatabase = NihonDatabase;
