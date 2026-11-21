# Futu Photo Editor

A browser-based, non-destructive photo editor built with React + TypeScript. It uses progressive enhancement to select a GPU WebGL2 renderer when available, with a CPU worker fallback for compatibility.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Test

```bash
npm run test
```

## Architecture overview

### Renderer abstraction
- `src/editor/renderer/types.ts` defines the `Renderer` interface.
- `src/editor/renderer/createRenderer.ts` selects the best backend at runtime.
- `src/editor/renderer/gpuWebgl2` implements the WebGL2 renderer for fast preview.
- `src/editor/renderer/cpuWorker` implements the CPU renderer with a Web Worker and OffscreenCanvas pipeline.

### CPU fallback strategy
- The CPU renderer caps preview output to 2048px on the long edge for responsiveness.
- The export pipeline runs at full resolution in the worker.
- If WebGL2 is unavailable or fails to initialize, the CPU backend is used automatically.

### State + history
- The document state is stored in Zustand and updated immutably.
- History is stored as parameter deltas instead of image snapshots.
- Pure utility functions (curve LUT + color conversion) are isolated in `src/utils` and covered by unit tests.

### Limitations (Phase 1)
- EXIF orientation handling is not yet implemented.
- Geometry and local masking UI are present, but the current rendering pipeline focuses on global color adjustments.

