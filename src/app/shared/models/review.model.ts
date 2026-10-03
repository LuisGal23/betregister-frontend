export interface Review {
  confirmLabel?: string;
  title: string;
  message: string;
  amount: string;
  note: string;
  execute: () => Promise<boolean>;
}
