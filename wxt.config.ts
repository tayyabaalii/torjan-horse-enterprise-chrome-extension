import { defineConfig } from "wxt";

// Manifest V3 enterprise "Trojan Horse" — injects SaaS UI into host platforms.
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Enterprise Companion",
    description:
      "Embed SaaS workflows inside Salesforce, LinkedIn, and legacy tools — no dashboard migration required.",
    permissions: ["storage", "identity", "alarms"],
    host_permissions: [
      "https://*.salesforce.com/*",
      "https://*.force.com/*",
      "https://*.lightning.force.com/*",
      "https://*.linkedin.com/*",
      "https://*.hubspot.com/*",
      "https://*.supabase.co/*",
      // Demo / local host pages for development
      "http://localhost/*",
      "https://localhost/*",
    ],
    // Replace with your OAuth client ID for Chrome identity API
    oauth2: {
      client_id: "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com",
      scopes: ["openid", "email", "profile"],
    },
  },
});
