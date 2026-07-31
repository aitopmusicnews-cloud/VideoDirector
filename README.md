# MV Director AI — Gemini Repair

This repaired version removes the broken OpenRouter/local-Mistral routing and uses Google's `@google/genai` SDK directly.

## What was repaired

- Gemini is now the actual generation provider.
- The Gemini API key is passed to generation and stored only in `sessionStorage` for the current browser session.
- Artist reference images and optional song audio are sent to Gemini as multimodal inline data (14 MB combined browser limit).
- Creative temperature, actor name, script type, frame format, prompt target, shot length, and style fields now affect generation.
- Storyboards use JSON output instead of fragile Markdown parsing.
- Transition generation is implemented: the browser extracts the outgoing clip's last frame and incoming clip's first frame, then Gemini creates a transition from those images plus the shot-list context.
- The missing transition `promptFormat` state is fixed.
- Export to Markdown, JSON, and CSV is retained.
- Added `npm run typecheck`.
- Removed the hard-coded local model path, OpenRouter model, local FastAPI requirement, and conflicting setup instructions.

## Run locally

1. Install Node.js 20+.
2. Install packages:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the Vite URL (normally `http://localhost:5173`).
5. Paste a Gemini API key into the app.

You may also set `VITE_GEMINI_API_KEY` in a local `.env` file for convenience. Because `VITE_` values are included in browser code, do **not** use that approach for a public production deployment.

## Model

The default is `gemini-2.5-flash`. Override it with:

```bash
VITE_GEMINI_MODEL=gemini-2.5-flash
```

## Production security

This repair intentionally keeps the app easy to run locally. A browser application cannot truly hide an API key. For a public deployment, move the Gemini calls in `services/geminiService.ts` behind a server/serverless endpoint and keep `GEMINI_API_KEY` on the server.

## Media limits

The repaired browser flow sends optional audio and images inline to Gemini and enforces a 14 MB combined attachment cap. Transition videos are **not** uploaded to Gemini; only two extracted PNG boundary frames are sent.

## Deploy on Render

This project should be deployed as a **Render Static Site**.

### Render Dashboard settings

- **Root Directory:** leave blank if this project is at the repository root
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node version:** `22.22.0`
- **Environment variable:** `VITE_GEMINI_MODEL=gemini-2.5-flash`

Do **not** add `VITE_GEMINI_API_KEY` to a public Render Static Site. Vite embeds `VITE_*` values into the browser bundle. Enter the Gemini key in the app instead; it is kept in `sessionStorage` for the browser session.

A `render.yaml` Blueprint and `.node-version` are included in this project. If you create the service from the Blueprint, Render will use the same build and publish settings automatically.

If you add client-side routes later, the included Render rewrite sends `/*` to `/index.html`, allowing direct visits and refreshes to work.
