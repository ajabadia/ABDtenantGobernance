/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// ─── Mocks (hoisted) ─────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const fallbacks: Record<string, string> = {
      title: 'Marca Blanca',
      subtitle: 'Personaliza la identidad visual',
      roleLiteralsTitle: 'Role Literals (Contextual Roles)',
      roleLiteralsDesc: 'Configure how contextual roles are displayed in your tenant.',
      roundedBorders: 'Bordes redondeados',
      roundedBordersDesc: 'Activar bordes redondeados',
      borderRadius: 'Radio de borde',
      primaryColor: 'Color Primario',
      secondaryColor: 'Color Secundario',
      accentColor: 'Color de Acento',
      logoLabel: 'Logotipo',
      faviconLabel: 'Favicon',
      clickToChange: 'Click para cambiar',
      uploadLogo: 'Subir Logo',
      uploadFavicon: 'Subir Favicon',
      abdPortal: 'ABD Portal',
      licenseControl: 'Control de Licencia',
      premiumSubscription: 'Suscripción Premium',
      versionShort: 'v1.0',
      wcagCompliance: 'Cumplimiento WCAG',
      wcagDesc: 'Accesibilidad garantizada',
    };
    return fallbacks[key] ?? key;
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
  useParams: vi.fn(() => ({ locale: 'es' })),
}));

vi.mock('@ajabadia/styles', () => ({
  generateTenantCss: vi.fn(() => '/* mock CSS */'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/actions/branding', () => ({
  updateTenantBrandingAction: vi.fn(async (_prev: unknown, _formData: FormData) => ({
    success: true,
    message: '¡Marca blanca propagada con éxito!',
  })),
}));

// ─── Helper constants ───────────────────────────────────────────────────────

const DEFAULT_ROLE_LITERALS = {
  CREATOR: { es: 'Creador', en: 'Creator' },
  RECIPIENT: { es: 'Destinatario', en: 'Recipient' },
  AUDITOR: { es: 'Auditor', en: 'Auditor' },
};

const CUSTOM_ROLE_LITERALS = {
  CREATOR: { es: 'Profesor', en: 'Teacher' },
  RECIPIENT: { es: 'Alumno', en: 'Student' },
  AUDITOR: { es: 'Auditor', en: 'Auditor' },
};

// ─── Import after mocks ─────────────────────────────────────────────────────

import { TenantBrandingForm } from './TenantBrandingForm';

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TenantBrandingForm — role literals fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all 6 role literal input fields with default values', () => {
    render(<TenantBrandingForm tenantId="test-tenant" />);

    // 3 role groups × 2 locale inputs = 6 inputs
    const inputs = screen.getAllByPlaceholderText(/Creador|Creator|Destinatario|Recipient|Auditor/);
    expect(inputs).toHaveLength(6);

    // Verify default values are rendered
    const creatorEsInput = screen.getByDisplayValue('Creador');
    expect(creatorEsInput).toBeInTheDocument();

    const creatorEnInput = screen.getByDisplayValue('Creator');
    expect(creatorEnInput).toBeInTheDocument();

    const recipientEsInput = screen.getByDisplayValue('Destinatario');
    expect(recipientEsInput).toBeInTheDocument();

    const recipientEnInput = screen.getByDisplayValue('Recipient');
    expect(recipientEnInput).toBeInTheDocument();

    const auditorEsInputs = screen.getAllByDisplayValue('Auditor');
    expect(auditorEsInputs).toHaveLength(2);
  });

  it('should render role literals with custom initial values', () => {
    render(
      <TenantBrandingForm
        tenantId="test-tenant"
        initialRoleCustomization={{ roleLiterals: CUSTOM_ROLE_LITERALS }}
      />
    );

    expect(screen.getByDisplayValue('Profesor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Teacher')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alumno')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Student')).toBeInTheDocument();
  });

  it('should update displayed value when user types in a role literal field', async () => {
    render(<TenantBrandingForm tenantId="test-tenant" />);

    const creatorEsInput = screen.getByDisplayValue('Creador');
    fireEvent.change(creatorEsInput, { target: { value: 'Docente' } });

    expect(creatorEsInput).toHaveValue('Docente');
  });

  it('should render fieldset with legend containing "Role Literals"', () => {
    render(<TenantBrandingForm tenantId="test-tenant" />);

    const fieldset = screen.getByRole('group', { name: /role literals/i });
    expect(fieldset).toBeInTheDocument();
  });

  it('should render role labels CREATOR, RECIPIENT, AUDITOR', () => {
    render(<TenantBrandingForm tenantId="test-tenant" />);

    expect(screen.getByText('CREATOR')).toBeInTheDocument();
    expect(screen.getByText('RECIPIENT')).toBeInTheDocument();
    expect(screen.getByText('AUDITOR')).toBeInTheDocument();
  });

  it('should render ES and EN locale labels for each role', () => {
    render(<TenantBrandingForm tenantId="test-tenant" />);

    const esLabels = screen.getAllByText('ES');
    expect(esLabels).toHaveLength(3);

    const enLabels = screen.getAllByText('EN');
    expect(enLabels).toHaveLength(3);
  });

  it('should include role literals in form submission FormData', async () => {
    const { updateTenantBrandingAction } = await import('@/actions/branding');

    render(<TenantBrandingForm tenantId="test-tenant" />);

    // Change a few values
    const creatorEsInput = screen.getByDisplayValue('Creador');
    fireEvent.change(creatorEsInput, { target: { value: 'Docente' } });

    const recipientEnInput = screen.getByDisplayValue('Recipient');
    fireEvent.change(recipientEnInput, { target: { value: 'Operator' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /propagar marca blanca/i });
    fireEvent.click(submitButton);

    // Wait for async submission
    const mockedAction = vi.mocked(updateTenantBrandingAction);
    expect(mockedAction).toHaveBeenCalledTimes(1);

    const _formData = mockedAction.mock.calls[0][1] as FormData;

    expect(_formData.get('roleLiteral_CREATOR_es')).toBe('Docente');
    expect(_formData.get('roleLiteral_CREATOR_en')).toBe('Creator');
    expect(_formData.get('roleLiteral_RECIPIENT_es')).toBe('Destinatario');
    expect(_formData.get('roleLiteral_RECIPIENT_en')).toBe('Operator');
    expect(_formData.get('roleLiteral_AUDITOR_es')).toBe('Auditor');
    expect(_formData.get('roleLiteral_AUDITOR_en')).toBe('Auditor');
  });
});
