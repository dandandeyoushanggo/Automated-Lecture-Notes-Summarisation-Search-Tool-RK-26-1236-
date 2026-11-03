# Local website preview

Current language: Simplified Chinese. Continue development and UI review in Chinese; translate the completed product to English after all features are finished, as requested by the user. Uploaded materials retain their original language.

This is a browser-local interface preview prioritised at the user's request. It leaves the original Worker untouched and does not replace the planned Django backend.

Open through an HTTP server, not by double-clicking the HTML. Run `node preview/build.mjs` after changing the Worker interface, then serve the preview folder locally. The workspace includes three purpose-written sample notes. Uploaded notes and original files are kept in IndexedDB in this browser, not a cloud account. Deleting browser data removes them. Do not use this prototype as the sole copy of important lecture files.

Working interface flows: note library, three subject filters, full-text search, PDF/DOCX/TXT text extraction, original downloads, editing, personal comment text, extractive summaries, TXT export and print-to-PDF. PDF and DOCX reading requires the CDN reader to load. Scans and OCR are unsupported.

Cloud sign-in, recipient sharing, selection highlights, server-generated PDF and real LLM summaries remain backend work. The preview explicitly labels these limitations.
