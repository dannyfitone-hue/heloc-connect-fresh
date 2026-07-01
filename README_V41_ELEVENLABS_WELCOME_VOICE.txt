V41 ElevenLabs Welcome Voice Update

Changes made:
- Replaced the robotic browser text-to-speech fallback with the uploaded ElevenLabs female voice MP3.
- Added the audio file at public/audio/welcome-voice.mp3.
- Updated the homepage welcome voice to play the real MP3 only.
- Removed robotic speechSynthesis fallback so visitors will not hear the old AI/robot voice.
- Keeps the same autoplay attempt behavior: the page tries to play on load and retries on visibility/focus/first tap, while still respecting browser autoplay restrictions.
- Speaker button replays the new ElevenLabs voice file.

Build check:
- npm install completed.
- npm run build compiled successfully and generated routes before the tool timeout occurred during final output collection.
