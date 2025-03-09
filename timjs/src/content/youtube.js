(function() {
  let genreExtracted = null;
  let currentUrl = location.href;
  let genrePromise = null; // [ADDED] Holds the promise from genre extraction.

  /**
   * Extracts the genre from a given document's HTML.
   * @param {Document} doc - The document to extract from.
   * @returns {string} The extracted genre or "Unknown".
   */
  function extractGenreFromDocument(doc) {
    const rawHTML = new XMLSerializer().serializeToString(doc);
    const regex = /<meta\s+itemprop=["']genre["']\s+content=["']([^"']+)["']/i;
    const match = regex.exec(rawHTML);
    return match ? match[1] : "Unknown";
  }

  /**
   * Updates the genre based on the current URL.
   * Returns a Promise that resolves with the genre.
   */
  function updateGenre() {
    if (!currentUrl.includes('/shorts/')) {
      genreExtracted = extractGenreFromDocument(document);
      return Promise.resolve(genreExtracted);
    } else {
      return fetch(currentUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(html, 'text/html');
          genreExtracted = extractGenreFromDocument(newDoc);
          return genreExtracted;
        })
        .catch(() => {
          genreExtracted = "Unknown";
          return "Unknown";
        });
    }
  }

  /**
   * Debounce function to limit rapid updates.
   * @param {function} func - The function to debounce.
   * @param {number} wait - Delay in milliseconds.
   */
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      return new Promise((resolve) => {
        timeout = setTimeout(() => resolve(func(...args)), wait);
      });
    };
  }

  // Debounced update to avoid too many rapid genre updates.
  const debouncedUpdateGenre = debounce(() => {
    genrePromise = updateGenre();
    return genrePromise;
  }, 500);

  // Listen to YouTube's SPA navigation event.
  window.addEventListener('yt-navigate-finish', () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      debouncedUpdateGenre();
    }
  });

  // Fallback polling: check for URL changes every 1000ms.
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      debouncedUpdateGenre();
    }
  }, 1000);

  // Listen for background messages requesting the YouTube genre.
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'get_youtube_genre') {
      if (genrePromise) {
        genrePromise.then((genre) => {
          sendResponse({ genre: genre || "Unknown" });
        });
      } else {
        sendResponse({ genre: genreExtracted || "Unknown" });
      }
      return true; // Keeps the message channel open for async response.
    }
  });

  // Initial genre extraction on content script load.
  debouncedUpdateGenre();
})();
