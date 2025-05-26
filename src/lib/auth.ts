// src/lib/auth.ts
import { mockUsers, type User, type UserRole } from './users';

const USER_ROLE_KEY = 'currentUserRole';
const USER_ID_KEY = 'currentUserId';
const USER_NAME_KEY = 'currentUserName';

export function loginUser(userIdInput: string): { success: boolean; message?: string; user?: User } {
  const user = mockUsers.find(u => u.id.toLowerCase() === userIdInput.toLowerCase());
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_ROLE_KEY, user.role);
      localStorage.setItem(USER_ID_KEY, user.id);
      localStorage.setItem(USER_NAME_KEY, user.name);
    }
    return { success: true, user };
  }
  return { success: false, message: 'Invalid User ID.' };
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(USER_ROLE_KEY);
  }
  return false; // Cannot determine on server, assume not authenticated for client-side redirects
}

export function getCurrentUserRole(): UserRole | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
  }
  return null;
}

export function getCurrentUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_ID_KEY);
  }
  return null;
}

export function getCurrentUserName(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(USER_NAME_KEY);
  }
  return null;
}
