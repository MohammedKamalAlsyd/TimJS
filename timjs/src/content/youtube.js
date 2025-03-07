(function() {
    let genreExtracted = null;
    let currentUrl = location.href;
  
    // Extract genre from the current document using a regex.
    function extractGenre() {
      let rawHTML = new XMLSerializer().serializeToString(document);
      const regex = /<meta\s+itemprop=["']genre["']\s+content=["']([^"']+)["']/i;
      const match = regex.exec(rawHTML);
      return match ? match[1] : "Unknown";
    }
  
    // Update the extracted genre and log it.
    function updateGenre() {
      genreExtracted = extractGenre();
      console.log("Extracted genre:", genreExtracted);
    }
  
    // Initial extraction when the content script loads.
    updateGenre();
  
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            console.log("URL changed in YouTube tab:", currentUrl);
            updateGenre()
        }
    }, 1000); // Check every 1 second (adjust interval as needed)
  
    // Listen for background messages requesting the YouTube genre.
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'get_youtube_genre') {
        sendResponse({ genre: genreExtracted || "Unknown" });
      }
    });
  })();
  