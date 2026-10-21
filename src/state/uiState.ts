import { atom } from 'jotai';

// Which billing assumption is being edited in the pricing equation. Shared so
// that links elsewhere on the page can open the same editor.
export type BillingSetting = 'hours' | 'rate';

export const billingEditorState = atom<BillingSetting | null>(null);
billingEditorState.debugLabel = 'billingEditorState';
