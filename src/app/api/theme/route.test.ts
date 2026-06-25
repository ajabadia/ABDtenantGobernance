import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
});

const { mockGetCache, mockSetCache } = vi.hoisted(() => {
  return {
    mockGetCache: vi.fn<(key: string) => Promise<string | null>>(async () => null),
    mockSetCache: vi.fn(async () => {}),
  };
});

vi.mock('@ajabadia/satellite-sdk/db', () => ({
  connectDB: vi.fn(async () => {}),
  encryptionPlugin: vi.fn(() => (schema: unknown) => schema),
}));

vi.mock('@ajabadia/satellite-sdk/auth-middleware', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
}));

vi.mock('@/services/tenant/tenant-service', () => {
  const mockGetConfig = vi.fn();
  return {
    TenantService: {
      getConfig: mockGetConfig,
    },
    mockGetConfig,
  };
});

// @ts-expect-error - named mock export
import { mockGetConfig } from '@/services/tenant/tenant-service';

describe('Edge CSS Theme Gateway API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 when tenantId is missing', async () => {
    const req = new NextRequest('http://localhost:5002/api/theme');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Missing tenantId');
  });

  it('should return cached CSS when Redis has a hit', async () => {
    mockGetCache.mockResolvedValue(':root { --primary: hsl(0 100% 50%); }');

    const req = new NextRequest('http://localhost:5002/api/theme?tenantId=tenant-cached');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache')).toBe('HIT');
    expect(res.headers.get('Content-Type')).toBe('text/css');
    const cssText = await res.text();
    expect(cssText).toContain('--primary: hsl(0 100% 50%)');
    // Should NOT call MongoDB when cache is hit
    expect(mockGetConfig).not.toHaveBeenCalled();
  });

  it('should return valid CSS and cache headers for a configured tenant', async () => {
    mockGetConfig.mockResolvedValue({
      tenantId: 'tenant-1',
      branding: {
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
        },
        rounded: true,
        radius: '0.5rem',
      },
    });

    const req = new NextRequest('http://localhost:5002/api/theme?tenantId=tenant-1');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/css');
    expect(res.headers.get('Cache-Control')).toContain('stale-while-revalidate=600');

    const cssText = await res.text();
    expect(cssText).toContain('--primary:');
    expect(cssText).toContain('--radius: 0.5rem');
  });

  it('should fall back to safe default CSS if tenant configuration is missing or throws error', async () => {
    mockGetConfig.mockRejectedValue(new Error('Tenant not found'));

    const req = new NextRequest('http://localhost:5002/api/theme?tenantId=tenant-non-existent');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/css');

    const cssText = await res.text();
    // Default fallback color is cyan-500 (#06b6d4 -> HSL 189 94% 43%)
    expect(cssText).toContain('--primary: hsl(189 94% 43%)');
  });

  it('should fall back to safe default CSS on invalid color syntax (prevent CSS injection)', async () => {
    // If branding database gets loaded with an invalid hex code (e.g. attempting to inject styles)
    mockGetConfig.mockResolvedValue({
      tenantId: 'tenant-malicious',
      branding: {
        colors: {
          primary: 'red; background: url(https://attacker.com/leak) !important;',
        },
      },
    });

    const req = new NextRequest('http://localhost:5002/api/theme?tenantId=tenant-malicious');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const cssText = await res.text();
    
    // Malicious value should trigger validation catch and fall back to safe default (189 94% 43%)
    expect(cssText).toContain('--primary: hsl(189 94% 43%)');
    expect(cssText).not.toContain('leak');
  });
});
