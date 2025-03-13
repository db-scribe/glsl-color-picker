import * as assert from 'assert';
import * as vscode from 'vscode';

// Capture the provider so we can test its methods.
let capturedProvider: vscode.DocumentColorProvider;

// Monkey-patch registerColorProvider to capture the provider instance.
const originalRegisterColorProvider = vscode.languages.registerColorProvider;
(vscode.languages as any).registerColorProvider = function (
    languages: string[],
    provider: vscode.DocumentColorProvider
): vscode.Disposable {
    capturedProvider = provider;
    return { dispose: () => {} };
};

// Import the extension (adjust the path as necessary)
import * as myExtension from '../extension';

suite('Color Provider Tests', () => {
    suiteSetup(() => {
        // Create a fake extension context with minimal required properties.
        const fakeContext = { subscriptions: [] } as unknown as vscode.ExtensionContext;
        // Activate the extension; this registers our provider.
        myExtension.activate(fakeContext);
        assert.ok(capturedProvider, 'Color provider should be captured');
    });

    test('provideDocumentColors finds and parses valid vec colors', () => {
        const content = `
            // Valid colors
            vec3(0.5, 0.5, 0.5)
            vec4(0.1, 0.2, 0.3, 0.4)
            // A vec3 with a value slightly out of range (should be clamped)
            vec3(1.1, 0.5, 0.5)
            // Clearly not a color (skipped because values are too high)
            vec3(2.5, 0.5, 0.5)
        `;
        // Create a dummy TextDocument.
        const dummyDocument = {
            getText: () => content,
            // Accept an optional token to match the signature.
            positionAt: (offset: number, token?: any) => new vscode.Position(0, offset)
        } as unknown as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideDocumentColors(dummyDocument, token);
        const colors = result as vscode.ColorInformation[];
        // We expect three color matches (the clearly out-of-range vec3 is skipped).
        assert.strictEqual(colors.length, 3, 'Expected three color matches');

        // Verify the first color: vec3(0.5, 0.5, 0.5)
        const color1 = colors[0].color;
        assert.strictEqual(color1.red, 0.5);
        assert.strictEqual(color1.green, 0.5);
        assert.strictEqual(color1.blue, 0.5);
        assert.strictEqual(color1.alpha, 1.0);

        // Verify the second color: vec4(0.1, 0.2, 0.3, 0.4)
        const color2 = colors[1].color;
        assert.strictEqual(color2.red, 0.1);
        assert.strictEqual(color2.green, 0.2);
        assert.strictEqual(color2.blue, 0.3);
        assert.strictEqual(color2.alpha, 0.4);

        // Verify the third color: vec3(1.1, 0.5, 0.5) should be clamped to (1.0, 0.5, 0.5, 1.0)
        const color3 = colors[2].color;
        assert.strictEqual(color3.red, 1.0, 'Red should be clamped to 1.0');
        assert.strictEqual(color3.green, 0.5);
        assert.strictEqual(color3.blue, 0.5);
        assert.strictEqual(color3.alpha, 1.0);
    });

    test('provideDocumentColors finds and parses hex colors', () => {
        const content = `
            // Hex RGB format
            #F90
            // Hex RGBA format
            #F90F
            // Hex RRGGBB format
            #FF9900
            // Hex RRGGBBAA format
            #FF9900FF
        `;
        
        const dummyDocument = {
            getText: () => content,
            positionAt: (offset: number) => new vscode.Position(0, offset)
        } as unknown as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideDocumentColors(dummyDocument, token);
        const colors = result as vscode.ColorInformation[];
        
        assert.strictEqual(colors.length, 4, 'Expected four hex color matches');

        // Verify #F90 (RGB)
        const color1 = colors[0].color;
        assert.strictEqual(color1.red, 255/255);
        assert.strictEqual(color1.green, 153/255);
        assert.strictEqual(color1.blue, 0/255);
        assert.strictEqual(color1.alpha, 1.0);

        // Verify #F90F (RGBA)
        const color2 = colors[1].color;
        assert.strictEqual(color2.red, 255/255);
        assert.strictEqual(color2.green, 153/255);
        assert.strictEqual(color2.blue, 0/255);
        assert.strictEqual(color2.alpha, 255/255);

        // Verify #FF9900 (RRGGBB)
        const color3 = colors[2].color;
        assert.strictEqual(color3.red, 255/255);
        assert.strictEqual(color3.green, 153/255);
        assert.strictEqual(color3.blue, 0/255);
        assert.strictEqual(color3.alpha, 1.0);

        // Verify #FF9900FF (RRGGBBAA)
        const color4 = colors[3].color;
        assert.strictEqual(color4.red, 255/255);
        assert.strictEqual(color4.green, 153/255);
        assert.strictEqual(color4.blue, 0/255);
        assert.strictEqual(color4.alpha, 255/255);
    });

    test('provideDocumentColors finds and parses RGB/RGBA colors', () => {
        const content = `
            // RGB format
            rgb(255, 153, 0)
            // RGBA format
            rgba(255, 153, 0, 0.5)
        `;
        
        const dummyDocument = {
            getText: () => content,
            positionAt: (offset: number) => new vscode.Position(0, offset)
        } as unknown as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideDocumentColors(dummyDocument, token);
        const colors = result as vscode.ColorInformation[];
        
        assert.strictEqual(colors.length, 2, 'Expected two RGB/RGBA color matches');

        // Verify rgb(255, 153, 0)
        const color1 = colors[0].color;
        assert.strictEqual(color1.red, 255/255);
        assert.strictEqual(color1.green, 153/255);
        assert.strictEqual(color1.blue, 0/255);
        assert.strictEqual(color1.alpha, 1.0);

        // Verify rgba(255, 153, 0, 0.5)
        const color2 = colors[1].color;
        assert.strictEqual(color2.red, 255/255);
        assert.strictEqual(color2.green, 153/255);
        assert.strictEqual(color2.blue, 0/255);
        assert.strictEqual(color2.alpha, 0.5);
    });

    test('provideColorPresentations provides multiple format options for vec3', () => {
        // Create a dummy document where getText returns text starting with "vec3".
        const dummyDocument = {
            getText: (range: vscode.Range) => "vec3(0.5, 0.5, 0.5)"
        } as unknown as vscode.TextDocument;
        const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 20));
        // Create a color within range.
        const color = new vscode.Color(0.5, 0.5, 0.5, 1.0);
        const context = { document: dummyDocument, range };

        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideColorPresentations(color, context, token);
        const presentations = result as vscode.ColorPresentation[];
        
        // Should have multiple format options, including the original
        assert.ok(presentations.length > 1, 'Expected multiple color presentations');
        
        // The first presentation should keep the original vec3 format
        assert.strictEqual(presentations[0].label, "vec3(0.500, 0.500, 0.500)");
        
        // Check that we have different format options (at least vec4, hex, and rgb)
        const hasVec4 = presentations.some(p => p.label.startsWith('vec4'));
        const hasHex = presentations.some(p => p.label.startsWith('#'));
        const hasRgb = presentations.some(p => p.label.startsWith('rgb'));
        
        assert.ok(hasVec4, 'Should include vec4 format option');
        assert.ok(hasHex, 'Should include hex format option');
        assert.ok(hasRgb, 'Should include rgb format option');
    });

    test('provideColorPresentations provides multiple format options for hex color', () => {
        // Create a dummy document where getText returns a hex color.
        const dummyDocument = {
            getText: (range: vscode.Range) => "#FF8000"
        } as unknown as vscode.TextDocument;
        const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 7));
        // Create a color within range.
        const color = new vscode.Color(1.0, 0.5, 0.0, 1.0);
        const context = { document: dummyDocument, range };

        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideColorPresentations(color, context, token);
        const presentations = result as vscode.ColorPresentation[];
        
        // Should have multiple format options
        assert.ok(presentations.length > 1, 'Expected multiple color presentations');
        
        // Check that we have different format options (vec3, vec4, hex, and rgb)
        const hasVec3 = presentations.some(p => p.label.startsWith('vec3'));
        const hasVec4 = presentations.some(p => p.label.startsWith('vec4'));
        const hasHex = presentations.some(p => p.label.startsWith('#'));
        const hasRgb = presentations.some(p => p.label.startsWith('rgb'));
        
        assert.ok(hasVec3, 'Should include vec3 format option');
        assert.ok(hasVec4, 'Should include vec4 format option');
        assert.ok(hasHex, 'Should include hex format option');
        assert.ok(hasRgb, 'Should include rgb format option');
    });

    test('provideColorPresentations handles alpha transparency correctly', () => {
        // Create a dummy document where getText returns a rgba color.
        const dummyDocument = {
            getText: (range: vscode.Range) => "rgba(255, 128, 0, 0.5)"
        } as unknown as vscode.TextDocument;
        const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 22));
        // Create a color with alpha.
        const color = new vscode.Color(1.0, 0.5, 0.0, 0.5);
        const context = { document: dummyDocument, range };

        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideColorPresentations(color, context, token);
        const presentations = result as vscode.ColorPresentation[];
        
        // Should have options that include alpha
        const hasVec4 = presentations.some(p => p.label.startsWith('vec4'));
        const hasRgba = presentations.some(p => p.label.startsWith('rgba'));
        const hasHexWithAlpha = presentations.some(p => p.label.startsWith('#') && p.label.length === 9);
        
        assert.ok(hasVec4, 'Should include vec4 format option for alpha');
        assert.ok(hasRgba, 'Should include rgba format option');
        assert.ok(hasHexWithAlpha, 'Should include hex format with alpha');
        
        // Find the rgba presentation and verify its format
        const rgbaPresentation = presentations.find(p => p.label.startsWith('rgba'));
        assert.ok(rgbaPresentation, 'Should have an rgba format option');
        assert.strictEqual(rgbaPresentation?.label, 'rgba(255, 128, 0, 0.50)');
    });
});

// Restore the original function after tests.
suiteTeardown(() => {
    (vscode.languages as any).registerColorProvider = originalRegisterColorProvider;
});
