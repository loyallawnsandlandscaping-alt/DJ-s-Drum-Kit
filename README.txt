DJ's Drum-Kit — Object Detect MVP v3 (camera required)

What’s new in v3
- Freemium: 8 free sounds + 12 pro sounds. Unlock Pro via code (local) or license file (JSON with {"pro":true}).
- Social keys screen: store Instagram/TikTok/YouTube/Facebook/X keys locally (no network used by default).
- Visual clones: when a pad triggers, it shows a thumbnail "copy" of the detected object region.
- Demo video mode: load a local video to test detection; camera still required for normal play.

Core
- 20 synth drum voices; assign any sound to any pad.
- Create draggable pads tied to detected object classes; triggers on enter, re-triggers after leave.
- Per-pad Loop toggle, global BPM.
- Record (MediaRecorder) with WAV fallback; download the file.
- Save/Load to local storage; Export/Import JSON; Share via Web Share API.
- PWA: offline after first load.

Run locally
  python3 -m http.server 8000
Open: http://localhost:8000 → Enable camera → (optional) Demo tab to load a video → Play tab to add pads.

Notes
- Keys are stored only on your device (localStorage). No uploads.
- To truly publish to social APIs, you’ll need each platform’s SDK and OAuth flow; this MVP only gathers/stores keys.
