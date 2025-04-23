import React, { useState, useEffect } from "react";
import browser from "webextension-polyfill";
import css from "./styles.module.css";

export function Popup() {
    const [domain, setDomain] = useState("");
    const [blockedDomains, setBlockedDomains] = useState<string[]>([]);

    // Fetch blocked domains on component mount
    useEffect(() => {
        browser.runtime.sendMessage({ popupMounted: true });
        loadBlockedDomains();
    }, []);

    const loadBlockedDomains = async () => {
        try {
            const result = await browser.storage.local.get("blockedDomains");
            if (result.blockedDomains) {
                setBlockedDomains(result.blockedDomains);
            }
        } catch (error) {
            console.error("Error loading blocked domains:", error);
        }
    };

    const addDomain = async () => {
        if (!domain.trim()) return;

        try {
            // Format domain (ensure no https://, etc.)
            const formattedDomain = domain
                .trim()
                .toLowerCase()
                .replace(/^https?:\/\//i, "")
                .replace(/^www\./i, "")
                .split("/")[0]; // Only keep domain part

            const newBlockedDomains = [...blockedDomains, formattedDomain];

            // Save to storage
            await browser.storage.local.set({
                blockedDomains: newBlockedDomains,
            });

            // Update state
            setBlockedDomains(newBlockedDomains);
            setDomain("");

            // Notify background script
            browser.runtime.sendMessage({ blockedDomainsUpdated: true });
        } catch (error) {
            console.error("Error adding domain:", error);
        }
    };

    const removeDomain = async (domainToRemove: string) => {
        try {
            const newBlockedDomains = blockedDomains.filter(
                (d) => d !== domainToRemove,
            );

            // Save to storage
            await browser.storage.local.set({
                blockedDomains: newBlockedDomains,
            });

            // Update state
            setBlockedDomains(newBlockedDomains);

            // Notify background script
            browser.runtime.sendMessage({ blockedDomainsUpdated: true });
        } catch (error) {
            console.error("Error removing domain:", error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addDomain();
        }
    };

    return (
        <div className={css.popupContainer}>
            <div className="mx-4 my-4">
                <h1 className="text-xl font-bold mb-4">Domain Blocker</h1>

                <div className="flex mb-4">
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter domain to block (e.g. utm.com)"
                        className="flex-grow border rounded p-2 mr-2"
                    />
                    <button
                        onClick={addDomain}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Add
                    </button>
                </div>

                {blockedDomains.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">
                            Blocked Domains:
                        </h2>
                        <ul className="border rounded p-2 max-h-48 overflow-y-auto">
                            {blockedDomains.map((d, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center py-1"
                                >
                                    <span>{d}</span>
                                    <button
                                        onClick={() => removeDomain(d)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
