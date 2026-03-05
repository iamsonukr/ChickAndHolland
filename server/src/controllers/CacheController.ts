import {Request, Response} from 'express';
import Cache, {imageCache, productCache, searchCache} from '../lib/cache.service';

export class CacheController {
    // Core logic methods that can be called from anywhere
    static clearAllCaches() {
        const clearedStats = {
            products: productCache.clear(),
            images: imageCache.clear(),
            search: searchCache.clear()
        };

        return {
            success: true,
            message: 'All caches cleared successfully',
            clearedStats
        };
    }

    static clearCacheByName(cacheName: string) {
        const cache = CacheController.getCacheByName(cacheName);
        if (!cache) {
            throw new Error(`Invalid cache name: ${cacheName}`);
        }

        const clearedItems = cache.clear();
        return {
            success: true,
            message: `Cache '${cacheName}' cleared successfully`,
            clearedItems
        };
    }

    static clearCacheKey(cacheName: string, key: string) {
        const cache = CacheController.getCacheByName(cacheName);
        if (!cache) {
            throw new Error(`Invalid cache name: ${cacheName}`);
        }

        const cleared = cache.clearKey(key);
        return {
            success: true,
            message: cleared ? 'Cache key cleared successfully' : 'Key not found in cache',
            cleared
        };
    }

    static clearCachePattern(cacheName: string, pattern: string) {
        const cache = CacheController.getCacheByName(cacheName);
        if (!cache) {
            throw new Error(`Invalid cache name: ${cacheName}`);
        }

        const clearedCount = cache.clearKeysByPattern(pattern);
        return {
            success: true,
            message: `Cleared ${clearedCount} keys matching pattern`,
            clearedCount
        };
    }

    static getCacheKeyInfo(cacheName: string, key: string) {
        const cache = CacheController.getCacheByName(cacheName);
        if (!cache) {
            throw new Error(`Invalid cache name: ${cacheName}`);
        }

        const info = cache.getKeyInfo(key);
        return {
            success: true,
            info
        };
    }

    static getAllCacheStats() {
        const detailedStats = {
            products: {
                ...productCache.getStats(),
                keys: productCache.getAllKeys(),
                mostRecentAccess: productCache.getMostRecentAccess(),
                oldestAccess: productCache.getOldestAccess(),
                hitRate: productCache.getHitRate()
            },
            images: {
                ...imageCache.getStats(),
                keys: imageCache.getAllKeys(),
                mostRecentAccess: imageCache.getMostRecentAccess(),
                oldestAccess: imageCache.getOldestAccess(),
                hitRate: imageCache.getHitRate()
            },
            search: {
                ...searchCache.getStats(),
                keys: searchCache.getAllKeys(),
                mostRecentAccess: searchCache.getMostRecentAccess(),
                oldestAccess: searchCache.getOldestAccess(),
                hitRate: searchCache.getHitRate()
            }
        };

        return {
            success: true,
            stats: detailedStats
        };
    }

    private static getCacheByName(name: string): Cache<any> | null {
        switch (name.toLowerCase()) {
            case 'products':
                return productCache;
            case 'images':
                return imageCache;
            case 'product-search':
            case 'search':
                return searchCache;
            default:
                return null;
        }
    }

    // Route handlers that use the core logic
    static handleClearAll(req: Request, res: Response) {
        try {
            const result = CacheController.clearAllCaches();
            res.json(result);
        } catch (error) {
            console.error('Error clearing caches:', error);
            res.status(500).json({
                success: false,
                message: 'Error clearing caches',
            });
        }
    }

    static handleClearByName(req: Request, res: Response) {
        try {
            const { cacheName } = req.body;
            const result = CacheController.clearCacheByName(cacheName);
            res.json(result);
        } catch (error) {
            console.error('Error clearing cache:', error);
            res.status(error instanceof Error && error.message.includes('Invalid cache name') ? 400 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error clearing cache'
            });
        }
    }

    static handleClearKey(req: Request, res: Response) {
        try {
            const { cacheName, key } = req.body;
            const result = CacheController.clearCacheKey(cacheName, key);
            res.json(result);
        } catch (error) {
            console.error('Error clearing cache key:', error);
            res.status(error instanceof Error && error.message.includes('Invalid cache name') ? 400 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error clearing cache key'
            });
        }
    }

    static handleClearPattern(req: Request, res: Response) {
        try {
            const { cacheName, pattern } = req.body;
            const result = CacheController.clearCachePattern(cacheName, pattern);
            res.json(result);
        } catch (error) {
            console.error('Error clearing cache pattern:', error);
            res.status(error instanceof Error && error.message.includes('Invalid cache name') ? 400 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error clearing cache pattern'
            });
        }
    }

    static handleGetKeyInfo(req: Request, res: Response) {
        try {
            const { cacheName, key } = req.query;
            const result = CacheController.getCacheKeyInfo(cacheName as string, key as string);
            res.json(result);
        } catch (error) {
            console.error('Error getting cache key info:', error);
            res.status(error instanceof Error && error.message.includes('Invalid cache name') ? 400 : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error getting cache key info'
            });
        }
    }

    static handleGetStats(req: Request, res: Response) {
        try {
            const result = CacheController.getAllCacheStats();
            res.json(result);
        } catch (error) {
            console.error('Error getting cache stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting cache stats',
            });
        }
    }
}