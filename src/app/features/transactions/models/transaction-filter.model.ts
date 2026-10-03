import type { MovementKind, MovementStatus } from '../../confirmations/models/movement.model';
export type TransactionFilter = 'all' | MovementKind | MovementStatus;
