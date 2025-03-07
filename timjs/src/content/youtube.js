/**
 * content/youtube.js
 * This content script runs on YouTube video and shorts pages.
 * It extracts the video genre from the page’s meta tag and returns it to the background script.
 */

console.log("Content script loaded for tab " + chrome.runtime.getManifest().name);
chrome.runtime.sendMessage({ action: "contentScriptLoaded" });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // Added sender argument for completeness, though not used in this case
  if (message.action === "extractGenre") {
    // Attempt to find a meta tag with the genre information
    const metaTag = document.querySelector('meta[itemprop="genre"]');
    let genre = "Unknown";
    if (metaTag) {
      genre = metaTag.getAttribute('content') || "Unknown";
    }
    // Send the genre back as a response
    sendResponse({ genre });
    return true; // Indicate you wish to use sendResponse asynchronously (important for onMessage in background script, even if response is immediate here)
  }
  return false; // Indicate you will send response synchronously or not at all for other messages.
});
