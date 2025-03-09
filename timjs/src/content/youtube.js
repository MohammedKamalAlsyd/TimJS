(function() {
    let genreExtracted = null;
    let currentUrl = location.href;
  
    /**
     * Extracts the genre from a given document's HTML.
     * @param {Document} doc - The document to extract from.
     * @returns {string} The extracted genre or "Unknown".
     */
    function extractGenreFromDocument(doc) {
      // Serialize the entire document to string.
      const rawHTML = new XMLSerializer().serializeToString(doc);
      // Look for the meta tag with itemprop="genre".
      const regex = /<meta\s+itemprop=["']genre["']\s+content=["']([^"']+)["']/i;
      const match = regex.exec(rawHTML);
      return match ? match[1] : "Unknown";
    }
  
    /**
     * Updates the genre variable.
     * For regular videos, it uses the current document.
     * For shorts (or cases where the head isn’t updated), it fetches the new URL.
     */
    function updateGenre() {
      if (!currentUrl.includes('/shorts/')) {
        // For non-shorts, simply extract from the current document.
        genreExtracted = extractGenreFromDocument(document);
      } else {
        // For shorts, fetch the new page HTML and then extract.
        fetch(currentUrl)
          .then(response => response.text())
          .then(html => {
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            genreExtracted = extractGenreFromDocument(newDoc);
          })
          .catch(() => {
            genreExtracted = "Unknown";
          });
      }
    }
  
    // Listen to YouTube's navigation event (SPA navigation)
    window.addEventListener('yt-navigate-finish', () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        updateGenre();
      }
    });
  
    // Fallback: poll for URL changes every second.
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        updateGenre();
      }
    }, 1000);
  
    // Listen for background messages requesting the YouTube genre.
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'get_youtube_genre') {
        sendResponse({ genre: genreExtracted || "Unknown" });
      }
    });
  
    // Initial genre extraction on content script load.
    updateGenre();
  })();