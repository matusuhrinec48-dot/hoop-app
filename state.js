// State Management

const STORAGE_KEY = 'hoop_clone_state';

const defaultState = {
    gems: 100, // Initial bonus
    requestedUsers: [], // IDs of users we requested
    seenUsers: [], // IDs of users we swiped specificially
};

export function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return defaultState;
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function spendGems(amount) {
    const state = loadState();
    if (state.gems >= amount) {
        state.gems -= amount;
        saveState(state);
        return true;
    }
    return false;
}

export function addGems(amount) {
    const state = loadState();
    state.gems += amount;
    saveState(state);
    return state.gems;
}

export function getGemBalance() {
    return loadState().gems;
}
