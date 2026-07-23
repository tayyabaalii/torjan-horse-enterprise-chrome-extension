import { createRoot, type Root } from "react-dom/client";
import { StrictMode, useCallback, useState } from "react";
import { CompanionPanel } from "../components/CompanionPanel";
import { companionStyles } from "../components/companion-styles";
import { extractPageContext, observeReady } from "../lib/extractors";
import type { PageContext } from "../lib/types";

const HOST_ID = "enterprise-companion-root";

function CompanionApp() {
  const [context, setContext] = useState<PageContext>(() => extractPageContext());

  const refresh = useCallback(() => {
    setContext(extractPageContext());
  }, []);

  return (
    <StrictMode>
      <CompanionPanel context={context} onRefreshContext={refresh} />
    </StrictMode>
  );
}

/**
 * Mount React into an open Shadow DOM so host-site CSS cannot collide
 * with the companion UI (Enterprise Tip from the architecture brief).
 */
function mountShadowUi(): Root {
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = companionStyles;
  shadow.appendChild(style);

  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(<CompanionApp />);
  return root;
}

export default defineContentScript({
  matches: [
    "*://*.salesforce.com/*",
    "*://*.force.com/*",
    "*://*.lightning.force.com/*",
    "*://*.linkedin.com/*",
    "*://*.hubspot.com/*",
    "*://localhost/*",
  ],
  // Run after DOM is available; SPA hosts still need mutation observation
  runAt: "document_idle",
  main() {
    void (async () => {
      await observeReady(
        () =>
          Boolean(document.body) &&
          (document.querySelector("h1") !== null ||
            document.querySelector("[data-companion-name]") !== null ||
            document.body.childElementCount > 2),
      );
      mountShadowUi();

      // Re-extract when SPA navigation changes the URL (Lightning / LinkedIn)
      let lastUrl = location.href;
      const navWatcher = new MutationObserver(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          // Remount to refresh context for the new record/page
          mountShadowUi();
        }
      });
      navWatcher.observe(document.body, { childList: true, subtree: true });
    })();
  },
});
