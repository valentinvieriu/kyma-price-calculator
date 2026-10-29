import { atom } from 'jotai';

// Which billing assumption is being edited, and the element the editor opens
// next to. Shared so the summary and the notes can all open it.
export type BillingSetting = 'hours' | 'rate';

export interface BillingEditor {
  setting: BillingSetting;
  opener: string;
}

export const billingEditorState = atom<BillingEditor | null>(null);
billingEditorState.debugLabel = 'billingEditorState';

// Ids of the links in the summary that show each setting, used as editor
// openers.
export const BILLING_OPENER_IDS: Record<BillingSetting, string> = {
  hours: 'summary-hours',
  rate: 'summary-rate',
};
