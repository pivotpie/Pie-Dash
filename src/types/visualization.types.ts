import type { Data, Layout, Config } from 'plotly.js';

export interface PlotlyConfig {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
}

export interface PlotlyChartData {
  x: (string | number | Date)[];
  y: (string | number)[];
  type?: 'scatter' | 'bar' | 'pie' | 'line' | 'histogram' | 'box' | 'heatmap';
  mode?: 'lines' | 'markers' | 'lines+markers';
  name?: string;
  marker?: {
    color?: string | string[];
    size?: number | number[];
    [key: string]: any;
  };
  [key: string]: any;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'box' | 'heatmap';

export interface VisualizationRequest {
  query: string;
  data: any[];
  chartType?: ChartType;
  title?: string;
  xAxis?: string;
  yAxis?: string;
}

export interface VisualizationResponse {
  chartConfig: PlotlyConfig;
  chartType: ChartType;
  title: string;
  description?: string;
  insights?: string[];
  error?: string;
}

export interface MultiVisualizationResponse {
  primary: VisualizationResponse;
  secondary?: VisualizationResponse[];
  analysisType: 'single' | 'multiple';
  insights: string[];
}