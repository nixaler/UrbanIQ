// Simple in-memory cache with TTL support
class Cache {
  private cache: Map<string, { value: any; expires: number }>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: any, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalCache = new Cache();

// Local storage cache with better error handling
export const storageCache = {
  set(key: string, value: any, ttl?: number): void {
    try {
      const item = {
        value,
        expires: ttl ? Date.now() + ttl : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set storage cache:', error);
    }
  },

  get(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (parsed.expires && Date.now() > parsed.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Failed to get storage cache:', error);
      return null;
    }
  },

  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to delete storage cache:', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear storage cache:', error);
    }
  }
};

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization helper for expensive computations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Request animation frame helper
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number>;

  constructor() {
    this.marks = new Map();
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();