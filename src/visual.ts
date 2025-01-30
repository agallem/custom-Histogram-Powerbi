/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
"use strict";
import Plotly from "plotly.js-dist-min";
import powerbi from "powerbi-visuals-api";

// custom imports
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel-community";
import { PreparedData } from './interfaces';
import { DrawHistogram } from './draw';
import { prepareData } from './dataPreparation';
import { addTooltip } from './tooltip';
import "./../style/visual.less";
import { VisualFormattingSettingsModel } from "./settings";
import { HistogramBehavior } from "./behavior";

// d3.js
import * as d3 from 'd3';

// powerbi.extensibility.visual
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

// powerbi-visuals-utils-interactivityutils
import { interactivitySelectionService, interactivityBaseService} from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;
import { BaseDataPoint } from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";

export class Visual implements IVisual {
    private drawHistogram: DrawHistogram;
    target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private behavior: IInteractiveBehavior;
    private host: IVisualHost;
    private root: any;
    private formatterFloat: (n: number) => string;
    private formatterInt: (n: number) => string;
    private interactivityService: IInteractivityService<BaseDataPoint> | any;
    private localizationManager: powerbi.extensibility.ILocalizationManager;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.localizationManager = options.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.target = options.element;
        this.host = options.host;
        this.behavior = new HistogramBehavior();
        this.interactivityService = createInteractivitySelectionService(this.host);
        if (document) {
            this.init()
        
            this.drawHistogram = new DrawHistogram(this.target);
        }
    }


    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        this.reset(); // Reset the container
        console.log('Visual update', options);
    
        // Get the settings from the DataView
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews[0]
        );
    
        // Prepare the data
        const preparedData: PreparedData = prepareData(options, this.host);
        const { data, datapoints } = preparedData;
    
        if (!data || data.length === 0) {
            console.warn("No data available for histogram.");
            return;
        }
    
        // Calculate density data
        const densityData = this.calculateDensity(data);
    
        // Retrieve bin settings dynamically
        const binColor = this.formattingSettings.binSettings.binColor.value.value;
        const binSize = this.formattingSettings.binSettings.useBinSize.value
            ? this.formattingSettings.binSettings.binSize.value // Use manual bin size
            : this.calculateDynamicBinSize(data); // Calculate dynamically if toggle is disabled
    
        const numberOfBins = this.formattingSettings.binSettings.useBinSize.value
            ? Math.ceil((d3.max(data)! - d3.min(data)!) / binSize)
            : this.formattingSettings.binSettings.binCount.value;
    
        // Histogram trace
        const histogramTrace: any = {
            x: data,
            type: 'histogram',
            marker: {
                color: binColor,
                line: {
                    color: 'black',
                    width: 1,
                },
            },
            xbins: {
                size: binSize,
                start: Math.min(...data),
                end: Math.max(...data),
            },
        };
    
        // Retrieve density curve toggle and color
        const showDensityCurve = this.formattingSettings.binSettings.showDensityCurve.value;
        const densityCurveColor = this.formattingSettings.binSettings.densityCurveColor.value.value;
    
        const traces = [histogramTrace];
    
        // Add density curve trace if the toggle is enabled
        if (showDensityCurve) {
            const densityTrace: any = {
                x: densityData.x,
                y: densityData.y,
                type: 'scatter',
                mode: 'lines',
                line: {
                    color: densityCurveColor,
                    width: 2,
                },
                name: 'Density Curve',
                yaxis: 'y2',
            };
            traces.push(densityTrace);
        }
    
        const fontSize = this.formattingSettings.generalSettings.fontSize.value;
        const fontColor = this.formattingSettings.generalSettings.fontColor.value.value;
    
        // Layout configuration
        const layout: any = {
            xaxis: {
                title: 'Values',
                titlefont: {
                    size: fontSize,
                    color: fontColor,
                },
            },
            yaxis: {
                title: 'Frequency',
                titlefont: {
                    size: fontSize,
                    color: fontColor,
                },
            },
            yaxis2: {
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickvals: null,
                showticklabels: false,
                title: '',
            },
            bargap: 0.05,
            showlegend: false,
            margin: {
                l: 50, // Left margin
                r: 50, // Right margin
                t: 20, // Top margin 
                b: 50, // Bottom margin
            },
        };
    
        // Select the container
        const container = document.getElementById('plotly_histogram');
        if (container) {
            // Render Plotly histogram with optional density curve
            Plotly.newPlot(container, traces, layout);
    
            // Add tooltips
            const bars = d3.select(container).selectAll('.plotly .bars path');
            addTooltip(bars, this.host, this.localizationManager, this.formatterFloat, this.formatterInt);
        }
    }    
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
}


    public applySelectionAfterResizing() {
        this.drawHistogram.bars.style("opacity", (category: any) => {
            if (!this.interactivityService.hasSelection()) {
              return 1;
            } else if (category.datapoints.some((d) => d.selected)) {
              return 1;
            } else {
              return 0.5;
            }
          });
    }

    public init() {
        const container: HTMLElement = document.createElement("div");
        container.id = "plotly_histogram"; 
        container.style.width = "100%";
        container.style.height = "100%";
        this.target.appendChild(container); 
    }  

    public reset() {
        while (this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }
        const container: HTMLElement = document.createElement("div");
        container.id = "plotly_histogram";
        container.style.width = "100%";
        container.style.height = "100%";
        this.target.appendChild(container);
    }
    private calculateDensity(data: number[]): { x: number[]; y: number[] } {
        // Helper function to calculate dynamic bandwidth
        const calculateBandwidth = (data: number[]): number => {
            if (data.length < 2) {
                return 0.1; // Default fallback bandwidth
            }
            const stdDev = d3.deviation(data)!; // Standard deviation
            const iqr = d3.quantile(data, 0.75)! - d3.quantile(data, 0.25)!; // IQR
            const range = Math.min(stdDev, iqr / 1.34); // Effective data range
            return 1.06 * range * Math.pow(data.length, -1 / 5); // Silverman's formula
        };
    
        const bandwidth = calculateBandwidth(data);
    
        // Gaussian Kernel
        const kernelGaussian = (v: number) => Math.exp(-0.5 * v * v) / Math.sqrt(2 * Math.PI);
    
        const kde = (kernel: any, xValues: number[], data: number[]) =>
            xValues.map(x => [
                x,
                d3.mean(data, v => kernel((x - v) / bandwidth)) / bandwidth,
            ]);
    
        const dataMin = Math.min(...data);
        const dataMax = Math.max(...data);
        const xValues = d3.range(dataMin, dataMax, (dataMax - dataMin) / 500); // Higher resolution
    
        const density = kde(kernelGaussian, xValues, data);
    
        return {
            x: density.map(d => d[0]),
            y: density.map(d => d[1]),
        };
    }
    
    
    private calculateDynamicBinSize(data: number[]): number {
        // Handle empty or invalid data edge cases
        if (data.length < 2) {
            return 1; // Default fallback bin size
        }
    
        // Sort the data as d3.quantile assumes sorted data
        const sortedData = data.slice().sort((a, b) => a - b);
    
        // Calculate the interquartile range (IQR)
        const q1 = d3.quantile(sortedData, 0.25)!; // First quartile
        const q3 = d3.quantile(sortedData, 0.75)!; // Third quartile
        const iqr = q3 - q1;
    
        // Calculate the bin width using the Freedman-Diaconis rule
        const binWidth = (2 * iqr) / Math.pow(data.length, 1 / 3);
    
        // Ensure bin width is positive and non-zero
        return binWidth > 0 ? binWidth : 1; // Fallback to 1 if bin width is invalid
    }    
    
}