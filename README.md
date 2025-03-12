# GLSL Color Picker

The GLSL Color Picker is a Visual Studio Code extension that provides a color picker for GLSL and HLSL shaders. It detects `vec3` and `vec4` color definitions in your shader code and allows you to edit them using the native VSCode color picker.

## Features

- Detects `vec3` and `vec4` color definitions in GLSL and HLSL shaders.
- Provides a color picker to edit these colors.
- Clamps color values to the 0-1 range as required by GLSL.

## Building the Extension

To build the extension, run the following commands:

```sh
npm install
npm run compile
```

## Testing the Extension

To run the tests, use the following command:

```sh
npm test
```

## Installing the Extension

To install the extension, follow these steps:

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
3. Search for "GLSL Color Picker".
4. Click "Install" to install the extension.

## Manual VSIX Creation and Installation

To manually create and install the VSIX package:

1. Create the VSIX package:

    ```sh
    npx vsce package
    ```

    or

    ```sh
    npm install -g vsce
    vsce package
    ```

2. Install the VSIX package:
    1. Open Visual Studio Code.
    2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
    3. Click on the three-dot menu in the top-right corner and select "Install from VSIX...".
    4. Select the generated `.vsix` file to install the extension.
