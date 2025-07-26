import { Request, Response, NextFunction } from 'express';

// For sensitive or user-specific data
export const noCache = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
};

// For private user data (dashboard, profile)
export const privateCache = (maxAge = 300) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.setHeader(
            'Cache-Control',
            `private, max-age=${maxAge}, must-revalidate`
        );
        next();
    };
};

// For public APIs (products, blog posts)
export const publicCache = (maxAge = 60, stale = 30) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.setHeader(
            'Cache-Control',
            `public, max-age=${maxAge}, stale-while-revalidate=${stale}`
        );
        next();
    };
};

// For CDN caching (e.g., Vercel, Cloudflare)
export const cdnCache = (sMaxAge = 300, maxAge = 0) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.setHeader(
            'Cache-Control',
            `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=60`
        );
        next();
    };
};
