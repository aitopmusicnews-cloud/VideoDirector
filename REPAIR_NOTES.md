# Repair notes

Source reviewed: https://github.com/aitopmusicnews-cloud/VideoDirector

Key original failures addressed:

1. API key was collected but never passed to the provider.
2. OpenRouter used a reranking model against a chat-completions endpoint.
3. Gemini dependency existed but was not used.
4. Transition generation was a placeholder error message.
5. Actor image/song uploads and multiple UI settings were ignored.
6. Transition state omitted the required `promptFormat` field.
7. Storyboard parsing depended on brittle Markdown formatting.
8. Local AI server depended on a machine-specific Mistral file path.
9. API key persistence changed from permanent local storage to session-only storage.

The repaired copy focuses on a single provider: Gemini.
