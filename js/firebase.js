/**
 * firebase.js - Modular Firebase configuration and initialization
 */

const firebaseConfig = {
  projectId: "nehon-learning",
  appId: "1:1040053693942:web:b7fc7a14c91aff621cebd7",
  storageBucket: "nehon-learning.firebasestorage.app",
  apiKey: "AIzaSyBobX8Tk31kiBEMo8okO8xXhUGODsuVqrw",
  authDomain: "nehon-learning.firebaseapp.com",
  messagingSenderId: "1040053693942",
  measurementId: "G-3TTH5WN908",
  databaseURL: "https://nehon-learning-default-rtdb.firebaseio.com"
};

// Initialize Firebase compat libraries if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Bind instances to window object for global availability across components
window.auth = firebase.auth();
window.db = firebase.database();
