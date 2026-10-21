import { utils, writeFile } from 'xlsx';
import { CostReport } from '../../state/costState';
import config from '../../config.json';

export type ExportRow = (string | number)[];

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
}

const FILE_NAME = 'Kyma-Price-Calculations';

const cu = (num: number) => `${(Math.round(num * 100) / 100).toFixed(2)} CU`;
const currency = (num: number) =>
  `${(Math.round(num * 100) / 100).toFixed(2)} ${config.CurrencyCode}`;

export function buildExportRows(report: CostReport): ExportRow[] {
  const rows: ExportRow[] = [['SAP BTP Kyma Runtime - Cost Estimation'], ['']];

  // Node pools — one block per pool. Volume is billed under Storage, so pool
  // cost is compute only.
  report.pools.forEach(({ machine, computeCosts }, index) => {
    rows.push(
      [index === 0 ? 'Base Worker Node Pool' : `Worker Node Pool ${index}`],
      ['Machine Type', machine.machineType.value],
      ['VM Size', machine.VMSize.value],
      ['Autoscaler Min', machine.minAutoscaler],
      ['Additional Volume', `${machine.additionalVolumeGib} GiB`],
      ['Pool Cost', cu(computeCosts)],
      [''],
    );
  });

  rows.push(
    // Time Consumption applies globally to all node pools and storage
    ['Time Consumption', `${report.timeConsumption} hrs`],
    [''],
    ['Storage'],
    ['Standard Storage', `${report.storage.standardGib} GiB`],
    ['NFS Storage', `${report.storage.nfsGib} GiB`],
    ['Snapshot Storage', `${report.storage.snapshotGib} GiB`],
    [''],
    ['Additional Services'],
    ['Redis Tier', report.redis.tier],
    ['Redis Cost', cu(report.additionalCosts)],
    ['Conversion Rate', report.conversionRate],
    [''],
    ['Summary'],
    ['Worker Nodes', cu(report.nodeConfigCosts)],
    ['Storage', cu(report.storageCosts)],
    ['Additional Services', cu(report.additionalCosts)],
    ['Total (CU)', cu(report.totalCosts.CU)],
    [`Total (${config.CurrencyCode})`, currency(report.totalCosts.CC)],
  );

  return rows;
}

// Always quote cells so Excel never misinterprets separators or hyphens.
function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCSV(rows: ExportRow[]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

export default function exportToFile(report: CostReport, format: ExportFormat) {
  const rows = buildExportRows(report);

  if (format === ExportFormat.XLSX) {
    exportToXLSX(rows);
  } else {
    exportToCSV(rows);
  }
}

function exportToXLSX(rows: ExportRow[]) {
  const worksheet = utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 26 }, { wch: 24 }];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Cost Estimation');
  writeFile(workbook, `${FILE_NAME}.xlsx`);
}

function exportToCSV(rows: ExportRow[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${FILE_NAME}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
