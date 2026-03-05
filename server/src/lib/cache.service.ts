interface CacheItem<T> {
    value: T;
    timestamp: number;
}

class Cache<T> {
    private cache: Map<string, CacheItem<T>>;
    private maxSize: number;
    private ttl: number;
    private name: string;
    private hits = 0;
    private misses = 0;
    private lastAccessed: Map<string, number> = new Map();

    constructor(name: string, maxSize = 1000, ttlMinutes = 60) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlMinutes * 60 * 1000;
        this.name = name;

        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
                this.lastAccessed.delete(key);
            }
        }
    }

    set(key: string, value: T): void {
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(key);
            this.lastAccessed.delete(key);
        }

        const timestamp = Date.now();
        this.cache.set(key, {
            value,
            timestamp
        });
        this.lastAccessed.set(key, timestamp);
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) {
            this.misses++;
            return null;
        }

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            this.lastAccessed.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        this.lastAccessed.set(key, Date.now());
        return item.value;
    }

    clearKey(key: string): boolean {
        const existed = this.cache.has(key);
        this.cache.delete(key);
        this.lastAccessed.delete(key);
        if (existed) {
            console.log(`Cleared key "${key}" from ${this.name} cache`);
        }
        return existed;
    }

    clearKeysByPattern(pattern: string): number {
        const regex = new RegExp(pattern);
        let clearedCount = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.lastAccessed.delete(key);
                clearedCount++;
            }
        }

        if (clearedCount > 0) {
            console.log(`Cleared ${clearedCount} keys matching pattern "${pattern}" from ${this.name} cache`);
        }
        return clearedCount;
    }

    getKeyInfo(key: string): { exists: boolean; value?: T; age?: number } {
        const item = this.cache.get(key);
        if (!item) return {exists: false};

        const age = Date.now() - item.timestamp;
        return {
            exists: true,
            value: item.value,
            age: Math.floor(age / 1000) // age in seconds
        };
    }

    clear(): number {
        const itemsCleared = this.cache.size;
        this.cache.clear();
        this.lastAccessed.clear();
        this.hits = 0;
        this.misses = 0;
        console.log(`Cleared ${itemsCleared} items from ${this.name} cache`);
        return itemsCleared;
    }

    getAllKeys(): string[] {
        return Array.from(this.cache.keys());
    }

    getMostRecentAccess(): { key: string; timestamp: number } | null {
        if (this.lastAccessed.size === 0) return null;

        let mostRecentKey = '';
        let mostRecentTime = 0;

        for (const [key, timestamp] of this.lastAccessed.entries()) {
            if (timestamp > mostRecentTime) {
                mostRecentTime = timestamp;
                mostRecentKey = key;
            }
        }

        return {
            key: mostRecentKey,
            timestamp: mostRecentTime
        };
    }

    getOldestAccess(): { key: string; timestamp: number } | null {
        if (this.lastAccessed.size === 0) return null;

        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, timestamp] of this.lastAccessed.entries()) {
            if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldestKey = key;
            }
        }

        return {
            key: oldestKey,
            timestamp: oldestTime
        };
    }

    getHitRate(): {
        hits: number;
        misses: number;
        rate: number;
    } {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            rate: total === 0 ? 0 : this.hits / total
        };
    }

    getStats(): {
        name: string;
        size: number;
        maxSize: number;
        ttlMinutes: number;
        usage: number;
    } {
        return {
            name: this.name,
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMinutes: this.ttl / (60 * 1000),
            usage: (this.cache.size / this.maxSize) * 100
        };
    }
}

// Initialize caches

export default Cache;

export const productCache = new Cache<any>('products', 1000, 60); // 1000 products, 60 minutes
export const imageCache = new Cache<string>('images', 500, 1440); // 500 images, 24 hours
export const searchCache = new Cache<any[]>('product-search', 1000, 30); // 1000 entries, 30 minutes TTL
