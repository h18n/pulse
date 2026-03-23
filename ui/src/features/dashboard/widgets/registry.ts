// Widget Registry - Extensible widget plugin system
import React from 'react';
import { Panel, TimeRange } from '@/types/dashboard';

// ============== Widget Props Interface ==============

export interface WidgetProps {
    panel: Panel;
    timeRange: TimeRange;
    variables: Record<string, string | string[]>;
    width: number;
    height: number;
    lastRefresh: number;
}

export interface WidgetPlugin {
    id: string;
    name: string;
    description: string;
    category: 'visualization' | 'data' | 'utility';
    icon?: React.ComponentType<{ size?: number }>;

    // Components
    PanelComponent: React.ComponentType<WidgetProps>;
    OptionsEditor?: React.ComponentType<{ panel: Panel; onChange: (options: any) => void }>;

    // Defaults
    defaultOptions: Record<string, any>;
    defaultFieldConfig: any;
}

// ============== Widget Registry ==============

const widgetRegistry = new Map<string, WidgetPlugin>();

export function registerWidget(plugin: WidgetPlugin) {
    widgetRegistry.set(plugin.id, plugin);
}

export function getWidget(type: string): WidgetPlugin | undefined {
    return widgetRegistry.get(type);
}

export function getWidgetComponent(type: string): React.ComponentType<WidgetProps> | null {
    const widget = widgetRegistry.get(type);
    return widget?.PanelComponent || null;
}

export function getAllWidgets(): WidgetPlugin[] {
    return Array.from(widgetRegistry.values());
}

export function getWidgetsByCategory(category: string): WidgetPlugin[] {
    return getAllWidgets().filter(w => w.category === category);
}

// ============== Built-in Widgets ==============

// Time Series Widget
import { TimeSeriesWidget } from './TimeSeries/TimeSeriesWidget';
import { StatWidget } from './Stat/StatWidget';
import { GaugeWidget } from './Gauge/GaugeWidget';
import { TableWidget } from './Table/TableWidget';
import { BarChartWidget } from './BarChart/BarChartWidget';
import { StatusGridWidget } from './StatusGrid/StatusGridWidget';
import { TextWidget } from './Text/TextWidget';
import { ForecastWidget } from './Forecast/ForecastWidget';

// Register built-in widgets
registerWidget({
    id: 'timeseries',
    name: 'Time Series',
    description: 'Time-based line, area, or bar chart',
    category: 'visualization',
    PanelComponent: TimeSeriesWidget,
    defaultOptions: {
        legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
        tooltip: { mode: 'multi', sort: 'none' },
    },
    defaultFieldConfig: {
        defaults: { color: { mode: 'palette-classic' } },
        overrides: [],
    },
});

registerWidget({
    id: 'stat',
    name: 'Stat',
    description: 'Big number with optional sparkline',
    category: 'visualization',
    PanelComponent: StatWidget,
    defaultOptions: {
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto',
        textMode: 'auto',
    },
    defaultFieldConfig: {
        defaults: {},
        overrides: [],
    },
});

registerWidget({
    id: 'gauge',
    name: 'Gauge',
    description: 'Circular gauge with thresholds',
    category: 'visualization',
    PanelComponent: GaugeWidget,
    defaultOptions: {
        showThresholdLabels: false,
        showThresholdMarkers: true,
    },
    defaultFieldConfig: {
        defaults: {
            thresholds: {
                mode: 'absolute',
                steps: [
                    { value: 0, color: 'green' },
                    { value: 70, color: 'yellow' },
                    { value: 90, color: 'red' },
                ],
            },
        },
        overrides: [],
    },
});

registerWidget({
    id: 'table',
    name: 'Table',
    description: 'Tabular data display',
    category: 'data',
    PanelComponent: TableWidget,
    defaultOptions: {
        showHeader: true,
        cellHeight: 'sm',
    },
    defaultFieldConfig: {
        defaults: {},
        overrides: [],
    },
});

registerWidget({
    id: 'barchart',
    name: 'Bar Chart',
    description: 'Horizontal or vertical bar chart',
    category: 'visualization',
    PanelComponent: BarChartWidget,
    defaultOptions: {
        orientation: 'horizontal',
        showValue: 'auto',
        groupWidth: 0.7,
        barWidth: 0.97,
    },
    defaultFieldConfig: {
        defaults: {},
        overrides: [],
    },
});

registerWidget({
    id: 'statusgrid',
    name: 'Status Grid',
    description: 'Grid of status indicators',
    category: 'visualization',
    PanelComponent: StatusGridWidget,
    defaultOptions: {
        columns: 4,
        showLabels: true,
    },
    defaultFieldConfig: {
        defaults: {},
        overrides: [],
    },
});

registerWidget({
    id: 'text',
    name: 'Text',
    description: 'Markdown or HTML content',
    category: 'utility',
    PanelComponent: TextWidget,
    defaultOptions: {
        mode: 'markdown',
        content: '# Hello\n\nThis is a text panel.',
    },
    defaultFieldConfig: {
        defaults: {},
        overrides: [],
    },
});

registerWidget({
    id: 'forecast',
    name: 'Forecast',
    description: 'Predictive time-series with threshold alerts',
    category: 'visualization',
    PanelComponent: ForecastWidget,
    defaultOptions: {
        forecastHours: 24,
        showConfidenceBands: true,
        displayMode: 'full',
    },
    defaultFieldConfig: {
        defaults: {
            unit: '',
        },
        overrides: [],
    },
});

export { widgetRegistry };
