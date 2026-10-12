/**
 * Global App Configuration for USIntellix Patient Mobile App
 */
export const CONFIG = {
    // Relative path or absolute URL pointing to the USIntellix HMS backend API
    API_BASE_URL: "/ims/usintellix-hospital-management-system/backend/public",
    
    // Fallback if accessed via direct port or virtual host
    getApiUrl(endpoint) {
        // If current origin has ims in the path or we are on localhost
        const path = window.location.pathname;
        if (path.includes("/ims/patient_mobile_app")) {
            return `/ims/usintellix-hospital-management-system/backend/public${endpoint}`;
        }
        // If hosted adjacent under web root
        return `../usintellix-hospital-management-system/backend/public${endpoint}`;
    },

    APP_NAME: "USIntellix",
    APP_SUBTITLE: "Patient Mobile Portal",
    VERSION: "1.0.0"
};
