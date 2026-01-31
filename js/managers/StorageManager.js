/**
 * StorageManager - localStorage操作の一元管理クラス
 */
class StorageManager {
    constructor() {
        this.KEYS = {
            HISTORY: 'quizMillionaireHistory',
            MISTAKES: 'quizMillionaireMistakes',
            TOTAL_PRIZE: 'quizTotalPrize',
            OWNED_ITEMS: 'quizOwnedItems',
            ACTIVE_THEME: 'quizActiveTheme'
        };
    }

    // --- History Management ---

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.HISTORY)) || [];
        } catch (e) {
            console.error('Error reading history:', e);
            return [];
        }
    }

    saveHistory(history) {
        try {
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }

    addHistoryEntry(entry) {
        const history = this.getHistory();
        history.unshift(entry);
        this.saveHistory(history);
    }

    // --- Mistakes Management ---

    getMistakes() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.MISTAKES)) || [];
        } catch (e) {
            console.error('Error reading mistakes:', e);
            return [];
        }
    }

    saveMistakes(mistakes) {
        try {
            localStorage.setItem(this.KEYS.MISTAKES, JSON.stringify(mistakes));
        } catch (e) {
            console.error('Error saving mistakes:', e);
        }
    }

    addMistake(questionId) {
        const mistakes = this.getMistakes();
        if (!mistakes.includes(questionId)) {
            mistakes.push(questionId);
            this.saveMistakes(mistakes);
        }
    }

    removeMistake(questionId) {
        const mistakes = this.getMistakes();
        const filtered = mistakes.filter(id => id !== questionId);
        this.saveMistakes(filtered);
    }

    // --- Shop Management ---

    getTotalPrize() {
        const value = localStorage.getItem(this.KEYS.TOTAL_PRIZE);
        return value !== null ? parseInt(value) : 1000000000;
    }

    saveTotalPrize(prize) {
        try {
            localStorage.setItem(this.KEYS.TOTAL_PRIZE, prize.toString());
        } catch (e) {
            console.error('Error saving total prize:', e);
        }
    }

    addPrize(amount) {
        const current = this.getTotalPrize();
        this.saveTotalPrize(current + amount);
    }

    deductPrize(amount) {
        const current = this.getTotalPrize();
        if (current >= amount) {
            this.saveTotalPrize(current - amount);
            return true;
        }
        return false;
    }

    getOwnedItems() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.OWNED_ITEMS)) || ['default-theme'];
        } catch (e) {
            console.error('Error reading owned items:', e);
            return ['default-theme'];
        }
    }

    saveOwnedItems(items) {
        try {
            localStorage.setItem(this.KEYS.OWNED_ITEMS, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving owned items:', e);
        }
    }

    addOwnedItem(itemId) {
        const items = this.getOwnedItems();
        if (!items.includes(itemId)) {
            items.push(itemId);
            this.saveOwnedItems(items);
        }
    }

    getActiveTheme() {
        return localStorage.getItem(this.KEYS.ACTIVE_THEME) || 'default-theme';
    }

    saveActiveTheme(themeId) {
        try {
            localStorage.setItem(this.KEYS.ACTIVE_THEME, themeId);
        } catch (e) {
            console.error('Error saving active theme:', e);
        }
    }

    // --- Utility ---

    clearAll() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    }
}
