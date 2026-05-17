# M012-SOCIAL-POSTING: Technical Specification

## Context
Luxurious currently has system activity feed behavior in [ActivityFeedPage.tsx](/C:/projects/convex/luxurious/src/pages/dashboard/ActivityFeedPage.tsx:31) backed by derived notification events in [convex/notifications.ts](/C:/projects/convex/luxurious/convex/notifications.ts:84). It does not have real user-authored social content, media posts, engagement, drafts, or post-detail flows.

M012 defines social posting v1 as a new product surface. Goal is not Instagram visual cloning. Goal is Instagram-grade posting and browsing flow mapped into Luxurious brand language:

- premium blue / gold / navy palette
- sharp card surfaces
- high-legibility dark mode
- clean light mode
- media-first feed
- fast draft-first posting

Implementation started on `2026-05-16`.

Current code slice ships:

- `convex/socialFeed.ts` schema-backed API
- `src/pages/dashboard/SocialFeedPage.tsx`
- `src/pages/dashboard/SocialComposerPage.tsx`
- `src/pages/dashboard/SocialPostDetailPage.tsx`
- `src/pages/dashboard/SocialAuthorPage.tsx`

Current gaps versus full spec:

- async transcode / poster pipeline not wired yet
- feed queries are bounded `take()` queries, not cursor pagination yet
- draft media reorder exists in backend API but no drag UI yet
- raw uploaded media currently doubles as delivery asset

## Product Goal
Build spec for authenticated social feed where logged-in users can:

- create photo/video posts
- save unfinished work automatically as draft
- publish to shared in-app feed
- choose `public` or `private` visibility per post
- browse feed, open post detail, like, comment, save, and copy internal share link

V1 intentionally excludes:

- stories
- reels
- direct messages
- follower graph
- mention parsing
- in-app media editing beyond ordering, crop intent, preview, and removal
- anonymous/public-internet viewing

## Product Scope Decisions

### Included in V1
- global authenticated home feed
- media-first post composer
- image and video support
- mixed-media carousel support
- single active draft per author
- hashtag parsing and hashtag-based filtering
- likes
- flat comments
- saves
- copy-link share
- author post listing page

### Excluded in V1
- social graph
- story tray
- reel-only vertical video surface
- nested comment threads
- comment editing
- reposts
- quote-posts
- push notification spec for social engagement
- public web SEO pages

## Routes and Surface Ownership

### New Social Surfaces
- `/social-feed`
  - primary authenticated feed
- `/social-feed/new`
  - deep-linkable composer entry
  - full-screen page on mobile
  - centered modal/page-shell on desktop
- `/social-feed/post/:postId`
  - post detail with comments
- `/social-feed/user/:userId`
  - author post listing

### Existing Surface Rule
- Existing `/activity-feed` remains system events / operational notifications
- Social posting does not replace notification feed in M012 spec
- Nav naming for later implementation should use `Social Feed`, not `Activity Feed`

## Audience and Visibility Model

### Auth Boundary
- All feed surfaces require logged-in app user
- No anonymous viewer support
- Shared links resolve to app route and force login before content load

### Visibility Values
- `public`
  - visible to every logged-in user in global feed
  - visible on author profile listing
  - visible on direct post URL to any authenticated user
- `private`
  - visible only to author and admin users
  - excluded from global feed for everyone else
  - excluded from other-user profile views
  - direct link shows authorization/visibility error to non-author, non-admin viewers

### Why This Rule
No friend/follower graph exists today. Owner-only private posts are only clean v1 interpretation that avoids fake privacy semantics.

## UX Blueprint

### Design Direction
Interaction model follows modern Instagram patterns:

- media-first cards
- bottom/inline engagement row
- quick composer entry
- fast preview flow
- sticky feed controls
- immersive post detail

Visual style stays Luxurious:

- dark mode uses deep navy shell and elevated indigo cards
- light mode uses cool gray-blue background and crisp white cards
- gold is reserved for emphasis, CTA, active chips, and premium actions
- blue remains primary action and interactive focus color

### Source of Truth Tokens
Use `src/index.css`, not `docs/design-system.md`.

Core tokens:

- light:
  - `--background: 210 20% 97%`
  - `--foreground: 222 47% 12%`
  - `--card: 0 0% 100%`
  - `--primary: 221 83% 53%`
  - `--secondary: 43 96% 48%`
- dark:
  - `--background: 221 49% 11%`
  - `--foreground: 213 36% 97%`
  - `--card: 218 40% 14%`
  - `--primary: 221 83% 53%`
  - `--secondary: 43 96% 48%`

## Screen-by-Screen UX

### 1. Home Feed: `/social-feed`

#### Layout
- Center-column feed shell
- Mobile:
  - full-width scrolling feed
  - sticky top bar
  - composer CTA pinned near top
- Desktop:
  - center column around `720px`
  - optional left filter rail and right lightweight context rail in later implementation
  - feed remains primary focus, not dashboard-grid layout

#### Top Bar
- page title: `Social Feed`
- subtle subtitle: `Photos, videos, and updates from Luxurious members`
- actions:
  - create post CTA
  - saved posts filter
  - my posts filter

#### Feed Ordering
- reverse chronological by `publishedAt`
- no ranking algorithm in v1
- pinned or sponsored posts excluded from v1

#### Feed Filtering
- users can filter feed by hashtag from:
  - tapped hashtag inside caption
  - search entry with `#tag`
  - dedicated active filter chip row
- hashtag filtering is exact-match on normalized hashtag token
- multi-hashtag boolean composition excluded from v1

#### Feed Entry
Each post card contains:

- author avatar
- author display name
- timestamp
- visibility badge
- overflow menu
- media block
- caption preview with expand/collapse
- engagement row
- lightweight counts
- comment preview

#### Feed Card Anatomy
- top meta row
  - avatar from profile if available
  - display name
  - secondary line with relative time
  - `Public` or `Private` chip
- media zone
  - 1 image/video: edge-to-edge rounded media block
  - multi-media: swipeable carousel with dot indicators
  - video: poster image + play affordance + duration badge
- caption zone
  - first three lines visible by default
  - `more` expands inline
- action row
  - like
  - comment
  - save
  - share
- footer meta
  - like count
  - comment count
  - optional `Saved` state
  - tappable hashtag row when post contains hashtags

#### Feed Empty States
- no posts yet:
  - large media icon
  - message: `No posts yet`
  - CTA: `Create first post`
- filtered empty state:
  - message tied to active filter, not generic failure

#### Feed Loading State
- skeleton author row
- skeleton media frame
- skeleton caption bars
- show 3 placeholder cards minimum

### 2. Composer Entry Points
- primary top-bar CTA: `New Post`
- optional floating action button on mobile
- author profile page secondary CTA: `Post`
- empty feed CTA routes into same composer

### 3. Composer: `/social-feed/new`

#### Container
- Mobile:
  - full-screen page
- Desktop:
  - large centered modal/page sheet
  - max width `840px`

#### Composer Steps
1. Resume draft check
2. Select media
3. Arrange and preview media
4. Write caption and choose privacy
5. Publish

#### Resume Draft Check
If active draft exists on composer open:

- show modal/sheet:
  - `Resume Draft`
  - `Discard Draft`
  - `Start Fresh`
- `Resume Draft`
  - reopen existing draft
- `Discard Draft`
  - delete draft and draft media associations
- `Start Fresh`
  - same result as discard then open empty composer

V1 rule:
- one active draft per author at a time

#### Media Selection
- CTA cards:
  - `Add Photos`
  - `Add Video`
- allow selecting mixed media in one post
- max 10 items total
- max 3 video items total
- max cumulative uploaded video duration per post: 10 minutes

#### Media Constraints
- images:
  - jpeg
  - png
  - webp
  - max 20 MB each
  - backend processing converts accepted raster uploads to optimized `image/webp`
- video:
  - mp4
  - mov
  - max 250 MB each
  - max 10 minutes cumulative duration per post
  - backend processing converts uploaded video to normalized delivery format
  - preferred delivery target: `video/mp4` with H.264 video and AAC audio for broad compatibility

#### Upload and Processing Pipeline
- raw file upload lands in Convex File Storage first
- upload does not mean post-ready
- every asset enters async processing pipeline:
  - image validation
  - image compression
  - image conversion to WebP
  - video validation
  - video transcode to delivery-safe format
  - poster frame extraction for video
  - metadata extraction
- UI must show per-asset state:
  - `Uploading`
  - `Processing`
  - `Ready`
  - `Failed`
- publish remains blocked until all attached assets are `Ready`

#### Media Arrangement
- reorder by drag on desktop and press-drag on mobile
- remove item with top-corner action
- choose cover from first visible frame for video
- crop intent:
  - v1 UI may expose aspect preview but does not require server crop pipeline
  - spec assumes client-side presentation crop only

#### Caption Composer
- multiline field
- max length: 2,200 characters
- inline counter
- optional line breaks preserved
- hashtags parsed and visually highlighted in preview
- hashtag rules:
  - `#` followed by letters or digits
  - normalize to lowercase for storage and filtering
  - preserve author-entered casing for render if desired by UI
  - max 20 hashtags per post
  - duplicate hashtags collapse to unique normalized set in backend metadata
- mention enrichment excluded in v1

#### Privacy Selector
- segmented control or pill group:
  - `Public`
  - `Private`
- explanatory helper text:
  - `Public: visible to all logged-in users`
  - `Private: visible only to you and admins`

#### Autosave
- debounce: 800 ms after user stops typing or editing
- force save on:
  - media attach
  - reorder
  - remove
  - privacy change
  - route leave
  - tab close prompt trigger
- autosave indicator:
  - `Saving...`
  - `Saved`
  - `Save failed`

#### Background Processing and Notification UX
- if upload/processing outlasts immediate composer interaction, system continues in background
- user may leave composer after draft save while assets process
- UI must show draft-level processing banner when composer is reopened
- on successful processing completion, system issues in-app notification:
  - `Your media is ready to publish`
- on processing failure, system issues in-app notification:
  - `Some media failed processing`
- notification should use Luxurious in-app notification system, separate from social post feed content

#### Publish
- publish button disabled until:
  - at least one media item attached
  - all attached media in `ready` state
  - no validation errors
- on publish:
  - draft transitions to `publishing`
  - show progress shell
  - on success route to post detail
  - clear active draft state

### 4. Post Detail: `/social-feed/post/:postId`
- same card header and media priority as feed
- caption fully expanded
- comments list below
- comment composer pinned bottom on mobile, inline bottom on desktop
- oldest comments first
- flat comment list only

#### Comment Rules
- create comment
- delete own comment
- post author can delete comments on own post
- admin can delete any comment
- no replies
- no comment edit in v1

### 5. Author Page: `/social-feed/user/:userId`
- author header
  - avatar
  - display name
  - post count
- authenticated viewer sees:
  - own profile: own public + private posts
  - other profile: public posts only
- grid/list toggle is optional later; v1 defaults to stacked cards

## Dark and Light UI Rules

### Shared Rules
- rounded cards
- strong media framing
- thin borders with restrained glow
- gold only for emphasis, not entire page chroma
- avoid Instagram pink/orange gradients

### Dark Mode
- shell: `hsl(var(--background))`
- primary card: `hsl(var(--card))`
- elevated hover/overlay: `hsl(var(--accent))`
- border: `hsl(var(--border))`
- primary CTA: `hsl(var(--primary))`
- premium CTA or active badge: `hsl(var(--secondary))`
- media frame shadows use low-spread navy shadows, not black slabs

### Light Mode
- shell: soft gray-blue page background
- cards: pure white
- borders: cool neutral blue-gray
- text: deep navy
- gold accents must stay saturated but used sparingly

### Specific Component Styling
- feed shell:
  - dark: navy canvas with subtle depth
  - light: clean editorial white-card stack
- composer:
  - desktop modal with large preview column + form column
  - mobile full-screen with sticky header/footer
- chips:
  - `Public` uses blue-muted treatment
  - `Private` uses gold-muted treatment
- buttons:
  - primary publish = blue
  - premium/high-priority CTA may use gold
  - destructive discard = red, never gold

## Backend Schema Additions

### Canonical Identity
Posts are owned by `users`.
If a matching `mobileProfiles.userId` exists, UI may enrich display with profile display name and avatar.

Canonical author fields:
- `authorUserId`
- optional `authorProfileId`

### Table 1: `socialMediaAssets`
Purpose: generalized uploaded asset registry for post media.

Fields:
- `ownerUserId: v.id("users")`
- `ownerProfileId: v.optional(v.id("mobileProfiles"))`
- `originalStorageId: v.id("_storage")`
- `processedStorageId: v.optional(v.id("_storage"))`
- `kind: v.union(v.literal("image"), v.literal("video"))`
- `mimeType: v.string()`
- `processedMimeType: v.optional(v.string())`
- `fileName: v.optional(v.string())`
- `sizeBytes: v.number()`
- `processedSizeBytes: v.optional(v.number())`
- `width: v.optional(v.number())`
- `height: v.optional(v.number())`
- `durationMs: v.optional(v.number())`
- `posterStorageId: v.optional(v.id("_storage"))`
- `processingStatus: v.union(v.literal("uploading"), v.literal("queued"), v.literal("processing"), v.literal("ready"), v.literal("failed"))`
- `processingError: v.optional(v.string())`
- `transcodeProfile: v.optional(v.string())`
- `checksum: v.optional(v.string())`
- `sourceExtension: v.optional(v.string())`
- `createdAt: v.number()`
- `updatedAt: v.number()`

Indexes:
- `by_ownerUserId_and_createdAt`
- `by_ownerUserId_and_processingStatus_and_createdAt`
- `by_processingStatus_and_createdAt`

### Table 2: `socialPosts`
Purpose: single source of truth for drafts and published posts.

Fields:
- `authorUserId: v.id("users")`
- `authorProfileId: v.optional(v.id("mobileProfiles"))`
- `caption: v.optional(v.string())`
- `hashtags: v.array(v.string())`  
  - denormalized normalized hashtag list for render/support logic
- `visibility: v.union(v.literal("public"), v.literal("private"))`
- `lifecycle: v.union(v.literal("draft"), v.literal("publishing"), v.literal("published"), v.literal("archived"), v.literal("deleted"))`
- `moderationStatus: v.union(v.literal("clear"), v.literal("flagged"), v.literal("removed"))`
- `mediaCount: v.number()`
- `likeCount: v.number()`
- `commentCount: v.number()`
- `saveCount: v.number()`
- `publishedAt: v.optional(v.number())`
- `lastEditedAt: v.number()`
- `createdAt: v.number()`
- `updatedAt: v.number()`

Indexes:
- `by_authorUserId_and_lifecycle_and_updatedAt`
- `by_authorUserId_and_lifecycle_and_createdAt`
- `by_lifecycle_and_visibility_and_publishedAt`
- `by_visibility_and_publishedAt`

Rules:
- one active draft per author
- enforce application-level uniqueness by querying author + `lifecycle = "draft"`

### Table 3: `socialPostMedia`
Purpose: ordered media mapping for each post.

Fields:
- `postId: v.id("socialPosts")`
- `assetId: v.id("socialMediaAssets")`
- `sortOrder: v.number()`
- `altText: v.optional(v.string())`
- `createdAt: v.number()`

Indexes:
- `by_postId_and_sortOrder`
- `by_assetId`

### Table 4: `socialPostLikes`
Purpose: unique like relation.

Fields:
- `postId: v.id("socialPosts")`
- `userId: v.id("users")`
- `createdAt: v.number()`

Indexes:
- `by_postId_and_createdAt`
- `by_postId_and_userId`
- `by_userId_and_createdAt`

### Table 5: `socialPostComments`
Purpose: flat comment stream.

Fields:
- `postId: v.id("socialPosts")`
- `authorUserId: v.id("users")`
- `authorProfileId: v.optional(v.id("mobileProfiles"))`
- `body: v.string()`
- `status: v.union(v.literal("visible"), v.literal("deleted"), v.literal("removed"))`
- `createdAt: v.number()`
- `updatedAt: v.number()`

Indexes:
- `by_postId_and_createdAt`
- `by_authorUserId_and_createdAt`

V1 rule:
- no `parentCommentId`

### Table 6: `socialSavedPosts`
Purpose: saved/unsaved relation.

Fields:
- `postId: v.id("socialPosts")`
- `userId: v.id("users")`
- `createdAt: v.number()`

Indexes:
- `by_userId_and_createdAt`
- `by_postId_and_userId`

### Table 7: `socialPostHashtags`
Purpose: normalized hashtag lookup table for fast feed filtering.

Fields:
- `postId: v.id("socialPosts")`
- `hashtag: v.string()`
- `createdAt: v.number()`

Indexes:
- `by_hashtag_and_createdAt`
- `by_postId`

## Storage Model
- Convex File Storage is mandatory storage backend for M012
- All raw and processed post media stored in Convex `_storage`
- `socialMediaAssets` is required metadata layer
- Upload flow uses generated upload URLs, then explicit attach mutation
- raw upload writes `originalStorageId`
- background processor writes `processedStorageId` and `posterStorageId` as needed
- image delivery source should be processed WebP asset, not raw original
- video delivery source should be processed normalized video asset, not raw original
- Published posts only reference assets in `ready` state
- Failed assets remain attachable to draft only for retry/remove UX

### Current Implementation Delta
- current implementation sets `processedStorageId = originalStorageId` on attach
- current implementation sets `processingStatus = "ready"` after metadata validation
- transcode, poster extraction, and retry queue are reserved for next slice

## Query and Mutation Surface

Module recommendation:
- `convex/socialFeed.ts`

Queries:
- `getHomeFeed({ scope, hashtag, limit })`
- `getPostDetail({ postId, commentLimit })`
- `getMyActiveDraft()`
- `getAuthorPosts({ userId, limit })`
- `listComments({ postId, limit })`

Mutations / actions:
- `createDraft()`
- `updateDraft({ postId, caption, visibility })`
- `discardDraft({ postId })`
- `generateMediaUploadUrl()`
- `attachDraftMedia({ postId, storageId, kind, mimeType, fileName, width, height, durationMs })`
- `reorderDraftMedia({ postId, orderedAssetIds })`
- `removeDraftMedia({ postId, assetId })`
- `publishDraft({ postId })`
- `toggleLike({ postId })`
- `createComment({ postId, body })`
- `deleteComment({ commentId })`
- `toggleSave({ postId })`

## Behavioral Rules

### Pagination
- cursor pagination is target state
- first implementation uses bounded queries (`take`) while route and schema settle
- feed default page size: 15 posts
- comments default page size: 25
- author posts default page size: 12

### Feed Eligibility
Include post in home feed only when:
- `lifecycle = "published"`
- `moderationStatus = "clear"`
- all attached assets are `ready`
- and:
  - `visibility = "public"`
  - or viewer is author/admin

### Publish Validation
Publish must fail when:
- zero attached media
- any attached asset not `ready`
- visibility missing
- caption too long
- hashtag count exceeds limit
- total video duration exceeds 10 minutes
- author is not owner of draft

### Likes and Saves
- optimistic UI allowed
- server authoritative count updates
- one like per user per post
- one save per user per post

### Comments
- optimistic create allowed
- delete should remove body from normal viewers and decrement visible count policy according to status transition
- v1 uses soft delete by status change, not hard delete

### Hashtag Rules
- hashtags extracted server-side from caption on every draft update and publish
- storage format uses normalized lowercase strings without `#`
- UI render may prepend `#`
- hashtag feed query uses normalized token
- invalid punctuation breaks hashtag token
- duplicate hashtags do not create duplicate stored values

### Media Processing Rules
- image uploads accepted as source formats, but delivery asset must be compressed WebP
- video uploads accepted as source formats, but delivery asset must be normalized to compatible MP4/H.264/AAC target
- processing runs asynchronously after upload and before publish eligibility
- processed asset supersedes original for playback/render
- raw originals may be retained temporarily for retry/audit but should not be used as delivery URL

### Current Slice Behavior
- accepted image/video uploads validate mime type and size on attach
- attach flow stores metadata rows immediately
- delivery uses raw uploaded asset for now
- publish still enforces `ready` state, but current attach step marks assets `ready`

### Soft Delete / Archive Policy
- draft discard:
  - mark draft post `deleted`
  - keep orphaned media eligible for background cleanup later
- published post delete:
  - set `lifecycle = "archived"` for author soft removal
  - admins may set `moderationStatus = "removed"`

### Moderation
- author can archive own post
- author can delete own comments
- post author can remove comments on their own posts
- admins can remove any post or comment
- no automated moderation pipeline in v1, only schema/status hooks

## Draft and Restore Lifecycle

### Single Active Draft Policy
- opening composer checks active draft first
- if one exists, user must resume or discard before clean composer starts
- no multi-draft picker in v1

### Autosave State Machine
- `draft`
  - editable
- `publishing`
  - locked
- `published`
  - visible by visibility rules
- `archived`
  - hidden from feed, still author-admin addressable
- `deleted`
  - discarded / removed terminal state

### Failure States
- upload failure:
  - keep draft intact
  - failed media item shows retry/remove
- processing failure:
  - keep draft intact
  - failed media item shows retry/remove
  - draft cannot publish while failed asset remains attached
- autosave failure:
  - draft remains open
  - show persistent failure banner
- publish failure:
  - return post to `draft`
  - preserve all form state

## Empty / Error / Moderation States

### Composer
- no media:
  - large upload dropzone with two clear CTAs
- failed media:
  - tile-level error chip
- processing media:
  - tile-level spinner plus `Processing` label
  - draft-level background banner when user leaves and returns
- no network:
  - autosave warning, local unsynced banner in future implementation

### Feed
- zero posts:
  - create-first-post illustration state
- private link unauthorized:
  - locked state with explanation
- removed post:
  - unavailable state, no media leak

## Performance Rules
- feed queries must avoid full scans
- counts served from denormalized `socialPosts` fields
- comments and media always loaded by indexed lookup
- no unbounded collection returns
- home feed ordered by indexed `publishedAt desc`
- hashtag feed ordered by indexed hashtag lookup + post publish ordering

## Later Implementation Slices
- Slice 1: schema + storage + draft API
  - shipped
- Slice 2: composer shell
  - shipped initial desktop version
- Slice 3: feed and post card UI
  - shipped initial desktop version
- Slice 4: post detail + comments
  - shipped flat-comment version
- Slice 5: async media processing, pagination, moderation edge cases
- Slice 6: mobile parity and polish

## Non-Goals
- viral growth mechanics
- follower/following graph
- algorithmic ranking
- reels player
- story ring system
- DMs
- comment replies
- anonymous sharing

## Acceptance Standard For This Spec
Spec is complete only if implementer can answer all without new product decisions:

- where social feed lives
- who can see public versus private
- how many drafts exist
- what tables exist
- what indexes exist
- what publish validates
- how uploads attach
- how draft resume works
- how post cards look in dark and light
- what is intentionally excluded from v1
