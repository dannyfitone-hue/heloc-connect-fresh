V46 Welcome Voice Playback Fix

Fixed the welcome voice glitch where scrolling/touching the screen could restart the audio.

Changes made:
- Removed hidden audio autoplay attribute so there is only one controlled playback path.
- Added a playback state guard: idle / playing / played.
- Autoplay attempts now only run if the audio has not started yet.
- First tap/click retry now only starts the voice if it is not already playing.
- Speaker button still works as manual replay and intentionally restarts the voice only when clicked.
- The welcome voice should now play once per page load and should not restart while scrolling.
