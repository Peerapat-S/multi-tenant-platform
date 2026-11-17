# Project Specification: Netflix-Style Streaming Web Page

## 1. Tech Stack & Setup
- **Framework:** React (Next.js or Vite) with TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (`lucide-react`)
- **Responsive Design:** Mobile-first, fully responsive across Mobile, Tablet, and Desktop (1440px+).

## 2. Color Palette & Typography (Design Tokens)
- **Primary Background:** `#141414` (Deep Cinema Black)
- **Secondary / Card Background:** `#181818`
- **Navbar Scrolled Background:** `#0B0B0B` (with smooth transition from transparent gradient)
- **Primary Brand Accent:** `#E50914` (Netflix Red) & `#B20710` (Hover Red)
- **Text Primary:** `#FFFFFF` (Pure White)
- **Text Secondary:** `#B3B3B3` (Light Gray)
- **Text Muted / Metadata:** `#808080`
- **Match Score Accent:** `#46D369` (Neon Green for "98% Match")
- **Font Family:** Sans-serif (`Inter`, `Helvetica Neue`, or system-ui), clean and high-contrast.

## 3. Page Architecture & Layout Sections

### A. Sticky Top Navigation Bar (`Navbar.tsx`)
- **Position:** `fixed top-0 w-full z-50 transition-colors duration-300`
- **State Behavior:** Transparent with a top-down dark gradient (`from-black/80 to-transparent`) when `scrollY === 0`. Turns solid `#141414` when scrolled past `50px`.
- **Left Side:** Bold red brand logo text (`NETFLIX` or custom logo) + Navigation links (`Home`, `TV Shows`, `Movies`, `New & Popular`, `My List`). Hide links behind a dropdown menu on mobile.
- **Right Side:** Search icon (expands into an inline search input on click), Notification bell icon with red badge, User Avatar square (`rounded-md`) with dropdown caret.

### B. Full-Bleed Hero Banner (`HeroBanner.tsx`)
- **Height:** `h-[75vh] md:h-[85vh]` full-width container.
- **Background:** High-resolution cinematic landscape backdrop image with dual vignette overlays:
  1. Left-to-right gradient (`bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent`) for text readability.
  2. Bottom fade gradient (`bg-gradient-to-t from-[#141414] via-transparent to-transparent`) to blend seamlessly into the first content row.
- **Content Overlay (Left-aligned, max-w-xl):**
  - **Badge:** "N SERIES" or "TOP 10 TODAY" tag.
  - **Title:** Large bold display title (`text-4xl md:text-6xl font-extrabold`).
  - **Synopsis:** 2-3 lines description (`line-clamp-3 text-gray-200`).
  - **Action Buttons:**
    - `Play` Button: White background (`bg-white text-black hover:bg-white/80 font-bold px-6 py-2.5 rounded flex items-center gap-2`).
    - `More Info` Button: Translucent gray (`bg-gray-500/70 text-white hover:bg-gray-500/50 font-semibold px-6 py-2.5 rounded flex items-center gap-2`).

### C. Content Rows & Horizontal Carousels (`ContentRow.tsx`)
- **Pull-up Overlap:** First row overlaps the bottom of the Hero Banner (`-mt-24 relative z-20`).
- **Row Categories (Mock 5-6 rows):**
  1. `Trending Now`
  2. `Top 10 Movies in Thailand Today` (Include large stylized rank numbers `1` to `10` next to vertical posters)
  3. `Sci-Fi & Cyberpunk Thrillers`
  4. `Continue Watching for User` (Include a thin red progress bar at the bottom of each card)
  5. `Critically Acclaimed Dramas`
- **Scrolling Mechanics:**
  - Horizontal scrollable flex container (`overflow-x-scroll scrollbar-hide scroll-smooth`).
  - Left & Right chevron arrow buttons that appear on row hover to scroll smoothly by viewport width.

### D. Interactive Media Card (`MovieCard.tsx`)
- **Aspect Ratio:** `16:9` landscape thumbnails (`w-[200px] md:w-[260px] flex-none rounded-md overflow-hidden cursor-pointer`).
- **Hover Micro-interaction:**
  - Smooth scale-up (`hover:scale-110 hover:z-30 transition-transform duration-300 delay-150`).
  - Reveals a quick-info panel below the thumbnail containing:
    - Circular action icons: `Play` (white fill), `Add to My List` (`+`), `Like` (Thumbs up), and `Expand Details` (Chevron down).
    - Metadata row: `98% Match` (in `#46D369`), Maturity badge (`16+` bordered box), Duration (`2h 14m` or `3 Seasons`).
    - Genre tags separated by subtle dots (`Sci-Fi • Suspenseful • Dark`).

### E. Title Detail Modal (`DetailModal.tsx`)
- **Trigger:** Clicking `More Info` on Hero or clicking any `MovieCard`.
- **Layout:** Centered modal (`max-w-3xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl`) with a dark backdrop overlay (`bg-black/75`).
- **Contents:**
  - Close button (`X`) in the top-right corner.
  - Large preview banner with gradient fade, title, `Play` button, and `+` wishlist toggle.
  - Two-column details grid:
    - **Left (65%):** Release year, maturity rating, full synopsis.
    - **Right (35%):** Cast list, Genres, Mood tags.
  - **Episodes / Similar Titles section:** Clean vertical list of episodes or 3-column grid of related content.

### F. Minimal Dark Footer (`Footer.tsx`)
- Centered container (`max-w-4xl mx-auto text-[#808080] text-sm py-12`).
- Social media icons row, 4-column grid of standard footer links (Audio and Subtitles, Help Center, Terms of Use, Privacy), Service Code button, and copyright text.

## 4. Data & Functional Requirements
- Create a clean `mockData.ts` file with realistic movie/series objects (id, title, backdropUrl, posterUrl, matchScore, ageRating, duration, genres, description, cast, isTop10, watchProgress).
- Use reliable placeholder images (e.g., Unsplash dark/cinematic photography URLs) so there are no broken image icons.
- Implement working state for:
  1. **Search Filter:** Typing in the navbar search bar filters and displays matching titles in a grid view.
  2. **My List Toggle:** Clicking `+` adds/removes items from a "My List" state and shows a checkmark `✓`.
  3. **Modal Open/Close:** Clicking any card opens its corresponding details in the `DetailModal` (closeable via `X`, clicking outside, or `Esc` key).