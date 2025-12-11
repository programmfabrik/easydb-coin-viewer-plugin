# easydb-coin-viewer-plugin

A Detail Sidebar Plugin for **easydb5** and **fylr** that provides an interactive WebGL-based 3D coin viewer. This plugin allows users to visualize and interact with coin images using advanced lighting and rendering techniques.

## Features

- **Interactive 3D Visualization**: View coins with realistic lighting and shading using WebGL
- **Light Direction Control**: Manipulate the light source direction to reveal surface details
- **Zoom & Rotation**: Zoom in/out and rotate the coin for detailed examination
- **Dual-Side Support**: View both sides of a coin with flip animation
- **Custom Color**: Apply custom colors to the coin surface
- **Grid Overlay**: Toggle grid lines for measurement reference
- **Fullscreen Mode**: Expand the viewer to fullscreen for detailed analysis

## Requirements

- easydb5 (Server API v1+) or fylr
- JSON files with coin data in the expected format (see below)

## Installation (Fylr)

1. **Via URL (recommended):**
    - Use the following URL to install the plugin and **receive automatic updates** in your instance:
      [https://programmfabrik.github.io/easydb-coin-viewer-plugin/easydb-coin-viewer-plugin.zip](https://programmfabrik.github.io/easydb-coin-viewer-plugin/easydb-coin-viewer-plugin.zip)

2. **Via ZIP:**
    - Download the latest version from [this link](https://programmfabrik.github.io/easydb-coin-viewer-plugin/easydb-coin-viewer-plugin.zip).
    - Use the Plugin Manager in Fylr to install the downloaded plugin package. Plugins installed via ZIP don't get updated automatically.

## JSON Data Format

The plugin expects JSON files attached to records with the following structure:

```json
{
  "processData": {
    "coinSide0": {
      "albedo": "(base64 encoded image)",
      "normal": "(base64 encoded image)"
    },
    "coinSide1": {
      "albedo": "(base64 encoded image)",
      "normal": "(base64 encoded image)"
    }
  },
  "userData": {
    "coinSideData0": {
      "intensity": 1.5,
      "lightDirectionX": 0.577,
      "lightDirectionY": -0.577,
      "lightDirectionZ": -0.577,
      "rotation": 0
    },
    "coinSideData1": {
      "intensity": 1.5,
      "lightDirectionX": 0.577,
      "lightDirectionY": -0.577,
      "lightDirectionZ": -0.577,
      "rotation": 0
    },
    "coinSideRotation": "Vertical"
  }
}
```

### Data Fields

| Field | Description |
|-------|-------------|
| `processData.coinSideX.albedo` | Base64 encoded color/texture image for the coin side |
| `processData.coinSideX.normal` | Base64 encoded normal map for surface detail rendering |
| `userData.coinSideDataX.intensity` | Light intensity multiplier |
| `userData.coinSideDataX.lightDirectionX/Y/Z` | Initial light direction vector |
| `userData.coinSideDataX.rotation` | Initial rotation angle |
| `userData.coinSideRotation` | Flip orientation: "Vertical" or "Horizontal" |

## Usage

1. Upload a JSON file with coin data to a record in easydb
2. Open the record in detail view
3. Click the coin icon button in the detail sidebar to open the viewer
4. Use the interactive controls:
   - **Drag**: Move the coin or adjust light direction (toggle mode)
   - **Scroll/Pinch**: Zoom in/out
   - **Rotate buttons**: Rotate clockwise/counter-clockwise
   - **Flip button**: Show the other side of the coin
   - **Color picker**: Change the coin surface color
   - **Grid button**: Toggle measurement grid
   - **Reset button**: Reset view, light, color and position
   - **Fullscreen button**: Toggle fullscreen mode

## Development

### Project Structure

```
├── src/
│   ├── webfrontend/
│   │   ├── CoinViewerDetailPlugin.coffee  # Main plugin class
│   │   └── scss/
│   │       └── easydb-coin-viewer-plugin.scss  # Styles
│   └── lib/
│       └── coin.js  # WebGL coin rendering library
├── l10n/
│   └── easydb-coin-viewer-plugin.csv  # Translations
├── manifest.yml  # Plugin manifest
├── Makefile  # Build configuration
└── LICENSE  # MIT License
```

### Build Commands

```bash
# Build everything
make build

# Build only code (JS + CSS)
make code

# Clean build artifacts
make clean

# Create distribution zip
make zip
```

## License

MIT License - Copyright (c) 2022 Programmfabrik GmbH

See [LICENSE](LICENSE) for details.
