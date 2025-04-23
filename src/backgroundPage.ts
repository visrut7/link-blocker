import browser from "webextension-polyfill";

// Store the blocked domains
let blockedDomains: string[] = [];

// Load blocked domains from storage
async function loadBlockedDomains() {
    try {
        const result = await browser.storage.local.get("blockedDomains");
        if (result.blockedDomains) {
            blockedDomains = result.blockedDomains;
            console.log("Loaded blocked domains:", blockedDomains);
        }
    } catch (error) {
        console.error("Error loading blocked domains:", error);
    }
}

// Initialize by loading blocked domains
loadBlockedDomains();

// Listen for messages sent from other parts of the extension
browser.runtime.onMessage.addListener(
    (request: { popupMounted?: boolean; blockedDomainsUpdated?: boolean }) => {
        // Log statement if request.popupMounted is true
        if (request.popupMounted) {
            console.log("backgroundPage notified that Popup has mounted.");
        }

        // Reload blocked domains if they've been updated
        if (request.blockedDomainsUpdated) {
            loadBlockedDomains();
        }
    },
);

// Function to determine if a URL should be blocked
function shouldBlockRequest(url: string): boolean {
    if (blockedDomains.length === 0) return false;

    try {
        // Parse the URL to get the hostname
        const hostname = new URL(url).hostname;

        // Check if the hostname matches any blocked domain
        return blockedDomains.some((domain) => {
            // Check for exact domain match or subdomain match
            return hostname === domain || hostname.endsWith("." + domain);
        });
    } catch (error) {
        console.error("Error checking URL:", error);
        return false;
    }
}

// Set up the web request listener to block requests
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const shouldBlock = shouldBlockRequest(details.url);
        if (shouldBlock) {
            console.log("Blocked request to:", details.url);
        }
        return { cancel: shouldBlock };
    },
    { urls: ["<all_urls>"] },
    ["blocking"],
);
