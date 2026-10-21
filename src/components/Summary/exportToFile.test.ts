// @vitest-environment jsdom
import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { utils, writeFile } from 'xlsx';
import exportToFile, {
  buildExportRows,
  ExportFormat,
  ExportRow,
  toCSV,
} from './exportToFile';
import { costReportAtom } from '../../state/costState';
import {
  additionalMachineSetupState,
  createMachineSetup,
} from '../../state/nodes/machineSetupState';
import { GiBQuantityState } from '../../state/storage/GiBQuantityState';
import { redisState } from '../../state/additionalConfig/redisState';
import { applyConversionRateState } from '../../state/additionalConfig/applyConversionRateState';

vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

function reportFromStore() {
  const store = createStore();
  store.set(additionalMachineSetupState, [createMachineSetup('pool-1', 2)]);
  store.set(GiBQuantityState, 64);
  store.set(redisState, { tier: 'Standard1', storageGib: 182 });
  store.set(applyConversionRateState, 0.5);
  return store.get(costReportAtom);
}

// Rows are label/value pairs; look one up by its label. Section headers reuse
// some summary labels (e.g. "Storage"), so take the last match.
const valueOf = (rows: ExportRow[], label: string) =>
  rows.findLast((row) => row[0] === label)?.[1];

describe('buildExportRows', () => {
  const rows = buildExportRows(reportFromStore());

  test('starts with the title', () => {
    expect(rows[0]).toEqual(['SAP BTP Kyma Runtime - Cost Estimation']);
  });

  test('writes one block per node pool with its compute cost', () => {
    const labels = rows.map((row) => row[0]);
    expect(labels).toContain('Base Worker Node Pool');
    expect(labels).toContain('Worker Node Pool 1');

    const poolCosts = rows.filter((row) => row[0] === 'Pool Cost');
    // base: 3 × 3 CU × 0.12 × 720; pool 1: 2 × 3 CU × 0.12 × 720
    expect(poolCosts).toEqual([
      ['Pool Cost', '777.60 CU'],
      ['Pool Cost', '518.40 CU'],
    ]);
  });

  test('lists inputs with units', () => {
    expect(valueOf(rows, 'Machine Type')).toBe('General Purpose');
    expect(valueOf(rows, 'Additional Volume')).toBe('0 GiB');
    expect(valueOf(rows, 'Time Consumption')).toBe('720 hrs');
    expect(valueOf(rows, 'Standard Storage')).toBe('64 GiB');
    expect(valueOf(rows, 'Redis Tier')).toBe('Standard1');
    expect(valueOf(rows, 'Conversion Rate')).toBe(0.5);
  });

  test('summarises costs in CU and currency, rounded to cents', () => {
    // nodes 1296 + storage 14.4 + Redis 81.9 = 1392.3
    expect(valueOf(rows, 'Worker Nodes')).toBe('1296.00 CU');
    expect(valueOf(rows, 'Storage')).toBe('14.40 CU');
    expect(valueOf(rows, 'Redis Cost')).toBe('81.90 CU');
    expect(valueOf(rows, 'Additional Services')).toBe('81.90 CU');
    expect(valueOf(rows, 'Total (CU)')).toBe('1392.30 CU');
    expect(valueOf(rows, 'Total (€)')).toBe('696.15 €');
  });
});

describe('toCSV', () => {
  test('quotes every cell and joins rows with newlines', () => {
    expect(toCSV([['a', 1], ['b']])).toBe('"a","1"\n"b"');
  });

  test('escapes embedded quotes and keeps separators inside cells', () => {
    expect(toCSV([['say "hi"', 'x,y', '1-2']])).toBe(
      '"say ""hi""","x,y","1-2"',
    );
  });
});

describe('exportToFile', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  test('XLSX writes a workbook named Kyma-Price-Calculations.xlsx', () => {
    exportToFile(reportFromStore(), ExportFormat.XLSX);

    expect(utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Cost Estimation',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.anything(),
      'Kyma-Price-Calculations.xlsx',
    );
  });

  describe('CSV', () => {
    let clicked: HTMLAnchorElement | undefined;

    beforeEach(() => {
      clicked = undefined;
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        function (this: HTMLAnchorElement) {
          clicked = this;
        },
      );
    });

    test('downloads Kyma-Price-Calculations.csv and cleans up', () => {
      exportToFile(reportFromStore(), ExportFormat.CSV);

      expect(clicked?.download).toBe('Kyma-Price-Calculations.csv');
      expect(clicked?.href).toBe('blob:test');
      expect(document.body.contains(clicked!)).toBe(false);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
      expect(writeFile).not.toHaveBeenCalled();
    });
  });
});
