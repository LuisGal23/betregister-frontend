import type { MovementKind, MovementStatus } from '../../confirmations/services/movement.model';
export type TransactionFilter = 'all' | MovementKind | MovementStatus;
