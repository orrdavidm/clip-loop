// Your toddler's clip list. Each entry becomes one big button.
//
//   title    – label under the thumbnail
//   videoId  – the part after "v=" in a YouTube URL (or after youtu.be/)
//   start    – where the loop begins: seconds (83) or "m:ss" ("1:23")
//   end      – where it jumps back to start; omit to loop to the end of the video
//   thumb    – optional custom image URL (defaults to YouTube's thumbnail)
//
// Replace the placeholder IDs below with real ones.

window.CLIPS = [
  { title: "Garbage Truck Song", videoId: "REPLACE_ME_1", start: "0:42", end: "1:35" },
  { title: "Fire Engines",       videoId: "REPLACE_ME_2", start: "2:10", end: "3:05" },
  { title: "Big Diggers",        videoId: "REPLACE_ME_3", start: 15,     end: 70 },
];
