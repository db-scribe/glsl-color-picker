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

    test('provideDocumentColors finds and parses valid colors', () => {
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

    test('provideColorPresentations returns correct presentation for vec3', () => {
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
        assert.strictEqual(presentations.length, 1, 'Expected one color presentation');
        // Expect the string to be formatted as a vec3 with 3 decimal places.
        assert.strictEqual(presentations[0].label, "vec3(0.500, 0.500, 0.500)");
    });

    test('provideColorPresentations returns correct presentation for vec4 with clamping', () => {
        // Create a dummy document where getText returns text starting with "vec4".
        const dummyDocument = {
            getText: (range: vscode.Range) => "vec4(0.5, 0.5, 0.5, 1.0)"
        } as unknown as vscode.TextDocument;
        const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 25));
        // Create a color with out-of-bound values to test clamping.
        const color = new vscode.Color(1.1, 0.5, -0.2, 1.5);
        const context = { document: dummyDocument, range };

        const token = new vscode.CancellationTokenSource().token;
        const result = capturedProvider.provideColorPresentations(color, context, token);
        const presentations = result as vscode.ColorPresentation[];
        assert.strictEqual(presentations.length, 1, 'Expected one color presentation');
        assert.strictEqual(
            presentations[0].label,
            "vec4(1.000, 0.500, 0.000, 1.000)",
            'Expected color presentation to be clamped correctly'
        );
    });
});

// Restore the original function after tests.
suiteTeardown(() => {
    (vscode.languages as any).registerColorProvider = originalRegisterColorProvider;
});
