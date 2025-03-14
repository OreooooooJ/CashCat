import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '../theme';

describe('Theme Store', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      })
    };
  })();

  // Mock document.documentElement
  const documentElementMock = {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    }
  };

  // Mock matchMedia
  const matchMediaMock = vi.fn();

  beforeEach(() => {
    // Setup Pinia
    setActivePinia(createPinia());
    
    // Setup mocks
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('document', { documentElement: documentElementMock });
    vi.stubGlobal('window', { 
      matchMedia: matchMediaMock
    });
    
    // Reset mocks
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with light mode by default when no preference is stored', () => {
    // Mock matchMedia to return false for dark mode preference
    matchMediaMock.mockReturnValue({ matches: false });
    
    const themeStore = useThemeStore();
    
    // Check initial state
    expect(themeStore.isDarkMode).toBe(false);
    
    // Verify localStorage was checked
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    
    // Verify matchMedia was called with the correct query
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    
    // Verify dark mode class was not added to document
    expect(documentElementMock.classList.add).not.toHaveBeenCalledWith('dark');
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should initialize with dark mode when system prefers dark mode', () => {
    // Mock matchMedia to return true for dark mode preference
    matchMediaMock.mockReturnValue({ matches: true });
    
    const themeStore = useThemeStore();
    
    // Check initial state
    expect(themeStore.isDarkMode).toBe(true);
    
    // Verify localStorage was checked
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    
    // Verify matchMedia was called with the correct query
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    
    // Verify dark mode class was added to document
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should initialize with stored preference from localStorage', () => {
    // Set stored preference to dark mode
    localStorageMock.getItem.mockReturnValueOnce('dark');
    
    const themeStore = useThemeStore();
    
    // Check initial state
    expect(themeStore.isDarkMode).toBe(true);
    
    // Verify localStorage was checked
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    
    // Verify matchMedia was not used as preference was found in localStorage
    expect(matchMediaMock).not.toHaveBeenCalled();
    
    // Verify dark mode class was added to document
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should toggle dark mode correctly', () => {
    // Start with light mode
    matchMediaMock.mockReturnValue({ matches: false });
    
    const themeStore = useThemeStore();
    
    // Initial state should be light mode
    expect(themeStore.isDarkMode).toBe(false);
    
    // Toggle to dark mode
    themeStore.toggleDarkMode();
    
    // Check state after toggle
    expect(themeStore.isDarkMode).toBe(true);
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    
    // Verify dark mode class was added to document
    expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
    
    // Toggle back to light mode
    themeStore.toggleDarkMode();
    
    // Check state after second toggle
    expect(themeStore.isDarkMode).toBe(false);
    
    // Verify localStorage was updated again
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    
    // Verify dark mode class was removed from document
    expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
  });
}); 