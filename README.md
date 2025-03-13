# GLSL Color Picker

The GLSL Color Picker is a Visual Studio Code extension that provides a color picker for GLSL and HLSL shaders. It detects various color formats in your shader code and allows you to edit them using the native VSCode color picker.

## Features

- Detects multiple color formats in GLSL and HLSL shaders:
  - `vec3` and `vec4` color definitions
  - Hex colors (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`)
  - RGB colors (`rgb(r, g, b)`)
  - RGBA colors (`rgba(r, g, b, a)`)
- Provides a color picker to edit these colors
- Convert between different color formats through the color picker
- Clamps color values to the appropriate range for each format

## Supported Color Formats and Conversion

The extension allows you to not only edit colors but also convert between different formats. When you click on a color with the VSCode color picker, you'll see options to convert it to other supported formats.

| Format | Example | Description |
|--------|---------|-------------|
| vec3   | `vec3(0.5, 0.1, 0.9)` | RGB color with values in 0-1 range |
| vec4   | `vec4(0.5, 0.1, 0.9, 1.0)` | RGBA color with values in 0-1 range |
| Hex RGB | `#F90` | 3-digit hexadecimal RGB color |
| Hex RGBA | `#F90F` | 4-digit hexadecimal RGBA color |
| Hex RRGGBB | `#FF9900` | 6-digit hexadecimal RGB color |
| Hex RRGGBBAA | `#FF9900FF` | 8-digit hexadecimal RGBA color |
| RGB | `rgb(255, 153, 0)` | RGB color with values in 0-255 range |
| RGBA | `rgba(255, 153, 0, 1.0)` | RGBA color with RGB values in 0-255 range and alpha in 0-1 range |

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
