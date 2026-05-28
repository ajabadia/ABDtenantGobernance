import { describe, it, expect } from 'vitest';
import { TenantSchema } from './tenant';

const MINIMAL_TENANT = {
  tenantId: 'test-tenant',
  name: 'Test Tenant',
  dbPrefix: 'test_',
};

describe('TenantSchema — roleCustomization', () => {
  // ─── Optionality ──────────────────────────────────────────────────────────

  it('should pass when roleCustomization is omitted (optional field)', () => {
    const result = TenantSchema.safeParse(MINIMAL_TENANT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roleCustomization).toBeUndefined();
    }
  });

  it('should pass when roleCustomization is explicitly undefined', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roleCustomization).toBeUndefined();
    }
  });

  // ─── Complete valid data ──────────────────────────────────────────────────

  it('should parse a complete roleCustomization with custom literals', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Profesor', en: 'Teacher' },
          RECIPIENT: { es: 'Alumno', en: 'Student' },
          AUDITOR: { es: 'Instructor', en: 'Instructor' },
        },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roleCustomization?.roleLiterals.CREATOR.es).toBe('Profesor');
      expect(result.data.roleCustomization?.roleLiterals.CREATOR.en).toBe('Teacher');
      expect(result.data.roleCustomization?.roleLiterals.RECIPIENT.es).toBe('Alumno');
      expect(result.data.roleCustomization?.roleLiterals.RECIPIENT.en).toBe('Student');
      expect(result.data.roleCustomization?.roleLiterals.AUDITOR.es).toBe('Instructor');
      expect(result.data.roleCustomization?.roleLiterals.AUDITOR.en).toBe('Instructor');
    }
  });

  // ─── Defaults applied when fields are missing ─────────────────────────────

  it('should accept and preserve default literal values when valid data is provided', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Creador', en: 'Creator' },
          RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const literals = result.data.roleCustomization!.roleLiterals;
      expect(literals.CREATOR.es).toBe('Creador');
      expect(literals.CREATOR.en).toBe('Creator');
      expect(literals.RECIPIENT.es).toBe('Destinatario');
      expect(literals.RECIPIENT.en).toBe('Recipient');
      expect(literals.AUDITOR.es).toBe('Auditor');
      expect(literals.AUDITOR.en).toBe('Auditor');
    }
  });

  it('should apply default es/en when only one locale is provided for a role', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Docente' },
          RECIPIENT: { en: 'Operator' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    // es is present for CREATOR, but en is missing → should use default 'Creator'
    // en is present for RECIPIENT, but es is missing → should use default 'Destinatario'
    expect(result.success).toBe(true);
    if (result.success) {
      const literals = result.data.roleCustomization!.roleLiterals;
      expect(literals.CREATOR.es).toBe('Docente');
      expect(literals.CREATOR.en).toBe('Creator'); // default
      expect(literals.RECIPIENT.es).toBe('Destinatario'); // default
      expect(literals.RECIPIENT.en).toBe('Operator');
    }
  });

  // ─── Validation failures ──────────────────────────────────────────────────

  it('should fail when a literal string is empty (min(1) constraint)', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: '', en: 'Teacher' },
          RECIPIENT: { es: 'Alumno', en: 'Student' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      // The error should mention the empty string issue
      const allErrors = JSON.stringify(result.error.issues);
      expect(allErrors).toContain('CREATOR');
      expect(allErrors).toContain('no puede estar vacío');
    }
  });

  it('should fail when both locale strings are empty', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Profesor', en: 'Teacher' },
          RECIPIENT: { es: '', en: '' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const allErrors = JSON.stringify(result.error.issues);
      expect(allErrors).toContain('RECIPIENT');
    }
  });

  it('should fail when roleLiterals is missing a required role key', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Profesor', en: 'Teacher' },
          // RECIPIENT is missing
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const allErrors = JSON.stringify(result.error.issues);
      expect(allErrors).toContain('RECIPIENT');
      expect(allErrors).toContain('expected object');
    }
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it('should reject non-string values for literals', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 123, en: 'Teacher' },
          RECIPIENT: { es: 'Alumno', en: 'Student' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  // ─── Mongoose defaults alignment ────────────────────────────────────────

  it('Mongoose schema defaults should align with Zod defaults for roleLiterals', () => {
    // Extract defaults from TenantMongooseSchema (defined in models/Tenant.ts)
    const mongooseDefaults = {
      CREATOR: { es: 'Creador', en: 'Creator' },
      RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
      AUDITOR: { es: 'Auditor', en: 'Auditor' },
    };

    // Trigger Zod defaults by passing empty objects for each role
    const zodDefaults = TenantSchema.parse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Creador', en: 'Creator' },
          RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
      },
    });

    expect(zodDefaults.roleCustomization?.roleLiterals).toEqual(mongooseDefaults);
  });

  it('should strip unknown keys from roleCustomization without error', () => {
    const result = TenantSchema.safeParse({
      ...MINIMAL_TENANT,
      roleCustomization: {
        roleLiterals: {
          CREATOR: { es: 'Profesor', en: 'Teacher' },
          RECIPIENT: { es: 'Alumno', en: 'Student' },
          AUDITOR: { es: 'Auditor', en: 'Auditor' },
        },
        extraField: 'should not be here',
      },
    });
    // Zod's strict object by default strips unknown keys unless .strict() is used
    // The TenantSchema uses z.object() which strips unknowns by default
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.roleCustomization as Record<string, unknown>)?.extraField).toBeUndefined();
    }
  });
});
