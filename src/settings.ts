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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel-community";

/**
 * Histogram Visual Settings
 */
export class GeneralSettings extends formattingSettings.SimpleCard {
    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "FontSizeKey",
        descriptionKey: "FontSizeDescriptionKey",
        value: 12,
    });
    public fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayNameKey: "TextColorKey",
        descriptionKey: "TextColorDescriptionKey",
        value:  { value: "#000000" }
    });
    name: string = "general";
    displayNameKey: string = "GeneralKey";
    descriptionKey: string = "GeneralDescriptionKey";
    slices = [this.fontSize, this.fontColor];
}

/**
 * Bin Settings
 */

export class BinSettings extends formattingSettings.SimpleCard {
    public binCount = new formattingSettings.NumUpDown({
        name: "binCount",
        displayNameKey: "BinCountKey",
        descriptionKey: "BinCountDescriptionKey",
        value: 20,
    });
    public useBinSize = new formattingSettings.ToggleSwitch({
        name: "useBinSize",
        displayNameKey: "UseBinSizeKey",
        descriptionKey: "UseBinSizeDescriptionKey",
        value: false,
    });
    public binSize = new formattingSettings.NumUpDown({
        name: "binSize",
        displayNameKey: "BinSizeKey",
        descriptionKey: "BinSizeDescriptionKey",
        value: 5,
    });
    public binColor = new formattingSettings.ColorPicker({
        name: "binColor",
        displayNameKey: "Bin Color",
        descriptionKey: "BinColorDescriptionKey",
        value: { value: "#A0D1FF" },
    });
    public densityCurveColor = new formattingSettings.ColorPicker({
        name: "densityCurveColor",
        displayNameKey: "Density Color",
        descriptionKey: "DensityCurveColorDescriptionKey",
        value: { value: "#12239E" }, 
    });
    public showDensityCurve = new formattingSettings.ToggleSwitch({
        name: "showDensityCurve",
        displayNameKey: "Show Density Curve",
        descriptionKey: "Toggle to show or hide the density curve",
        value: true, 
    });    
    name: string = "bins";
    displayNameKey: string = "BinsKey";
    descriptionKey: string = "BinsDescriptionKey";
    analyticsPane: boolean = false;
    slices: Array<formattingSettings.Slice> = [
        this.binColor,
        this.densityCurveColor,
        this.showDensityCurve,
        this.useBinSize,
        this.binCount,
        this.binSize,
    ];
}


export class VisualFormattingSettingsModel extends formattingSettings.Model {
    displayNameKey: string = "FormattingKey";
    descriptionKey: string = "FormattingDescriptionKey";
    public generalSettings: GeneralSettings = new GeneralSettings();
    public binSettings: BinSettings = new BinSettings();

    public cards = [
        this.generalSettings,
        this.binSettings,
    ];
}