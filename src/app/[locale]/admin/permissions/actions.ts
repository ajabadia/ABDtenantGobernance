/**
 * @purpose Gestiona acciones relacionadas con el manejo de grupos y políticas.
 * @purpose_en Exports actions related to group and policy management.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:2,sig:1lthu4m
 * @lastUpdated 2026-06-23T20:38:01.426Z
 */

// Re‑export group‑related actions
import {
  fetchGroupsAction,
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
} from './groups-actions';

// Re‑export policy‑related actions
import {
  fetchPoliciesAction,
  createPolicyAction,
} from './policies-actions';

export {
  fetchGroupsAction,
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  fetchPoliciesAction,
  createPolicyAction,
};

