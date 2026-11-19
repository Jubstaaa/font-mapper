# FontMapper Privacy Policy

**Last updated:** 2026-11-20

FontMapper is a Chrome extension that lets users replace the fonts used on
websites with fonts installed on their computer. This policy describes what
data FontMapper does — and does not — handle.

## Summary

FontMapper does not collect, transmit, sell, or share any personal data with
the developer or any third party. There are no FontMapper servers, and the
extension itself makes no network requests. Your font mappings are saved with
Chrome's own sync storage, so if Chrome Sync is turned on they travel with your
Google account to your other Chrome browsers.

## What FontMapper stores

**Font mappings — Chrome sync storage (`chrome.storage.sync`)**

- The hostnames of sites where you have created a font mapping
  (e.g. `medium.com`)
- The mappings themselves: each source font name, the local font you chose to
  replace it, and any typography adjustments you set (scale, bold, italic,
  line height, letter and word spacing, text color)

When you are signed in to Chrome with Sync turned on, Chrome syncs this data
through your Google account to the other Chrome browsers where you are signed
in. That transfer is performed and secured by Google Chrome under
[Google's Privacy Policy](https://policies.google.com/privacy); FontMapper
never sees it and the developer cannot access it. If Chrome Sync is off, the
data stays in this browser. If a sync write fails (for example because Chrome's
sync storage quota is reached), FontMapper keeps the mappings in this browser's
local storage (`chrome.storage.local`) instead.

**Installed font list — local storage only (`chrome.storage.local`)**

- The names of the fonts installed on your computer (family, full name,
  PostScript name and style), cached after you allow access on the options page
  so the popup's font picker can list them. This cache is never synced.

**Removing your data**

- Use **Clear all mappings** on the options page, or **Reset site** in the popup, to
  delete mappings. Clearing removes them from Chrome sync storage, and Chrome
  then removes them from your other synced browsers.
- Uninstalling the extension deletes everything it stored in this browser.

## What FontMapper reads from your device

- **The list of fonts installed on your computer**, through Chrome's Local Font
  Access API (`window.queryLocalFonts`). Chrome asks for your permission first.
  The list is read when you load or refresh it on the options page and is
  cached locally as described above; it is never transmitted.
- **The fonts used on the current page**, through a content script that reads
  computed `font-family` values on http and https pages. No other page content,
  form input or text is read. The result is sent only to the extension's own
  popup.

## What FontMapper does not collect

FontMapper does not collect, transmit, or share:

- Personally identifiable information (name, email, address, etc.)
- Authentication or financial information
- Page text, form input, keystrokes, clicks, or mouse movements
- Browsing history or visited URLs (only the hostnames you create mappings for
  are stored, as described above)
- Analytics, telemetry, crash reports, or usage statistics

## Permissions

The extension requests these Chrome permissions strictly for the purposes
above:

- `storage` — to save your font mappings (sync storage) and the cached font
  list (local storage)
- `activeTab` — to work with the tab you open the popup on
- Host permission for `http://*/*` and `https://*/*` — so the content script can
  detect and swap fonts on the websites you customize, and the toolbar badge can
  show whether the current site has mappings

The Local Font Access permission is requested by Chrome at runtime, when you
choose to load your installed fonts.

## Open source

The full source code is available at
[github.com/Jubstaaa/font-mapper](https://github.com/Jubstaaa/font-mapper).
You can verify the claims above by reading the code.

## Contact

Questions or concerns? Please open an issue at
[github.com/Jubstaaa/font-mapper/issues](https://github.com/Jubstaaa/font-mapper/issues).

## Changes to this policy

If this policy changes in a future release, the updated version will be
published in this repository, and the version shipped in the Chrome Web Store
listing will reference it. Substantive changes will be noted in the project's
release notes.
