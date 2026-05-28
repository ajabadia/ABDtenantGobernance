# Handoff: Linkado Polimórfico de Assets a Espacios (`AssetSpaceLink`)

## Goal
Implementar la lógica y la interfaz de usuario en `ABDtenantGobernance` para asociar recursos (documentos, corpus RAG, etc.) a múltiples espacios de la jerarquía organizativa de forma polimórfica (relación Many-to-Many) sin duplicar datos, garantizando la integridad de datos ante movimientos de la jerarquía y superando la auditoría de certificación industrial.

## Current State
- **Estado**: **100% Certificado (SYS_CERTIFIED)** ✅
- **Auditoría**: El pipeline de 6 fases (`.\scripts\abd-audit.ps1`) ha pasado con éxito (`0 errors` en todas las fases).
  - Fase 1: Structural Audit -> PASSED (Modals de roles extraídos para reducir el tamaño de archivo de `page.tsx`).
  - Fase 2: i18n Coverage -> PASSED (Claves añadidas en ES/EN).
  - Fase 3: a11y Compliance -> PASSED (Corregidos `aria-label` en botones con iconos para el validador AST).
  - Fase 4: Purity & Types -> PASSED.
  - Fase 5: Type Safety (TSC) -> PASSED (Corregido `SCOPE_TYPE_OPTIONS` y removido directive `@ts-expect-error` obsoleto).
  - Fase 6: Code Quality -> PASSED (Resueltos warnings de hooks de React y imports no usados).

## Files in Flight
Ninguno. Todos los archivos han sido modificados, compilados y validados.

## Changed Files
- **[NEW]** [AssetSpaceLink.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/models/AssetSpaceLink.ts) - Modelo de base de datos Mongoose para el linkado de assets.
- **[NEW]** [AssetSpaceLinkRepository.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/lib/repositories/AssetSpaceLinkRepository.ts) - Capa de repositorio para queries optimizadas y propagación jerárquica.
- **[NEW]** [asset-link-service.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/services/tenant/asset-link-service.ts) - Lógica de negocio con transacciones atómicas y chequeo de soberanía.
- **[NEW]** [asset-link-service.test.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/services/tenant/asset-link-service.test.ts) - Cobertura de tests unitarios del servicio de links.
- **[NEW]** [route.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/app/api/admin/spaces/links/route.ts) - Route handler API para CRUD de enlaces.
- **[NEW]** [ManageSpaceAssetsModal.tsx](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/components/admin/spaces/ManageSpaceAssetsModal.tsx) - Modal UI de control y vinculación de assets.
- **[NEW]** [AssignRoleModal.tsx](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/app/[locale]/admin/quiz-roles/AssignRoleModal.tsx) - Subcomponente modal extraído para reducir tamaño de archivo.
- **[NEW]** [BulkAssignModal.tsx](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/app/[locale]/admin/quiz-roles/BulkAssignModal.tsx) - Subcomponente modal extraído para reducir tamaño de archivo.
- **[MODIFY]** [page.tsx](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/app/[locale]/admin/quiz-roles/page.tsx) - Limpieza de importaciones y modularización de la UI de roles de cuestionario.
- **[MODIFY]** [space-service.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/services/tenant/space-service.ts) - Propagación recursiva de cambios de ruta sobre `AssetSpaceLink` al mover espacios.
- **[MODIFY]** [branding.test.ts](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/src/actions/branding.test.ts) - Ajuste en mock-imports de test.
- **[MODIFY]** [es.json](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/messages/es.json) & [en.json](file:///d:/desarrollos/ABDSuite/ABDtenantGobernance/messages/en.json) - Soporte completo multilingüe para las nuevas interfaces y flujos.

## Failed Attempts
- **Parsing A11y**: En un primer intento, el validador AST estático de a11y (`arch-guard.mjs`) fallaba en registrar el `aria-label` dentro de los botones de desenlace. Esto ocurría porque la línea `onClick={() => ...}` contiene un carácter de mayor que (`>`) debido a la arrow function de JS, lo cual confundía al analizador simple haciéndole creer que el tag `<button` había terminado antes de llegar al `aria-label`. Lo solucionamos poniendo el `aria-label` en la mismísima primera línea del tag `<button ...`.
