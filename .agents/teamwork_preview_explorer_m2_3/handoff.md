# Handoff Report: Canvas High-DPI Sign Exports E2E Validation

This handoff report summarizes the read-only investigation and design of the E2E verification plan for the high-DPI Canvas signage generator in GridPass.

## 1. Observation

Direct observations made within the repository:
- **Offscreen Canvas Element:** Located in `c:\_Projects\Gridpass-v4\src\app\dash\page.tsx` on line 625:
  ```tsx
  <canvas ref={hiddenCanvasRef} className="hidden" />
  ```
- **High-DPI Coordinate Dimensions:** Explicitly initialized in `handleDownloadSign` on lines 435-436:
  ```javascript
  canvas.width = 2400;
  canvas.height = 3000;
  ```
- **CORS Image Configuration:** Prevents canvas tainting when loading the external QR code from `api.qrserver.com` in `handleDownloadSign` on line 512:
  ```javascript
  qrImg.crossOrigin = 'anonymous'; // Avoid tainted canvas warnings
  ```
- **Data Export Hook:** Draws the completed image data to a URL on line 582:
  ```javascript
  const dataUrl = canvas.toDataURL('image/png');
  ```
- **Root `package.json` Setup:** Evaluated `c:\_Projects\Gridpass-v4\package.json` and confirmed that no E2E testing framework is currently installed as a development dependency.

---

## 2. Logic Chain

1. **Resolution Layout Sizing:**
   * Setting the canvas dimensions explicitly to `2400` width and `3000` height guarantees that when printed at standard 8"x10" layout sheets, it matches the high-quality **300 DPI layout equivalent** standard for print layout output.
2. **CORS Safety Integration:**
   * Drawing external images from a CDN on a `<canvas>` element causes browser security engines to mark the canvas context as **tainted** unless the image is fetched via CORS.
   * By instantiating `qrImg.crossOrigin = 'anonymous'`, the browser initiates an HTTP request with CORS pre-flight requirements.
   * Since the public CDN `api.qrserver.com` is configured with wildcard origin sharing (`Access-Control-Allow-Origin: *`), the image is safely loaded and drawn.
   * The canvas remains clean, letting the application execute `.toDataURL()` successfully without throwing a `SecurityError` page exception.
3. **E2E Automation Requirements:**
   * Since this offscreen drawing process is asynchronous and on-demand, standard snapshot unit testing is insufficient.
   * An E2E test requires browser emulation (such as **Playwright**) to bypass authentication, input custom mock details in the vehicle builder, trigger the hidden canvas drawing routine via modal clicks, intercept the browser-level download prompt, sniff the downloaded file's raw binary buffer to verify PNG signatures and dimensions (2400x3000), and verify that no security exceptions were logged to the browser console.

---

## 3. Caveats

- **Read-Only Scoping:** The Playwright test script and its package configurations were not actually installed, written to source code, or run against live test instances.
- **Database Dependency:** The designed E2E test scripts assume a running backend environment (e.g. Firebase Auth & Firestore emulation or a dedicated development backend) with valid mock user login credentials (`driver@gridpass.app` / `paddockpassword123`).
- **CDN Flakiness:** The E2E script uses mock interception for `api.qrserver.com` via Playwright's `page.route` to prevent external network flakiness. If testing real CDN integration, tests may be subject to network latency or CDN outages.

---

## 4. Conclusion

The Canvas high-DPI sign exports mechanism is robustly structured and implements the correct cross-origin attributes to prevent tainted canvas exceptions. To provide long-term regression safety, we have designed a comprehensive Playwright E2E verification plan.

We propose:
1. Installing `@playwright/test` as a development dependency in the project.
2. Integrating the complete test script (detailed in `analysis.md`) into a `tests/` directory.
3. Stubbing or intercepting third-party CDN requests in testing environments to isolate canvas checks and avoid external network test failures.

---

## 5. Verification Method

To verify the investigation and E2E design findings:
- **Inspect Key Files:**
  * View `c:\_Projects\Gridpass-v4\.agents\teamwork_preview_explorer_m2_3\analysis.md` to inspect the full E2E Playwright test implementation and layout parameters.
  * Check `c:\_Projects\Gridpass-v4\src\app\dash\page.tsx` (specifically the `handleDownloadSign` function starting at line 423) to confirm the offscreen initialization, high-resolution bounds, and `.crossOrigin = 'anonymous'` usage.
- **Run the E2E Suite (Future Steps):**
  * Run the command `npx playwright test tests/canvas-export.spec.ts` once dependencies are installed.
  * Ensure the test completes successfully with zero `SecurityError` exceptions logged and that the sniffed image dimensions are exactly `2400x3000`.
