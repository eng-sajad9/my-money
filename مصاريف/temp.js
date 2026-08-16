  <script type="module">
    /* âš ï¸ Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ø£Ù…Ø§Ù†:
     * - ÙƒÙ„ Ù…Ø³ØªØ®Ø¯Ù… Ù„Ù‡ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ù†ÙØµÙ„Ø© ÙÙŠ localStorage (Ù…Ø­Ù…ÙŠ Ø¨Ø±Ù‚Ù… UID Ø§Ù„ÙØ±ÙŠØ¯)
     * - Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙÙŠ Firebase Ù…Ø®Ø²Ù†Ø© ÙÙŠ Ù…Ø³Ø§Ø± users/{uid}/state (Ù…Ø­Ù…ÙŠ Ø¨Ù€ UID)
     * - ÙŠØªÙ… Ù…Ø³Ø­ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ù† Ø§Ù„Ø°Ø§ÙƒØ±Ø© Ø¹Ù†Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬
     * - ÙŠØ¬Ø¨ ØªØ·Ø¨ÙŠÙ‚ Firebase Security Rules Ù„Ù„Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø¥Ø¶Ø§ÙÙŠØ©
     */
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
     
    import {
      getAuth,
      onAuthStateChanged,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut,
      updatePassword,
      reauthenticateWithCredential,
      EmailAuthProvider,
    } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDQxzIZjBuk5ngd2c7ZHhmfvzUq9TU26Yw",
      authDomain: "mony-ecb81.firebaseapp.com",
      databaseURL: "https://mony-ecb81-default-rtdb.firebaseio.com",
      projectId: "mony-ecb81",
      storageBucket: "mony-ecb81.firebasestorage.app",
      messagingSenderId: "1099032510981",
      appId: "1:1099032510981:web:36e36003b13ffe6d72926c",
      measurementId: "G-PVHFMZ82XL",
    };

    const ADMIN_UID = "6Ss694f4QSOPYeM5TWnfnlxP2O32";

    let app = null;
    let db = null;
    let auth = null;
    let firebaseEnabled = false;

    try {
      app = initializeApp(firebaseConfig);
      db = getDatabase(app);
      auth = getAuth(app);
      firebaseEnabled = true;
    } catch (e) {
      console.warn("Firebase init failed:", e);
    }

    const STORAGE_KEY_PREFIX = "expense_manager_";
    const THEME_KEY = "expense_manager_theme";
    const LAST_UID_KEY = STORAGE_KEY_PREFIX + "last_uid";
    const SYNC_QUEUE_KEY = STORAGE_KEY_PREFIX + "sync_queue";
    const LAST_SYNC_KEY = STORAGE_KEY_PREFIX + "last_sync";
    const defaultCategories = ["Ø£ÙƒÙ„", "Ù…ÙˆØ§ØµÙ„Ø§Øª", "ØªØ³ÙˆÙ‚", "ÙÙˆØ§ØªÙŠØ±", "ØªØ±ÙÙŠÙ‡", "Ø£Ø®Ø±Ù‰"];

    // Ù…ØªØºÙŠØ±Ø§Øª Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© Ø­Ø§Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„ ÙˆØ§Ù„Ù…Ø²Ø§Ù…Ù†Ø©
    let isOnline = navigator.onLine;
    let isSyncing = false;
    let syncQueue = [];

    // Ù…Ø±Ø§Ù‚Ø¨Ø© Ø­Ø§Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø§Ù†ØªØ±Ù†Øª
    window.addEventListener("online", () => {
      isOnline = true;
      updateConnectionUI();
      // Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø§ØªØµØ§Ù„
      syncPendingChanges();
      // Ø¨Ø¹Ø¯ Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø§ØªØµØ§Ù„ØŒ Ø¹Ù„Ù‘Ù… Ø£Ù† Ø§Ù„ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØªØ§Ù„ÙŠ Ù„ÙŠØ³ Ø¨Ø³Ø¨Ø¨ Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ù…Ù† Ø¯ÙˆÙ† Ø§ØªØµØ§Ù„
      sessionStorage.removeItem('wasOffline');
    });

    window.addEventListener("offline", () => {
      isOnline = false;
      updateConnectionUI();
      // Ø­ÙØ¸ Ø¹Ù„Ø§Ù…Ø© Ø­ØªÙ‰ Ù†Ø¹Ø§Ù„Ø¬ Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø© Ù„Ø§Ø­Ù‚Ø§Ù‹
      try { sessionStorage.setItem('wasOffline', '1'); } catch (e) {}
    });

    // Global error handlers to surface runtime issues (diagnostic overlay)
    function showDiagnostic(msg) {
      console.error('Diagnostic:', msg);
      try {
        const overlay = document.getElementById('diagnosticOverlay');
        if (overlay) {
          overlay.textContent = 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚: ' + String(msg);
          overlay.style.display = 'flex';
        } else if (appLoader) {
          appLoader.textContent = 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚: ' + String(msg);
          appLoader.style.display = 'flex';
        } else {
          alert('Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚: ' + String(msg));
        }
      } catch (e) {
        /* ignore */
      }
    }

    window.addEventListener('error', (e) => {
      showDiagnostic(e.message || (e.error && e.error.message) || String(e));
    });

    window.addEventListener('unhandledrejection', (e) => {
      showDiagnostic((e && e.reason && e.reason.message) ? e.reason.message : String(e.reason || e));
    });

    // ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ù„Ø¥Ø¸Ù‡Ø§Ø± Ø­Ø§Ù„Ø© Ø§Ù„Ø§ØªØµØ§Ù„
    function showToast(msg, type = 'default', duration = 3000) {
      const toast = document.getElementById('connectionToast');
      if (!toast) return;
      toast.textContent = msg;
      toast.style.background = type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : 'rgba(0,0,0,0.7)';
      toast.classList.add('show');
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }

    // Professional alert modal
    function showAlertModal(message, title = 'ØªÙ†Ø¨ÙŠÙ‡', icon = 'âš ï¸') {
      return new Promise((resolve) => {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertTitle');
        const msgEl = document.getElementById('alertMessage');
        const iconEl = document.getElementById('alertIcon');
        const confirmBtn = document.getElementById('alertBtnConfirm');
        const cancelBtn = document.getElementById('alertBtnCancel');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;
        cancelBtn.style.display = 'none';
        confirmBtn.textContent = 'Ø­Ø³Ù†Ø§Ù‹';

        const handleConfirm = () => {
          modal.style.display = 'none';
          confirmBtn.removeEventListener('click', handleConfirm);
          resolve(true);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) handleConfirm();
        });
        modal.style.display = 'flex';
      });
    }

    // Professional confirm modal
    function showConfirmModal(message, title = 'ØªØ£ÙƒÙŠØ¯', icon = 'â“') {
      return new Promise((resolve) => {
        const modal = document.getElementById('alertModal');
        const titleEl = document.getElementById('alertTitle');
        const msgEl = document.getElementById('alertMessage');
        const iconEl = document.getElementById('alertIcon');
        const confirmBtn = document.getElementById('alertBtnConfirm');
        const cancelBtn = document.getElementById('alertBtnCancel');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;
        cancelBtn.style.display = 'block';
        confirmBtn.textContent = 'Ù†Ø¹Ù…ØŒ Ù…ØªØ§Ø¨Ø¹Ø©';
        cancelBtn.textContent = 'Ø¥Ù„ØºØ§Ø¡';

        const handleConfirm = () => {
          cleanup();
          modal.style.display = 'none';
          resolve(true);
        };

        const handleCancel = () => {
          cleanup();
          modal.style.display = 'none';
          resolve(false);
        };

        const cleanup = () => {
          confirmBtn.removeEventListener('click', handleConfirm);
          cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) handleCancel();
        });
        modal.style.display = 'flex';
      });
    }

    function updateConnectionUI() {
      // network status indicator (new) or legacy class
      const indicator = document.getElementById("networkStatus") || document.querySelector(".connection-indicator");
      if (indicator) {
        if (isOnline) {
          indicator.classList.remove("offline");
          indicator.classList.add("online");
        } else {
          indicator.classList.remove("online");
          indicator.classList.add("offline");
        }
        indicator.classList.remove("syncing");
        // fallback: force color in case class didn't apply
        indicator.style.backgroundColor = isOnline ? '#2ecc71' : '#e74c3c';
      }
      // Only show toast for actual disconnections, not on every state change
      if (!isOnline) {
        showToast(' Ø§Ù†Øª Ø§Ù„Ø§Ù† Ø¨Ø¯ÙˆÙ† Ø§ØªØµØ§Ù„', 'error');
      }
    }

    let state = {
      months: [],
      selectedMonthId: null,
      categories: [...defaultCategories],
      // New features
      goals: [], // { id, title, target, current, dueDate }
      categoryLimits: {}, // { [categoryName]: { limit: number, hard: boolean } }
      savingsBuckets: [], // { id, name, amount }
      recurring: [],
      challenges: [],
      badges: [],
      // timestamp used to detect which copy is newer when syncing
      lastModified: null,
    };

    let filterState = {
      search: "",
      category: "all",
      hasImageOnly: false,
    };

    // Ø­Ø§Ù„Ø© Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø­Ù…ÙŠ
    let privateState = {
      pinCode: "1234", // Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ
      pinEnabled: true,
      isUnlocked: false,
      totalBalance: 0,
      budgetFromMonth: null,
      budgetToMonth: null,
      allocations: [
        { id: 1, name: "Ø¬Ø§Ù…Ø¹Ø©", amount: 0 },
        { id: 2, name: "Ù…ÙˆØ§ØµÙ„Ø§Øª", amount: 0 },
        { id: 3, name: "Ø£ÙƒÙ„", amount: 0 }
      ],
      notes: "",
      lastNotesUpdate: null,
      nextAllocationId: 4
    };

    let currentUser = null;
    let userRef = null;
    let userInitiatedLogout = false; // flag to avoid clearing state on transient auth-null events
    let authInitialized = false; // tracks whether onAuthStateChanged has run once


    function getStorageKey() {
      // Prefer the currently signed-in user's UID. If none, try the last saved UID
      // (so refreshing the page without being signed-in still uses the user's local data).
      if (currentUser && currentUser.uid) {
        return STORAGE_KEY_PREFIX + currentUser.uid;
      }
      try {
        const lastUid = localStorage.getItem(LAST_UID_KEY);
        if (lastUid) return STORAGE_KEY_PREFIX + lastUid;
      } catch (e) {
        /* ignore localStorage read errors */
      }
      return STORAGE_KEY_PREFIX + "guest";
    }

    const monthNames = [
      "",
      "ÙŠÙ†Ø§ÙŠØ±", "ÙØ¨Ø±Ø§ÙŠØ±", "Ù…Ø§Ø±Ø³", "Ø£Ø¨Ø±ÙŠÙ„", "Ù…Ø§ÙŠÙˆ", "ÙŠÙˆÙ†ÙŠÙˆ",
      "ÙŠÙˆÙ„ÙŠÙˆ", "Ø£ØºØ³Ø·Ø³", "Ø³Ø¨ØªÙ…Ø¨Ø±", "Ø£ÙƒØªÙˆØ¨Ø±", "Ù†ÙˆÙÙ…Ø¨Ø±", "Ø¯ÙŠØ³Ù…Ø¨Ø±",
    ];

    function formatNumber(value) {
      if (value === null || value === undefined) return "0";
      const number =
        typeof value === "number"
          ? value
          : parseInt(String(value).replace(/\D/g, "")) || 0;
      return formatNumberWithCommas(number);
    }

    function parseFormattedNumber(str) {
      if (!str) return 0;
      const digits = str.replace(/\D/g, "");
      return parseInt(digits || "0", 10);
    }

    // remove bulky image data from state to shrink size
    function stripImagesFromState() {
      if (!state || !Array.isArray(state.months)) return;
      state.months.forEach((m) => {
        if (Array.isArray(m.expenses)) {
          m.expenses.forEach((e) => {
            if (e && e.imageDataUrl) {
              delete e.imageDataUrl;
            }
          });
        }
      });
    }

    // Format number with commas as thousand separators (e.g., "1,234,567")
    function formatNumberWithCommas(value) {
      const s = String(value || "").replace(/\D/g, "");
      if (!s) return ""; // return empty for input formatting so field can be cleared
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Attach live formatting to inputs that have inputmode="numeric"
    function attachNumericInputFormatting() {
      try {
        document.querySelectorAll('input.form-input[inputmode="numeric"]').forEach((inp) => {
          if (inp._formatAttached) return;
          inp._formatAttached = true;
          inp.addEventListener('input', () => {
            const start = inp.selectionStart || inp.value.length;
            const before = inp.value.slice(0, start);
            const raw = (inp.value || '').replace(/\D/g, '');
            const digitsBefore = (before.match(/\d/g) || []).length;
            const formatted = formatNumberWithCommas(raw);
            inp.value = formatted;
            // map digitsBefore to new caret position
            let pos = 0, digits = 0;
            while (pos < formatted.length && digits < digitsBefore) {
              if (/\d/.test(formatted[pos])) digits++;
              pos++;
            }
            inp.selectionStart = inp.selectionEnd = pos;
          });
        });
      } catch (e) {
        console.warn('attachNumericInputFormatting failed', e);
      }
    }

    function generateMonthId(year, month) {
      return `${year}-${String(month).padStart(2, "0")}`;
    }

    function normalizeState(raw) {
      let s = raw && typeof raw === "object" ? raw : {};
      if (!Array.isArray(s.months)) s.months = [];
      if (!Array.isArray(s.categories)) s.categories = [...defaultCategories];
      if (s.categories.length === 0) s.categories = [...defaultCategories];
      if (typeof s.selectedMonthId !== "string") s.selectedMonthId = null;
      // new feature defaults
      if (!Array.isArray(s.goals)) s.goals = [];
      if (typeof s.categoryLimits !== 'object' || s.categoryLimits === null) s.categoryLimits = {};
      if (!Array.isArray(s.savingsBuckets)) s.savingsBuckets = [];
      if (!Array.isArray(s.recurring)) s.recurring = [];
      if (!Array.isArray(s.challenges)) s.challenges = [];
      if (!Array.isArray(s.badges)) s.badges = [];  
      // ensure we always have a lastModified field for conflict resolution
      if (typeof s.lastModified !== 'number') s.lastModified = 0;

      s.months.forEach((m) => {
        if (!Array.isArray(m.expenses)) m.expenses = [];
        m.year = parseInt(m.year) || new Date().getFullYear();
        m.month = parseInt(m.month) || 1;
        m.name = monthNames[m.month] || m.name || "";
        m.salary = parseInt(m.salary) || 0;
        m.id = m.id || generateMonthId(m.year, m.month);
      });

      if (s.months.length === 0) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const id = generateMonthId(year, month);
        s.months.push({
          id,
          year,
          month,
          name: monthNames[month],
          salary: 0,
          expenses: [],
        });
        s.selectedMonthId = id;
      } else {
        if (!s.months.find((m) => m.id === s.selectedMonthId)) {
          s.selectedMonthId = s.months[s.months.length - 1].id;
        }
      }

      return s;
    }

    function getSelectedMonth() {
      return state.months.find((m) => m.id === state.selectedMonthId) || null;
    }

    function saveStateLocal() {
      const key = getStorageKey();
      try {
        // ensure the timestamp is present even if saveState wasn't called
        if (!state.lastModified) state.lastModified = Date.now();
        localStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        // quota exceeded or other storage error
        console.warn('localStorage save failed', err);
        if (err && err.name === 'QuotaExceededError') {
          // try to free up space by removing expensive fields (images)
          stripImagesFromState();
          try {
            localStorage.setItem(key, JSON.stringify(state));
            console.warn('Saved state after stripping images');
            alert('ØªÙ…Øª Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØµÙˆØ± Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ù…Ù† Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„ØªÙØ§Ø¯ÙŠ Ø§Ù…ØªÙ„Ø§Ø¡ Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ù…Ø­Ù„ÙŠ. ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¹Ø§Ø¯Ø© Ø±ÙØ¹ Ø§Ù„ØµÙˆØ± Ø¥Ø°Ø§ Ø§Ø­ØªØ¬Øª.');
            return;
          } catch (e2) {
            console.error('Still failed to save state after cleaning', e2);
          }
        }
        alert('ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ù„ÙŠØ§Ù‹: Ø§Ù…ØªÙ„Ø£ Ø§Ù„ØªØ®Ø²ÙŠÙ†. Ø­Ø§ÙˆÙ„ Ø­Ø°Ù Ø¨Ø¹Ø¶ Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ Ø£Ùˆ Ø§Ù„ØµÙˆØ± Ø§Ù„ÙƒØ¨ÙŠØ±Ø©.');
      }
    }

    async function saveStateRemote() {
      if (!firebaseEnabled || !currentUser || !userRef) return;
      try {
        await set(userRef, state);
        // ØªØ³Ø¬ÙŠÙ„ ÙˆÙ‚Øª Ø¢Ø®Ø± Ù…Ø²Ø§Ù…Ù†Ø© Ù†Ø§Ø¬Ø­Ø©
        try { localStorage.setItem(LAST_SYNC_KEY, Date.now().toString()); } catch (e) { /* ignore */ }
        return true;
      } catch (e) {
        console.warn("Failed to sync with Firebase:", e);
        if (e && e.name === 'QuotaExceededError') {
          stripImagesFromState();
          try {
            await set(userRef, state);
            return true;
          } catch (e2) {
            console.error('Still failed remote after stripping images', e2);
          }
        }
        return false;
      }
    }

    // real-time listener so that updates made on another device
    // are pulled in immediately (fixes issue with laptop not showing
    // changes made on phone).
    let remoteListenerUnsubscribe = null;

    function startRemoteListener() {
      if (!firebaseEnabled || !userRef) return;
      // detach any previous listener
      if (remoteListenerUnsubscribe) {
        remoteListenerUnsubscribe();
      }
      remoteListenerUnsubscribe = onValue(userRef, (snap) => {
        if (!snap.exists()) return;
        const remoteData = normalizeState(snap.val());
        const remoteJson = JSON.stringify(remoteData);
        const localJson = JSON.stringify(state);
        if (remoteJson !== localJson) {
          state = remoteData;
          saveStateLocal();
          refreshUI();
          console.log("âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø© Ù…Ù† Ø¬Ù‡Ø§Ø² Ø¢Ø®Ø±");
        }
      });
    }

    // Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ù„Ù‰ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ù„Ù„Ù…Ø²Ø§Ù…Ù†Ø©
    function queueForSync(action, data) {
      try {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
        queue.push({
          action,
          data,
          timestamp: Date.now(),
          id: Math.random().toString(36).substr(2, 9)
        });
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      } catch (e) {
        console.warn("Failed to queue sync:", e);
      }
    }

    // Ù…Ø¹Ø§Ù„Ø¬Ø© Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø¹Ù†Ø¯ Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø§ØªØµØ§Ù„
    async function syncPendingChanges() {
      if (isSyncing || !isOnline || !firebaseEnabled || !currentUser) return;
      
      isSyncing = true;
      const netEl = document.getElementById('networkStatus');
      if (netEl) {
        netEl.classList.add('syncing');
      }
      try {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
        if (queue.length === 0) {
          isSyncing = false;
          if (netEl) {
            netEl.classList.remove('syncing');
            if (isOnline) netEl.classList.add('online');
          }
          return;
        }

        // Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©
        showToast('âŸ³ Ø¬Ø§Ø±Ù Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...', 'default', 1500);
        const success = await saveStateRemote();
        if (success) {
          // Ø­Ø°Ù Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ù†Ø§Ø¬Ø­Ø©
          localStorage.removeItem(SYNC_QUEUE_KEY);
          showToast('âœ“ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø­Ø¯Ø«Ø©', 'success', 2000);
        } else {
          // remote save failed but no exception thrown
          showToast('âš ï¸ ÙØ´Ù„ Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©', 'error');
        }
      } catch (e) {
        console.warn("Sync failed:", e);
        showToast('âš ï¸ ÙØ´Ù„ Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©', 'error');
      } finally {
        isSyncing = false;
        if (netEl) {
          netEl.classList.remove('syncing');
          if (isOnline) {
            netEl.classList.add('online');
            netEl.style.backgroundColor = '#2ecc71';
          }
        }
      }
    }

    async function saveState() {
      // update modification timestamp whenever we save
      state.lastModified = Date.now();
      saveStateLocal();
      
      if (!isOnline) {
        // Ø¥Ø°Ø§ ÙƒÙ†Ø§ Ø¯ÙˆÙ† Ø§ØªØµØ§Ù„ØŒ Ø£Ø¶Ù Ù„Ù„Ù‚Ø§Ø¦Ù…Ø©
        queueForSync("save", state);
        return;
      }
      
      // Ø¥Ø°Ø§ ÙƒØ§Ù† Ù‡Ù†Ø§Ùƒ Ø§ØªØµØ§Ù„ØŒ Ø­Ø§ÙˆÙ„ Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø© Ù…Ø¨Ø§Ø´Ø±Ø©
      const success = await saveStateRemote();
      if (!success) {
        // Ø¥Ø°Ø§ ÙØ´Ù„Øª Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©ØŒ Ø£Ø¶Ù Ù„Ù„Ù‚Ø§Ø¦Ù…Ø©
        queueForSync("save", state);
      }
    }

    function loadStateLocal() {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        state = normalizeState(data);
      } catch (e) {
        console.error("Failed to parse local state:", e);
      }
    }

    /**
     * When the app starts we attempt to reconcile local storage with the
     * contents of the user's node in Firebase.  Previously we always treated
     * any local copy as the source of truth and blindly overwrote the remote
     * version, which caused data-loss whenever a device opened an older
     * snapshot and pushed it to the server.  To prevent that we now compare
     * timestamps (stored on the state object) and only overwrite when the
     * local copy is newer than the remote one.  If both copies exist and
     * differ we pick the freshest, and fall back to the server when in doubt.
     * A prompt could be added later for manual conflict resolution.
     */
    async function loadStateRemoteIfExists() {
      if (!firebaseEnabled || !userRef) return;
      try {
        const localKey = getStorageKey();
        let localRaw = null;
        try {
          localRaw = localStorage.getItem(localKey);
        } catch (e) {
          /* ignore localStorage read errors */
        }

        const snap = await get(userRef);
        const remoteExists = snap.exists();
        let remoteState = null;
        if (remoteExists) {
          remoteState = normalizeState(snap.val());
        }

        if (localRaw && remoteExists) {
          // Both sides have something.  parse and compare timestamps.
          let localData;
          try {
            localData = normalizeState(JSON.parse(localRaw));
          } catch (e) {
            console.warn('Bad local data, ignoring it', e);
            localData = null;
          }

          if (localData) {
            const localTs = localData.lastModified || 0;
            const remoteTs = remoteState.lastModified || 0;

            if (localTs > remoteTs) {
              // local copy is newer â€“ push it up
              state = localData;
              try { await set(userRef, state); } catch (e) { console.warn('Failed to update remote during init', e); }
              try { localStorage.setItem(LAST_SYNC_KEY, Date.now().toString()); } catch (e) {}
              showToast('ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ© (Ø£Ø­Ø¯Ø« Ù†Ø³Ø®Ø©)', 'success');
            } else {
              // remote is at least as new â€“ load it down
              state = remoteState;
              saveStateLocal();
              showToast('ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ù† Ø§Ù„Ø®Ø§Ø¯Ù…', 'success');
            }
            return;
          }
          // if localData was null we drop through and treat as if it didn't exist
        }

        // if we reach here either only one side has data or neither side has data
        if (localRaw && !remoteExists) {
          // push the lone local copy
          try {
            const localData = normalizeState(JSON.parse(localRaw));
            state = localData;
            await set(userRef, state);
            try { localStorage.setItem(LAST_SYNC_KEY, Date.now().toString()); } catch (e) {}
            showToast('ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©', 'success');
          } catch (e) {
            console.warn('Failed parsing previous local data', e);
          }
        } else if (!localRaw && remoteExists) {
          // only remote exists
          state = remoteState;
        } else if (!localRaw && !remoteExists) {
          // nothing anywhere, just write the initial state so future devices
          // see it.
          await set(userRef, state);
        }
      } catch (e) {
        console.warn("Failed to load/sync from Firebase:", e);
      }
    }

    function applyTheme(theme) {
      const root = document.documentElement;
      root.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
      const btn = document.getElementById("btnToggleTheme");
      if (btn) btn.textContent = theme === "dark" ? "â˜€ï¸ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„ÙØ§ØªØ­" : "ðŸŒ™ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ø¯Ø§ÙƒÙ†";
    }

    /* ======= Ø¹Ù†Ø§ØµØ± DOM ======= */

    const loginView = document.getElementById("loginView");
    const appView = document.getElementById("appView");

    const appLoader = document.getElementById("appLoader");
    const authErrorEl = document.getElementById("authError");

    // Login form elements
    const loginEmailInput = document.getElementById("loginEmail");
    const loginPasswordInput = document.getElementById("loginPassword");
    const btnLogin = document.getElementById("btnLogin");
    const btnTogglePwLogin = document.getElementById("btnTogglePwLogin");

    // Register form elements
    const registerEmailInput = document.getElementById("registerEmail");
    const registerPasswordInput = document.getElementById("registerPassword");
    const registerPasswordConfirmInput = document.getElementById("registerPasswordConfirm");
    const btnRegister = document.getElementById("btnRegister");
    const registerErrorEl = document.getElementById("registerError");
    const btnCancelRegister = document.getElementById("btnCancelRegister");

    const userEmailLabel = document.getElementById("userEmailLabel");
    const btnLogout = document.getElementById("btnLogout");
    const btnToggleTheme = document.getElementById("btnToggleTheme");

    const tabButtons = document.querySelectorAll(".tab-btn");
const tabMonth = document.getElementById("tab-month");
const tabCompare = document.getElementById("tab-compare");
const tabPlanning = document.getElementById("tab-planning");
const tabPrivate = document.getElementById("tab-private");
const tabAdminBtn = document.getElementById("tabAdminBtn");

    // Ø¹Ù†Ø§ØµØ± Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø­Ù…ÙŠ
    const privateSection = document.getElementById("privateSection");
    const privateContent = document.getElementById("privateContent");
    const privatePinInput = document.getElementById("privatePinInput");
    const btnOpenPrivate = document.getElementById("btnOpenPrivate");
    const privateErrorMsg = document.getElementById("privateErrorMsg");
    const btnPrivateLogout = document.getElementById("btnPrivateLogout");
    const totalBalanceInput = document.getElementById("totalBalanceInput");
    const privateTotalExpenses = document.getElementById("privateTotalExpenses");
    const privateAllMonthsCount = document.getElementById("privateAllMonthsCount");
    const privateActualRemaining = document.getElementById("privateActualRemaining");
    const budgetFromMonth = document.getElementById("budgetFromMonth");
    const budgetToMonth = document.getElementById("budgetToMonth");
    const budgetAllocationsContainer = document.getElementById("budgetAllocations");
    const btnAddAllocation = document.getElementById("btnAddAllocation");
    const calcInput = document.getElementById("calcInput");
    const calcResult = document.getElementById("calcResult");
    const privateNotes = document.getElementById("privateNotes");
    const privateNotesLastUpdate = document.getElementById("privateNotesLastUpdate");
    const pinEnabledToggle = document.getElementById("pinEnabledToggle");
    const btnChangePinCode = document.getElementById("btnChangePinCode");

const adminUsersContainer = document.getElementById("adminUsersContainer");
const adminNoteEl = document.getElementById("adminNote");
const btnAdminRefresh = document.getElementById("btnAdminRefresh");
const btnToggleRegistration = document.getElementById("btnToggleRegistration");
const registrationStatusEl = document.getElementById("registrationStatus");
const btnChangePasswordQuick = document.getElementById("btnChangePasswordQuick");

const adminSearchInput = document.getElementById("adminSearch");
const adminStatsEl = document.getElementById("adminStats");
let adminUsersCache = null;

const modalPassword = document.getElementById("modalPassword");
const btnClosePassword = document.getElementById("btnClosePassword");
const btnModalChangePassword = document.getElementById("btnModalChangePassword");
const modalCurrentPassword = document.getElementById("modalCurrentPassword");
const modalNewPassword = document.getElementById("modalNewPassword");
const modalConfirmPassword = document.getElementById("modalConfirmPassword");
const modalPasswordMessage = document.getElementById("modalPasswordMessage");

    const tabAdmin = document.getElementById("tab-admin");
    const adminTabBtn = document.getElementById("adminTabBtn");

    const monthSelect = document.getElementById("monthSelect");
    const btnAddMonth = document.getElementById("btnAddMonth");
    const btnEditMonth = document.getElementById("btnEditMonth");

    const summarySalaryEl = document.getElementById("summarySalary");
    const summaryExpensesEl = document.getElementById("summaryExpenses");
    const summaryRemainingEl = document.getElementById("summaryRemaining");

    const advancedStatsToggle = document.getElementById("advancedStatsToggle");
    const advancedStatsIcon = document.getElementById("advancedStatsIcon");
    const advancedStatsBody = document.getElementById("advancedStatsBody");
    const dailyAvgEl = document.getElementById("statDailyAvg");
    const remainingPerDayEl = document.getElementById("statRemainingPerDay");
    const maxExpenseEl = document.getElementById("statMaxExpense");
    const topCategoryEl = document.getElementById("statTopCategory");
    const categoryBars = document.getElementById("categoryBars");

    const btnAddExpense = document.getElementById("btnAddExpense");
    const expenseList = document.getElementById("expenseList");
    const searchInput = document.getElementById("searchInput");
    const filterCategory = document.getElementById("filterCategory");
    const filterHasImage = document.getElementById("filterHasImage");
    const filterSummaryEl = document.getElementById("filterSummary");

    const newCategoryInput = document.getElementById("newCategoryInput");
    const btnAddCategory = document.getElementById("btnAddCategory");
    const categoryList = document.getElementById("categoryList");

    const modalMonth = document.getElementById("modalMonth");
    const modalMonthTitle = document.getElementById("modalMonthTitle");
    const monthInput = document.getElementById("monthInput");
    const yearInput = document.getElementById("yearInput");
    const salaryInput = document.getElementById("salaryInput");
    const deleteMonthBtn = document.getElementById("deleteMonthBtn");
    const saveMonthBtn = document.getElementById("saveMonthBtn");
    const btnCancelMonth = document.getElementById("btnCancelMonth");
    const btnCloseMonth = document.getElementById("btnCloseMonth");

    // Goals & buckets UI elements
    const btnAddGoal = document.getElementById("btnAddGoal");
    const btnAddBucket = document.getElementById("btnAddBucket");
    const showGoalsTab = document.getElementById('showGoalsTab');
    const showBucketsTab = document.getElementById('showBucketsTab');
    const goalsContainer = document.getElementById("goalsContainer");
    const bucketsContainer = document.getElementById("bucketsContainer");
    const modalGoal = document.getElementById("modalGoal");
    const modalGoalTitle = document.getElementById("modalGoalTitle");
    const goalTitleInput = document.getElementById("goalTitleInput");
    const goalTargetInput = document.getElementById("goalTargetInput");
    const goalCurrentInput = document.getElementById("goalCurrentInput");
    const goalDueDate = document.getElementById("goalDueDate");
    const btnSaveGoal = document.getElementById("btnSaveGoal");
    const btnCancelGoal = document.getElementById("btnCancelGoal");
    const btnCloseGoal = document.getElementById("btnCloseGoal");
    const btnDeleteGoal = document.getElementById("btnDeleteGoal");

    const modalExpense = document.getElementById("modalExpense");
    const expenseModalTitle = document.getElementById("expenseModalTitle");
    const expenseTitleInput = document.getElementById("expenseTitleInput");
    const expenseAmountInput = document.getElementById("expenseAmountInput");
    const expenseCategoryInput = document.getElementById("expenseCategoryInput");
    const expenseDateInput = document.getElementById("expenseDateInput");
    const expenseNoteInput = document.getElementById("expenseNoteInput");
    const expenseImageInput = document.getElementById("expenseImageInput");
    const deleteExpenseBtn = document.getElementById("deleteExpenseBtn");
    const saveExpenseBtn = document.getElementById("saveExpenseBtn");
    const btnCancelExpense = document.getElementById("btnCancelExpense");
    const btnCloseExpense = document.getElementById("btnCloseExpense");

    const modalImage = document.getElementById("modalImage");
    const imageModalView = document.getElementById("imageModalView");

    const compareContainer = document.getElementById("compareContainer");
    const monthRow = document.querySelector(".month-row");

    let editingMonthId = null;
    let editingExpenseId = null;
    let isSavingExpense = false; // Ø¹Ù„Ù… Ù„Ù„ØªØ­ÙƒÙ… Ø¨Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø­ÙØ¸ ÙˆÙ…Ù†Ø¹ Ø§Ù„ØªÙƒØ±Ø§Ø±

    /* ======= ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ (Ù†Ù…Ø§Ø°Ø¬ Ù…Ù†ÙØµÙ„Ø©) ======= */

    const tabLoginBtn = document.getElementById("tabLogin");
    const tabRegisterBtn = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    function switchToLogin() {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      loginForm.style.display = "block";
      registerForm.style.display = "none";
      authErrorEl.textContent = "";
      registerErrorEl.textContent = "";
    }

    function switchToRegister() {
      tabLoginBtn.classList.remove("active");
      tabRegisterBtn.classList.add("active");
      loginForm.style.display = "none";
      registerForm.style.display = "block";
      authErrorEl.textContent = "";
      registerErrorEl.textContent = "";
    }

    tabLoginBtn.addEventListener("click", switchToLogin);
    tabRegisterBtn.addEventListener("click", switchToRegister);
    btnCancelRegister.addEventListener("click", (e) => {
      e.preventDefault();
      switchToLogin();
    });

    // Toggle password visibility
    if (btnTogglePwLogin) {
      btnTogglePwLogin.addEventListener("click", () => {
        const isPassword = loginPasswordInput.type === "password";
        loginPasswordInput.type = isPassword ? "text" : "password";
        btnTogglePwLogin.textContent = isPassword ? "ðŸ™ˆ" : "ðŸ‘ï¸";
      });
    }
    const btnTogglePwReg = document.getElementById("btnTogglePwReg");
    if (btnTogglePwReg) {
      btnTogglePwReg.addEventListener("click", () => {
        const isPassword = registerPasswordInput.type === "password";
        registerPasswordInput.type = isPassword ? "text" : "password";
        btnTogglePwReg.textContent = isPassword ? "ðŸ™ˆ" : "ðŸ‘ï¸";
      });
    }

    // live search for admin users
    if (adminSearchInput) {
      adminSearchInput.addEventListener('input', () => {
        // re-render using cache or reload if empty
        loadAdminUsers();
      });
    }

    btnRegister.addEventListener("click", async () => {
      registerErrorEl.textContent = "";
      const email = (registerEmailInput.value || "").trim();
      const password = (registerPasswordInput.value || "").trim();
      const confirm = (registerPasswordConfirmInput.value || "").trim();
      if (!email || !password) {
        registerErrorEl.textContent = "Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±.";
        return;
      }
      if (password !== confirm) {
        registerErrorEl.textContent = "ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± ÙˆØªØ£ÙƒÙŠØ¯Ù‡Ø§ ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ÙŠÙ†.";
        return;
      }
      if (!firebaseEnabled || !auth) {
        registerErrorEl.textContent = "ÙŠØªØ·Ù„Ø¨ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø§ØªØµØ§Ù„Ø§Ù‹ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø¹Ù†Ø¯ ØªÙˆÙØ± Ø§Ù„Ø´Ø¨ÙƒØ©.";
        return;
      }

      // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø­Ø§Ù„Ø© Ø§Ù„ØªØ³Ø¬ÙŠÙ„
      try {
        if (firebaseEnabled && db) {
          const statusRef = ref(db, "settings/registrationEnabled");
          const snap = await get(statusRef);
          const isEnabled = snap.exists() ? snap.val() : true;
          if (!isEnabled) {
            registerErrorEl.textContent = "âœ— Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¬Ø¯ÙŠØ¯ Ù…Ø¹Ø·Ù‘Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹. ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„.";
            return;
          }
        }
      } catch (err) {
        console.error("Error checking registration status:", err);
        // ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ù„Ø®Ø·Ø£ØŒ Ø§Ø³Ù…Ø­ Ø¨Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©
      }

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = result.user;
        userRef = ref(db, "users/" + currentUser.uid + "/state");
        state = {
          months: [],
          selectedMonthId: null,
          categories: [...defaultCategories],
        };
        await saveStateRemote();
        if (firebaseEnabled && db) {
          try {
            await set(ref(db, "users/" + currentUser.uid + "/profile"), {
              email: currentUser.email || email,
            });
          } catch (e) {
            console.warn("Failed to save user profile:", e);
          }
        }
        registerPasswordInput.value = "";
        registerPasswordConfirmInput.value = "";
        try { localStorage.setItem(LAST_UID_KEY, currentUser.uid); } catch (e) {}
        try { localStorage.setItem(STORAGE_KEY_PREFIX + currentUser.uid + "_profile", JSON.stringify({ email: currentUser.email || "" })); } catch (e) {}
      } catch (e) {
        console.error(e);
        registerErrorEl.textContent = "ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨. ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±.";
      }
    });

    btnLogin.addEventListener("click", async () => {
      authErrorEl.textContent = "";
      const email = (loginEmailInput.value || "").trim();
      const password = (loginPasswordInput.value || "").trim();
      if (!email || !password) {
        authErrorEl.textContent = "Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±.";
        return;
      }

      const loginProcessingBar = document.getElementById("loginProcessingBar");
      try {
        // show processing UI
        if (loginProcessingBar) {
          loginProcessingBar.style.display = "flex";
          loginProcessingBar.classList.remove("fade-out");
          loginProcessingBar.classList.add("fade-in");
        }
        btnLogin.disabled = true;

        await signInWithEmailAndPassword(auth, email, password);
        loginPasswordInput.value = "";
      } catch (e) {
        console.error(e);
        authErrorEl.textContent = "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ ØºÙŠØ± ØµØ­ÙŠØ­Ø© Ø£Ùˆ Ø­Ø¯Ø« Ø®Ø·Ø£.";
      } finally {
        // hide processing UI
        if (loginProcessingBar) {
          loginProcessingBar.classList.remove("fade-in");
          loginProcessingBar.classList.add("fade-out");
          setTimeout(() => {
            if (loginProcessingBar) {
              loginProcessingBar.style.display = "none";
              loginProcessingBar.classList.remove("fade-out");
            }
          }, 320);
        }
        btnLogin.disabled = false;
      }
    });

    btnLogout.addEventListener("click", async () => {
      userInitiatedLogout = true;
      try {
        state = {
          months: [],
          selectedMonthId: null,
          categories: [...defaultCategories],
        };
        filterState = {
          search: "",
          category: "all",
          hasImageOnly: false,
        };
        currentUser = null;
        userRef = null;

        try { localStorage.removeItem(LAST_UID_KEY); } catch (e) {}

        await signOut(auth);
      } catch (e) {
        console.error(e);
        alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬.");
      }
    });

    /* ======= ØªØ¨ÙˆÙŠØ¨Ø§Øª ======= */

    /* ======= Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø­Ù…ÙŠ (Ù…Ù„Ø§Ø­Ø¸Ø§ØªÙŠ ÙˆØ§Ù„Ø­Ø³Ø§Ø¨Ø§Øª) ======= */

    function loadPrivateState() {
      const key = getStorageKey();
      const savedPrivate = localStorage.getItem(key + "_private");
      if (savedPrivate) {
        try {
          const loaded = JSON.parse(savedPrivate);
          privateState = {
            ...privateState,
            ...loaded
          };
        } catch (e) {
          console.warn("Failed to load private state:", e);
        }
      }
      privateState.isUnlocked = false;
      resetPrivateUI();
      populateBudgetMonthSelects();
      updatePrivateSummary();
      
      // Ø§Ø³ØªØ¹Ø§Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙÙŠ Ø§Ù„Ø­Ù‚ÙˆÙ„
      totalBalanceInput.value = formatNumber(privateState.totalBalance || 0);
      if (privateState.budgetFromMonth && budgetFromMonth) {
        budgetFromMonth.value = privateState.budgetFromMonth;
      }
      if (privateState.budgetToMonth && budgetToMonth) {
        budgetToMonth.value = privateState.budgetToMonth;
      }
      if (privateNotes) {
        privateNotes.value = privateState.notes || "";
        if (privateState.lastNotesUpdate && privateNotesLastUpdate) {
          privateNotesLastUpdate.textContent = `Ø¢Ø®Ø± Ø­ÙØ¸: ${privateState.lastNotesUpdate}`;
        }
      }
      if (pinEnabledToggle) {
        pinEnabledToggle.checked = privateState.pinEnabled !== false;
      }
    }

    function savePrivateState() {
      const key = getStorageKey();
      localStorage.setItem(key + "_private", JSON.stringify(privateState));
    }

    function resetPrivateUI() {
      privatePinInput.value = "";
      privateErrorMsg.textContent = "";
      calcResult.textContent = "Ø§Ù†ØªØ¸Ø± Ø§Ù„Ø­Ø³Ø§Ø¨...";
      
      // Ø¥Ø°Ø§ ÙƒØ§Ù† PIN Ù…Ø¹Ø·Ù‘Ù„ØŒ ÙØªØ­ Ù…Ø¨Ø§Ø´Ø±Ø©
      if (!privateState.pinEnabled) {
        privateSection.style.display = "none";
        privateContent.style.display = "flex";
        privateState.isUnlocked = true;
      } else {
        // Ø¥Ø°Ø§ ÙƒØ§Ù† PIN Ù…ÙØ¹Ù‘Ù„ØŒ Ø£Ø¸Ù‡Ø± Ø´Ø§Ø´Ø© Ø§Ù„Ù‚ÙÙ„
        privateSection.style.display = "flex";
        privateContent.style.display = "none";
        privateState.isUnlocked = false;
      }
    }

    function populateBudgetMonthSelects() {
      budgetFromMonth.innerHTML = "";
      budgetToMonth.innerHTML = "";

      state.months.forEach((m) => {
        const optFrom = document.createElement("option");
        optFrom.value = m.id;
        optFrom.textContent = `${m.name} ${m.year}`;
        budgetFromMonth.appendChild(optFrom);

        const optTo = document.createElement("option");
        optTo.value = m.id;
        optTo.textContent = `${m.name} ${m.year}`;
        budgetToMonth.appendChild(optTo);
      });

      if (state.months.length > 0) {
        budgetFromMonth.value = state.months[0].id;
        budgetToMonth.value = state.months[state.months.length - 1].id;
      }
    }

    function unlockPrivateSection() {
      // Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù‚ÙÙ„ Ù…Ø¹Ø·Ù‘Ù„ØŒ ÙØªØ­ Ù…Ø¨Ø§Ø´Ø±Ø©
      if (!privateState.pinEnabled) {
        privateState.isUnlocked = true;
        privateSection.style.display = "none";
        privateContent.style.display = "flex";
        updatePrivateSummary();
        renderAllocations();
        // Ø¥Ø®ÙØ§Ø¡ Ø§Ù„ÙƒÙŠØ¨ÙˆØ±Ø¯ Ø¨Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØªØ±ÙƒÙŠØ² Ù…Ø¤Ù‚ØªØ§Ù‹
        document.activeElement.blur();
        setTimeout(() => {
          calcInput.focus();
        }, 300);
        return;
      }

      const pin = privatePinInput.value.trim();
      privateErrorMsg.textContent = "";

      if (!pin) {
        privateErrorMsg.textContent = "Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… PIN";
        return;
      }

      if (pin !== privateState.pinCode) {
        privateErrorMsg.textContent = "âŒ Ø±Ù‚Ù… PIN ØºÙŠØ± ØµØ­ÙŠØ­";
        privatePinInput.value = "";
        privatePinInput.focus();
        return;
      }

      privateState.isUnlocked = true;
      privateSection.style.display = "none";
      privateContent.style.display = "flex";
      updatePrivateSummary();
      renderAllocations();
      // Ø¥Ø®ÙØ§Ø¡ Ø§Ù„ÙƒÙŠØ¨ÙˆØ±Ø¯ Ø¨Ø¥Ø²Ø§Ù„Ø© Ø§Ù„ØªØ±ÙƒÙŠØ² Ù…Ø¤Ù‚ØªØ§Ù‹
      document.activeElement.blur();
      setTimeout(() => {
        calcInput.focus();
      }, 300);
    }

    function lockPrivateSection() {
      privateState.isUnlocked = false;
      resetPrivateUI();
    }

    function updatePrivateSummary() {
      const fromMonthId = budgetFromMonth?.value || null;
      const toMonthId = budgetToMonth?.value || null;

      let totalExp = 0;
      let countedMonths = 0;

      if (fromMonthId && toMonthId) {
        const months = state.months.map(m => m.id);
        const fromIdx = months.indexOf(fromMonthId);
        const toIdx = months.indexOf(toMonthId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const start = Math.min(fromIdx, toIdx);
          const end = Math.max(fromIdx, toIdx);

          for (let i = start; i <= end; i++) {
            const m = state.months[i];
            if (Array.isArray(m.expenses)) {
              m.expenses.forEach((e) => {
                totalExp += (e.amount || 0);
              });
            }
            countedMonths++;
          }
        }
      }

      privateTotalExpenses.textContent = formatNumber(totalExp);
      privateAllMonthsCount.textContent = countedMonths;

      const totalBal = parseFormattedNumber(totalBalanceInput.value || "0");
      const remaining = totalBal - totalExp;
      privateActualRemaining.textContent = formatNumber(remaining);
      privateActualRemaining.parentElement.className = "budget-stat-value " + (remaining >= 0 ? "success" : "danger");
    }

    function renderAllocations() {
      budgetAllocationsContainer.innerHTML = "";
      
      privateState.allocations.forEach((alloc, idx) => {
        const item = document.createElement("div");
        item.className = "allocation-item";
        item.style.animationDelay = (idx * 0.05) + "s";

        const inputs = document.createElement("div");
        inputs.className = "allocation-inputs";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "form-input form-input-sm";
        nameInput.value = alloc.name;
        nameInput.placeholder = "Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø©";
        nameInput.addEventListener("change", () => {
          privateState.allocations[idx].name = nameInput.value;
          savePrivateState();
        });

        const amountInput = document.createElement("input");
        amountInput.type = "text";
        amountInput.inputMode = "numeric";
        amountInput.className = "form-input form-input-sm";
        amountInput.value = formatNumber(alloc.amount);
        amountInput.placeholder = "0";
        amountInput.addEventListener("input", () => {
          const start = amountInput.selectionStart || amountInput.value.length;
          const before = amountInput.value.slice(0, start);
          const raw = (amountInput.value || '').replace(/\D/g, '');
          const digitsBefore = (before.match(/\d/g) || []).length;
          const formatted = formatNumberWithCommas(raw);
          amountInput.value = formatted;
          // map digitsBefore to new caret position
          let pos = 0, digits = 0;
          while (pos < formatted.length && digits < digitsBefore) {
            if (/\d/.test(formatted[pos])) digits++;
            pos++;
          }
          amountInput.selectionStart = amountInput.selectionEnd = pos;
          privateState.allocations[idx].amount = parseFormattedNumber(amountInput.value);
          savePrivateState();
          updateAllocationResult(idx);
        });

        inputs.appendChild(nameInput);
        inputs.appendChild(amountInput);

        const resultDiv = document.createElement("div");
        resultDiv.className = "allocation-result";
        const resultLabel = document.createElement("div");
        resultLabel.className = "allocation-result-label";
        resultLabel.textContent = "Ù…ØªØ¨Ù‚ÙŠ";
        const resultValue = document.createElement("div");
        resultValue.className = "allocation-result-value";
        resultValue.id = "alloc-result-" + alloc.id;
        resultValue.textContent = "0";
        resultDiv.appendChild(resultLabel);
        resultDiv.appendChild(resultValue);

        const removeBtn = document.createElement("button");
        removeBtn.className = "allocation-remove-btn";
        removeBtn.textContent = "Ø­Ø°Ù";
        removeBtn.addEventListener("click", () => {
          privateState.allocations.splice(idx, 1);
          savePrivateState();
          renderAllocations();
        });

        item.appendChild(inputs);
        item.appendChild(resultDiv);
        item.appendChild(removeBtn);

        budgetAllocationsContainer.appendChild(item);
      });

      // ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù†ØªØ§Ø¦Ø¬
      privateState.allocations.forEach((_, idx) => updateAllocationResult(idx));
    }

    function updateAllocationResult(idx) {
      const totalBal = parseFormattedNumber(totalBalanceInput.value || "0");
      const totalUsed = privateState.allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
      const remaining = totalBal - totalUsed;

      const resultEl = document.getElementById("alloc-result-" + privateState.allocations[idx].id);
      if (resultEl) {
        resultEl.textContent = formatNumber(remaining);
        resultEl.parentElement.style.color = remaining >= 0 ? "#10b981" : "#ef4444";
      }
    }

    function evaluateExpression(expr) {
      try {
        const sanitized = expr.trim()
          .replace(/[^\d+\-*/.()]/g, "")
          .replace(/\d+/g, (match) => match)
          .trim();

        if (!sanitized) return "Ø£Ø¯Ø®Ù„ Ù…Ø¹Ø§Ø¯Ù„Ø©";

        if (!/^[\d+\-*/.()]+$/.test(sanitized)) {
          return "Ù…Ø¹Ø§Ø¯Ù„Ø© ØºÙŠØ± ØµØ­ÙŠØ­Ø©";
        }

        const result = new Function(`"use strict"; return (${sanitized})`)();
        
        if (typeof result !== "number" || !isFinite(result)) {
          return "Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­Ø³Ø§Ø¨";
        }

        return formatNumber(Math.round(result * 100) / 100);
      } catch (e) {
        return "Ø®Ø·Ø£: " + (e.message || "Ù…Ø¹Ø§Ø¯Ù„Ø© ØºÙŠØ± ØµØ­ÙŠØ­Ø©");
      }
    }

    function updateCalculator() {
      const expr = calcInput.value;
      if (!expr) {
        calcResult.textContent = "Ø§Ù†ØªØ¸Ø± Ø§Ù„Ø­Ø³Ø§Ø¨...";
        return;
      }
      const result = evaluateExpression(expr);
      calcResult.textContent = result;
    }

    function openChangePinDialog() {
      const newPin = prompt("Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… PIN Ø¬Ø¯ÙŠØ¯ (4-6 Ø£Ø±Ù‚Ø§Ù…):");
      if (!newPin) return;

      if (!/^\d{4,6}$/.test(newPin)) {
        alert("Ø±Ù‚Ù… PIN ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† 4-6 Ø£Ø±Ù‚Ø§Ù… ÙÙ‚Ø·");
        return;
      }

      privateState.pinCode = newPin;
      savePrivateState();
      alert("âœ“ ØªÙ… ØªØ­Ø¯ÙŠØ« Ø±Ù‚Ù… PIN Ø¨Ù†Ø¬Ø§Ø­");
    }

    // Ù…Ø³ØªÙ…Ø¹ÙŠ Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø­Ù…ÙŠ
    if (btnOpenPrivate) {
      btnOpenPrivate.addEventListener("click", unlockPrivateSection);
    }

    if (privatePinInput) {
      // ØªØµÙÙŠØ© Ø§Ù„Ø£Ø±Ù‚Ø§Ù… ÙÙ‚Ø· Ù…Ù† PIN input
      privatePinInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
      });

      privatePinInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") unlockPrivateSection();
      });
    }

    if (btnPrivateLogout) {
      btnPrivateLogout.addEventListener("click", lockPrivateSection);
    }

    if (totalBalanceInput) {
      totalBalanceInput.addEventListener("input", () => {
        const start = totalBalanceInput.selectionStart || totalBalanceInput.value.length;
        const before = totalBalanceInput.value.slice(0, start);
        const raw = (totalBalanceInput.value || '').replace(/\D/g, '');
        const digitsBefore = (before.match(/\d/g) || []).length;
        const formatted = formatNumberWithCommas(raw);
        totalBalanceInput.value = formatted;
        let pos = 0, digits = 0;
        while (pos < formatted.length && digits < digitsBefore) {
          if (/\d/.test(formatted[pos])) digits++;
          pos++;
        }
        totalBalanceInput.selectionStart = totalBalanceInput.selectionEnd = pos;
        updatePrivateSummary();
        privateState.totalBalance = parseFormattedNumber(totalBalanceInput.value);
        savePrivateState();
        renderAllocations();
      });
    }

    if (budgetFromMonth) {
      budgetFromMonth.addEventListener("change", () => {
        privateState.budgetFromMonth = budgetFromMonth.value;
        savePrivateState();
        updatePrivateSummary();
      });
    }

    if (budgetToMonth) {
      budgetToMonth.addEventListener("change", () => {
        privateState.budgetToMonth = budgetToMonth.value;
        savePrivateState();
        updatePrivateSummary();
      });
    }

    if (btnAddAllocation) {
      btnAddAllocation.addEventListener("click", () => {
        privateState.allocations.push({
          id: privateState.nextAllocationId++,
          name: "ÙØ¦Ø© Ø¬Ø¯ÙŠØ¯Ø©",
          amount: 0
        });
        savePrivateState();
        renderAllocations();
      });
    }

    if (calcInput) {
      calcInput.addEventListener("input", updateCalculator);
    }

    if (privateNotes) {
      privateNotes.addEventListener("input", () => {
        privateState.notes = privateNotes.value;
        privateState.lastNotesUpdate = new Date().toLocaleString("ar-EG");
        savePrivateState();
        if (privateNotesLastUpdate) {
          privateNotesLastUpdate.textContent = `Ø¢Ø®Ø± Ø­ÙØ¸: ${privateState.lastNotesUpdate}`;
        }
      });
    }

    if (pinEnabledToggle) {
      pinEnabledToggle.addEventListener("change", () => {
        privateState.pinEnabled = pinEnabledToggle.checked;
        savePrivateState();
      });
    }

    if (btnChangePinCode) {
      btnChangePinCode.addEventListener("click", openChangePinDialog);
    }

    /* ======= ØªØ¨ÙˆÙŠØ¨Ø§Øª ======= */

tabButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;

    if (tab === "month") {
      tabMonth.style.display = "block";
      tabCompare.style.display = "none";
      if (tabPlanning) tabPlanning.style.display = "none";
      if (tabPrivate) tabPrivate.style.display = "none";
      if (tabAdmin) tabAdmin.style.display = "none";
      if (monthRow) monthRow.style.display = "flex";
    } else if (tab === "compare") {
      tabMonth.style.display = "none";
      tabCompare.style.display = "block";
      if (tabPlanning) tabPlanning.style.display = "none";
      if (tabPrivate) tabPrivate.style.display = "none";
      if (tabAdmin) tabAdmin.style.display = "none";
      if (monthRow) monthRow.style.display = "none";
    } else if (tab === "planning") {
      tabMonth.style.display = "none";
      tabCompare.style.display = "none";
      if (tabPlanning) tabPlanning.style.display = "block";
      if (tabPrivate) tabPrivate.style.display = "none";
      if (tabAdmin) tabAdmin.style.display = "none";
      if (monthRow) monthRow.style.display = "none";
    } else if (tab === "private") {
      tabMonth.style.display = "none";
      tabCompare.style.display = "none";
      if (tabPlanning) tabPlanning.style.display = "none";
      if (tabPrivate) tabPrivate.style.display = "block";
      if (tabAdmin) tabAdmin.style.display = "none";
      if (monthRow) monthRow.style.display = "none";
      loadPrivateState();
    } else if (tab === "admin") {
      tabMonth.style.display = "none";
      tabCompare.style.display = "none";
      if (tabPlanning) tabPlanning.style.display = "none";
      if (tabPrivate) tabPrivate.style.display = "none";
      if (tabAdmin) tabAdmin.style.display = "block";
      if (monthRow) monthRow.style.display = "none";

      // Ø¹Ù†Ø¯ ÙØªØ­ ØªØ¨ÙˆÙŠØ¨ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…ØŒ Ø­Ù…Ù‘Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†
      await loadAdminUsers();
    }
  });
});


    /* ======= Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ù…ØªÙ‚Ø¯Ù…Ø© Ø·ÙŠ/ÙØªØ­ ======= */

    advancedStatsToggle.addEventListener("click", () => {
      const isOpen = advancedStatsBody.classList.contains("open");
      if (isOpen) {
        advancedStatsBody.classList.remove("open");
        advancedStatsIcon.classList.remove("open");
      } else {
        advancedStatsBody.classList.add("open");
        advancedStatsIcon.classList.add("open");
      }
    });

    // Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ Ø§Ù„ÙØªØ­ Ø£Ùˆ Ø§Ù„ØªØ­Ø¯ÙŠØ«
    function selectCurrentMonth() {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      
      // Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ ÙÙŠ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø´Ù‡Ø±
      const currentMonthData = state.months.find(m => m.month === currentMonth && m.year === currentYear);
      
      if (currentMonthData) {
        state.selectedMonthId = currentMonthData.id;
      } else {
        // Ø¥Ø°Ø§ Ù„Ù… ÙŠÙƒÙ† Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ Ù…ÙˆØ¬ÙˆØ¯Ø§Ù‹ØŒ Ø§Ø®ØªØ± Ø¢Ø®Ø± Ø´Ù‡Ø±
        if (state.months.length > 0) {
          state.selectedMonthId = state.months[state.months.length - 1].id;
        }
      }
    }

    function refreshMonthSelect() {
      monthSelect.innerHTML = "";
      if (!Array.isArray(state.months) || state.months.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø£Ø´Ù‡Ø±";
        monthSelect.appendChild(option);
        monthSelect.disabled = true;
        return;
      }
      monthSelect.disabled = false;
      state.months
        .slice()
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .forEach((m) => {
          const option = document.createElement("option");
          option.value = m.id;
          option.textContent = `${m.name} ${m.year}`;
          monthSelect.appendChild(option);
        });
      if (!state.selectedMonthId) {
        state.selectedMonthId = state.months[state.months.length - 1].id;
      }
      monthSelect.value = state.selectedMonthId;
    }

    function renderSummary() {
      const month = getSelectedMonth();
      if (!month) {
        summarySalaryEl.textContent = "0";
        summaryExpensesEl.textContent = "0";
        summaryRemainingEl.textContent = "0";
        return;
      }
      const expenses = Array.isArray(month.expenses) ? month.expenses : [];
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const remaining = (month.salary || 0) - totalExpenses;

      summarySalaryEl.textContent = formatNumber(month.salary || 0);
      summaryExpensesEl.textContent = formatNumber(totalExpenses);
      summaryRemainingEl.textContent = formatNumber(remaining);

      summaryRemainingEl.classList.toggle("positive", remaining >= 0);
      summaryRemainingEl.classList.toggle("negative", remaining < 0);
    }

    function renderAdvancedStats() {
      const month = getSelectedMonth();
      categoryBars.innerHTML = "";
      if (!month) {
        dailyAvgEl.textContent = "0";
        remainingPerDayEl.textContent = "0";
        maxExpenseEl.textContent = "0";
        topCategoryEl.textContent = "Ù„Ø§ ÙŠÙˆØ¬Ø¯";
        return;
      }
      const expenses = Array.isArray(month.expenses) ? month.expenses : [];
      if (expenses.length === 0) {
        dailyAvgEl.textContent = "0";
        remainingPerDayEl.textContent = "0";
        maxExpenseEl.textContent = "0";
        topCategoryEl.textContent = "Ù„Ø§ ÙŠÙˆØ¬Ø¯";
        return;
      }

      const today = new Date();
      const year = month.year;
      const monthIndex = month.month - 1;
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const nowMonth = today.getMonth();
      const nowYear = today.getFullYear();

      let daysPassed;
      if (nowMonth === monthIndex && nowYear === year) {
        daysPassed = today.getDate();
      } else {
        daysPassed = daysInMonth;
      }

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const dailyAvg =
        daysPassed > 0 ? Math.round(totalExpenses / daysPassed) : totalExpenses;
      dailyAvgEl.textContent = formatNumber(dailyAvg);

      const remaining = (month.salary || 0) - totalExpenses;
      const daysRemaining =
        daysInMonth - (nowMonth === monthIndex && nowYear === year ? today.getDate() : daysInMonth);
      const remainingPerDay =
        daysRemaining > 0 ? Math.round(remaining / daysRemaining) : remaining;
      remainingPerDayEl.textContent = formatNumber(remainingPerDay);

      const maxExpense = expenses.reduce(
        (max, e) => (e.amount > max.amount ? e : max),
        expenses[0]
      );
      maxExpenseEl.textContent = `${formatNumber(maxExpense.amount || 0)} (${maxExpense.title || "Ù…ØµØ±ÙˆÙ"})`;

      const categoryTotals = {};
      expenses.forEach((e) => {
        const cat = e.category || "Ø£Ø®Ø±Ù‰";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
      });

      let topCategory = "Ù„Ø§ ÙŠÙˆØ¬Ø¯";
      let topTotal = 0;
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        if (total > topTotal) {
          topTotal = total;
          topCategory = cat;
        }
      });
      topCategoryEl.textContent = `${topCategory} (${formatNumber(topTotal)})`;

      const maxCatTotal = Math.max(...Object.values(categoryTotals)) || 1;
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        const item = document.createElement("div");
        item.className = "category-bar";

        const top = document.createElement("div");
        top.className = "category-bar-top";
        const nameEl = document.createElement("span");
        nameEl.textContent = cat;
        const amountEl = document.createElement("span");
        amountEl.textContent = formatNumber(total);
        top.appendChild(nameEl);
        top.appendChild(amountEl);

        const bg = document.createElement("div");
        bg.className = "category-bar-bg";

        const fill = document.createElement("div");
        fill.className = "category-bar-fill";
        fill.style.width = (total / maxCatTotal) * 100 + "%";

        bg.appendChild(fill);
        item.appendChild(top);
        item.appendChild(bg);
        categoryBars.appendChild(item);
      });
    }

    function applyFilters(expenses) {
      const search = filterState.search.toLowerCase();
      const category = filterState.category;
      const hasImageOnly = filterState.hasImageOnly;

      return expenses.filter((e) => {
        if (category !== "all" && e.category !== category) return false;
        if (
          search &&
          !(
            (e.title || "").toLowerCase().includes(search) ||
            (e.note || "").toLowerCase().includes(search)
          )
        ) {
          return false;
        }
        if (hasImageOnly && !e.imageDataUrl) return false;
        return true;
      });
    }

    function renderExpenses() {
      const month = getSelectedMonth();
      expenseList.innerHTML = "";
      filterSummaryEl.textContent = "";

      if (!month) {
        expenseList.innerHTML =
          '<div class="empty-state">Ø£Ø¶Ù Ø´Ù‡Ø±Ù‹Ø§ Ø«Ù… Ø£Ø¶Ù Ù…ØµØ§Ø±ÙŠÙ Ù„Ø¹Ø±Ø¶Ù‡Ø§ Ù‡Ù†Ø§.</div>';
        return;
      }

      const expenses = Array.isArray(month.expenses) ? month.expenses : [];
      if (expenses.length === 0) {
        expenseList.innerHTML =
          '<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØµØ§Ø±ÙŠÙ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø± Ø¨Ø¹Ø¯.</div>';
        return;
      }

      const sorted = expenses
        .slice()
        .sort((a, b) => b.id - a.id);

      const filtered = applyFilters(sorted);

      if (filtered.length === 0) {
        expenseList.innerHTML =
          '<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØµØ§Ø±ÙŠÙ Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø¨Ø­Ø«/Ø§Ù„ÙÙ„ØªØ±Ø©.</div>';
      } else {
        filtered.forEach((e) => {
          const item = document.createElement("div");
          item.className = "expense-item";

          const main = document.createElement("div");
          main.className = "expense-main";

          const title = document.createElement("div");
          title.className = "expense-title";
          title.textContent = e.title || "Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†";

          const meta = document.createElement("div");
          meta.className = "expense-meta";
          const catSpan = document.createElement("span");
          catSpan.textContent = e.category || "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
          const dateSpan = document.createElement("span");
          dateSpan.textContent = e.date || "Ø¨Ø¯ÙˆÙ† ØªØ§Ø±ÙŠØ®";
          meta.appendChild(catSpan);
          meta.appendChild(document.createTextNode(" Â· "));
          meta.appendChild(dateSpan);

          const note = document.createElement("div");
          note.className = "expense-note";
          note.textContent = e.note || "";

          main.appendChild(title);
          main.appendChild(meta);
          if (e.note) main.appendChild(note);

          if (e.imageDataUrl) {
            const imgBadge = document.createElement("div");
            imgBadge.className = "expense-image-badge";
            imgBadge.textContent = "ðŸ“· ØªÙˆØ¬Ø¯ ØµÙˆØ±Ø©";
            main.appendChild(imgBadge);

            const img = document.createElement("img");
            img.src = e.imageDataUrl;
            img.alt = "ØµÙˆØ±Ø© Ø§Ù„Ù…ØµØ±ÙˆÙ";
            img.className = "expense-thumb";
            img.addEventListener("click", () => {
              imageModalView.src = e.imageDataUrl;
              modalImage.style.display = "flex";
            });
            main.appendChild(img);
          }

          const actions = document.createElement("div");
          actions.className = "expense-actions";
          const editBtn = document.createElement("button");
          editBtn.className = "btn-ghost btn-edit";
          editBtn.textContent = "âœï¸ ØªØ¹Ø¯ÙŠÙ„";
          editBtn.addEventListener("click", () => openExpenseModal(e.id));

          const delBtn = document.createElement("button");
          delBtn.className = "btn-ghost btn-delete";
          delBtn.textContent = "ðŸ—‘ï¸ Ø­Ø°Ù";
          delBtn.addEventListener("click", () => deleteExpense(e.id));

          actions.appendChild(editBtn);
          actions.appendChild(delBtn);
          main.appendChild(actions);

          const amountContainer = document.createElement("div");
          amountContainer.className = "expense-amount-container";

          const amountBadge = document.createElement("div");
          amountBadge.className = "expense-amount-badge";
          amountBadge.textContent = "ðŸ’°";

          const amount = document.createElement("div");
          amount.className = "expense-amount";
          amount.textContent = formatNumber(e.amount || 0);

          amountContainer.appendChild(amountBadge);
          amountContainer.appendChild(amount);
          item.appendChild(main);
          item.appendChild(amountContainer);
          expenseList.appendChild(item);
        });
      }

      if (filterState.category !== "all") {
        const catTotal = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
        filterSummaryEl.textContent =
          "Ø¥Ø¬Ù…Ø§Ù„ÙŠ ÙØ¦Ø© " +
          filterState.category +
          ": " +
          formatNumber(catTotal);
      }
    }
async function loadAllUsersForAdmin() {
  adminUsersContainer.innerHTML = "<p>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</p>";

  const usersSnap = await get(ref(db, "users"));
  if (!usersSnap.exists()) {
    adminUsersContainer.innerHTML = "<p>Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†.</p>";
    return;
  }

  const users = usersSnap.val();
  adminUsersContainer.innerHTML = "";

  Object.keys(users).forEach(uid => {
    const userData = users[uid];

    const profile = userData.profile || {};
    const state = userData.state || {};
    const months = state.months || [];

    let totalExpenses = 0;
    months.forEach(m => {
      if (Array.isArray(m.expenses)) {
        m.expenses.forEach(e => totalExpenses += (e.amount || 0));
      }
    });

    const totalSalaries = months.reduce((acc, m) => acc + (m.salary || 0), 0);

    const card = document.createElement("div");
    card.className = "admin-user-card";

    card.innerHTML = `
      <h3>${profile.email || "Ø¨Ø¯ÙˆÙ† Ø¨Ø±ÙŠØ¯"}</h3>
      <p><strong>Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…:</strong> ${uid}</p>
      <p><strong>Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø´Ù‡Ø±:</strong> ${months.length}</p>
      <p><strong>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±ÙˆØ§ØªØ¨:</strong> ${formatNumber(totalSalaries)}</p>
      <p><strong>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ:</strong> ${formatNumber(totalExpenses)}</p>
      <p><strong>Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ:</strong> ${formatNumber(totalSalaries - totalExpenses)}</p>
    `;

    adminUsersContainer.appendChild(card);
  });
}

    function renderComparison() {
      // helper: deterministic color palette for categories
      function getCategoryColor(cat, i) {
        const palette = [
          "#2563eb",
          "#4f46e5",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#0ea5b3",
          "#f97316",
        ];
        if (!cat) return palette[i % palette.length];
        // simple hash to pick color for category name consistently
        let h = 0;
        for (let j = 0; j < cat.length; j++) h = (h << 5) - h + cat.charCodeAt(j);
        const idx = Math.abs(h) % palette.length;
        return palette[idx];
      }

      compareContainer.innerHTML = "";
      if (!Array.isArray(state.months) || state.months.length === 0) {
        compareContainer.innerHTML =
          '<div class="empty-state">Ø£Ø¶Ù Ø´Ù‡Ø±Ø§Ù‹ ÙˆØ§Ø­Ø¯Ø§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ù„Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø©.</div>';
        return;
      }

      const monthsSorted = state.months
        .slice()
        .sort((a, b) => b.year - a.year || b.month - a.month);

      // collect category list across months
      const allCategories = new Set();
      monthsSorted.forEach((m) => {
        (m.expenses || []).forEach((e) => allCategories.add(e.category || "Ø£Ø®Ø±Ù‰"));
      });
      const categories = Array.from(allCategories.length ? allCategories : state.categories);

      // totals per month and per-category
      const monthData = monthsSorted.map((m) => {
        const expenses = Array.isArray(m.expenses) ? m.expenses : [];
        const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const catTotals = {};
        categories.forEach((c) => (catTotals[c] = 0));
        expenses.forEach((e) => {
          const cat = e.category || "Ø£Ø®Ø±Ù‰";
          catTotals[cat] = (catTotals[cat] || 0) + (e.amount || 0);
        });
        return {
          id: m.id,
          label: `${m.name} ${m.year}`,
          year: m.year,
          month: m.month,
          salary: m.salary || 0,
          total,
          remaining: (m.salary || 0) - total,
          catTotals,
        };
      });

      const maxTotal = Math.max(...monthData.map((d) => d.total), 1);

      // build header summary card
      const grid = document.createElement("div");
      grid.className = "compare-grid";

      const topCard = document.createElement("div");
      topCard.className = "compare-card";
      topCard.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3>Ù…Ù‚Ø§Ø±Ù†Ø© Ø§Ù„Ø£Ø´Ù‡Ø±</h3><div class="compare-meta">` +
        `<div>Ø£Ø´Ù‡Ø±: ${monthData.length}</div>` +
        `<div>ØªØµÙ†ÙŠÙØ§Øª Ù…ÙØ­ÙˆØµØ©: ${categories.length}</div>` +
        `</div></div>`;

      // legend for categories (show top few)
      const legend = document.createElement("div");
      legend.className = "category-legend";
      categories.slice(0, 8).forEach((c, i) => {
        const li = document.createElement("div");
        li.className = "legend-item";
        const sw = document.createElement("span");
        sw.className = "legend-swatch";
        sw.style.background = getCategoryColor(c, i);
        li.appendChild(sw);
        const txt = document.createElement("span");
        txt.textContent = c;
        li.appendChild(txt);
        legend.appendChild(li);
      });
      topCard.appendChild(legend);
      grid.appendChild(topCard);

      // create a compare card per month with bar and small table of top categories
      monthData.forEach((d) => {
        const card = document.createElement("div");
        card.className = "compare-card";

        const row = document.createElement("div");
        row.className = "compare-row";

        const left = document.createElement("div");
        left.style.flex = "1";
        const title = document.createElement("div");
        title.style.fontWeight = "700";
        title.textContent = d.label;
        const meta = document.createElement("div");
        meta.className = "compare-meta";
        meta.innerHTML = `Ø§Ù„Ø±Ø§ØªØ¨: ${formatNumber(d.salary)} Â· Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ: ${formatNumber(d.total)} Â· Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ: ${formatNumber(d.remaining)}`;
        left.appendChild(title);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.style.width = "140px";
        right.style.textAlign = "right";
        right.innerHTML = `<div style="font-weight:700;color:#2563eb">${formatNumber(d.total)}</div>` +
          `<div style="font-size:12px;color:var(--subtext-color)">Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ: ${formatNumber(d.remaining)}</div>`;

        row.appendChild(left);
        row.appendChild(right);

        // stacked bar showing category breakdown
        const stacked = document.createElement("div");
        stacked.className = "stacked-bar";
        if (d.total <= 0) {
          const emptySeg = document.createElement("div");
          emptySeg.className = "stacked-seg";
          emptySeg.style.width = "100%";
          emptySeg.style.background = "linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.02))";
          stacked.appendChild(emptySeg);
        } else {
          Object.entries(d.catTotals).forEach(([cat, amt], ci) => {
            const pct = d.total > 0 ? (amt / d.total) * 100 : 0;
            const seg = document.createElement("div");
            seg.className = "stacked-seg";
            seg.style.width = pct > 0 ? pct + "%" : "0%";
            seg.style.background = getCategoryColor(cat, ci);
            seg.title = `${cat}: ${formatNumber(amt)} (${Math.round(pct)}%)`;
            stacked.appendChild(seg);
          });
        }

        card.appendChild(row);
        card.appendChild(stacked);

        // add small table of top 4 categories
        const catEntries = Object.entries(d.catTotals).sort((a, b) => b[1] - a[1]);
        const table = document.createElement("table");
        table.className = "compare-table";
        const thead = document.createElement("thead");
        thead.innerHTML = `<tr><th>Ø§Ù„ØªØµÙ†ÙŠÙ</th><th>Ø§Ù„Ù…Ø¨Ù„Øº</th><th>Ø§Ù„Ù†Ø³Ø¨Ø©</th></tr>`;
        table.appendChild(thead);
        const tbody = document.createElement("tbody");
        const top4 = catEntries.slice(0, 4);
        top4.forEach(([cat, amt]) => {
          const tr = document.createElement("tr");
          const pct = maxTotal > 0 ? Math.round((amt / d.total) * 100) : 0;
          tr.innerHTML = `<td>${cat}</td><td>${formatNumber(amt)}</td><td>${pct}%</td>`;
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        card.appendChild(table);

        grid.appendChild(card);
      });

      compareContainer.appendChild(grid);
    }

    /* ======= Ø§Ù„ØªØµÙ†ÙŠÙØ§Øª ======= */

    function renderCategoryOptions() {
      expenseCategoryInput.innerHTML = "";
      filterCategory.innerHTML = "";
      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = "ÙƒÙ„ Ø§Ù„ØªØµÙ†ÙŠÙØ§Øª";
      filterCategory.appendChild(allOpt);

      state.categories.forEach((cat) => {
        const opt1 = document.createElement("option");
        opt1.value = cat;
        opt1.textContent = cat;
        expenseCategoryInput.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = cat;
        opt2.textContent = cat;
        filterCategory.appendChild(opt2);
      });
    }

    function renderCategoryList() {
      categoryList.innerHTML = "";
      state.categories.forEach((cat, index) => {
        const chip = document.createElement("span");
        chip.className = "category-chip";
        chip.draggable = true;
        chip.dataset.index = index;

        const name = document.createElement("span");
        name.textContent = cat;
        name.style.flex = "1";
        chip.appendChild(name);

        // show limit badge if exists
        const limitObj = (state.categoryLimits && state.categoryLimits[cat]) || null;
        if (limitObj && limitObj.limit) {
          const badge = document.createElement('span');
          badge.className = 'category-limit-badge';
          badge.textContent = `${formatNumber(limitObj.limit)}` + (limitObj.hard ? ' âš ï¸' : '');
          badge.title = limitObj.hard ? 'Ø­Ø¸Ø± Ù…ÙØ¹Ù„ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¬Ø§ÙˆØ²' : 'ØªÙ†Ø¨ÙŠÙ‡ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ù‚ØªØ±Ø§Ø¨ Ù…Ù† Ø§Ù„Ø­Ø¯';
          chip.appendChild(badge);
        }

        const controls = document.createElement("div");
        controls.className = "category-chip-controls";

        if (index > 0) {
          const upBtn = document.createElement("button");
          upBtn.textContent = "â†‘";
          upBtn.title = "ØªØ­Ø±ÙŠÙƒ Ù„Ø£Ø¹Ù„Ù‰";
          upBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const temp = state.categories[index];
            state.categories[index] = state.categories[index - 1];
            state.categories[index - 1] = temp;
            refreshUI();
          });
          controls.appendChild(upBtn);
        }

        if (index < state.categories.length - 1) {
          const downBtn = document.createElement("button");
          downBtn.textContent = "â†“";
          downBtn.title = "ØªØ­Ø±ÙŠÙƒ Ù„Ø£Ø³ÙÙ„";
          downBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const temp = state.categories[index];
            state.categories[index] = state.categories[index + 1];
            state.categories[index + 1] = temp;
            refreshUI();
          });
          controls.appendChild(downBtn);
        }

        if (state.categories.length > 1) {
          const delBtn = document.createElement("button");
          delBtn.textContent = "âœ•";
          delBtn.title = "Ø­Ø°Ù Ø§Ù„ØªØµÙ†ÙŠÙ";
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!confirm("Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„ØªØµÙ†ÙŠÙØŸ")) return;
            state.categories.splice(index, 1);
            refreshUI();
          });
          controls.appendChild(delBtn);
        }

        // settings button for category limits
        const settingsBtn = document.createElement('button');
        settingsBtn.textContent = 'âš™ï¸';
        settingsBtn.title = 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„ÙØ¦Ø©';
        settingsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openCategoryLimitModal(cat);
        });
        controls.appendChild(settingsBtn);

        chip.appendChild(controls);

        chip.addEventListener("dragstart", (e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/html", chip.innerHTML);
          chip.classList.add("dragging");
        });

        chip.addEventListener("dragend", () => {
          chip.classList.remove("dragging");
        });

        chip.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });

        chip.addEventListener("drop", (e) => {
          e.preventDefault();
          const draggedIndex = parseInt(
            document.querySelector(".category-chip.dragging")?.dataset.index || -1
          );
          if (draggedIndex !== -1 && draggedIndex !== index) {
            const temp = state.categories[draggedIndex];
            state.categories[draggedIndex] = state.categories[index];
            state.categories[index] = temp;
            refreshUI();
          }
        });

        categoryList.appendChild(chip);
      });
    }

    btnAddCategory.addEventListener("click", async () => {
      const name = newCategoryInput.value.trim();
      if (!name) return;
      if (state.categories.includes(name)) {
        alert("Ù‡Ø°Ø§ Ø§Ù„ØªØµÙ†ÙŠÙ Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„.");
        return;
      }
      state.categories.push(name);
      newCategoryInput.value = "";
      await refreshUI();
    });

    expenseCategoryInput.addEventListener("change", () => {
      const categoryError = document.getElementById("categoryError");
      if (expenseCategoryInput.value && expenseCategoryInput.value.trim() !== "") {
        categoryError.style.display = "none";
        expenseCategoryInput.style.borderColor = "";
      }
    });

    /* ======= Month Modal ======= */

    let monthModalEscHandler = null;
    function openMonthModal(edit = false) {
      const now = new Date();
      const currentMonth = getSelectedMonth();
      if (edit && currentMonth) {
        editingMonthId = currentMonth.id;
        modalMonthTitle.textContent = "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø´Ù‡Ø±";
        monthInput.value = String(currentMonth.month);
        yearInput.value = currentMonth.year;
        salaryInput.value = formatNumber(currentMonth.salary || 0);
        deleteMonthBtn.style.display = "inline-flex";
      } else {
        editingMonthId = null;
        modalMonthTitle.textContent = "Ø¥Ø¶Ø§ÙØ© Ø´Ù‡Ø± Ø¬Ø¯ÙŠØ¯";
        monthInput.value = String(now.getMonth() + 1);
        yearInput.value = now.getFullYear();
        salaryInput.value = "";
        deleteMonthBtn.style.display = "none";
      }
      modalMonth.style.display = "flex";
      setTimeout(() => {
        attachNumericInputFormatting();
        try { salaryInput && salaryInput.focus(); } catch (e) {}
        monthModalEscHandler = (e) => { if (e.key === 'Escape') closeMonthModal(); };
        document.addEventListener('keydown', monthModalEscHandler);
      }, 0);
    }

    function closeMonthModal() {
      modalMonth.style.display = "none";
      if (monthModalEscHandler) { document.removeEventListener('keydown', monthModalEscHandler); monthModalEscHandler = null; }
    }

    btnAddMonth.addEventListener("click", () => openMonthModal(false));
    btnEditMonth.addEventListener("click", () => {
      if (!getSelectedMonth()) openMonthModal(false);
      else openMonthModal(true);
    });

    salaryInput.addEventListener("input", () => {
      const start = salaryInput.selectionStart || salaryInput.value.length;
      const before = salaryInput.value.slice(0, start);
      const raw = (salaryInput.value || '').replace(/\D/g, '');
      const digitsBefore = (before.match(/\d/g) || []).length;
      const formatted = formatNumberWithCommas(raw);
      salaryInput.value = formatted;
      let pos = 0, digits = 0;
      while (pos < formatted.length && digits < digitsBefore) {
        if (/\d/.test(formatted[pos])) digits++;
        pos++;
      }
      salaryInput.selectionStart = salaryInput.selectionEnd = pos;
    });

    btnCancelMonth.addEventListener("click", closeMonthModal);
    btnCloseMonth.addEventListener("click", closeMonthModal);

    deleteMonthBtn.addEventListener("click", async () => {
      if (!editingMonthId) return;
      if (!confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø± ÙˆØ¬Ù…ÙŠØ¹ Ù…ØµØ§Ø±ÙŠÙÙ‡ØŸ")) return;
      const idx = state.months.findIndex((m) => m.id === editingMonthId);
      if (idx !== -1) state.months.splice(idx, 1);
      if (state.months.length === 0) {
        state.selectedMonthId = null;
      } else {
        state.selectedMonthId = state.months[state.months.length - 1].id;
      }
      editingMonthId = null;
      closeMonthModal();
      await refreshUI();
    });

    saveMonthBtn.addEventListener("click", async () => {
      const monthNum = parseInt(monthInput.value, 10);
      const yearNum = parseInt(yearInput.value, 10);
      const salary = parseFormattedNumber(salaryInput.value);

      if (!yearNum || yearNum < 1900) {
        alert("Ù…Ù† ÙØ¶Ù„Ùƒ Ø£Ø¯Ø®Ù„ Ø³Ù†Ø© ØµØ­ÙŠØ­Ø©.");
        return;
      }
      if (!monthNum || monthNum < 1 || monthNum > 12) {
        alert("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± Ø´Ù‡Ø±Ù‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§.");
        return;
      }

      const id = generateMonthId(yearNum, monthNum);
      const name = monthNames[monthNum];

      if (editingMonthId) {
        const existing = state.months.find((m) => m.id === editingMonthId);
        if (!existing) return;
        if (editingMonthId !== id) {
          const conflict = state.months.find((m) => m.id === id);
          if (conflict) {
            alert("ÙŠÙˆØ¬Ø¯ Ø´Ù‡Ø± Ø¨Ù†ÙØ³ Ø§Ù„ØªØ§Ø±ÙŠØ® Ø¨Ø§Ù„ÙØ¹Ù„.");
            return;
          }
        }
        existing.year = yearNum;
        existing.month = monthNum;
        existing.name = name;
        existing.salary = salary;
        existing.id = id;
        state.selectedMonthId = id;
      } else {
        const exists = state.months.find((m) => m.id === id);
        if (exists) {
          alert("Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø± Ù…ÙˆØ¬ÙˆØ¯ Ù…Ø³Ø¨Ù‚Ù‹Ø§. Ø§ÙØªØ­Ù‡ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù„ØªØ¹Ø¯ÙŠÙ„Ù‡.");
          return;
        }
        state.months.push({
          id,
          year: yearNum,
          month: monthNum,
          name,
          salary,
          expenses: [],
        });
        state.selectedMonthId = id;
      }

      editingMonthId = null;
      closeMonthModal();
      await refreshUI();
    });

    monthSelect.addEventListener("change", async (e) => {
      state.selectedMonthId = e.target.value || null;
      await refreshUI();
    });

    modalMonth.addEventListener("click", (e) => {
      if (e.target === modalMonth) closeMonthModal();
    });

    /* ======= Expense Modal ======= */

    function openExpenseModal(expenseId = null) {
      isSavingExpense = false; // Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ø¹Ù„Ù… Ø¹Ù†Ø¯ ÙØªØ­ Ø§Ù„Ù€ Modal
      const month = getSelectedMonth();
      if (!month) {
        alert("Ù…Ù† ÙØ¶Ù„Ùƒ Ø£Ø¶Ù Ø´Ù‡Ø±Ù‹Ø§ Ø£ÙˆÙ„Ø§Ù‹.");
        return;
      }
      if (expenseId) {
        const exp = (month.expenses || []).find((e) => e.id === expenseId);
        if (!exp) return;
        editingExpenseId = expenseId;
        expenseModalTitle.textContent = "ØªØ¹Ø¯ÙŠÙ„ Ù…ØµØ±ÙˆÙ";
        expenseTitleInput.value = exp.title || "";
        expenseAmountInput.value = formatNumber(exp.amount || 0);
        expenseCategoryInput.value = exp.category || state.categories[0];
        expenseDateInput.value = exp.date || "";
        expenseNoteInput.value = exp.note || "";
        expenseImageInput.value = "";
        // Ø¹Ø±Ø¶ Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ø¥Ù† ÙˆØ¬Ø¯Øª
        if (exp.imageDataUrl) {
          imagePreviewImg.src = exp.imageDataUrl;
          imagePreviewFilename.textContent = "ØµÙˆØ±Ø© Ù…ÙˆØ¬ÙˆØ¯Ø©";
          imagePreviewSize.textContent = "";
          imagePreviewContainer.classList.add("active");
        } else {
          imagePreviewContainer.classList.remove("active");
          imagePreviewImg.src = "";
        }
        deleteExpenseBtn.style.display = "inline-flex";
      } else {
        editingExpenseId = null;
        expenseModalTitle.textContent = "Ø¥Ø¶Ø§ÙØ© Ù…ØµØ±ÙˆÙ";
        expenseTitleInput.value = "";
        expenseAmountInput.value = "";
        expenseCategoryInput.value = state.categories[0];
        expenseDateInput.valueAsDate = new Date();
        expenseNoteInput.value = "";
        expenseImageInput.value = "";
        imagePreviewContainer.classList.remove("active");
        imagePreviewImg.src = "";
        deleteExpenseBtn.style.display = "none";
      }
      modalExpense.style.display = "flex";
    }

    function closeExpenseModal() {
      modalExpense.style.display = "none";
      // Ø¥Ø²Ø§Ù„Ø© Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø¥ØºÙ„Ø§Ù‚
      imagePreviewContainer.classList.remove("active");
      imagePreviewImg.src = "";
    }

    btnAddExpense.addEventListener("click", () => openExpenseModal(null));
    btnCancelExpense.addEventListener("click", closeExpenseModal);
    btnCloseExpense.addEventListener("click", closeExpenseModal);

    modalExpense.addEventListener("click", (e) => {
      if (e.target === modalExpense) closeExpenseModal();
    });



    // Ù…Ø¹Ø§Ù„Ø¬Ø© Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imagePreviewImg = document.getElementById("imagePreviewImg");
    const imagePreviewFilename = document.getElementById("imagePreviewFilename");
    const imagePreviewSize = document.getElementById("imagePreviewSize");
    const imagePreviewRemove = document.getElementById("imagePreviewRemove");

    function formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    }

    // Ø¯Ø§Ù„Ø© Ø¶ØºØ· Ø§Ù„ØµÙˆØ± Ù„ØªÙ‚Ù„ÙŠÙ„ Ø­Ø¬Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù†Ù‚ÙˆÙ„Ø©
    function compressImage(dataUrl, maxWidth = 800, maxHeight = 800, quality = 0.7) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = dataUrl;
        img.onload = function () {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Ø­Ø³Ø§Ø¨ Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ù…Ø¹ Ø§Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø³Ø¨Ø©
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(dataUrl); // Ø¥Ø±Ø¬Ø§Ø¹ Ø§Ù„Ø£ØµÙ„ ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ù„Ø®Ø·Ø£
      });
    }

    expenseImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (event) {
          imagePreviewImg.src = event.target.result;
          imagePreviewFilename.textContent = file.name;
          imagePreviewSize.textContent = formatFileSize(file.size);
          imagePreviewContainer.classList.add("active");
        };
        reader.readAsDataURL(file);
      } else if (file) {
        alert("Ù…Ù† ÙØ¶Ù„Ùƒ Ø§Ø®ØªØ± Ù…Ù„Ù ØµÙˆØ±Ø© ØµØ­ÙŠØ­");
        expenseImageInput.value = "";
        imagePreviewContainer.classList.remove("active");
      }
    });

    imagePreviewRemove.addEventListener("click", (e) => {
      e.preventDefault();
      expenseImageInput.value = "";
      imagePreviewContainer.classList.remove("active");
      imagePreviewImg.src = "";
      imagePreviewFilename.textContent = "";
      imagePreviewSize.textContent = "";
    });

    async function deleteExpense(expenseId) {
      const month = getSelectedMonth();
      if (!month || !Array.isArray(month.expenses)) return;
      if (!confirm("Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…ØµØ±ÙˆÙØŸ")) return;
      const idx = month.expenses.findIndex((e) => e.id === expenseId);
      if (idx !== -1) {
        month.expenses.splice(idx, 1);
        await refreshUI();
      }
    }

    deleteExpenseBtn.addEventListener("click", async () => {
      if (!editingExpenseId) return;
      await deleteExpense(editingExpenseId);
      closeExpenseModal();
    });

    saveExpenseBtn.addEventListener("click", async () => {
      // Ù…Ù†Ø¹ Ø§Ù„Ù†Ù‚Ø± Ø§Ù„Ù…ØªÙƒØ±Ø±
      if (isSavingExpense) return;
      isSavingExpense = true;

      const month = getSelectedMonth();
      const categoryError = document.getElementById("categoryError");

      if (!month) {
        await showAlertModal("Ù…Ù† ÙØ¶Ù„Ùƒ Ø£Ø¶Ù Ø´Ù‡Ø±Ù‹Ø§ Ø£ÙˆÙ„Ø§Ù‹.", "ØªÙ†Ø¨ÙŠÙ‡", "â„¹ï¸");
        isSavingExpense = false;
        return;
      }
      if (!Array.isArray(month.expenses)) month.expenses = [];

      const title = expenseTitleInput.value.trim() || "Ù…ØµØ±ÙˆÙ";
      const amount = parseFormattedNumber(expenseAmountInput.value);
      const category = expenseCategoryInput.value;
      const date = expenseDateInput.value || "";
      const note = expenseNoteInput.value.trim();

      if (!amount || amount <= 0) {
        await showAlertModal("Ù…Ù† ÙØ¶Ù„Ùƒ Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§.", "Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ù…Ø¨Ù„Øº", "âŒ");
        isSavingExpense = false;
        return;
      }

      if (!category || category.trim() === "") {
        categoryError.style.display = "block";
        expenseCategoryInput.focus();
        expenseCategoryInput.style.borderColor = "var(--danger)";
        isSavingExpense = false;
        return;
      } else {
        categoryError.style.display = "none";
        expenseCategoryInput.style.borderColor = "";
      }

      // Check category limit before proceeding
      const limitCheck = checkCategoryLimit(category, amount);
      if (!limitCheck.allowed) {
        await showAlertModal(
          limitCheck.message || 'Ù‡Ø°Ø§ Ø§Ù„Ù…ØµØ±ÙˆÙ ÙŠØªØ¬Ø§ÙˆØ² Ø­Ø¯ Ø§Ù„ÙØ¦Ø© ÙˆØ³ÙŠØªÙ… Ù…Ù†Ø¹Ù‡.',
          'âš ï¸ ØªØ­Ø°ÙŠØ±',
          'â›”'
        );
        isSavingExpense = false;
        return;
      }
      if (limitCheck.message && !limitCheck.allowed) {
        await showAlertModal(
          limitCheck.message,
          'âš ï¸ ØªØ­Ø°ÙŠØ±',
          'â›”'
        );
        isSavingExpense = false;
        return;
      }
      if (limitCheck.message && limitCheck.allowed) {
        const confirmed = await showConfirmModal(
          limitCheck.message,
          'âš ï¸ ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„ÙØ¦Ø©',
          'âš ï¸'
        );
        if (!confirmed) {
          isSavingExpense = false;
          return;
        }
      }

      // Proceed with expense save
      const file = expenseImageInput.files[0];

      // Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù€ Modal ÙÙˆØ±Ø§Ù‹ Ù„ØªØ¬Ù†Ø¨ Ø§Ù„Ù†Ù‚Ø± Ø§Ù„Ù…ØªÙƒØ±Ø±
      closeExpenseModal();

      if (file) {
        const reader = new FileReader();
        reader.onload = async function (e) {
          let imageDataUrl = e.target.result;
          
          // Ø¶ØºØ· Ø§Ù„ØµÙˆØ±Ø© Ø¥Ø°Ø§ ÙƒØ§Ù†Øª ÙƒØ¨ÙŠØ±Ø© Ø§Ù„Ø­Ø¬Ù…
          if (file.size > 500000) { // Ø£ÙƒØ¨Ø± Ù…Ù† 500KB
            imageDataUrl = await compressImage(imageDataUrl, 800, 800, 0.7);
          }
          
          await saveExpenseObject(month, {
            id: editingExpenseId,
            title,
            amount,
            category,
            date,
            note,
            imageDataUrl,
          });
          isSavingExpense = false;
        };
        reader.readAsDataURL(file);
      } else {
        let imageDataUrl = null;
        if (editingExpenseId) {
          const existing = month.expenses.find((exp) => exp.id === editingExpenseId);
          imageDataUrl = existing ? existing.imageDataUrl || null : null;
        }
        await saveExpenseObject(month, {
          id: editingExpenseId,
          title,
          amount,
          category,
          date,
          note,
          imageDataUrl,
        });
        isSavingExpense = false;
      }
    });

    async function saveExpenseObject(
      month,
      { id, title, amount, category, date, note, imageDataUrl }
    ) {
      if (!Array.isArray(month.expenses)) month.expenses = [];
      if (id) {
        const existing = month.expenses.find((e) => e.id === id);
        if (!existing) return;
        existing.title = title;
        existing.amount = amount;
        existing.category = category;
        existing.date = date;
        existing.note = note;
        existing.imageDataUrl = imageDataUrl;
      } else {
        month.expenses.push({
          id: Date.now().toString(),
          title,
          amount,
          category,
          date,
          note,
          imageDataUrl,
        });
      }
      editingExpenseId = null;
      await refreshUI();
    }

    // ====== Goals feature ======
    let editingGoalId = null;

    function renderGoals() {
      if (!goalsContainer) return;
      goalsContainer.innerHTML = "";
      const goals = Array.isArray(state.goals) ? state.goals : [];
      if (goals.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù‡Ø¯Ø§Ù Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.';
        goalsContainer.appendChild(empty);
        return;
      }

      goals.forEach((g) => {
        const item = document.createElement('div');
        item.className = 'goal-item';

        const left = document.createElement('div');
        left.className = 'goal-left';
        const title = document.createElement('div');
        title.className = 'goal-title';
        title.textContent = g.title || 'Ù‡Ø¯Ù';
        left.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'goal-meta';
        const progress = Math.min(100, Math.round(((g.current||0) / (g.target||1)) * 100));
        meta.innerHTML = `<div class="goal-amounts">${formatNumber(g.current||0)} / ${formatNumber(g.target||0)}</div>` + (g.dueDate ? `<div class="goal-duedate">${g.dueDate}</div>` : '');
        left.appendChild(meta);

        const progWrap = document.createElement('div');
        progWrap.className = 'goal-progress-wrap';
        const prog = document.createElement('div');
        prog.className = 'goal-progress';
        prog.style.width = progress + '%';
        progWrap.appendChild(prog);
        left.appendChild(progWrap);

        item.appendChild(left);

        const actions = document.createElement('div');
        actions.className = 'goal-actions';
        const btnView = document.createElement('button');
        btnView.className = 'btn btn-outline btn-sm';
        btnView.textContent = 'ØªÙØ§ØµÙŠÙ„';
        btnView.addEventListener('click', () => openGoalModal(g.id));
        actions.appendChild(btnView);

        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn btn-primary btn-sm';
        btnAdd.textContent = '+ Ø£Ø¶Ù Ù…Ø¨Ù„Øº';
        btnAdd.addEventListener('click', () => {
          const val = prompt('Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„Øº Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ø¥Ù„Ù‰ Ø§Ù„Ù‡Ø¯Ù:');
          if (!val) return;
          const num = parseFormattedNumber(val);
          if (!num) { alert('Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§'); return; }
          g.current = (g.current || 0) + num;
          saveState();
          renderGoals();
        });
        actions.appendChild(btnAdd);

        item.appendChild(actions);
        goalsContainer.appendChild(item);
      });
    }

    let goalModalEscHandler = null;
    function openGoalModal(goalId = null) {
      editingGoalId = goalId;
      modalGoal.style.display = 'flex';
      if (goalId) {
        modalGoalTitle.textContent = 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù‡Ø¯Ù';
        btnDeleteGoal.style.display = 'inline-flex';
        const g = state.goals.find(x => x.id === goalId);
        if (g) {
          goalTitleInput.value = g.title || '';
          goalTargetInput.value = formatNumber(g.target || 0);
          goalCurrentInput.value = formatNumber(g.current || 0);
          goalDueDate.value = g.dueDate || '';
        }
      } else {
        modalGoalTitle.textContent = 'Ø¥Ø¶Ø§ÙØ© Ù‡Ø¯Ù Ø¬Ø¯ÙŠØ¯';
        btnDeleteGoal.style.display = 'none';
        goalTitleInput.value = '';
        goalTargetInput.value = '';
        goalCurrentInput.value = '';
        goalDueDate.value = '';
      }
      // ensure numeric inputs in modals get formatting attached and focus first field
      setTimeout(() => {
        attachNumericInputFormatting();
        try { goalTitleInput && goalTitleInput.focus(); } catch (e) {}
        goalModalEscHandler = (e) => { if (e.key === 'Escape') closeGoalModal(); };
        document.addEventListener('keydown', goalModalEscHandler);
      }, 0);
    }

    function closeGoalModal() {
      editingGoalId = null;
      modalGoal.style.display = 'none';
      if (goalModalEscHandler) { document.removeEventListener('keydown', goalModalEscHandler); goalModalEscHandler = null; }
    }

    async function saveGoal() {
      const title = (goalTitleInput.value || '').trim() || 'Ù‡Ø¯Ù';
      const target = parseFormattedNumber(goalTargetInput.value || '0');
      const current = parseFormattedNumber(goalCurrentInput.value || '0');
      const due = goalDueDate.value || null;
      if (!target || target <= 0) { alert('Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ Ù…Ø³ØªÙ‡Ø¯ÙÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§'); return; }
      if (!Array.isArray(state.goals)) state.goals = [];
      if (editingGoalId) {
        const g = state.goals.find(x => x.id === editingGoalId);
        if (g) {
          g.title = title; g.target = target; g.current = current; g.dueDate = due;
        }
      } else {
        state.goals.push({ id: Date.now().toString(), title, target, current, dueDate: due });
      }
      saveState();
      closeGoalModal();
      renderGoals();
    }

    function deleteGoal() {
      if (!editingGoalId) return;
      if (!confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù‡Ø¯ÙØŸ')) return;
      const idx = state.goals.findIndex(x => x.id === editingGoalId);
      if (idx !== -1) state.goals.splice(idx, 1);
      saveState();
      closeGoalModal();
      renderGoals();
    }

    // Category limits check - with overflow tracking
    function checkCategoryLimit(cat, additionalAmount) {
      if (!state.categoryLimits) return { allowed: true };
      const obj = state.categoryLimits[cat];
      if (!obj || !obj.limit) return { allowed: true };
      const month = getSelectedMonth();
      const total = (month.expenses || []).reduce((s, e) => s + ((e.category === cat) ? (e.amount || 0) : 0), 0);
      const would = total + (additionalAmount || 0);
      
      // Check if we've already exceeded once in this month
      const hasOverflowed = obj.hasExceeded === true;
      console.log(`[DEBUG] Checking limit for ${cat}: would=${would}, limit=${obj.limit}, hasOverflowed=${hasOverflowed}`);
      
      // Allow equal to limit (not just less than)
      if (would <= obj.limit) {
        // Still within limit
        if (would >= Math.round(obj.limit * 0.8)) {
          return { allowed: true, message: `âš ï¸ Ø§Ù‚ØªØ±Ø¨Øª Ù…Ù† Ø­Ø¯ Ø§Ù„ÙØ¦Ø© "${cat}" (${formatNumber(would)} / ${formatNumber(obj.limit)})` };
        }
        return { allowed: true };
      }
      
      // Over limit: allow only once if not hard limit
      if (would > obj.limit) {
        if (hasOverflowed) {
          // Already exceeded once, block further additions
          const msg = `âŒ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø¥Ø¶Ø§ÙØ© Ù…ØµØ§Ø±ÙŠÙ Ø¥Ø¶Ø§ÙÙŠØ©. ØªØ¬Ø§ÙˆØ²Øª Ø­Ø¯ Ø§Ù„ÙØ¦Ø© "${cat}" (${formatNumber(obj.limit)}) Ø¨Ø§Ù„ÙØ¹Ù„.`;
          return { allowed: false, message: msg };
        }
        
        if (obj.hard) {
          // Hard limit, no overflow allowed
          const msg = `â›” Ø³ÙŠØªÙ… ØªØ¬Ø§ÙˆØ² Ø­Ø¯ Ø§Ù„ÙØ¦Ø© "${cat}" (${formatNumber(obj.limit)}) â€” Ø¨Ø¹Ø¯ Ø§Ù„Ø¥Ø¶Ø§ÙØ©: ${formatNumber(would)}. Ù‡Ø°Ø§ Ø§Ù„Ø­Ø¯ Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ¬Ø§ÙˆØ²Ù‡.`;
          return { allowed: false, message: msg };
        }
        
        // Soft limit, allow one overflow
        const msg = `âš ï¸ Ø³ÙŠØªÙ… ØªØ¬Ø§ÙˆØ² Ø­Ø¯ Ø§Ù„ÙØ¦Ø© "${cat}" (${formatNumber(obj.limit)}) â€” Ø¨Ø¹Ø¯ Ø§Ù„Ø¥Ø¶Ø§ÙØ©: ${formatNumber(would)}.\n\nÙ‡Ø°Ø§ Ø§Ù„ØªØ¬Ø§ÙˆØ² Ù…Ø³Ù…ÙˆØ­ Ù„Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø·.`;
        return { allowed: true, message: msg, markOverflow: true };
      }
      
      return { allowed: true };
    }

    // wire modal buttons
    if (btnAddGoal) btnAddGoal.addEventListener('click', () => openGoalModal(null));
    if (btnCancelGoal) btnCancelGoal.addEventListener('click', closeGoalModal);
    if (btnCloseGoal) btnCloseGoal.addEventListener('click', closeGoalModal);
    if (btnSaveGoal) btnSaveGoal.addEventListener('click', saveGoal);
    if (btnDeleteGoal) btnDeleteGoal.addEventListener('click', deleteGoal);

    // toggle between goals and buckets - DISABLED: both shown together now
    // if (showGoalsTab) {
    //   showGoalsTab.addEventListener('click', () => {
    //     showGoalsTab.classList.add('active');
    //     showBucketsTab && showBucketsTab.classList.remove('active');
    //     document.getElementById('goalsTab').style.display = 'block';
    //     document.getElementById('bucketsTab').style.display = 'none';
    //     if (btnAddGoal) btnAddGoal.style.display = '';
    //     if (btnAddBucket) btnAddBucket.style.display = 'none';
    //   });
    // }
    // if (showBucketsTab) {
    //   showBucketsTab.addEventListener('click', () => {
    //     showBucketsTab.classList.add('active');
    //     showGoalsTab && showGoalsTab.classList.remove('active');
    //     document.getElementById('goalsTab').style.display = 'none';
    //     document.getElementById('bucketsTab').style.display = 'block';
    //     if (btnAddGoal) btnAddGoal.style.display = 'none';
    //     if (btnAddBucket) btnAddBucket.style.display = '';
    //   });
    // }

    // Category Limit modal wiring & helpers
    const modalCategoryLimit = document.getElementById('modalCategoryLimit');
    const categoryLimitName = document.getElementById('categoryLimitName');
    const categoryLimitAmount = document.getElementById('categoryLimitAmount');
    const categoryLimitHard = document.getElementById('categoryLimitHard');
    const btnSaveCategoryLimit = document.getElementById('btnSaveCategoryLimit');
    const btnCancelCategoryLimit = document.getElementById('btnCancelCategoryLimit');
    const btnDeleteCategoryLimit = document.getElementById('btnDeleteCategoryLimit');
    let editingCategoryForLimit = null;
    let categoryLimitEscHandler = null;

    function openCategoryLimitModal(cat) {
      editingCategoryForLimit = cat;
      if (!modalCategoryLimit) return;
      modalCategoryLimit.style.display = 'flex';
      categoryLimitName.textContent = cat;
      const cur = state.categoryLimits && state.categoryLimits[cat] ? state.categoryLimits[cat] : null;
      categoryLimitAmount.value = cur && cur.limit ? formatNumber(cur.limit) : '';
      categoryLimitHard.checked = cur && !!cur.hard;
      if (btnDeleteCategoryLimit) btnDeleteCategoryLimit.style.display = cur && cur.limit ? 'inline-flex' : 'none';
      // attach formatting and focus
      setTimeout(() => {
        attachNumericInputFormatting();
        const el = categoryLimitAmount;
        if (el) { el.focus(); el.selectionEnd = el.value.length; }
        categoryLimitEscHandler = (e) => { if (e.key === 'Escape') closeCategoryLimitModal(); };
        document.addEventListener('keydown', categoryLimitEscHandler);
      }, 0);
    }

    function closeCategoryLimitModal() {
      if (!modalCategoryLimit) return;
      modalCategoryLimit.style.display = 'none';
      editingCategoryForLimit = null;
      if (categoryLimitEscHandler) { document.removeEventListener('keydown', categoryLimitEscHandler); categoryLimitEscHandler = null; }
    }

    function saveCategoryLimit() {
      if (!editingCategoryForLimit) return closeCategoryLimitModal();
      const val = (categoryLimitAmount.value || '').trim();
      if (!val) {
        if (state.categoryLimits) delete state.categoryLimits[editingCategoryForLimit];
        saveState(); refreshUI(); closeCategoryLimitModal();
        return;
      }
      const num = parseFormattedNumber(categoryLimitAmount.value);
      if (!num) { alert('Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§.'); return; }
      state.categoryLimits = state.categoryLimits || {};
      state.categoryLimits[editingCategoryForLimit] = { limit: num, hard: !!categoryLimitHard.checked };
      saveState(); refreshUI(); closeCategoryLimitModal();
    }

    function deleteCategoryLimit() {
      if (!editingCategoryForLimit) return;
      if (!confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù Ø­Ø¯ Ø§Ù„ÙØ¦Ø©ØŸ')) return;
      if (state.categoryLimits) delete state.categoryLimits[editingCategoryForLimit];
      saveState(); refreshUI(); closeCategoryLimitModal();
    }

    if (btnSaveCategoryLimit) btnSaveCategoryLimit.addEventListener('click', saveCategoryLimit);
    if (btnCancelCategoryLimit) btnCancelCategoryLimit.addEventListener('click', closeCategoryLimitModal);
    if (btnCloseCategoryLimit) btnCloseCategoryLimit.addEventListener('click', closeCategoryLimitModal);
    if (btnDeleteCategoryLimit) btnDeleteCategoryLimit.addEventListener('click', deleteCategoryLimit);

    if (modalCategoryLimit) modalCategoryLimit.addEventListener('click', (e) => { if (e.target === modalCategoryLimit) closeCategoryLimitModal(); });

    /* ======= Savings Buckets (Paycheck Split) ======= */
    // element references already obtained earlier near top, skip redeclaration
    const bucketsTotalPercent = document.getElementById('bucketsTotalPercent');
    const btnPreviewSplit = document.getElementById('btnPreviewSplit');
    const btnApplySplit = document.getElementById('btnApplySplit');

    // modal elements
    const modalBucket = document.getElementById('modalBucket');
    const bucketNameInput = document.getElementById('bucketNameInput');
    const bucketAmountInput = document.getElementById('bucketAmountInput');
    const btnSaveBucket = document.getElementById('btnSaveBucket');
    const btnCancelBucket = document.getElementById('btnCancelBucket');
    const btnCloseBucket = document.getElementById('btnCloseBucket');
    const btnDeleteBucket = document.getElementById('btnDeleteBucket');

    let editingBucketId = null;
    let bucketModalEscHandler = null;

    function renderSavingsBuckets() {
      if (!bucketsContainer) return;
      bucketsContainer.innerHTML = '';
      const buckets = Array.isArray(state.savingsBuckets) ? state.savingsBuckets : [];
      if (buckets.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§ÙØ¸Ø§Øª Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.';
        bucketsContainer.appendChild(empty);
        bucketsTotalPercent.textContent = '0';
        return;
      }

      const month = getSelectedMonth();
      const salary = (month && month.salary) ? month.salary : 0;
      let totalAlloc = 0;

      buckets.forEach((b) => {
        const item = document.createElement('div');
        item.className = 'bucket-item';

        const left = document.createElement('div');
        left.className = 'bucket-left';
        const name = document.createElement('div');
        name.className = 'bucket-name';
        name.textContent = b.name || 'Ø­Ø§ÙØ¸Ø©';
        left.appendChild(name);

        const meta = document.createElement('div');
        meta.className = 'bucket-meta';
        const amt = b.amount || 0;
        totalAlloc += amt;
        const percent = salary ? Math.round((amt / salary) * 100) : 0;
        meta.innerHTML = `<div class="bucket-percent">${percent}%</div><div class="bucket-amount">${formatNumber(amt)}</div>`;
        left.appendChild(meta);
        item.appendChild(left);

        const controls = document.createElement('div');
        controls.className = 'bucket-controls';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline btn-sm';
        editBtn.textContent = 'âœŽ';
        editBtn.title = 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø­Ø§ÙØ¸Ø©';
        editBtn.addEventListener('click', (e) => { e.stopPropagation(); openBucketModal(b.id); });
        controls.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-outline btn-sm';
        delBtn.textContent = 'ðŸ—‘ï¸';
        delBtn.title = 'Ø­Ø°Ù Ø§Ù„Ø­Ø§ÙØ¸Ø©';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø§ÙØ¸Ø©ØŸ')) return; const idx = state.savingsBuckets.findIndex(x => x.id === b.id); if (idx !== -1) state.savingsBuckets.splice(idx, 1); saveState(); refreshUI(); });
        controls.appendChild(delBtn);

        item.appendChild(controls);
        bucketsContainer.appendChild(item);
      });

      const percentOfSalary = salary ? Math.round((totalAlloc / salary) * 100) : 0;
      bucketsTotalPercent.textContent = `${formatNumber(totalAlloc)} â€” ${percentOfSalary}%`;
      if (salary && totalAlloc > salary) bucketsTotalPercent.style.color = 'var(--danger)'; else bucketsTotalPercent.style.color = '';
    }

    function openBucketModal(bucketId = null) {
      editingBucketId = bucketId;
      if (!modalBucket) return;
      modalBucket.style.display = 'flex';
      if (bucketId) {
        const b = state.savingsBuckets.find(x => x.id === bucketId);
        if (b) {
          bucketNameInput.value = b.name || '';
          bucketAmountInput.value = formatNumber(b.amount || 0);
          btnDeleteBucket.style.display = 'inline-flex';
        }
      } else {
        bucketNameInput.value = '';
        bucketAmountInput.value = '';
        btnDeleteBucket.style.display = 'none';
      }
      setTimeout(() => { attachNumericInputFormatting(); try { bucketNameInput && bucketNameInput.focus(); } catch (e) {} bucketModalEscHandler = (e) => { if (e.key === 'Escape') closeBucketModal(); }; document.addEventListener('keydown', bucketModalEscHandler);
        // live note update
        try {
          const noteEl = document.getElementById('bucketAmountNote');
          const updateBucketNote = () => {
            const month = getSelectedMonth();
            const salary = month ? (month.salary || 0) : 0;
            const existingTotal = (state.savingsBuckets || []).reduce((s, b) => s + (b.id === editingBucketId ? 0 : (b.amount || 0)), 0);
            const curVal = parseFormattedNumber(bucketAmountInput.value || '0') || 0;
            const newTotal = existingTotal + curVal;
            const pct = salary ? Math.round((newTotal / salary) * 100) : 0;
            if (noteEl) {
              noteEl.textContent = `Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø¨Ø¹Ø¯ Ø§Ù„Ø¥Ø¶Ø§ÙØ©: ${formatNumber(newTotal)} Ù…Ù† ${formatNumber(salary)} (${pct}%)`;
              if (salary && newTotal > salary) noteEl.style.color = 'var(--danger)'; else noteEl.style.color = 'var(--subtext-color)';
            }
          };
          updateBucketNote();
          bucketAmountInput._noteHandler = updateBucketNote;
          bucketAmountInput.addEventListener('input', updateBucketNote);
        } catch (e) {}
      }, 0);
    }

    function closeBucketModal() {
      if (!modalBucket) return;
      modalBucket.style.display = 'none';
      editingBucketId = null;
      if (bucketModalEscHandler) { document.removeEventListener('keydown', bucketModalEscHandler); bucketModalEscHandler = null; }
      try {
        if (bucketAmountInput && bucketAmountInput._noteHandler) {
          bucketAmountInput.removeEventListener('input', bucketAmountInput._noteHandler);
          bucketAmountInput._noteHandler = null;
        }
      } catch (e) {}
    }

    function saveBucket() {
      const name = (bucketNameInput.value || '').trim() || 'Ø­Ø§ÙØ¸Ø©';
      const amount = parseFormattedNumber(bucketAmountInput.value || '0') || 0;
      if (amount < 0) { alert('Ø£Ø¯Ø®Ù„ Ù…Ø¨Ù„ØºÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§.'); return; }
      // check total amount
      const existingTotal = (state.savingsBuckets || []).reduce((s, b) => s + (b.id === editingBucketId ? 0 : (b.amount || 0)), 0);
      const newTotal = existingTotal + amount;
      const month = getSelectedMonth();
      const salary = month ? (month.salary || 0) : 0;
      if (salary && newTotal > salary) {
        if (!confirm('Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ù…Ø¨Ø§Ù„Øº ÙŠØªØ¬Ø§ÙˆØ² Ø§Ù„Ø±Ø§ØªØ¨ØŒ Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©ØŸ')) return;
      }
      if (!Array.isArray(state.savingsBuckets)) state.savingsBuckets = [];
      if (editingBucketId) {
        const b = state.savingsBuckets.find(x => x.id === editingBucketId);
        if (b) { b.name = name; b.amount = amount; }
      } else {
        state.savingsBuckets.push({ id: Date.now().toString(), name, amount });
      }
      saveState(); refreshUI(); closeBucketModal();
    }

    function deleteBucket() {
      if (!editingBucketId) return;
      if (!confirm('Ù‡Ù„ ØªØ±ÙŠØ¯ Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø­Ø§ÙØ¸Ø©ØŸ')) return;
      const idx = state.savingsBuckets.findIndex(x => x.id === editingBucketId);
      if (idx !== -1) state.savingsBuckets.splice(idx, 1);
      saveState(); refreshUI(); closeBucketModal();
    }

    function previewSplit() {
      const month = getSelectedMonth();
      if (!month) { alert('Ø§Ø®ØªØ± Ø´Ù‡Ø±Ù‹Ø§ Ø£ÙˆÙ„Ù‹Ø§.'); return; }
      const salary = month.salary || 0;
      if (!salary) { alert('Ø­Ø¯Ù‘Ø« Ø§Ù„Ø±Ø§ØªØ¨ Ø£ÙˆÙ„Ù‹Ø§ Ù„ÙŠØªÙ… Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø©.'); return; }
      const buckets = state.savingsBuckets || [];
      if (buckets.length === 0) { alert('Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§ÙØ¸Ø§Øª Ù„Ù…Ø¹Ø±ÙØ© Ø§Ù„ØªÙˆØ²ÙŠØ¹.'); return; }

      let totalAlloc = 0;
      const rows = buckets.map((b) => {
        const amt = b.amount || 0;
        totalAlloc += amt;
        const pct = salary ? Math.round((amt / salary) * 100) : 0;
        return { name: b.name || 'Ø­Ø§ÙØ¸Ø©', amount: amt, percent: pct };
      });
      const leftover = salary - totalAlloc;

      // populate details panel
      const detailsEl = document.getElementById('splitDetailsPanel');
      const summaryEl = document.getElementById('splitSummaryPanel');
      if (detailsEl) {
        detailsEl.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'split-details-table';
        rows.forEach(r => {
          const tr = document.createElement('tr');
          const tdName = document.createElement('td'); tdName.textContent = r.name; tdName.style.width = '50%';
          const tdAmt = document.createElement('td'); tdAmt.textContent = formatNumber(r.amount); tdAmt.style.textAlign = 'right';
          const tdPct = document.createElement('td'); tdPct.textContent = r.percent + '%'; tdPct.style.width = '80px'; tdPct.style.textAlign = 'right';
          tr.appendChild(tdName); tr.appendChild(tdAmt); tr.appendChild(tdPct);
          table.appendChild(tr);
        });
        detailsEl.appendChild(table);
      }

      if (summaryEl) {
        summaryEl.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';
        wrap.innerHTML = `
          <div><strong>Ø§Ù„Ø±Ø§ØªØ¨:</strong> ${formatNumber(salary)}</div>
          <div><strong>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„Ù…Ø®ØµÙˆÙ…:</strong> ${formatNumber(totalAlloc)}</div>
          <div><strong>Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ:</strong> ${formatNumber(leftover)}</div>
        `;
        summaryEl.appendChild(wrap);
      }

      // show modal and wire interaction
      const modal = document.getElementById('modalSplitPreview');
      if (!modal) return;
      modal.style.display = 'flex';

      // tabs
      modal.querySelectorAll('.split-tab-btn').forEach((btn) => {
        btn.onclick = () => {
          modal.querySelectorAll('.split-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.tab;
          document.getElementById('splitDetailsPanel').style.display = (tab === 'details') ? '' : 'none';
          document.getElementById('splitSummaryPanel').style.display = (tab === 'summary') ? '' : 'none';
        };
      });

      // close & apply
      const closeModal = () => {
        modal.style.display = 'none';
        document.removeEventListener('keydown', escHandler);
      };
      const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
      document.addEventListener('keydown', escHandler);

      const closeBtn = document.getElementById('btnCloseSplitPreview');
      const closeBtn2 = document.getElementById('btnCloseSplitPreview2');
      const applyBtn = document.getElementById('btnApplySplitFromPreview');
      if (closeBtn) closeBtn.onclick = closeModal;
      if (closeBtn2) closeBtn2.onclick = closeModal;
      if (applyBtn) applyBtn.onclick = () => { applySplit(); closeModal(); };

      modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    function applySplit() {
      const month = getSelectedMonth();
      if (!month) { alert('Ø§Ø®ØªØ± Ø´Ù‡Ø±Ù‹Ø§ Ø£ÙˆÙ„Ù‹Ø§.'); return; }
      const salary = month.salary || 0;
      if (!salary) { alert('Ø­Ø¯Ù‘Ø« Ø§Ù„Ø±Ø§ØªØ¨ Ø£ÙˆÙ„Ù‹Ø§ Ù„ÙŠØªÙ… Ø§Ù„ØªØ·Ø¨ÙŠÙ‚.'); return; }
      const buckets = state.savingsBuckets || [];
      if (buckets.length === 0) { alert('Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§ÙØ¸Ø§Øª Ù„Ù„ØªØ·Ø¨ÙŠÙ‚.'); return; }
      const allocations = buckets.map((b) => ({ bucketId: b.id, name: b.name, amount: b.amount || 0, percent: salary ? Math.round(((b.amount||0)/salary)*100) : 0 }));
      month.savings = allocations;
      saveState(); refreshUI();
      alert('âœ“ ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ØªÙˆØ²ÙŠØ¹ Ø¹Ù„Ù‰ Ø§Ù„Ø´Ù‡Ø±.');
    }

    if (btnAddBucket) btnAddBucket.addEventListener('click', () => openBucketModal(null));
    if (btnSaveBucket) btnSaveBucket.addEventListener('click', saveBucket);
    if (btnCancelBucket) btnCancelBucket.addEventListener('click', closeBucketModal);
    if (btnCloseBucket) btnCloseBucket.addEventListener('click', closeBucketModal);
    if (btnDeleteBucket) btnDeleteBucket.addEventListener('click', deleteBucket);
    if (modalBucket) modalBucket.addEventListener('click', (e) => { if (e.target === modalBucket) closeBucketModal(); });
    if (btnPreviewSplit) btnPreviewSplit.addEventListener('click', previewSplit);
    if (btnApplySplit) btnApplySplit.addEventListener('click', applySplit);

    /* ======= ÙÙ„ØªØ±Ø© ======= */

    searchInput.addEventListener("input", () => {
      filterState.search = searchInput.value;
      renderExpenses();
    });

    filterCategory.addEventListener("change", () => {
      filterState.category = filterCategory.value;
      renderExpenses();
    });

    filterHasImage.addEventListener("change", () => {
      filterState.hasImageOnly = filterHasImage.checked;
      renderExpenses();
    });

    /* ======= Image Modal ======= */

    modalImage.addEventListener("click", (e) => {
      if (e.target === modalImage) {
        modalImage.style.display = "none";
        imageModalView.src = "";
      }
    });

    /* ======= Theme ======= */

    btnToggleTheme.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "light" ? "dark" : "light");
    });

    /* ======= Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…: Ø­Ø³Ø§Ø¨ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ======= */

    function computeUserStats(userState) {
      const normalized = normalizeState(userState || {});
      const months = Array.isArray(normalized.months) ? normalized.months : [];
      let totalSalary = 0;
      let totalExpenses = 0;
      let expensesCount = 0;

      months.forEach((m) => {
        totalSalary += m.salary || 0;
        if (Array.isArray(m.expenses)) {
          expensesCount += m.expenses.length;
          m.expenses.forEach((ex) => {
            totalExpenses += ex.amount || 0;
          });
        }
      });

      const remaining = totalSalary - totalExpenses;
      return {
        monthsCount: months.length,
        totalSalary,
        totalExpenses,
        remaining,
        expensesCount,
      };
    }

    async function adminDeleteUserData(uid) {
      if (!firebaseEnabled || !db) {
        alert("Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ØªØªØ·Ù„Ø¨ Ø§ØªØµØ§Ù„Ø§Ù‹ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª.");
        return;
      }
      if (!confirm("Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø¨ÙŠØ§Ù†Ø§Øª Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŸ")) {
        return;
      }
      try {
        await set(ref(db, "users/" + uid), null);
        adminUsersCache = null; // clear cache so next load is fresh
        await loadAdminUsers(true);
      } catch (e) {
        console.error(e);
        alert("ØªØ¹Ø°Ø± Ø­Ø°Ù Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….");
      }
    }

    async function adminToggleUserDisabled(uid, currentlyDisabled) {
      if (!firebaseEnabled || !db) {
        alert("Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ØªØªØ·Ù„Ø¨ Ø§ØªØµØ§Ù„Ø§Ù‹ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª.");
        return;
      }
      const newValue = !currentlyDisabled;
      try {
        await set(ref(db, "users/" + uid + "/disabled"), newValue);
        adminUsersCache = null;
        await loadAdminUsers(true);
      } catch (e) {
        console.error(e);
        alert("ØªØ¹Ø°Ø± ØªØºÙŠÙŠØ± Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….");
      }
    }

    async function loadAdminUsers(forceReload = false) {
      if (!firebaseEnabled || !db || !currentUser) {
        adminUsersContainer.innerHTML =
          '<div class="empty-state">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ØªØªØ·Ù„Ø¨ Ø§ØªØµØ§Ù„Ø§Ù‹ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª ÙˆFirebase.</div>';
        return;
      }
      if (currentUser.uid !== ADMIN_UID) {
        adminUsersContainer.innerHTML =
          '<div class="empty-state">Ù„ÙŠØ³Øª Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ø¹Ø±Ø¶ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ….</div>';
        return;
      }

      adminUsersContainer.innerHTML =
        '<div class="empty-state">Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†...</div>';

      try {
        // fetch once and cache; if forced reload (refresh button) or cache empty
        let list;
        if (!adminUsersCache || forceReload) {
          const usersSnap = await get(ref(db, "users"));
          if (!usersSnap.exists()) {
            adminUsersContainer.innerHTML =
              '<div class="empty-state">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø£ÙŠ Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø¨Ø¹Ø¯.</div>';
            adminUsersCache = [];
            updateAdminStats();
            return;
          }
          adminUsersCache = [];
          usersSnap.forEach((userSnap) => {
            adminUsersCache.push({ uid: userSnap.key, data: userSnap.val() || {} });
          });
        }
        list = adminUsersCache;
        updateAdminStats();
        renderAdminUsers(list);
      } catch (e) {
        console.error(e);
        adminUsersContainer.innerHTML =
          '<div class="empty-state">ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†.</div>';
      }
    }

    function updateAdminStats() {
      const total = adminUsersCache ? adminUsersCache.length : 0;
      const disabled = adminUsersCache
        ? adminUsersCache.filter((u) => !!u.data.disabled).length
        : 0;
      const active = total - disabled;
      if (adminStatsEl) {
        adminStatsEl.innerHTML = `
          <span>Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†: ${total}</span>
          <span>Ø§Ù„Ù†Ø´Ø·ÙˆÙ†: ${active}</span>
          <span>Ø§Ù„Ù…Ø¹Ø·Ù‘ÙŽÙ„ÙˆÙ†: ${disabled}</span>
        `;
      }
    }

    function renderAdminUsers(list) {
      const fragment = document.createDocumentFragment();
      const searchTerm = (adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : "");
      let shown = 0;

      list.forEach(({ uid, data }) => {
        const profile = data.profile || {};
        const disabled = !!data.disabled;
        if (searchTerm) {
          const email = (profile.email || "").toLowerCase();
          if (!email.includes(searchTerm) && !uid.toLowerCase().includes(searchTerm)) {
            return; // skip this user
          }
        }

        shown++;
        const stateData = data.state || {};
        const isOwner = uid === ADMIN_UID;
        const stats = computeUserStats(stateData);

        const card = document.createElement("div");
        card.className = "admin-user-card";

        // Header
        const header = document.createElement("div");
        header.className = "admin-user-header";

        const main = document.createElement("div");
        main.className = "admin-user-main";

        const emailEl = document.createElement("div");
        emailEl.className = "admin-user-email";
        emailEl.textContent = profile.email || "(Ø¨Ø¯ÙˆÙ† Ø¨Ø±ÙŠØ¯ Ù…Ø­ÙÙˆØ¸)";
        const uidEl = document.createElement("div");
        uidEl.className = "admin-user-uid";
        uidEl.textContent = "UID: " + uid;

        main.appendChild(emailEl);
        main.appendChild(uidEl);

        const badgesContainer = document.createElement("div");

          const statusBadge = document.createElement("span");
          statusBadge.className =
            "admin-badge " + (disabled ? "admin-badge-disabled" : "admin-badge-active");
          statusBadge.textContent = disabled ? "Ù…Ø¹Ø·Ù‘Ù„" : "Ù†Ø´Ø·";

          badgesContainer.appendChild(statusBadge);

          if (isOwner) {
            const ownerBadge = document.createElement("span");
            ownerBadge.className = "admin-badge admin-badge-admin";
            ownerBadge.textContent = "Ù…Ø§Ù„Ùƒ Ø§Ù„Ù†Ø¸Ø§Ù…";
            badgesContainer.appendChild(ownerBadge);
          }

          header.appendChild(main);
          header.appendChild(badgesContainer);

          // Summary stats
          const statsEl = document.createElement("div");
          statsEl.className = "admin-user-stats";

          function makeStat(labelText, valText) {
            const line = document.createElement("div");
            line.className = "admin-stat-line";
            const l = document.createElement("span");
            l.className = "admin-stat-label";
            l.textContent = labelText;
            const v = document.createElement("span");
            v.className = "admin-stat-value";
            v.textContent = valText;
            line.appendChild(l);
            line.appendChild(v);
            return line;
          }

          statsEl.appendChild(makeStat("Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±ÙˆØ§ØªØ¨:", formatNumber(stats.totalSalary)));
          statsEl.appendChild(makeStat("Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ:", formatNumber(stats.totalExpenses)));
          statsEl.appendChild(makeStat("Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ:", formatNumber(stats.remaining)));
          statsEl.appendChild(makeStat("Ø¹Ø¯Ø¯ Ø§Ù„Ø£Ø´Ù‡Ø±:", stats.monthsCount));
          statsEl.appendChild(makeStat("Ø¹Ø¯Ø¯ Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ:", stats.expensesCount));

          // Actions
          const actions = document.createElement("div");
          actions.className = "admin-user-actions";

          if (!isOwner) {
            const toggleBtn = document.createElement("button");
            toggleBtn.className = "btn-soft";
            toggleBtn.textContent = disabled ? "Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ØªØ¹Ø·ÙŠÙ„" : "ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…";
            toggleBtn.addEventListener("click", () => {
              adminToggleUserDisabled(uid, disabled);
            });
            actions.appendChild(toggleBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn-danger-soft";
            deleteBtn.textContent = "ðŸ—‘ï¸ Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª";
            deleteBtn.addEventListener("click", () => {
              adminDeleteUserData(uid);
            });
            actions.appendChild(deleteBtn);
          } else {
            const infoOwner = document.createElement("div");
            infoOwner.className = "admin-note";
            infoOwner.textContent = "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ø£Ùˆ ØªØ¹Ø·ÙŠÙ„ Ù…Ø§Ù„Ùƒ Ø§Ù„Ù†Ø¸Ø§Ù….";
            actions.appendChild(infoOwner);
          }

          card.appendChild(header);
          card.appendChild(statsEl);

          // Detailed months (+ expenses) view
          const monthsNormalized = normalizeState(stateData).months || [];
          const monthsSorted = monthsNormalized.slice().sort((a, b) => a.year - b.year || a.month - b.month);

          const monthsContainer = document.createElement("div");
          monthsContainer.className = "admin-user-months";

          if (monthsSorted.length === 0) {
            const empty = document.createElement("div");
            empty.className = "admin-note";
            empty.textContent = "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø£Ø´Ù‡Ø± Ù…Ø­ÙÙˆØ¸Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….";
            monthsContainer.appendChild(empty);
          } else {
            monthsSorted.forEach((m) => {
              const mItem = document.createElement("div");
              mItem.className = "admin-month-item";

              const mHeader = document.createElement("div");
              mHeader.className = "admin-month-header";
              const nameSpan = document.createElement("span");
              nameSpan.textContent = `${m.name} ${m.year}`;
              const statsSpan = document.createElement("span");
              const mTotal = (Array.isArray(m.expenses) ? m.expenses.reduce((s, e) => s + (e.amount || 0), 0) : 0);
              const mRemaining = (m.salary || 0) - mTotal;
              statsSpan.textContent = `Ø§Ù„Ø±Ø§ØªØ¨: ${formatNumber(m.salary || 0)} Â· Ø§Ù„Ù…ØµØ§Ø±ÙŠÙ: ${formatNumber(mTotal)} Â· Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ: ${formatNumber(mRemaining)}`;
              mHeader.appendChild(nameSpan);
              mHeader.appendChild(statsSpan);

              const mExpenses = document.createElement("div");
              mExpenses.className = "admin-month-expenses";
              mExpenses.style.display = "none";

              // Toggle expand/collapse
              mHeader.addEventListener("click", () => {
                mExpenses.style.display = mExpenses.style.display === "none" ? "block" : "none";
              });

              // Expense rows
              const expensesArr = Array.isArray(m.expenses) ? m.expenses.slice().sort((a,b)=> (b.id||0)-(a.id||0)) : [];
              if (expensesArr.length === 0) {
                const emptyRow = document.createElement("div");
                emptyRow.className = "empty-state";
                emptyRow.textContent = "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ØµØ§Ø±ÙŠÙ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±.";
                mExpenses.appendChild(emptyRow);
              } else {
                expensesArr.forEach((ex) => {
                  const row = document.createElement("div");
                  row.className = "admin-expense-row";

                  const left = document.createElement("div");
                  left.style.flex = "1";
                  const t = document.createElement("div");
                  t.textContent = ex.title || "Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†";
                  t.style.fontWeight = "600";
                  const meta = document.createElement("div");
                  meta.style.fontSize = "12px";
                  meta.style.color = "var(--subtext-color)";
                  meta.textContent = `${ex.category || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯'} Â· ${ex.date || 'Ø¨Ø¯ÙˆÙ† ØªØ§Ø±ÙŠØ®'}`;
                  if (ex.note) {
                    const note = document.createElement("div");
                    note.style.fontSize = "12px";
                    note.textContent = ex.note;
                    left.appendChild(t);
                    left.appendChild(meta);
                    left.appendChild(note);
                  } else {
                    left.appendChild(t);
                    left.appendChild(meta);
                  }

                  const right = document.createElement("div");
                  right.style.minWidth = "110px";
                  right.style.textAlign = "right";
                  const amountEl = document.createElement("div");
                  amountEl.textContent = formatNumber(ex.amount || 0);
                  amountEl.style.fontWeight = "700";
                  amountEl.style.color = "#2563eb";

                  right.appendChild(amountEl);

                  if (ex.imageDataUrl) {
                    const img = document.createElement("img");
                    img.src = ex.imageDataUrl;
                    img.alt = "ØµÙˆØ±Ø© Ø§Ù„Ù…ØµØ±ÙˆÙ";
                    img.style.height = "40px";
                    img.style.borderRadius = "6px";
                    img.style.marginLeft = "8px";
                    img.addEventListener("click", () => {
                      imageModalView.src = ex.imageDataUrl;
                      modalImage.style.display = "flex";
                    });
                    right.appendChild(img);
                  }

                  row.appendChild(left);
                  row.appendChild(right);
                  mExpenses.appendChild(row);
                });
              }

              mItem.appendChild(mHeader);
              mItem.appendChild(mExpenses);
              monthsContainer.appendChild(mItem);
            });
          }

          card.appendChild(monthsContainer);
          card.appendChild(actions);

          fragment.appendChild(card);
        });

        if (shown === 0) {
          adminUsersContainer.innerHTML =
            '<div class="empty-state">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† Ù…Ø·Ø§Ø¨Ù‚ÙˆÙ† Ù„Ù„Ø¨Ø­Ø«.</div>';
        } else {
          adminUsersContainer.innerHTML = "";
          adminUsersContainer.appendChild(fragment);
        }
    }

    // ØªØ­Ù…ÙŠÙ„ Ø­Ø§Ù„Ø© Ù‚ÙÙ„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ù…Ù† Firebase
    async function loadRegistrationStatus() {
      if (!firebaseEnabled || !db) return;
      try {
        const statusRef = ref(db, "settings/registrationEnabled");
        const snap = await get(statusRef);
        const isEnabled = snap.exists() ? snap.val() : true;
        updateRegistrationUI(isEnabled);
      } catch (err) {
        console.error("Error loading registration status:", err);
        updateRegistrationUI(true);
      }
    }

    // ØªØ­Ø¯ÙŠØ« ÙˆØ§Ø¬Ù‡Ø© Ù‚ÙÙ„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„
    function updateRegistrationUI(isEnabled) {
      if (btnToggleRegistration) {
        btnToggleRegistration.classList.toggle("active", isEnabled);
        btnToggleRegistration.style.background = isEnabled ? "#10b981" : "#ef4444";
        btnToggleRegistration.style.borderColor = isEnabled ? "#059669" : "#dc2626";
      }
    }

    // ØªØ¨Ø¯ÙŠÙ„ Ø­Ø§Ù„Ø© Ø§Ù„ØªØ³Ø¬ÙŠÙ„
    async function toggleRegistration() {
      if (!firebaseEnabled || !db || currentUser?.uid !== ADMIN_UID) {
        return;
      }

      try {
        btnToggleRegistration.disabled = true;
        const statusRef = ref(db, "settings/registrationEnabled");
        const snap = await get(statusRef);
        const currentStatus = snap.exists() ? snap.val() : true;
        const newStatus = !currentStatus;

        await set(statusRef, newStatus);
        updateRegistrationUI(newStatus);
      } catch (err) {
        console.error("Error toggling registration:", err);
      } finally {
        btnToggleRegistration.disabled = false;
      }
    }

    // ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
    async function changePassword() {
      const current = modalCurrentPassword?.value?.trim();
      const newPwd = modalNewPassword?.value?.trim();
      const confirmPwd = modalConfirmPassword?.value?.trim();

      // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø¯Ø®Ù„Ø§Øª
      if (!current) {
        showModalPasswordMessage("Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø§Ù„Ø­Ø§Ù„ÙŠØ©.", "error");
        return;
      }
      if (!newPwd) {
        showModalPasswordMessage("Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.", "error");
        return;
      }
      if (newPwd.length < 6) {
        showModalPasswordMessage("ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.", "error");
        return;
      }
      if (newPwd !== confirmPwd) {
        showModalPasswordMessage("ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙˆØªØ£ÙƒÙŠØ¯Ù‡Ø§ ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©.", "error");
        return;
      }
      if (newPwd === current) {
        showModalPasswordMessage("ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ù…Ø®ØªÙ„ÙØ© Ø¹Ù† Ø§Ù„Ø­Ø§Ù„ÙŠØ©.", "error");
        return;
      }

      try {
        btnModalChangePassword.disabled = true;
        btnModalChangePassword.textContent = "â³ Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ø¯ÙŠØ«...";

        // Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©
        const email = currentUser.email;
        const credential = EmailAuthProvider.credential(email, current);
        await reauthenticateWithCredential(currentUser, credential);

        // ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
        await updatePassword(currentUser, newPwd);

        // Ù…Ø³Ø­ Ø§Ù„Ø­Ù‚ÙˆÙ„
        modalCurrentPassword.value = "";
        modalNewPassword.value = "";
        modalConfirmPassword.value = "";

        showModalPasswordMessage("âœ“ ØªÙ… ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø¨Ù†Ø¬Ø§Ø­.", "success");
        setTimeout(() => {
          closePasswordModal();
        }, 1500);
      } catch (err) {
        console.error("Error changing password:", err);

        if (err.code === "auth/wrong-password") {
          showModalPasswordMessage("ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø§Ù„Ø­Ø§Ù„ÙŠØ© ØºÙŠØ± ØµØ­ÙŠØ­Ø©.", "error");
        } else if (err.code === "auth/weak-password") {
          showModalPasswordMessage("ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ø¶Ø¹ÙŠÙØ© Ø¬Ø¯Ø§Ù‹.", "error");
        } else if (err.code === "auth/requires-recent-login") {
          showModalPasswordMessage("Ø§Ù„Ø±Ø¬Ø§Ø¡ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰ Ø«Ù… Ø­Ø§ÙˆÙ„.", "error");
        } else {
          showModalPasswordMessage("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±: " + (err.message || "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ"), "error");
        }
      } finally {
        btnModalChangePassword.disabled = false;
        btnModalChangePassword.textContent = "âœ“ ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±";
      }
    }

    // Ø¹Ø±Ø¶ Ø±Ø³Ø§Ù„Ø© ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± ÙÙŠ Ø§Ù„Ù…ÙˆØ¯Ø§Ù„
    function showModalPasswordMessage(message, type) {
      if (!modalPasswordMessage) return;
      modalPasswordMessage.textContent = message;
      modalPasswordMessage.className = type === "success" ? "password-success" : "password-error";
    }

    // ÙØªØ­ Ù…ÙˆØ¯Ø§Ù„ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
    function openPasswordModal() {
      if (modalPassword) {
        modalPassword.style.display = "flex";
        modalCurrentPassword.focus();
        modalPasswordMessage.textContent = "";
        modalPasswordMessage.className = "";
      }
    }

    // Ø¥ØºÙ„Ø§Ù‚ Ù…ÙˆØ¯Ø§Ù„ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
    function closePasswordModal() {
      if (modalPassword) {
        modalPassword.style.display = "none";
        modalCurrentPassword.value = "";
        modalNewPassword.value = "";
        modalConfirmPassword.value = "";
        modalPasswordMessage.textContent = "";
        modalPasswordMessage.className = "";
      }
    }

    // Ø²Ø± Ù‚ÙÙ„/ÙØªØ­ Ø§Ù„ØªØ³Ø¬ÙŠÙ„ (ÙÙŠ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙÙ‚Ø·)
    if (btnToggleRegistration) {
      btnToggleRegistration.addEventListener("click", toggleRegistration);
    }

    // Ø²Ø± ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± Ù…Ù† Ø§Ù„Ø±Ø£Ø³
    if (btnChangePasswordQuick) {
      btnChangePasswordQuick.addEventListener("click", openPasswordModal);
    }

    // Ø¥ØºÙ„Ø§Ù‚ Ù…ÙˆØ¯Ø§Ù„ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±
    if (btnClosePassword) {
      btnClosePassword.addEventListener("click", closePasswordModal);
    }

    // Ø²Ø± ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø± ÙÙŠ Ø§Ù„Ù…ÙˆØ¯Ø§Ù„
    if (btnModalChangePassword) {
      btnModalChangePassword.addEventListener("click", changePassword);
    }

    // Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…ÙˆØ¯Ø§Ù„ Ø¹Ù†Ø¯ Ø§Ù„Ù†Ù‚Ø± Ø®Ø§Ø±Ø¬Ù‡
    if (modalPassword) {
      modalPassword.addEventListener("click", (e) => {
        if (e.target === modalPassword) {
          closePasswordModal();
        }
      });
    }

    // ØªØ­Ù…ÙŠÙ„ Ø­Ø§Ù„Ø© Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¹Ù†Ø¯ ÙØªØ­ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
    let registrationLoaded = false;
    if (adminTabBtn) {
      adminTabBtn.addEventListener("click", () => {
        if (!registrationLoaded) {
          loadRegistrationStatus();
          registrationLoaded = true;
        }
      });
    }

    // Ø²Ø± ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… (ÙŠØ¹Ù…Ù„ Ø¹Ù„Ù‰ Ø¥Ø¹Ø§Ø¯Ø© ØªØ­Ù…ÙŠÙ„ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†)
    if (btnAdminRefresh) {
      btnAdminRefresh.addEventListener("click", async () => {
        const prevText = btnAdminRefresh.textContent;
        try {
          btnAdminRefresh.disabled = true;
          btnAdminRefresh.textContent = "ðŸ”„ Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ø¯ÙŠØ«...";
          adminUsersCache = null;
          await loadAdminUsers(true);
          await loadRegistrationStatus();

        } catch (err) {
          console.error(err);
          alert("ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†.");
        } finally {
          btnAdminRefresh.textContent = prevText;
          btnAdminRefresh.disabled = false;
        }
      });
    }

    let _hasRunRefresh = false; // track whether we already animated once

    async function refreshUI(options = {}) {
      // options.noAnimate = true will skip any fade transitions
      const noAnim = options.noAnimate || (_hasRunRefresh && !options.forceAnimate);
      state = normalizeState(state);

      if (!noAnim) {
        // apply fade-out to the main app view so existing data hides smoothly
        if (appView) {
          appView.classList.remove("fade-in");
          appView.classList.add("fade-out");
          // wait for animation to finish (match CSS duration ~280ms)
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      refreshMonthSelect();
      renderSummary();
      renderAdvancedStats();
      renderExpenses();
      renderComparison();
      renderCategoryOptions();
      renderCategoryList();
      renderGoals();
      renderSavingsBuckets();

      if (!noAnim) {
        // reveal updated UI with a subtle fade-in
        if (appView) {
          appView.classList.remove("fade-out");
          appView.classList.add("fade-in");
          // remove the class after animation to keep DOM clean
          setTimeout(() => appView && appView.classList.remove("fade-in"), 350);
        }
      }

      await saveState();
      _hasRunRefresh = true; // subsequent calls default to no animation
    }

    (function init() {
      try {
        const savedTheme = localStorage.getItem(THEME_KEY) || "light";
        applyTheme(savedTheme);

        // loader handling removed: we no longer display during init to avoid
        // flicker/verification messages when the page reloads after network
        // interruptions. appLoader is now only used for fatal diagnostics.
        // const cameFromOffline = !!sessionStorage.getItem('wasOffline');
        // (no display logic)
        if (loginView) loginView.style.display = "none";
        if (appView) appView.style.display = "none";

      // If we have a last signed-in uid and local state, show app immediately (avoid loader flash)
      try {
        const lastUid = localStorage.getItem(LAST_UID_KEY);
        if (lastUid) {
          const raw = localStorage.getItem(STORAGE_KEY_PREFIX + lastUid);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              state = normalizeState(parsed);
              // show app using local data while firebase confirms session
              if (appLoader) appLoader.style.display = "none";
              if (loginView) loginView.style.display = "none";
              if (appView) appView.style.display = "block";
              if (adminTabBtn) adminTabBtn.style.display = "none"; // will update after auth

              // try to show cached profile/email immediately (speeds up UI on refresh)
              try {
                const profileRaw = localStorage.getItem(STORAGE_KEY_PREFIX + lastUid + "_profile");
                if (profileRaw) {
                  const p = JSON.parse(profileRaw);
                  if (userEmailLabel) userEmailLabel.textContent = p.email || "";
                }
                // show admin tab from cache when uid matches ADMIN_UID (will be revalidated by auth handler)
                if (adminTabBtn) {
                  adminTabBtn.style.display = lastUid === ADMIN_UID ? "block" : "none";
                }
              } catch (e) {
                /* ignore cache read errors */
              }
              // render local UI
              refreshUI();
            } catch (e) {
              console.warn("failed to parse local cached state", e);
            }
          }
        }
      } catch (e) {
        console.warn("failed to read last uid", e);
      }

      if (firebaseEnabled && auth) {
        onAuthStateChanged(auth, async (user) => {
         try {
         // ignore repeated null events after initialization unless explicit logout
         if (authInitialized && !user && !userInitiatedLogout) {
           console.warn('Ignored auth-null event (not user logout)');
           return;
         }
         authInitialized = true;
         if (user) {
  currentUser = user;
  userRef = ref(db, "users/" + currentUser.uid + "/state");
  // DO NOT start listener here - will start AFTER initial sync completes
  // (to avoid pulling old Firebase data before we push local changes)

        // remember last uid locally to speed up UI on refresh
        try { localStorage.setItem(LAST_UID_KEY, currentUser.uid); } catch (e) {}

  /* ðŸ”’ Ø§Ù„ØªØ­Ù‚Ù‚ Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø¹Ø·Ù‘Ù„Ø§Ù‹ */
  try {
    const disabledSnap = await get(ref(db, "users/" + currentUser.uid + "/disabled"));
    if (disabledSnap.exists() && disabledSnap.val() === true) {
      alert("ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø­Ø³Ø§Ø¨Ùƒ Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.");
      await signOut(auth);
      return;
    }
  } catch (e) {
    console.warn("Failed to check disabled flag:", e);
  }

  /* ðŸ“Œ ØªØ­Ø¯ÙŠØ« Ø¨Ø±ÙˆÙØ§ÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¯Ø§Ø®Ù„ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª */
  try {
    await set(ref(db, "users/" + currentUser.uid + "/profile"), {
      email: currentUser.email || "",
    });
  } catch (e) {
    console.warn("Failed to update user profile:", e);
  }

  /* ï¿½ Ù†Ù‚Ù„ Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ù…Ù† 'guest' Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ù…ÙˆØ¬ÙˆØ¯Ø© */
  function migrateGuestData() {
    try {
      const guestKey = STORAGE_KEY_PREFIX + "guest";
      const userKey = STORAGE_KEY_PREFIX + currentUser.uid;
      if (guestKey === userKey) return;
      const guestRaw = localStorage.getItem(guestKey);
      if (!guestRaw) return;
      // Ù„Ø§ ØªÙ‚ÙˆÙ… Ø¨Ø§Ù„ÙƒØªØ§Ø¨Ø© ÙÙˆÙ‚ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¥Ø°Ø§ ÙƒØ§Ù† Ù„Ø¯ÙŠÙ‡ Ø¨Ø§Ù„ÙØ¹Ù„ Ø´ÙŠØ¡
      if (!localStorage.getItem(userKey)) {
        const parsed = JSON.parse(guestRaw);
        const norm = normalizeState(parsed);
        localStorage.setItem(userKey, JSON.stringify(norm));
        state = norm;
      }
      // Ù„Ø§ ØªØ­Ø°Ù Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙÙˆØ±Ø§Ù‹Ø› Ù‚Ø¯ ÙŠØ­ØªØ§Ø¬ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„ÙˆØµÙˆÙ„ Ù…Ø¶Ø§Ø¹Ù
    } catch (e) {
      console.warn("Guest migration failed", e);
    }
  }
  migrateGuestData();

  /* ï¿½ðŸ“§ Ø¥Ø¸Ù‡Ø§Ø± Ø¨Ø±ÙŠØ¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… */
  userEmailLabel.textContent = user.email || "";

  /* ðŸ‘‘ Ø¥Ø¸Ù‡Ø§Ø± ØªØ¨ÙˆÙŠØ¨ Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù‡Ùˆ Ø§Ù„Ù…Ø¯ÙŠØ± */
  if (adminTabBtn) {
    if (currentUser.uid === ADMIN_UID) {
      adminTabBtn.style.display = "block";
    } else {
      adminTabBtn.style.display = "none";
      if (tabAdmin) tabAdmin.style.display = "none";
    }
  }

  /* â˜ï¸ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… */
  // ÙÙŠ Ø­Ø§Ù„Ø© ÙˆØ¬ÙˆØ¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø®Ø²Ù†Ø© Ù…Ø­Ù„ÙŠØ§Ù‹ Ø¨Ø§Ø³Ù… Ù…Ø³ØªØ®Ø¯Ù… Ø¢Ø®Ø± Ø£Ùˆ guestØŒ Ø³ØªÙ‚ÙˆÙ… Ø§Ù„Ø¯Ø§Ù„Ø©
  // Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø¨Ø¯Ù…Ø¬Ù‡Ø§ Ù…Ø¹ Ø§Ù„Ù…ÙØªØ§Ø­ Ø§Ù„Ø­Ø§Ù„ÙŠ Ù‚Ø¨Ù„ ØªØ­Ù…ÙŠÙ„ Ø£ÙŠ Ø£Ø´ÙŠØ§Ø¡.
  loadStateLocal();
  state = normalizeState(state);

  // Ø¨Ø¹Ø¯ ØªØ­Ù…ÙŠÙ„ Ù…Ø­Ù„ÙŠØ§Ù‹ØŒ Ø­Ø§ÙˆÙ„ Ø¬Ù„Ø¨/Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø¨Ø¹ÙŠØ¯Ø©
  await loadStateRemoteIfExists();
  state = normalizeState(state);
  
  // Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø´Ù‡Ø± Ø§Ù„Ø­Ø§Ù„ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
  selectCurrentMonth();
  
  // if we brought in guest data or made local changes, ensure remote copy is updated
  if (isOnline) {
    await saveState();
  }
  // listener should also be active after initial sync
  startRemoteListener();

  /* ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù‚Ø³Ù… Ø§Ù„Ù…Ø­Ù…ÙŠ */
  loadPrivateState();

  /* ðŸ”„ Ø¹Ø±Ø¶ ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ */
  if (appLoader) appLoader.style.display = "none";
  loginView.style.display = "none";
  appView.style.display = "block";

  // attach live number formatting to numeric inputs
  attachNumericInputFormatting();

  // add admin-only test runner button (if admin area is present)
  try {
    const adminContainer = document.getElementById('adminUsersContainer');
    // Removed: format test button - no longer needed
  } catch (e) {}

  await refreshUI();

} else {
  /* ðŸšª Ø­Ø§Ù„Ø© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ */
  // Ø¨Ø¹Ø¯ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù†Ø·Ù‚ Ø£Ø¹Ù„Ø§Ù‡ØŒ Ø£ÙŠ auth-null ÙŠØªÙ… ØªØ¬Ø§Ù‡Ù„Ù‡ Ù‚Ø¨Ù„ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„ÙØ±Ø¹
  currentUser = null;
  userInitiatedLogout = false; // reset flag
  if (remoteListenerUnsubscribe) {
    remoteListenerUnsubscribe();
    remoteListenerUnsubscribe = null;
  }
  userRef = null;
  userEmailLabel.textContent = "";
  
  if (adminTabBtn) adminTabBtn.style.display = "none";
  if (tabAdmin) tabAdmin.style.display = "none";

  /* ðŸ”„ Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø­Ø§Ù„Ø© Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ */
  state = {
    months: [],
    selectedMonthId: null,
    categories: [...defaultCategories],
  };

  filterState = {
    search: "",
    category: "all",
    hasImageOnly: false,
  };

  /* Ø¹Ø±Ø¶ Ø´Ø§Ø´Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ */
  if (appLoader) appLoader.style.display = "none";
  appView.style.display = "none";
  currentUser = null;
  userInitiatedLogout = false; // reset flag
  if (remoteListenerUnsubscribe) {
    remoteListenerUnsubscribe();
    remoteListenerUnsubscribe = null;
  }
  userRef = null;
  userEmailLabel.textContent = "";
  
  if (adminTabBtn) adminTabBtn.style.display = "none";
  if (tabAdmin) tabAdmin.style.display = "none";

  /* ðŸ”„ Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø­Ø§Ù„Ø© Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ */
  state = {
    months: [],
    selectedMonthId: null,
    categories: [...defaultCategories],
  };

  filterState = {
    search: "",
    category: "all",
    hasImageOnly: false,
  };

  /* Ø¹Ø±Ø¶ Ø´Ø§Ø´Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ */
  if (appLoader) appLoader.style.display = "none";
  appView.style.display = "none";
  loginView.style.display = "block";
}
  } catch (e) {
    showDiagnostic(e && e.message ? e.message : String(e));
    console.error(e);
  }
});
} else {
  // ÙÙŠ Ø­Ø§Ù„Ø© Ù„Ù… ÙŠØ¹Ù…Ù„ Firebase (ÙˆØ¶Ø¹ Offline)
  currentUser = null;
  userRef = null;
  if (appLoader) appLoader.style.display = "none";
  loginView.style.display = "none";
  appView.style.display = "block";
  // attach live number formatting in offline mode
  attachNumericInputFormatting();
  refreshUI();
}
} catch (e) {
  showDiagnostic(e && e.message ? e.message : String(e));
}
})();
    </script>
