# M024: AI PDF & Image Knowledge Management

**Status:** `[in-progress]`\
**Created:** 2026-05-30\
**Last Updated:** 2026-05-30\
**Owner:** Luxurious Desktop / Convex Backend

## Objective

Give admins a dedicated AI knowledge page where they can upload PDF documents, images (JPG/PNG/WebP), or enter direct prompt templates/text,
turn them into searchable AI context, and remove stale knowledge without code
changes.

## Reference

- Cloned `hyson666/pdf-rag-mcp-server` into `reference/pdf-rag-mcp-server`.
- Removed the cloned `.git` directory to avoid nested Git conflicts.
- `reference/` is ignored and used only for local study.

## Decisions

- V1 supports text-based PDFs, raw text input, and image files (JPG, PNG, WebP).
- Scanned image PDFs are rejected with a clear ingestion error (OCR not applied to PDFs).
- Image files are processed via vision/OCR API to extract visible text and descriptions.
- Uploaded PDFs, images, and text inputs are stored in Convex file storage as `.pdf`, `.jpg`/`.png`/`.webp`, and `.txt`.
- Extracted chunks are stored in Convex and embedded into the existing `aiDbEmbeddings` vector index.
- Admins can delete a document, its chunks, its embeddings, and its storage file.
- Image extraction uses DeepSeek vision or equivalent server-side vision model to describe and transcribe image content.

## Phase 1: Backend Storage & Data Model

- [x] Add `aiKnowledgeDocuments` for uploaded PDF metadata/status.
- [x] Add `aiKnowledgeChunks` for extracted text chunks.
- [x] Add `aiKnowledgeChunks` as an embeddable AI source table.
- [x] Add admin-only upload URL generation.
- [x] Add admin-only delete with chunk/embedding/storage cleanup.

## Phase 2: Knowledge Ingestion

- [x] Add PDF and raw text ingestion action.
- [x] Extract best-effort text from text-based PDFs client-side using `pdf.js`.
- [x] Chunk extracted text for embedding.
- [x] Schedule embedding for each chunk.
- [x] Mark ingestion `ready` or `failed` with visible error.

## Phase 3: Admin UX

- [x] Add `/admin/ai-knowledge` route.
- [x] Add sidebar Admin Tools entry.
- [x] Add Admin Panel tool link.
- [x] Add upload form with toggle for PDF Document / Raw Text Template.
- [x] Add source list, search, open, and delete controls.
- [x] Keep existing admin visual style.

## Phase 4: Validation (PDF — Complete)

- [x] Run `npx convex codegen`.
- [x] Run `npx tsc --noEmit`.
- [x] Run `npm run build`.
- [x] Targeted ESLint for changed files.
- [x] Upload test PDF: `pdf-ai-knowledge/vft3402011093262470609_New-Member-guide-14-Jan-26-7M-EST.pdf`.
- [x] Confirm document becomes `ready` or shows actionable extraction error.

## Phase 5: Image Upload & OCR Extraction

- [x] Accept `.jpg`, `.jpeg`, `.png`, `.webp` in `ingestUploadedPdf` (rename concept to `ingestUploadedDocument` or keep backward-compatible).
- [x] Detect image mime types (`image/jpeg`, `image/png`, `image/webp`) in backend action.
- [x] For image files, fetch image bytes from Convex storage.
- [x] Send image to vision/OCR API (DeepSeek vision or OpenAI vision) with prompt: "Extract all visible text, labels, diagrams, and describe the content for knowledge retrieval."
- [x] Use vision response as `extractedText` for chunking.
- [x] Reject images where vision extraction yields < 10 chars.
- [x] Update desktop UI file input to accept `image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp` alongside PDF.
- [x] Add "Image" option to upload type segmented control (or merge into "PDF / Image Document" option).
- [x] Skip client-side PDF text extraction for image files — server vision handles it.
- [x] Show appropriate progress toast for image processing.
- [x] Update hero description and empty-state copy to mention images.

## Phase 6: Image Validation

- [x] Run `npx convex codegen`.
- [x] Run `npx tsc --noEmit`.
- [x] Run `npm run build`.
- [ ] Upload test JPG with visible text. Confirm `ready` with chunks.
- [ ] Upload test PNG with diagram/labels. Confirm `ready`.
- [ ] Upload blank/noise image. Confirm `failed` with clear error.
- [ ] Verify image document appears in knowledge library with correct metadata.
- [ ] Verify AI chat can answer questions from image-extracted knowledge.

## Validation Notes

- Browser check passed at `http://localhost:5173/admin/ai-knowledge`.
- Test PDF uploaded successfully and became `ready` with 40 chunks.
- Local test PDF is ignored by Git via `pdf-ai-knowledge/`.

## Acceptance Criteria

- Admin can open AI Knowledge from sidebar/admin tools.
- Admin can upload a PDF and see ingestion status.
- Admin can upload an image (JPG/PNG/WebP) and see ingestion status.
- Image content is extracted via server-side vision API and chunked for embedding.
- Admin can remove a knowledge source completely.
- Uploaded text PDF chunks become searchable by AI semantic search.
- Uploaded image-extracted text chunks become searchable by AI semantic search.
- Non-admin users cannot upload, list, or delete knowledge sources.
