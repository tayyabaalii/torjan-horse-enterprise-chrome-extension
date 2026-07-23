/**
 * Isolated styles injected into Shadow DOM so host CSS (Salesforce, HubSpot, etc.)
 * cannot break the companion UI — and vice versa.
 */
export const companionStyles = `
  :host {
    all: initial;
    font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    color: #0f1c18;
  }

  * { box-sizing: border-box; }

  .companion-root {
    position: fixed;
    z-index: 2147483646;
    inset: 0;
    pointer-events: none;
  }

  .companion-fab,
  .companion-drawer,
  .companion-drawer * {
    pointer-events: auto;
  }

  .companion-fab {
    position: fixed;
    right: 20px;
    bottom: 24px;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 14px;
    background: linear-gradient(145deg, #0d5c4d 0%, #163a33 100%);
    color: #e8f5f1;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.04em;
    cursor: pointer;
    box-shadow: 0 10px 28px rgba(10, 40, 34, 0.35);
  }

  .companion-fab:hover {
    filter: brightness(1.08);
  }

  .companion-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: min(380px, 100vw);
    height: 100vh;
    background:
      radial-gradient(ellipse at 0% 0%, rgba(45, 140, 118, 0.18), transparent 55%),
      linear-gradient(180deg, #f4faf7 0%, #e7efe9 100%);
    border-left: 1px solid rgba(15, 40, 34, 0.12);
    box-shadow: -16px 0 40px rgba(8, 28, 24, 0.18);
    display: flex;
    flex-direction: column;
    padding: 20px 18px 16px;
    gap: 14px;
    overflow: auto;
  }

  .companion-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .eyebrow {
    margin: 0 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #2d6b5c;
    font-weight: 600;
  }

  .companion-header h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.25;
    font-weight: 650;
    color: #0c221c;
  }

  .icon-btn {
    border: 0;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: #3a524a;
    padding: 0 4px;
  }

  .companion-context {
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(20, 55, 46, 0.1);
    border-radius: 12px;
    padding: 12px 14px;
  }

  .context-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }

  .context-top strong {
    font-size: 15px;
  }

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 6px 8px;
    font-size: 13px;
  }

  dt {
    color: #5a6f67;
  }

  dd {
    margin: 0;
    color: #142821;
    word-break: break-word;
  }

  .mono {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 12px;
  }

  .companion-auth .primary,
  .action-card,
  .linkish {
    font-family: inherit;
  }

  .primary {
    width: 100%;
    border: 0;
    border-radius: 10px;
    padding: 11px 14px;
    background: #0d5c4d;
    color: #f2fbf7;
    font-weight: 600;
    cursor: pointer;
  }

  .primary:hover { background: #0a4a3e; }

  .ghost {
    border: 1px solid rgba(20, 55, 46, 0.2);
    border-radius: 10px;
    padding: 11px 14px;
    background: transparent;
    color: #0d5c4d;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .auth-inline {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .auth-inline input {
    border: 1px solid rgba(20, 55, 46, 0.18);
    border-radius: 8px;
    padding: 9px 10px;
    font: inherit;
    font-size: 13px;
    background: #fff;
  }

  .auth-btns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .auth-btns .primary { width: auto; }

  .auth-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: #2c4038;
  }

  .auth-row em {
    font-style: normal;
    font-weight: 600;
  }

  .linkish {
    border: 0;
    background: transparent;
    color: #0d5c4d;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .section-label {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #4d635a;
    font-weight: 600;
  }

  .action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .action-card {
    text-align: left;
    border: 1px solid rgba(20, 55, 46, 0.14);
    background: rgba(255, 255, 255, 0.85);
    border-radius: 10px;
    padding: 10px 11px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .action-card:hover:not(:disabled) {
    border-color: #0d5c4d;
    background: #fff;
  }

  .action-card:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .action-label {
    font-size: 13px;
    font-weight: 650;
    color: #0f241e;
  }

  .action-hint {
    font-size: 11px;
    color: #5a6f67;
  }

  .companion-result {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    padding: 10px 12px;
    border: 1px solid rgba(20, 55, 46, 0.1);
  }

  .muted { margin: 0; color: #5a6f67; font-size: 13px; }
  .error { margin: 0; color: #8b2e2e; font-size: 13px; }
  .ok .result-summary { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #0d5c4d; }

  pre {
    margin: 0;
    padding: 8px;
    background: #12241f;
    color: #d5ebe3;
    border-radius: 8px;
    font-size: 11px;
    overflow: auto;
    max-height: 160px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
  }

  .companion-footer {
    margin-top: auto;
    font-size: 11px;
    color: #5a6f67;
    line-height: 1.4;
    padding-top: 8px;
  }
`;
