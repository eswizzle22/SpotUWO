import { useState, useCallback } from 'react';
import type { User } from '../types';

export function useLocalStorageNumber(key: string, initial = 0): [number, (v: number) => void] {
    const [value, setValue] = useState<number>(() => {
        const stored = localStorage.getItem(key);
        return stored ? parseInt(stored, 10) : initial;
    });

    const set = useCallback((v: number) => {
        localStorage.setItem(key, String(v));
        setValue(v);
    }, [key]);

    return [value, set];
}

export function useLocalStorageJSON<T>(key: string, initial: T): [T, (v: T) => void] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initial;
        } catch {
            return initial;
        }
    });

    const set = useCallback((v: T) => {
        localStorage.setItem(key, JSON.stringify(v));
        setValue(v);
    }, [key]);

    return [value, set];
}

// ─── Auth helpers ───────────────────────────────
const USERS_KEY = 'spot-uwo-users';   // Record<email, User>
const SESSION_KEY = 'spot-uwo-session'; // email string of logged-in user

function loadUsers(): Record<string, User> {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveUsers(users: Record<string, User>) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): string | null {
    return localStorage.getItem(SESSION_KEY);
}

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const email = loadSession();
        if (!email) return null;
        const users = loadUsers();
        return users[email] ?? null;
    });

    /** Create a new account. Returns error string or null on success. */
    const signUp = useCallback((email: string, _password: string, displayName: string): string | null => {
        const users = loadUsers();
        if (users[email]) return 'An account with this email already exists.';
        const user: User = {
            email,
            displayName,
            points: 0,
            totalUpdates: 0,
            createdAt: Date.now(),
            votedReports: [],
        };
        users[email] = user;
        saveUsers(users);
        localStorage.setItem(SESSION_KEY, email);
        setCurrentUser(user);
        return null;
    }, []);

    /** Log in. Returns error string or null on success. */
    const signIn = useCallback((email: string, _password: string): string | null => {
        const users = loadUsers();
        const user = users[email];
        if (!user) return 'No account found with this email.';
        // In a real app you'd check password hash — here we trust localStorage for demo
        localStorage.setItem(SESSION_KEY, email);
        setCurrentUser(user);
        return null;
    }, []);

    const signOut = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        setCurrentUser(null);
    }, []);

    /** Persist any changes to the current user object */
    const updateUser = useCallback((updates: Partial<User>) => {
        setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            const users = loadUsers();
            users[prev.email] = updated;
            saveUsers(users);
            return updated;
        });
    }, []);

    return { currentUser, signUp, signIn, signOut, updateUser };
}