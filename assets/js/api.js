import { CONFIG } from "./config.js";

/**
 * Universal API Client with Session & Cookie handling
 */
export async function apiRequest(endpoint, options = {}) {
    const url = CONFIG.getApiUrl(endpoint);
    
    const defaultHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const config = {
        credentials: "include", // Essential for PHP session cookies
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            return {
                success: false,
                message: `Server returned an invalid format (HTTP ${response.status}).`
            };
        }

        // Return parsed data along with HTTP status
        return {
            ...data,
            httpStatus: response.status
        };
    } catch (networkError) {
        console.error("API Error:", networkError);
        return {
            success: false,
            message: "Unable to reach hospital server. Please check your internet connection."
        };
    }
}
