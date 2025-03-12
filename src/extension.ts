import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('GLSL Color Picker is now active!');

    // Regex to match GLSL vec3 and vec4 color definitions
    // Note: In GLSL, colors are typically in 0-1 range, not 0-255
    const colorRegex = /vec(3|4)\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/g;

    /**
     * Register the Color Provider - this enables the native VSCode color picker
     */
    const colorProvider = vscode.languages.registerColorProvider(['glsl', 'hlsl'], {
        /**
         * Find all color vectors in the document and convert them to ColorInformation
         * 
         * This function detects GLSL vec3/vec4 color definitions and converts them
         * to VSCode color objects. Both systems use the 0-1 range for color values.
         */
        provideDocumentColors(document: vscode.TextDocument): vscode.ColorInformation[] {
            const colorInformation: vscode.ColorInformation[] = [];
            const text = document.getText();
            let match: RegExpExecArray | null;

            // Reset the regex before starting the search
            colorRegex.lastIndex = 0;

            while ((match = colorRegex.exec(text)) !== null) {
                // Parse the color components from GLSL format (already in 0-1 range)
                const isVec4 = match[1] === '4';
                const r = parseFloat(match[2]);
                const g = parseFloat(match[3]);
                const b = parseFloat(match[4]);
                const a = isVec4 && match[5] ? parseFloat(match[5]) : 1.0;

                // Validate color values are in the expected 0-1 range
                // Skip invalid colors (e.g., vec3(2.0, 3.0, 4.0) might be a position, not a color)
                if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1 || a < 0 || a > 1) {
                    // Could be a position vector or other non-color use of vec3/vec4
                    // Skip this match if values are clearly outside color range
                    if (r > 2 || g > 2 || b > 2) {
                        continue;
                    }

                    // For values slightly outside range, clamp them
                    const clamp = (val: number): number => Math.max(0, Math.min(1, val));
                    const color = new vscode.Color(clamp(r), clamp(g), clamp(b), clamp(a));

                    // Create a range for this color
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    colorInformation.push(new vscode.ColorInformation(range, color));
                } else {
                    // Color values are in the expected range
                    const color = new vscode.Color(r, g, b, a);

                    // Create a range for this color
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    colorInformation.push(new vscode.ColorInformation(range, color));
                }
            }

            return colorInformation;
        },

        /**
         * Convert a color back to GLSL format when the user changes it
         * 
         * Note: VSCode's color picker uses the 0-1 range for color values,
         * which matches GLSL's normalized format. However, we need to ensure
         * values remain in the correct range and format for GLSL.
         */
        provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument, range: vscode.Range }): vscode.ColorPresentation[] {
            // Determine if this was a vec3 or vec4 originally
            const originalText = context.document.getText(context.range);
            const isVec4 = originalText.startsWith('vec4');

            // Ensure values are in the valid 0-1 range (VSCode might allow out-of-range values)
            const clamp = (val: number): number => Math.max(0, Math.min(1, val));

            // Format the color components with 3 decimal places
            const r = clamp(color.red).toFixed(3);
            const g = clamp(color.green).toFixed(3);
            const b = clamp(color.blue).toFixed(3);
            const a = clamp(color.alpha).toFixed(3);

            // Create the GLSL color string
            let colorString: string;
            if (isVec4) {
                colorString = `vec4(${r}, ${g}, ${b}, ${a})`;
            } else {
                colorString = `vec3(${r}, ${g}, ${b})`;
            }

            // Return a single presentation with our formatted string
            return [new vscode.ColorPresentation(colorString)];
        }
    });

    context.subscriptions.push(colorProvider);
}

export function deactivate() { }