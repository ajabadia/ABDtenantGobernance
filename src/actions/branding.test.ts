import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://test:27017/test';
});

// ─── Mocks ───────────────────────────────────────────────────────────────────
// Note: vi.mock calls are hoisted. Mock variables are created INSIDE the factory
// and exported as named exports so they can be imported by tests below.

vi.mock('@ajabadia/satellite-sdk/auth-middleware', () => ({
  ensureIndustrialAccess: vi.fn(async () => ({
    id: 'admin-user-id',
    tenantId: 'tenant-test-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  })),
}));

vi.mock('@/services/tenant/tenant-service', () => {
  const mockGetConfig = vi.fn(async () => ({
    tenantId: 'tenant-test-1',
    branding: {
      colors: { primary: '#0f172a', secondary: '#1e293b', accent: '#3b82f6' },
      autoDarkMode: true,
      rounded: true,
      radius: '0.75rem',
    },
  }));
  const mockUpdateConfig = vi.fn(async () => ({}));

  return {
    TenantService: {
      getConfig: mockGetConfig,
      updateConfig: mockUpdateConfig,
    },
    mockGetConfig,
    mockUpdateConfig,
  };
});

vi.mock('@/lib/cloudinary', () => ({
  uploadBrandingAsset: vi.fn(async () => ({ secureUrl: 'https://example.com/img.png', publicId: 'pub-123' })),
  deleteCloudinaryAsset: vi.fn(async () => {}),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { updateTenantBrandingAction } from './branding';
// @ts-expect-error - named mock exports, not in real module
import { mockGetConfig, mockUpdateConfig } from '@/services/tenant/tenant-service';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';;

describe('updateTenantBrandingAction — roleCustomization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset default mock behavior for each test
    mockGetConfig.mockResolvedValue({
      tenantId: 'tenant-test-1',
      branding: {
        colors: { primary: '#0f172a', secondary: '#1e293b', accent: '#3b82f6' },
        autoDarkMode: true,
        rounded: true,
        radius: '0.75rem',
      },
    });
    mockUpdateConfig.mockResolvedValue({});
  });

  // ─── FormData extraction of role literals ──────────────────────────────────

  it('should extract all 6 roleLiteral fields from FormData and pass to updateConfig', async () => {
    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#ff0000');
    formData.append('rounded', 'true');
    formData.append('radius', '0.5rem');

    formData.append('roleLiteral_CREATOR_es', 'Profesor');
    formData.append('roleLiteral_CREATOR_en', 'Teacher');
    formData.append('roleLiteral_RECIPIENT_es', 'Alumno');
    formData.append('roleLiteral_RECIPIENT_en', 'Student');
    formData.append('roleLiteral_AUDITOR_es', 'Auditor');
    formData.append('roleLiteral_AUDITOR_en', 'Auditor');

    const result = await updateTenantBrandingAction(null, formData);

    expect(result.success).toBe(true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      'tenant-test-1',
      expect.objectContaining({
        roleCustomization: {
          roleLiterals: {
            CREATOR: { es: 'Profesor', en: 'Teacher' },
            RECIPIENT: { es: 'Alumno', en: 'Student' },
            AUDITOR: { es: 'Auditor', en: 'Auditor' },
          },
        },
      }),
      'admin-user-id',
    );
  });

  it('should apply default values when roleLiteral FormData fields are missing', async () => {
    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#ff0000');
    formData.append('rounded', 'true');
    formData.append('radius', '0.5rem');
    // No roleLiteral fields appended

    const result = await updateTenantBrandingAction(null, formData);

    expect(result.success).toBe(true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      'tenant-test-1',
      expect.objectContaining({
        roleCustomization: {
          roleLiterals: {
            CREATOR: { es: 'Creador', en: 'Creator' },
            RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
            AUDITOR: { es: 'Auditor', en: 'Auditor' },
          },
        },
      }),
      'admin-user-id',
    );
  });

  it('should handle partial roleLiteral fields (some missing, some present)', async () => {
    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#ff0000');
    formData.append('rounded', 'true');
    formData.append('radius', '0.5rem');

    // Only set CREATOR.es and RECIPIENT.en — others fall back to defaults
    formData.append('roleLiteral_CREATOR_es', 'Docente');
    formData.append('roleLiteral_RECIPIENT_en', 'Operator');

    const result = await updateTenantBrandingAction(null, formData);

    expect(result.success).toBe(true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      'tenant-test-1',
      expect.objectContaining({
        roleCustomization: {
          roleLiterals: {
            CREATOR: { es: 'Docente', en: 'Creator' },
            RECIPIENT: { es: 'Destinatario', en: 'Operator' },
            AUDITOR: { es: 'Auditor', en: 'Auditor' },
          },
        },
      }),
      'admin-user-id',
    );
  });

  // ─── Integration with existing branding data ───────────────────────────────

  it('should preserve existing branding data alongside roleCustomization', async () => {
    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#0f172a');
    formData.append('secondary', '#1e293b');
    formData.append('accent', '#3b82f6');
    formData.append('rounded', 'true');
    formData.append('radius', '0.75rem');

    formData.append('roleLiteral_CREATOR_es', 'Profesor');
    formData.append('roleLiteral_CREATOR_en', 'Teacher');
    formData.append('roleLiteral_RECIPIENT_es', 'Alumno');
    formData.append('roleLiteral_RECIPIENT_en', 'Student');
    formData.append('roleLiteral_AUDITOR_es', 'Auditor');
    formData.append('roleLiteral_AUDITOR_en', 'Auditor');

    const result = await updateTenantBrandingAction(null, formData);

    expect(result.success).toBe(true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      'tenant-test-1',
      expect.objectContaining({
        branding: expect.objectContaining({
          colors: expect.objectContaining({
            primary: '#0f172a',
            secondary: '#1e293b',
          }),
        }),
        roleCustomization: {
          roleLiterals: {
            CREATOR: { es: 'Profesor', en: 'Teacher' },
            RECIPIENT: { es: 'Alumno', en: 'Student' },
            AUDITOR: { es: 'Auditor', en: 'Auditor' },
          },
        },
      }),
      'admin-user-id',
    );
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  it('should return error response when updateConfig throws', async () => {
    mockUpdateConfig.mockRejectedValueOnce(new Error('Database connection failed'));

    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#ff0000');
    formData.append('rounded', 'true');
    formData.append('radius', '0.5rem');
    formData.append('roleLiteral_CREATOR_es', 'Profesor');
    formData.append('roleLiteral_CREATOR_en', 'Teacher');
    formData.append('roleLiteral_RECIPIENT_es', 'Alumno');
    formData.append('roleLiteral_RECIPIENT_en', 'Student');
    formData.append('roleLiteral_AUDITOR_es', 'Auditor');
    formData.append('roleLiteral_AUDITOR_en', 'Auditor');

    const result = await updateTenantBrandingAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Database connection failed');
  });

  it('should call ensureIndustrialAccess with ADMIN role', async () => {
    const formData = new FormData();
    formData.append('tenantId', 'tenant-test-1');
    formData.append('primary', '#ff0000');
    formData.append('rounded', 'true');
    formData.append('radius', '0.5rem');
    formData.append('roleLiteral_CREATOR_es', 'Profesor');
    formData.append('roleLiteral_CREATOR_en', 'Teacher');
    formData.append('roleLiteral_RECIPIENT_es', 'Alumno');
    formData.append('roleLiteral_RECIPIENT_en', 'Student');
    formData.append('roleLiteral_AUDITOR_es', 'Auditor');
    formData.append('roleLiteral_AUDITOR_en', 'Auditor');

    await updateTenantBrandingAction(null, formData);

    expect(ensureIndustrialAccess).toHaveBeenCalledWith('ADMIN');
  });
});
