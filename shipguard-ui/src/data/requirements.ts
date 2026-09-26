import type { Requirement } from '../types';

/**
 * Release requirements extracted from release-requirements.pdf.
 * Source: FoodNest v2.0 — Release Requirements (ShipGuard AI demonstration).
 */
export const RELEASE_REQUIREMENTS: Requirement[] = [
  {
    id: 'REQ-01',
    description: 'All automated tests must pass.',
    priority: 'Critical',
    status: 'PENDING',
  },
  {
    id: 'REQ-02',
    description:
      'The application must validate required payment configuration before payment processing.',
    priority: 'Critical',
    status: 'PENDING',
  },
  {
    id: 'REQ-03',
    description:
      'The documented Node.js version must match the deployment environment.',
    priority: 'High',
    status: 'PENDING',
  },
  {
    id: 'REQ-04',
    description: 'API documentation must match the implemented endpoint paths.',
    priority: 'High',
    status: 'PENDING',
  },
  {
    id: 'REQ-05',
    description:
      'Production database migration and rollback steps must be documented.',
    priority: 'Medium',
    status: 'PENDING',
  },
  {
    id: 'REQ-06',
    description:
      'The release report must identify blockers separately from warnings.',
    priority: 'High',
    status: 'PENDING',
  },
];
