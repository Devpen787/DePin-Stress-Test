/**
 * DePIN Stress Test - Export Utilities
 * Functions for exporting simulation data to CSV and JSON
 */

import type { AggregateResult, SimulationParams, DerivedMetrics } from '../model/types';

/**
 * Convert aggregated results to CSV format
 */
export function aggregatedToCSV(data: AggregateResult[]): string {
  if (data.length === 0) return '';

  // Headers
  const headers = [
    'week',
    'price_mean',
    'price_p10',
    'price_p90',
    'supply_mean',
    'supply_p10',
    'supply_p90',
    'demand_mean',
    'demand_served_mean',
    'providers_mean',
    'providers_p10',
    'providers_p90',
    'capacity_mean',
    'service_price_mean',
    'minted_mean',
    'burned_mean',
    'utilisation_mean',
    'profit_mean',
    'scarcity_mean',
    'incentive_mean',
    'buy_pressure_mean',
    'sell_pressure_mean',
    'net_flow_mean',
    'churn_count_mean',
    'join_count_mean',
  ];

  const rows = data.map((d) => [
    d.t,
    d.price?.mean?.toFixed(4) || '',
    d.price?.p10?.toFixed(4) || '',
    d.price?.p90?.toFixed(4) || '',
    d.supply?.mean?.toFixed(0) || '',
    d.supply?.p10?.toFixed(0) || '',
    d.supply?.p90?.toFixed(0) || '',
    d.demand?.mean?.toFixed(2) || '',
    d.demandServed?.mean?.toFixed(2) || '',
    d.providers?.mean?.toFixed(1) || '',
    d.providers?.p10?.toFixed(1) || '',
    d.providers?.p90?.toFixed(1) || '',
    d.capacity?.mean?.toFixed(0) || '',
    d.servicePrice?.mean?.toFixed(4) || '',
    d.minted?.mean?.toFixed(0) || '',
    d.burned?.mean?.toFixed(0) || '',
    d.utilisation?.mean?.toFixed(2) || '',
    d.profit?.mean?.toFixed(2) || '',
    d.scarcity?.mean?.toFixed(4) || '',
    d.incentive?.mean?.toFixed(4) || '',
    d.buyPressure?.mean?.toFixed(0) || '',
    d.sellPressure?.mean?.toFixed(0) || '',
    d.netFlow?.mean?.toFixed(0) || '',
    d.churnCount?.mean?.toFixed(1) || '',
    d.joinCount?.mean?.toFixed(1) || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Convert simulation data to JSON export format
 */
export function simulationToJSON(
  data: AggregateResult[],
  params: SimulationParams,
  metrics: DerivedMetrics
): string {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      simulationType: 'DePIN Stress Test',
    },
    parameters: params,
    derivedMetrics: metrics,
    timeSeries: data.map((d) => ({
      week: d.t,
      price: {
        mean: d.price?.mean,
        p10: d.price?.p10,
        p90: d.price?.p90,
        stdDev: d.price?.stdDev,
      },
      supply: {
        mean: d.supply?.mean,
        p10: d.supply?.p10,
        p90: d.supply?.p90,
      },
      demand: {
        requested: d.demand?.mean,
        served: d.demandServed?.mean,
      },
      providers: {
        count: d.providers?.mean,
        p10: d.providers?.p10,
        p90: d.providers?.p90,
      },
      capacity: d.capacity?.mean,
      servicePrice: d.servicePrice?.mean,
      tokenFlows: {
        minted: d.minted?.mean,
        burned: d.burned?.mean,
        buyPressure: d.buyPressure?.mean,
        sellPressure: d.sellPressure?.mean,
        netFlow: d.netFlow?.mean,
      },
      utilisation: d.utilisation?.mean,
      providerEconomics: {
        profit: d.profit?.mean,
        incentive: d.incentive?.mean,
        churnCount: d.churnCount?.mean,
        joinCount: d.joinCount?.mean,
      },
      scarcity: d.scarcity?.mean,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export aggregated results to CSV file
 */
export function exportToCSV(data: AggregateResult[], filename?: string): void {
  const csv = aggregatedToCSV(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csv, filename || `depin-simulation-${timestamp}.csv`, 'text/csv');
}

/**
 * Export full simulation to JSON file
 */
export function exportToJSON(
  data: AggregateResult[],
  params: SimulationParams,
  metrics: DerivedMetrics,
  filename?: string
): void {
  const json = simulationToJSON(data, params, metrics);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(
    json,
    filename || `depin-simulation-${timestamp}.json`,
    'application/json'
  );
}

/**
 * Generate shareable URL with encoded parameters
 */
export function generateShareableURL(params: SimulationParams): string {
  const baseURL = window.location.origin + window.location.pathname;
  const encoded = btoa(JSON.stringify(params));
  return `${baseURL}?config=${encoded}`;
}

/**
 * Parse parameters from URL
 */
export function parseURLParams(): Partial<SimulationParams> | null {
  const urlParams = new URLSearchParams(window.location.search);
  const config = urlParams.get('config');

  if (!config) return null;

  try {
    return JSON.parse(atob(config));
  } catch {
    console.error('Failed to parse URL parameters');
    return null;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

