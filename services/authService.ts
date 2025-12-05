import { UserProfile } from "../types";

const STORAGE_KEY = 'quizzy_netrunner_identity';
const TAKEN_NAMES_KEY = 'quizzy_taken_ids';

// Cyberpunk-themed word list for recovery keys
const WORD_LIST = [
  'neon', 'flux', 'core', 'grid', 'node', 'link', 'byte', 'data', 'mech', 'cyber',
  'pulse', 'wave', 'zero', 'void', 'sync', 'warp', 'tech', 'chip', 'code', 'hack',
  'acid', 'base', 'root', 'shell', 'dark', 'light', 'nano', 'bio', 'mod', 'gear',
  'scan', 'ping', 'host', 'port', 'gate', 'lock', 'key', 'file', 'load', 'save'
];

// Reserved names that cannot be used
const RESERVED_NAMES = ['admin', 'root', 'system', 'null', 'undefined', 'guest', 'api', 'bot', 'ai'];

const getTakenNames = (): Set<string> => {
    try {
        const stored = localStorage.getItem(TAKEN_NAMES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set(RESERVED_NAMES);
    } catch {
        return new Set(RESERVED_NAMES);
    }
};

const saveTakenNames = (names: Set<string>) => {
    localStorage.setItem(TAKEN_NAMES_KEY, JSON.stringify(Array.from(names)));
};

const generateId = (): string => {
  const randomNum = Math.floor(Math.random() * 90000) + 10000;
  return `user_${randomNum}`;
};

const generateRecoveryKey = (): string => {
  const words: string[] = [];
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    words.push(WORD_LIST[randomIndex]);
  }
  return words.join('-');
};

export const initializeUser = (): UserProfile => {
  const takenNames = getTakenNames();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProfile;
      // Schema migration: ensure new fields exist for legacy users
      if (typeof parsed.totalScore === 'undefined') {
          parsed.totalScore = 0;
          parsed.quizzesCompleted = 0;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      
      // Ensure current user is in taken list (self-healing)
      if (!takenNames.has(parsed.id)) {
          takenNames.add(parsed.id);
          saveTakenNames(takenNames);
      }
      
      return parsed;
    }
  } catch (e) {
    console.warn("Local storage access failed, generating temp user");
  }

  let newId = generateId();
  // Simple collision avoidance
  while (takenNames.has(newId)) {
      newId = generateId();
  }

  const newUser: UserProfile = {
    id: newId,
    recoveryKey: generateRecoveryKey(),
    createdAt: Date.now(),
    totalScore: 0,
    quizzesCompleted: 0
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    takenNames.add(newUser.id);
    saveTakenNames(takenNames);
  } catch (e) {
    console.warn("Could not persist user to local storage");
  }

  return newUser;
};

export const updateUsername = (newUsername: string): { success: boolean; error?: string; user?: UserProfile } => {
    const cleanName = newUsername.trim();
    
    // 1. Validation Regex: Alphanumeric, underscores, hyphens. 3-16 chars.
    const nameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
    if (!nameRegex.test(cleanName)) {
        return { success: false, error: "Invalid format. Use 3-16 chars (A-Z, 0-9, -, _)." };
    }

    // 2. Retrieve current user
    let currentUser: UserProfile;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) throw new Error("No session");
        currentUser = JSON.parse(stored);
    } catch {
        return { success: false, error: "Session not found." };
    }

    // 3. Check if no change
    if (cleanName === currentUser.id) {
        return { success: true, user: currentUser };
    }

    // 4. Check Availability
    const takenNames = getTakenNames();
    if (takenNames.has(cleanName)) {
        return { success: false, error: `ID '${cleanName}' is unavailable.` };
    }

    // 5. Update
    const oldId = currentUser.id;
    currentUser.id = cleanName;

    try {
        // Save User
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
        
        // Update Registry
        takenNames.delete(oldId); // Free up old name
        takenNames.add(cleanName); // Reserve new name
        saveTakenNames(takenNames);

        return { success: true, user: currentUser };
    } catch (e) {
        return { success: false, error: "Write error." };
    }
};

export const recoverUser = (inputKey: string): UserProfile | null => {
  const cleanKey = inputKey.trim().toLowerCase();
  
  if (cleanKey.split('-').length !== 4) return null;

  // Simulate ID recovery based on hash of key (mock)
  let hash = 0;
  for (let i = 0; i < cleanKey.length; i++) {
    hash = ((hash << 5) - hash) + cleanKey.charCodeAt(i);
    hash |= 0;
  }
  const recoveredId = `user_${Math.abs(hash % 90000) + 10000}`;

  // Note: In a real app, we would fetch the score from backend.
  // Here we reset score because we can't recover it from just a key hash client-side.
  const recoveredUser: UserProfile = {
    id: recoveredId,
    recoveryKey: cleanKey,
    createdAt: Date.now(),
    totalScore: 0, 
    quizzesCompleted: 0
  };
  
  // Register recovered ID in taken list
  const taken = getTakenNames();
  if (!taken.has(recoveredId)) {
      taken.add(recoveredId);
      saveTakenNames(taken);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveredUser));
  return recoveredUser;
};

export const updateUserScore = (additionalScore: number): UserProfile | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const user = JSON.parse(stored) as UserProfile;
            user.totalScore = (user.totalScore || 0) + additionalScore;
            user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            return user;
        }
    } catch (e) {
        console.error("Failed to update user score", e);
    }
    return null;
};

export const logoutUser = () => {
    localStorage.removeItem(STORAGE_KEY);
};