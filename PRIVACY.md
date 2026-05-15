# FontMapper Privacy Policy

**Last updated:** 2026-05-15

FontMapper is a Chrome extension that lets users replace the fonts used on
websites with locally-installed fonts of their choice. This policy describes
what data FontMapper does — and does not — handle.

## Summary

FontMapper does not collect, transmit, sell, or share any personal data.
Everything stays on your device. FontMapper makes no network requests.

## What FontMapper stores locally

The extension stores the following information in your browser's local storage
(`chrome.storage.local`) only:

- The hostnames of sites where you have explicitly created a font mapping
  (e.g. `medium.com`)
- The mappings themselves — pairs of source font names and the local font
  names you have chosen as replacements

This data is:

- Stored only on your device, never transmitted anywhere
- Not synced to any Google account
- Not shared with the developer or any third party
- Deleted when you remove the extension or clear its storage

## What FontMapper reads from your device

To function, FontMapper accesses:

- **The list of fonts installed on your computer**, via the Chrome
  `fontSettings` API. The list is used only to populate the in-popup font
  picker. It is read on demand each time you open the popup and is never
  transmitted off-device.
- **The fonts used on the current page**, via a content script that inspects
  computed `font-family` values. No other page content, form input, or text
  is read. The scan result is sent only to the extension's own popup UI.

## What FontMapper does not collect

FontMapper does not collect, transmit, or share:

- Personally identifiable information (name, email, address, etc.)
- Authentication or financial information
- Page text, form input, keystrokes, clicks, or mouse movements
- Browsing history or visited URLs
- Analytics, telemetry, crash reports, or usage statistics

## Permissions

The extension requests the following Chrome permissions strictly for the
purposes above:

- `activeTab` — to interact with the tab you explicitly open the popup on
- `storage` — to remember your font mappings per domain, locally
- `fontSettings` — to read the list of fonts installed on your device
- Host permission for all URLs — to allow the content script to swap fonts on
  whichever sites you choose to customize

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
