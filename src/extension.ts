import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('GLSL Color Picker is now active!');

    // Regex patterns for different color formats
    const colorPatterns = {
        // Original vec3/vec4 pattern
        vec: /vec(3|4)\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/g,
        
        // Hex color patterns (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
        hex: /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
        
        // RGB/RGBA patterns
        rgb: /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g,
        rgba: /rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)/g
    };

    /**
     * Register the Color Provider - this enables the native VSCode color picker
     */
    const colorProvider = vscode.languages.registerColorProvider(['glsl', 'hlsl'], {
        /**
         * Find all color vectors in the document and convert them to ColorInformation
         */
        provideDocumentColors(document: vscode.TextDocument): vscode.ColorInformation[] {
            const colorInformation: vscode.ColorInformation[] = [];
            const text = document.getText();
            
            // Process vec3/vec4 colors
            colorPatterns.vec.lastIndex = 0;
            let vecMatch: RegExpExecArray | null;
            while ((vecMatch = colorPatterns.vec.exec(text)) !== null) {
                // Parse the color components (already in 0-1 range)
                const isVec4 = vecMatch[1] === '4';
                const r = parseFloat(vecMatch[2]);
                const g = parseFloat(vecMatch[3]);
                const b = parseFloat(vecMatch[4]);
                const a = isVec4 && vecMatch[5] ? parseFloat(vecMatch[5]) : 1.0;

                // Skip if values are clearly not colors (likely position vectors)
                if (r > 2 || g > 2 || b > 2) {
                    continue;
                }

                // Clamp values to valid range
                const clamp = (val: number): number => Math.max(0, Math.min(1, val));
                const color = new vscode.Color(clamp(r), clamp(g), clamp(b), clamp(a));

                // Create a range for this color
                const startPos = document.positionAt(vecMatch.index);
                const endPos = document.positionAt(vecMatch.index + vecMatch[0].length);
                const range = new vscode.Range(startPos, endPos);

                colorInformation.push(new vscode.ColorInformation(range, color));
            }

            // Process hex colors
            colorPatterns.hex.lastIndex = 0;
            let hexMatch: RegExpExecArray | null;
            while ((hexMatch = colorPatterns.hex.exec(text)) !== null) {
                const hex = hexMatch[1];
                let r = 0, g = 0, b = 0, a = 1;
                
                // Parse different hex formats
                if (hex.length === 3) {
                    // #RGB format
                    r = parseInt(hex[0] + hex[0], 16) / 255;
                    g = parseInt(hex[1] + hex[1], 16) / 255;
                    b = parseInt(hex[2] + hex[2], 16) / 255;
                } else if (hex.length === 4) {
                    // #RGBA format
                    r = parseInt(hex[0] + hex[0], 16) / 255;
                    g = parseInt(hex[1] + hex[1], 16) / 255;
                    b = parseInt(hex[2] + hex[2], 16) / 255;
                    a = parseInt(hex[3] + hex[3], 16) / 255;
                } else if (hex.length === 6) {
                    // #RRGGBB format
                    r = parseInt(hex.substring(0, 2), 16) / 255;
                    g = parseInt(hex.substring(2, 4), 16) / 255;
                    b = parseInt(hex.substring(4, 6), 16) / 255;
                } else if (hex.length === 8) {
                    // #RRGGBBAA format
                    r = parseInt(hex.substring(0, 2), 16) / 255;
                    g = parseInt(hex.substring(2, 4), 16) / 255;
                    b = parseInt(hex.substring(4, 6), 16) / 255;
                    a = parseInt(hex.substring(6, 8), 16) / 255;
                }

                const color = new vscode.Color(r, g, b, a);
                const startPos = document.positionAt(hexMatch.index);
                const endPos = document.positionAt(hexMatch.index + hexMatch[0].length);
                const range = new vscode.Range(startPos, endPos);

                colorInformation.push(new vscode.ColorInformation(range, color));
            }

            // Process rgb colors
            colorPatterns.rgb.lastIndex = 0;
            let rgbMatch: RegExpExecArray | null;
            while ((rgbMatch = colorPatterns.rgb.exec(text)) !== null) {
                // Parse RGB values (0-255 range)
                const r = parseInt(rgbMatch[1], 10) / 255;
                const g = parseInt(rgbMatch[2], 10) / 255;
                const b = parseInt(rgbMatch[3], 10) / 255;
                const a = 1.0; // Full opacity for RGB

                // Create color and range
                const color = new vscode.Color(r, g, b, a);
                const startPos = document.positionAt(rgbMatch.index);
                const endPos = document.positionAt(rgbMatch.index + rgbMatch[0].length);
                const range = new vscode.Range(startPos, endPos);

                colorInformation.push(new vscode.ColorInformation(range, color));
            }

            // Process rgba colors
            colorPatterns.rgba.lastIndex = 0;
            let rgbaMatch: RegExpExecArray | null;
            while ((rgbaMatch = colorPatterns.rgba.exec(text)) !== null) {
                // Parse RGBA values
                const r = parseInt(rgbaMatch[1], 10) / 255;
                const g = parseInt(rgbaMatch[2], 10) / 255;
                const b = parseInt(rgbaMatch[3], 10) / 255;
                const a = parseFloat(rgbaMatch[4]); // Alpha is already 0-1 in RGBA

                // Create color and range
                const color = new vscode.Color(r, g, b, a);
                const startPos = document.positionAt(rgbaMatch.index);
                const endPos = document.positionAt(rgbaMatch.index + rgbaMatch[0].length);
                const range = new vscode.Range(startPos, endPos);

                colorInformation.push(new vscode.ColorInformation(range, color));
            }

            return colorInformation;
        },

        /**
         * Provide multiple color presentation options for format conversion
         */
        provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument, range: vscode.Range }): vscode.ColorPresentation[] {
            // Get the original format for default presentation 
            const originalText = context.document.getText(context.range);
            
            // Clamp values to ensure they're in valid range
            const clamp = (val: number): number => Math.max(0, Math.min(1, val));
            const r = clamp(color.red);
            const g = clamp(color.green);
            const b = clamp(color.blue);
            const a = clamp(color.alpha);
            
            // Create an array to hold all presentation options
            const presentations: vscode.ColorPresentation[] = [];
            
            // Always include the original format as the first option
            // This is important for preserving existing formats when making small adjustments
            
            // For vec3/vec4 formats
            if (originalText.startsWith('vec')) {
                const isVec4 = originalText.startsWith('vec4');
                const vec3Format = `vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})`;
                const vec4Format = `vec4(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, ${a.toFixed(3)})`;
                
                // Add the original format first
                presentations.push(new vscode.ColorPresentation(isVec4 ? vec4Format : vec3Format));
                
                // Add the alternative vec format as well
                if (isVec4) {
                    presentations.push(new vscode.ColorPresentation(vec3Format));
                } else {
                    presentations.push(new vscode.ColorPresentation(vec4Format));
                }
            } else {
                // For non-vec formats, create vec options
                presentations.push(
                    new vscode.ColorPresentation(`vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})`),
                    new vscode.ColorPresentation(`vec4(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}, ${a.toFixed(3)})`)
                );
            }
            
            // For hex formats: add different hex format options
            const rHex2 = Math.round(r * 255).toString(16).padStart(2, '0');
            const gHex2 = Math.round(g * 255).toString(16).padStart(2, '0');
            const bHex2 = Math.round(b * 255).toString(16).padStart(2, '0');
            const aHex2 = Math.round(a * 255).toString(16).padStart(2, '0');
            
            const rHex1 = Math.round(r * 15).toString(16);
            const gHex1 = Math.round(g * 15).toString(16);
            const bHex1 = Math.round(b * 15).toString(16);
            const aHex1 = Math.round(a * 15).toString(16);
            
            // Short hex formats for simple colors
            if (rHex2[0] === rHex2[1] && gHex2[0] === gHex2[1] && bHex2[0] === bHex2[1]) {
                // Add #RGB format (3-char hex)
                presentations.push(new vscode.ColorPresentation(`#${rHex1}${gHex1}${bHex1}`));
                
                // Add #RGBA format (4-char hex) if alpha is not 1.0
                if (a < 0.99) {
                    presentations.push(new vscode.ColorPresentation(`#${rHex1}${gHex1}${bHex1}${aHex1}`));
                }
            }
            
            // Always add 6-char hex
            presentations.push(new vscode.ColorPresentation(`#${rHex2}${gHex2}${bHex2}`));
            
            // Add 8-char hex if alpha is not 1.0
            if (a < 0.99) {
                presentations.push(new vscode.ColorPresentation(`#${rHex2}${gHex2}${bHex2}${aHex2}`));
            }
            
            // Add RGB and RGBA formats
            const rInt = Math.round(r * 255);
            const gInt = Math.round(g * 255);
            const bInt = Math.round(b * 255);
            
            presentations.push(new vscode.ColorPresentation(`rgb(${rInt}, ${gInt}, ${bInt})`));
            
            if (a < 0.99) {
                presentations.push(new vscode.ColorPresentation(`rgba(${rInt}, ${gInt}, ${bInt}, ${a.toFixed(2)})`));
            }
            
            return presentations;
        }
    });

    context.subscriptions.push(colorProvider);
}

export function deactivate() { }