# MASTER PROMPT — Dual-Mode Developer Portfolio: "IDE" × "Docs"

> Copy everything below the line into your AI builder (Cursor, v0, Claude, etc.) to generate the portfolio. It is fully self-contained: all of Hussein's real data is embedded.

---

## 1) ROLE & OBJECTIVE

You are a **senior front-end engineer + product designer**. Build a single, polished, production-quality **personal portfolio website** for **Hussein Taha**, a Full Stack Developer.

The portfolio is unique: it presents the **same content through two switchable experiences ("modes")**, toggled by one elegant control that is always visible:

- **Mode A — "IDE / Code Editor":** The site looks and behaves like Hussein's **React project opened inside VS Code**. Visitors "read the code" to learn about him, click files in the explorer, and press **▶ Run** to reveal the rendered result.
- **Mode B — "UI Library Docs":** The site looks like the **documentation of a component library** (think shadcn/ui, Radix, MUI, or Storybook). Each part of Hussein's profile is a documented "component" with a **live Preview + Code tabs + a props/features table**.

The goal: a memorable, "wow" portfolio that proves front-end craft, attention to detail, and product sense — while remaining fast, accessible, and easy to run.

---

## 2) HARD TECH CONSTRAINTS (must follow exactly)

- Output must be **100% static**: **HTML + Tailwind CSS + vanilla JavaScript only**.
- **No** React/Vue/Angular/Svelte, **no** build step, **no** bundler, **no** npm, **no** TypeScript.
- Load **Tailwind via the Play CDN** (`https://cdn.tailwindcss.com`). Configure theme tokens + `darkMode: 'class'` via an inline `tailwind.config` script.
- All interactivity in **plain ES6 JavaScript** (modules or a single file are both fine).
- **Optional single dependency:** one CDN syntax highlighter (Prism.js **or** highlight.js) *only* for coloring code. If you prefer zero deps, implement lightweight token highlighting yourself. No other runtime libraries.
- The whole thing must run by **double-clicking `index.html`** (no server required).
- Clean, commented, well-organized code. Mobile-first and responsive.

---

## 3) DEVELOPER DATA (use this exact content)

**Identity**
- Name: **Hussein Taha Hussein Ismail**
- Title: **Full Stack Developer**
- Location: **Cairo, Egypt**
- Email: **hussien212258@gmail.com**
- Phone: **+20 155 634 4022**
- GitHub: **https://github.com/HussienTaha** (username: `HussienTaha`)
- LinkedIn: **https://www.linkedin.com/in/hussien-taha-99ba24386**
- GitHub stats: **11 followers · 9 following**, achievement: **Pull Shark**
- Assets available locally: `logo.jfif` (use as brand mark + favicon), `Hussein Taha CV.pdf` (wire up a **"Download Résumé"** button/link).

**Professional summary**
> Results-driven Full Stack Developer with one year of professional experience in the Information Systems Branch of the Egyptian Naval Forces, complemented by freelance work. Specializing in building scalable web applications, robust APIs, and responsive user interfaces. Proficient in TypeScript, React, Next.js (Front-End), and NestJS (Back-End), with a strong foundation in software engineering principles. Passionate about writing clean, efficient code and delivering high-quality, performance-optimized solutions.

**Technical skills** (group these as badges/props)
- **Languages:** TypeScript, JavaScript, Python, Java, C#
- **Front-End:** React, Next.js, HTML5, CSS3, SASS, Bootstrap, Tailwind CSS
- **Back-End:** Node.js, Express.js, NestJS
- **Databases:** MongoDB, MySQL, PostgreSQL
- **Tools & Platforms:** Git, Docker, Postman, VS Code, AWS, Firebase, CI/CD

**Experience**
- **Freelance Full Stack Developer** — Cairo, Egypt — *2024 – Present*
  - Developed end-to-end web applications using TypeScript, Next.js (front-end), and NestJS (back-end).
  - Designed and implemented RESTful APIs and GraphQL endpoints.
  - Built responsive, accessible UIs using React, Next.js, Bootstrap, and Tailwind CSS.
  - Modeled database schemas and optimized queries using MongoDB and MySQL.
  - Managed full project lifecycles independently, ensuring timely delivery and client satisfaction.

- **Full-Stack Developer** — Information Systems Branch, Egyptian Naval Forces — *2026 – 2027*
  - Developed internal full-stack applications for the Egyptian Naval Forces information systems.
  - Collaborated with cross-functional teams to deliver secure, high‑performance solutions.
  - Maintained and enhanced existing systems, ensuring reliability and compliance.

**Education & training**
- **B.Sc. Software Engineering** — Faculty of Computers & Information, **Assiut University** — Graduated **2025**, Grade: **Very Good**.
- **Full Stack Development Course** — **Route Academy**.

**Languages**
- Arabic (Native) · English (Fluent)

**Featured projects** (each = a "component" in Docs mode / a source file in IDE mode)
1. **TaskFlow-jira** — *TypeScript* — Full-stack, real-time task-management system (Jira-style) for managing tasks, teams, and progress in a way that feels fast and organized. Tech: TypeScript, Next.js, NestJS, real-time.
2. **Chat_Social_App** — *JavaScript* — Real-time social chat app: connect with friends, create groups & conversations; **Socket.IO** on client and server.
3. **E-commerceApp-Nestjs** — *TypeScript* — E-commerce application with a **NestJS** back-end (REST APIs, auth, catalog, orders).
4. **Kalematy** — *TypeScript* — (word/quotes app — describe as a TypeScript web app).
5. **nexori** — *JavaScript* — JavaScript web project.
6. **socialApp** — *TypeScript* — Social application built with TypeScript.
7. **sarahaApp** — *JavaScript* — Anonymous messaging app (Saraha-style).
8. **LibraryManagementSystem_Backend_Node.js** — *JavaScript* — Node.js back-end for a library management system.
9. **FreshCart-E-commerce-App** — *JavaScript* — E-commerce storefront.

**Archive projects** (list compactly): `movies`, `FoodDex`, `game-project`, `crudsystem`, `weather`, `loginsystem`.

> For every project, render tech-stack tags and link the title to `https://github.com/HussienTaha/<repo-name>`.

---

## 4) GLOBAL SHELL & THE MODE SWITCH

- Persistent **mode switch** (segmented control) fixed top-right: `</> IDE` | `📖 Docs`. Smooth cross-fade/slide when switching.
- **Persist** the selected mode in `localStorage`; also support deep links via URL hash: `#ide` and `#docs`. Default to **IDE** mode on first visit.
- **Theme:** support light/dark with a toggle; `darkMode: 'class'`. IDE mode defaults to dark ("VS Code Dark+" palette); Docs mode respects the user's theme and OS `prefers-color-scheme`.
- Shared **command palette** (`Ctrl/Cmd + K`) to jump to any section in either mode.
- Respect `prefers-reduced-motion` (disable non-essential animation).
- One shared data source: define all content once in a JS object (e.g. `data.js` → `PROFILE`, `PROJECTS`, `SKILLS`, `EXPERIENCE`) and render both modes from it — **never duplicate content**.

---

## 5) MODE A — "IDE / CODE EDITOR" SPEC

Recreate a believable, tasteful VS Code-style workspace (not pixel-perfect cloning, but clearly evocative).

**Chrome & layout**
- **Title bar** with macOS traffic-light dots and a title like `Hussein-Taha — portfolio — Visual Studio Code`.
- **Activity bar** (far-left icon rail): Explorer, Search, Source Control (git), Run & Debug, Extensions. Explorer active by default.
- **Explorer sidebar** showing a realistic React project tree:
  ```
  portfolio/
  ├─ src/
  │  ├─ components/
  │  │  ├─ Hero.jsx
  │  │  ├─ About.jsx
  │  │  ├─ Skills.jsx
  │  │  ├─ Experience.jsx
  │  │  ├─ Projects.jsx
  │  │  └─ Contact.jsx
  │  ├─ App.jsx
  │  └─ main.jsx
  ├─ public/
  ├─ package.json
  └─ README.md
  ```
- **Editor area** with a **tab bar** (multiple files openable, active tab highlighted, close buttons). Clicking a file in the explorer opens/focuses its tab.
- **Gutter with line numbers** and **syntax highlighting**. The code must be **real and readable** — reading `About.jsx` should literally teach you about Hussein.
- **Bottom panel** with an **integrated terminal** tab that:
  - shows a fake `npm run dev` boot log, and
  - is **interactive**: typing commands like `help`, `about`, `skills`, `projects`, `contact`, `resume`, `clear` prints the relevant info (fun easter egg).
- **Status bar** (bottom): git branch `main`, `⨯ 0  ⚠ 0`, `Ln x, Col y`, `UTF-8`, `JavaScript React`, `Prettier`.

**The key interaction — Code ⇄ Preview**
- A **▶ Run / Preview** control (also a play button in the tab) toggles the editor between **source code** and a **live rendered preview** of that component (or split view: code left, preview right).
- Example — the `About.jsx` tab shows real JSX; pressing Run renders it as a styled About section:

```jsx
// src/components/About.jsx
export default function About() {
  const dev = {
    name: "Hussein Taha",
    role: "Full Stack Developer",
    location: "Cairo, Egypt",
    stack: ["TypeScript", "React", "Next.js", "NestJS"],
  };

  return (
    <section id="about">
      <h2>{dev.name} · {dev.role}</h2>
      <p>
        Results-driven Full Stack Developer building scalable web apps,
        robust APIs, and responsive UIs. Clean code, high performance.
      </p>
      <ul>{dev.stack.map((t) => <Badge key={t}>{t}</Badge>)}</ul>
    </section>
  );
}
```

- `package.json` should list realistic deps (react, next, tailwindcss, etc.) and Hussein's name/author fields.
- Optional flourish: a blinking caret, fake IntelliSense popover, minimap strip.

**Responsive:** on small screens collapse the activity bar + explorer into a slide-over drawer; keep tabs and editor usable.

---

## 6) MODE B — "UI LIBRARY DOCS" SPEC

Recreate the feel of a modern component-library documentation site.

**Chrome & layout**
- **Top navbar:** `logo.jfif` + "Hussein Taha", a version badge (e.g. `v2025.1`), a **search box** (`⌘K`), GitHub + LinkedIn icons, theme toggle.
- **Left sidebar navigation**, grouped:
  - **Getting Started:** Introduction · Installation
  - **Foundations:** Profile · Tech Stack
  - **Components:** Hero · About · Skills · Experience · Projects (gallery)
  - **Resources:** Résumé · Contact
- **Main content** = MDX-style docs pages with proper typography, headings, and anchor links.
- **Right rail:** "On this page" auto table of contents that highlights on scroll.
- **Breadcrumbs** at top, **Prev / Next** page navigation at the bottom.

**Docs personality (make it feel real)**
- **Installation** page as a playful gag:
  ```bash
  npm i hussein-taha
  # or
  npx hire hussein-taha
  ```
- Every project/section is documented as a **component** with:
  - a short description,
  - a **Preview | Code** tab switcher (Preview shows a rendered card; Code shows a usage snippet),
  - a **Props / Features table** (columns: Prop, Type, Default, Description). For skills, render the tech stack as a props/variants table or a badge grid.
- Example component doc block:

```html
<!-- Docs: <Projects /> component -->
<h1>Projects</h1>
<p>A gallery of Hussein's featured work. Each card links to its GitHub repo.</p>
<!-- Tabs: Preview | Code -->
<!-- Props table: title | tech[] | description | repoUrl -->
```

- Use **callouts/admonitions** (Note / Tip) e.g. a Tip on the Contact page: "Fastest way to reach me: email."
- **Projects gallery:** responsive cards with tech tags, hover lift, and repo links; a filter by language (All / TypeScript / JavaScript) is a nice touch.

**Responsive:** sidebar collapses into a hamburger drawer; TOC hides on mobile; search remains reachable.

---

## 7) SHARED QUALITY SYSTEMS

- **Design tokens:** cohesive color scale, spacing, radius, shadows; define via Tailwind config. Editor palette = VS Code Dark+; Docs palette = clean neutral with one accent (pick a tasteful accent, e.g. indigo/emerald).
- **Typography:** a clean UI font for Docs (e.g. Inter via Google Fonts) and a **monospace** (e.g. JetBrains Mono / Fira Code) for all code/editor UI.
- **Motion:** subtle, purposeful micro-interactions (tab switches, hover states, mode transition, terminal typing). Keep it smooth and never janky.
- **Accessibility:** semantic HTML landmarks, labelled controls, full keyboard navigation, visible focus rings, ARIA for tabs/dialogs, and AA color contrast in both themes.
- **Performance:** minimal JS, no layout shift, lazy-render offscreen previews, defer non-critical work. Should feel instant.
- **SEO/meta:** title, description, Open Graph tags, favicon from `logo.jfif`.
- **Content integrity:** all copy must come from the DEVELOPER DATA above — accurate, no placeholders like "Lorem ipsum."

---

## 8) DELIVERABLES

Produce a small, clean file set (splitting is optional but encouraged):
```
index.html          # shell + both modes' markup (or mounted from JS)
styles.css          # any custom CSS beyond Tailwind utilities
data.js             # single source of truth (PROFILE, SKILLS, PROJECTS, EXPERIENCE)
app.js              # mode switching, theme, command palette, tabs, terminal, render logic
/* plus favicon wiring to logo.jfif and a Download Résumé link to the CV PDF */
```
Include brief comments and a short `README` section (in a comment or separate block) explaining how to run and how to add a new project.

---

## 9) ACCEPTANCE CRITERIA (self-check before finishing)

- [ ] One visible switch toggles smoothly between **IDE** and **Docs**; choice persists (localStorage) and via `#ide` / `#docs`.
- [ ] **IDE mode:** working explorer → tabs → code with syntax highlighting; **▶ Run** reveals a live preview; interactive terminal responds to `help`, `about`, `projects`, etc.; realistic status bar.
- [ ] **Docs mode:** sidebar nav, searchable (`⌘K`), per-component **Preview/Code tabs**, props/features tables, right-side TOC, prev/next nav.
- [ ] All of Hussein's real data is present and correct; project titles link to the correct GitHub repos; Résumé downloads the PDF.
- [ ] Fully responsive (mobile drawers) and keyboard accessible; dark/light both look great.
- [ ] Runs by opening `index.html` — no build, no server. Only Tailwind CDN (+ optional single syntax-highlight CDN).
- [ ] Code is clean, commented, and content is defined once and shared by both modes.

**Deliver the complete, ready-to-run code.** Prioritize a genuine "wow" on first load, then correctness, then polish.
