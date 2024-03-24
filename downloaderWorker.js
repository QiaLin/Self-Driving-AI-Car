// fileDownloader.js
self.onmessage = function(event) {
    const objectData = event.data.objectData;
    const fileName = event.data.fileName;
    
    const blob = new Blob([objectData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    // Append the <a> element to the document body and trigger the download
    document.body.appendChild(a);
    a.click();

    // Cleanup: Remove the <a> element and revoke the URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Post a message back to the main thread to indicate completion
    self.postMessage("download_complete");
};
