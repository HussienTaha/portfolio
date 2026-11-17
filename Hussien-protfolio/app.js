/* ============================================================
   app.js — dual-mode portfolio engine (vanilla JS)
   Modes: "IDE" (VS Code-style) + "Docs" (UI library docs).
   Content is rendered from data.js (single source of truth).
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     State
     ------------------------------------------------------------ */
  let currentMode = "ide";
  let currentPage = "introduction";
  let activePath = null;
  let openTabs = [];
  let viewMode = "code"; // code | preview | split
  let tocObserver = null;
  let siteRepoFilter = "All";
  let siteRepoQuery = "";

  let PALETTE_CMDS = [];
  let paletteFiltered = [];
  let paletteSel = 0;

  /* ------------------------------------------------------------
     Tiny utilities
     ------------------------------------------------------------ */
  const byId = (id) => document.getElementById(id);
  const RESUME_URL = encodeURI(PROFILE.resume);

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : v;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function slug(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const gh = (repo) => PROFILE.github + "/" + repo;

  function fileIcon(lang) {
    if (lang === "jsx") return { cls: "ico-jsx", txt: "⚛" };
    if (lang === "json") return { cls: "ico-json", txt: "{}" };
    if (lang === "md") return { cls: "ico-md", txt: "#" };
    return { cls: "", txt: "▤" };
  }

  /* ------------------------------------------------------------
     Lightweight syntax highlighter (no dependencies)
     Single-pass tokenizer -> escaped, span-wrapped HTML.
     ------------------------------------------------------------ */
  const TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(import|from|export|default|function|return|const|let|var|new|await|async|if|else|for|while|class|extends|typeof|of|in|null|true|false|this|void)\b|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][A-Za-z0-9.]*|\/?>)/g;

  function highlight(code) {
    let out = "";
    let last = 0;
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(code))) {
      out += escapeHtml(code.slice(last, m.index));
      let cls = "";
      if (m[1]) cls = "tk-com";
      else if (m[2]) cls = "tk-str";
      else if (m[3]) cls = "tk-kw";
      else if (m[4]) cls = "tk-num";
      else if (m[5]) cls = "tk-tag";
      out += '<span class="' + cls + '">' + escapeHtml(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    out += escapeHtml(code.slice(last));
    return out;
  }

  function codeBlock(code, lang) {
    const src = code.replace(/\n+$/, "");
    const lines = src.split("\n");
    const gutter = lines.map((_, i) => i + 1).join("\n");
    const body = lang === "md" ? escapeHtml(src) : highlight(src);
    return (
      '<div class="code-wrap"><div class="code-scroll">' +
      '<pre class="code-gutter">' +
      gutter +
      "</pre>" +
      '<pre class="code-body"><code>' +
      body +
      "</code></pre>" +
      "</div></div>"
    );
  }

  /* ------------------------------------------------------------
     Section builders — rendered previews (theme-adaptive).
     Reused by IDE previews and the Docs component demos.
     ------------------------------------------------------------ */
  function buildHero() {
    return `
      <section class="preview-section" style="padding:56px 24px;text-align:center">
        <span style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(16,185,129,.4);background:rgba(16,185,129,.1);color:#10b981;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:600">
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981" class="animate-pulse"></span> ${PROFILE.availability}
        </span>
        <h1 style="margin:22px 0 0;font-size:clamp(32px,5vw,52px);font-weight:800;letter-spacing:-.02em">${PROFILE.name}</h1>
        <p style="margin:12px 0 0;font-size:18px;color:var(--muted)">${PROFILE.title} · ${PROFILE.location}</p>
        <div style="margin-top:26px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
          <a href="#" data-goto="projects" style="border-radius:10px;background:var(--accent);color:#fff;padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none">View projects</a>
          <a href="${RESUME_URL}" download style="border-radius:10px;border:1px solid var(--border);padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none;color:var(--fg)">Download résumé</a>
        </div>
      </section>`;
  }

  function buildAbout() {
    const stack = ["TypeScript", "React", "Next.js", "NestJS", "Node.js", "Tailwind CSS"];
    return `
      <section class="preview-section" style="padding:40px 24px;max-width:680px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:800;margin:0">About me</h2>
        <p style="margin:16px 0 0;line-height:1.7;color:var(--muted)">${PROFILE.summary}</p>
        <ul style="margin:20px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px">
          ${stack.map((t) => `<li class="chip">${t}</li>`).join("")}
        </ul>
      </section>`;
  }

  function buildSkills() {
    return `
      <section class="preview-section" style="padding:40px 24px;max-width:820px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:800;margin:0 0 20px">Tech stack</h2>
        <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
          ${SKILLS.map(
            (g) => `
            <div style="border:1px solid var(--border);border-radius:14px;padding:16px;background:var(--card)">
              <h3 style="margin:0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)">${g.group}</h3>
              <ul style="margin:12px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px">
                ${g.items.map((i) => `<li class="chip">${i}</li>`).join("")}
              </ul>
            </div>`
          ).join("")}
        </div>
      </section>`;
  }

  function buildExperience() {
    return `
      <section class="preview-section" style="padding:40px 24px;max-width:760px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:800;margin:0 0 20px">Experience</h2>
        <div style="display:flex;flex-direction:column;gap:18px">
          ${EXPERIENCE.map(
            (r) => `
            <article style="border:1px solid var(--border);border-radius:14px;padding:18px;background:var(--card)">
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline">
                <h3 style="margin:0;font-weight:700">${r.title}</h3>
                <span style="font-size:12px;color:var(--muted)">${r.period}</span>
              </div>
              <p style="margin:4px 0 0;font-size:13px;color:var(--muted)">${r.location}</p>
              <ul style="margin:12px 0 0;padding-left:18px;line-height:1.7;font-size:14px;color:var(--muted)">
                ${r.points.map((p) => `<li>${p}</li>`).join("")}
              </ul>
            </article>`
          ).join("")}
        </div>
      </section>`;
  }

  function projectCards(filter) {
    const list =
      !filter || filter === "All"
        ? PROJECTS
        : PROJECTS.filter((p) => p.language === filter);
    return list
      .map(
        (p) => `
        <a href="${gh(p.repo)}" target="_blank" rel="noreferrer" class="proj-card" style="display:block;border:1px solid var(--border);border-radius:14px;padding:18px;background:var(--card);text-decoration:none;color:var(--fg);transition:border-color .15s,transform .15s">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <h3 style="margin:0;font-weight:700;font-size:15px">${p.name}</h3>
            <span style="color:var(--muted)">↗</span>
          </div>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:var(--muted)">${p.description}</p>
          <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">
            ${p.tech.map((t) => `<span class="chip chip-sm">${t}</span>`).join("")}
          </div>
        </a>`
      )
      .join("");
  }

  function buildProjects() {
    return `
      <section class="preview-section" style="padding:40px 24px;max-width:900px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:800;margin:0 0 20px">Projects</h2>
        <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          ${projectCards("All")}
        </div>
      </section>`;
  }

  function buildContact() {
    return `
      <section class="preview-section" style="padding:48px 24px;text-align:center;max-width:560px;margin:0 auto">
        <h2 style="font-size:24px;font-weight:800;margin:0">Get in touch</h2>
        <p style="margin:12px 0 0;color:var(--muted)">Fastest way to reach me is email — I usually reply within a day.</p>
        <a href="mailto:${PROFILE.email}" style="display:inline-block;margin-top:22px;border-radius:10px;background:var(--accent);color:#fff;padding:12px 22px;font-weight:600;text-decoration:none">${PROFILE.email}</a>
        <div style="margin-top:18px;display:flex;gap:16px;justify-content:center;font-size:14px">
          <a class="link" href="${PROFILE.github}" target="_blank" rel="noreferrer">GitHub</a>
          <a class="link" href="${PROFILE.linkedin}" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </section>`;
  }

  function buildAppPreview() {
    return `<div>${buildHero()}${buildAbout()}${buildSkills()}${buildExperience()}${buildProjects()}${buildContact()}</div>`;
  }

  function buildPackagePreview() {
    return `
      <section class="preview-section" style="padding:40px 24px;max-width:460px;margin:0 auto">
        <div style="border:1px solid var(--border);border-radius:16px;padding:22px;background:var(--card)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:12px;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px">H</div>
            <div>
              <h3 style="margin:0;font-weight:700">hussein-taha-portfolio</h3>
              <p style="margin:2px 0 0;font-size:12px;color:var(--muted)">${PROFILE.version} · MIT</p>
            </div>
          </div>
          <p style="margin:16px 0 0;font-size:14px;color:var(--muted)">Full Stack Developer — TypeScript, React, Next.js, NestJS</p>
          <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
            <div class="chip" style="justify-content:center">react ^18.3</div>
            <div class="chip" style="justify-content:center">react-dom ^18.3</div>
            <div class="chip" style="justify-content:center">tailwindcss ^3.4</div>
            <div class="chip" style="justify-content:center">vite ^5.4</div>
          </div>
        </div>
      </section>`;
  }

  function buildReadmePreview() {
    return `
      <section class="preview-section prose-docs" style="padding:40px 24px;max-width:680px;margin:0 auto">
        <h1 style="font-size:28px">Hussein Taha — Portfolio</h1>
        <p>Full Stack Developer based in ${PROFILE.location}. Building scalable web apps with TypeScript, React, Next.js and NestJS.</p>
        <h2>Run locally</h2>
        <div class="codecard"><span class="cmd-prompt">$</span> npm install
<span class="cmd-prompt">$</span> npm run dev</div>
        <h2>Contact</h2>
        <ul>
          <li>Email: ${PROFILE.email}</li>
          <li>GitHub: ${PROFILE.github}</li>
          <li>LinkedIn: ${PROFILE.linkedin}</li>
        </ul>
      </section>`;
  }

  const PREVIEWS = {
    hero: buildHero,
    about: buildAbout,
    skills: buildSkills,
    experience: buildExperience,
    projects: buildProjects,
    contact: buildContact,
    app: buildAppPreview,
    pkg: buildPackagePreview,
    readme: buildReadmePreview,
  };

  /* ------------------------------------------------------------
     Virtual project files (the "source code" shown in IDE mode).
     NOTE: these code strings intentionally avoid backticks and
     ${ } so they can live safely inside template literals.
     ------------------------------------------------------------ */
  const USAGE_SNIPPET =
`import { Hussein } from "hussein-taha";

export default function Team() {
  return (
    <Hussein
      role="Full Stack Developer"
      stack={["TypeScript", "React", "Next.js", "NestJS"]}
      location="Cairo, Egypt"
      available
    />
  );
}`;

  const FILES = {
    "src/components/Hero.jsx": {
      name: "Hero.jsx",
      lang: "jsx",
      preview: "hero",
      code:
`export default function Hero() {
  const profile = {
    name: "Hussein Taha",
    role: "Full Stack Developer",
    location: "Cairo, Egypt",
    available: true,
  };

  return (
    <section id="hero" className="hero">
      {profile.available && <span className="badge">Available for work</span>}
      <h1 className="title">{profile.name}</h1>
      <p className="subtitle">{profile.role} — {profile.location}</p>
      <div className="cta">
        <a href="#projects">View projects</a>
        <a href="/resume.pdf" download>Download résumé</a>
      </div>
    </section>
  );
}`,
    },
    "src/components/About.jsx": {
      name: "About.jsx",
      lang: "jsx",
      preview: "about",
      code:
`export default function About() {
  const dev = {
    name: "Hussein Taha",
    role: "Full Stack Developer",
    stack: ["TypeScript", "React", "Next.js", "NestJS"],
  };

  return (
    <section id="about" className="about">
      <h2>About me</h2>
      <p>
        Results-driven Full Stack Developer with one year of professional experience in the Information Systems Branch of the Egyptian Naval Forces, complemented by freelance work. Specializing in building scalable web applications, robust APIs, and responsive user interfaces. I care about clean code and high-performance solutions.
      </p>
      <ul className="chips">
        {dev.stack.map((tech) => (
          <li key={tech} className="chip">{tech}</li>
        ))}
      </ul>
    </section>
  );
}`,
    },
    "src/components/Skills.jsx": {
      name: "Skills.jsx",
      lang: "jsx",
      preview: "skills",
      code:
`const SKILLS = {
  languages: ["TypeScript", "JavaScript", "Python", "Java", "C#"],
  frontend: ["React", "Next.js", "HTML5", "CSS3", "SASS", "Bootstrap", "Tailwind CSS"],
  backend: ["Node.js", "Express.js", "NestJS"],
  databases: ["MongoDB", "MySQL", "PostgreSQL"],
  tools: ["Git", "Docker", "Postman", "VS Code", "AWS", "Firebase", "CI/CD"],
};

export default function Skills() {
  return (
    <section id="skills" className="skills">
      <h2>Tech stack</h2>
      {Object.entries(SKILLS).map(([group, items]) => (
        <div key={group} className="skill-group">
          <h3>{group}</h3>
          <ul>
            {items.map((s) => (
              <li key={s} className="chip">{s}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}`,
    },
    "src/components/Experience.jsx": {
      name: "Experience.jsx",
      lang: "jsx",
      preview: "experience",
      code:
`const roles = [
  {
    title: "Freelance Full Stack Developer",
    location: "Cairo, Egypt",
    period: "2024 — Present",
    points: [
      "Built end-to-end apps with Next.js (front-end) and NestJS (back-end).",
      "Designed RESTful APIs and GraphQL endpoints.",
      "Crafted responsive, accessible UIs with React and Tailwind CSS.",
      "Modeled schemas and optimized queries on MongoDB and MySQL.",
      "Owned full project lifecycles with on-time delivery.",
    ],
  },
];

export default function Experience() {
  return (
    <section id="experience" className="experience">
      <h2>Experience</h2>
      {roles.map((role) => (
        <article key={role.title} className="role">
          <h3>{role.title}</h3>
          <p className="meta">{role.location} — {role.period}</p>
          <ul>
            {role.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}`,
    },
    "src/components/Projects.jsx": {
      name: "Projects.jsx",
      lang: "jsx",
      preview: "projects",
      code:
`const USER = "HussienTaha";

const projects = [
  { name: "TaskFlow-jira", tech: ["TypeScript", "Next.js", "NestJS"], desc: "Real-time task & team management, Jira-style." },
  { name: "Chat_Social_App", tech: ["JavaScript", "Socket.IO"], desc: "Real-time social chat with friends & groups." },
  { name: "E-commerceApp-Nestjs", tech: ["TypeScript", "NestJS"], desc: "E-commerce app with a NestJS back-end." },
  { name: "Kalematy", tech: ["TypeScript"], desc: "A content-driven TypeScript web app." },
  { name: "sarahaApp", tech: ["JavaScript"], desc: "Anonymous messaging app." },
  { name: "FreshCart-E-commerce-App", tech: ["JavaScript"], desc: "E-commerce storefront UI." },
];

export default function Projects() {
  return (
    <section id="projects" className="projects">
      <h2>Projects</h2>
      <div className="grid">
        {projects.map((p) => (
          <a
            key={p.name}
            className="card"
            href={"https://github.com/" + USER + "/" + p.name}
            target="_blank"
            rel="noreferrer"
          >
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
            <ul>
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </section>
  );
}`,
    },
    "src/components/Contact.jsx": {
      name: "Contact.jsx",
      lang: "jsx",
      preview: "contact",
      code:
`export default function Contact() {
  const contact = {
    email: "hussien212258@gmail.com",
    phone: "+20 155 634 4022",
    github: "https://github.com/HussienTaha",
    linkedin: "https://www.linkedin.com/in/hussien-taha-99ba24386",
  };

  return (
    <section id="contact" className="contact">
      <h2>Get in touch</h2>
      <p>Fastest way to reach me is email — I usually reply within a day.</p>
      <a className="btn" href={"mailto:" + contact.email}>
        {contact.email}
      </a>
      <div className="socials">
        <a href={contact.github}>GitHub</a>
        <a href={contact.linkedin}>LinkedIn</a>
      </div>
    </section>
  );
}`,
    },
    "src/App.jsx": {
      name: "App.jsx",
      lang: "jsx",
      preview: "app",
      code:
`import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Contact from "./components/Contact";

export default function App() {
  return (
    <main className="portfolio">
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}`,
    },
    "src/main.jsx": {
      name: "main.jsx",
      lang: "jsx",
      preview: "app",
      code:
`import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    "package.json": {
      name: "package.json",
      lang: "json",
      preview: "pkg",
      code:
`{
  "name": "hussein-taha-portfolio",
  "version": "2025.1.0",
  "private": true,
  "author": "Hussein Taha <hussien212258@gmail.com>",
  "description": "Full Stack Developer — TypeScript, React, Next.js, NestJS",
  "homepage": "https://github.com/HussienTaha",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.2"
  }
}`,
    },
    "README.md": {
      name: "README.md",
      lang: "md",
      preview: "readme",
      code:
`# Hussein Taha — Portfolio

Full Stack Developer based in Cairo, Egypt.
Building scalable web apps with TypeScript, React, Next.js and NestJS.

## Run locally

    npm install
    npm run dev

## Contact

- Email: hussien212258@gmail.com
- GitHub: https://github.com/HussienTaha
- LinkedIn: https://www.linkedin.com/in/hussien-taha-99ba24386

Tip: use the "IDE / Docs" switch (top-right) to change how you read this portfolio.`,
    },
  };

  const TREE = [
    {
      type: "folder",
      name: "src",
      open: true,
      children: [
        {
          type: "folder",
          name: "components",
          open: true,
          children: [
            { type: "file", path: "src/components/Hero.jsx" },
            { type: "file", path: "src/components/About.jsx" },
            { type: "file", path: "src/components/Skills.jsx" },
            { type: "file", path: "src/components/Experience.jsx" },
            { type: "file", path: "src/components/Projects.jsx" },
            { type: "file", path: "src/components/Contact.jsx" },
          ],
        },
        { type: "file", path: "src/App.jsx" },
        { type: "file", path: "src/main.jsx" },
      ],
    },
    { type: "file", path: "package.json" },
    { type: "file", path: "README.md" },
  ];

  /* ============================================================
     IDE MODE
     ============================================================ */
  function renderIDE() {
    byId("ide-root").innerHTML = `
    <div class="ide-window">
      <div class="ide-titlebar">
        <div class="ide-traffic"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div>
        <button class="ide-menu-btn" id="ide-drawer-btn" aria-label="Toggle explorer">☰</button>
        <div class="ide-title">Hussein-Taha — portfolio — Visual Studio Code</div>
      </div>
      <div class="ide-body">
        <div class="ide-activity">
          <button class="act active" title="Explorer" aria-label="Explorer">🗎</button>
          <button class="act" title="Search" aria-label="Search">🔍</button>
          <button class="act" title="Source Control" aria-label="Source Control">⑂</button>
          <button class="act" title="Run and Debug" aria-label="Run and Debug">▷</button>
          <button class="act" title="Extensions" aria-label="Extensions">▦</button>
          <div class="act-spacer"></div>
          <button class="act" title="Account" aria-label="Account">◯</button>
          <button class="act" title="Settings" aria-label="Settings">⚙</button>
        </div>
        <aside class="ide-side">
          <div class="side-head">Explorer</div>
          <div class="side-project">PORTFOLIO</div>
          <div class="tree" id="ide-tree"></div>
        </aside>
        <div class="ide-main">
          <div class="ide-tabs" id="ide-tabs"></div>
          <div class="editor-toolbar">
            <div class="crumb" id="ide-crumb"></div>
            <div class="view-switch" id="ide-viewswitch">
              <button data-view="code" class="active">Code</button>
              <button data-view="preview">▶ Preview</button>
              <button data-view="split">Split</button>
            </div>
          </div>
          <div class="editor-content" id="ide-editor"></div>
          <div class="ide-terminal" id="ide-terminal">
            <div class="term-head">
              <span class="term-tabs"><span class="active">TERMINAL</span><span>PROBLEMS</span><span>OUTPUT</span><span>DEBUG CONSOLE</span></span>
              <span class="term-shell">zsh — portfolio</span>
            </div>
            <div class="term-body" id="term-body"></div>
            <form class="term-line" id="term-form" autocomplete="off">
              <span class="term-prompt">hussein@portfolio</span><span class="term-sep">:</span><span class="term-path">~/portfolio</span><span class="term-dollar">$</span>
              <input id="term-input" name="cmd" autocomplete="off" spellcheck="false" aria-label="Terminal input" />
            </form>
          </div>
        </div>
      </div>
      <div class="ide-status">
        <div class="st-left"><span class="st-item">⑂ main*</span><span class="st-item">⨯ 0&nbsp;&nbsp;⚠ 0</span><span class="st-item">Vite</span></div>
        <div class="st-right"><span class="st-item" id="st-lncol">Ln 1, Col 1</span><span class="st-item">Spaces: 2</span><span class="st-item">UTF-8</span><span class="st-item">LF</span><span class="st-item" id="st-lang">JavaScript React</span><span class="st-item">Prettier ✓</span></div>
      </div>
    </div>`;
    renderTree();
  }

  function renderTree() {
    byId("ide-tree").innerHTML = TREE.map((n) => treeNode(n, 0)).join("");
  }

  function treeNode(node, depth) {
    const pad = 8 + depth * 14;
    if (node.type === "folder") {
      const kids = node.open
        ? node.children.map((c) => treeNode(c, depth + 1)).join("")
        : "";
      return (
        `<button class="tree-row" data-folder="${node.name}" style="padding-left:${pad}px">` +
        `<span class="tree-caret ${node.open ? "open" : ""}">▶</span>` +
        `<span class="tree-ico ico-folder">▸</span>${node.name}</button>` +
        kids
      );
    }
    const f = FILES[node.path];
    const icon = fileIcon(f.lang);
    const active = node.path === activePath ? " active" : "";
    return (
      `<button class="tree-row${active}" data-path="${node.path}" style="padding-left:${pad + 14}px">` +
      `<span class="tree-ico ${icon.cls}">${icon.txt}</span>${f.name}</button>`
    );
  }

  function toggleFolder(name) {
    (function walk(nodes) {
      nodes.forEach((n) => {
        if (n.type === "folder") {
          if (n.name === name) n.open = !n.open;
          walk(n.children);
        }
      });
    })(TREE);
    renderTree();
  }

  function openFile(path) {
    if (!FILES[path]) return;
    if (!openTabs.includes(path)) openTabs.push(path);
    activePath = path;
    renderTabs();
    renderEditor();
    renderTree();
  }

  function closeTab(path) {
    const i = openTabs.indexOf(path);
    if (i < 0) return;
    openTabs.splice(i, 1);
    if (activePath === path) {
      activePath = openTabs[i] || openTabs[i - 1] || openTabs[openTabs.length - 1] || null;
    }
    renderTabs();
    renderEditor();
    renderTree();
  }

  function renderTabs() {
    byId("ide-tabs").innerHTML = openTabs
      .map((p) => {
        const f = FILES[p];
        const icon = fileIcon(f.lang);
        return (
          `<div class="ide-tab${p === activePath ? " active" : ""}" data-tab-path="${p}">` +
          `<span class="tree-ico ${icon.cls}">${icon.txt}</span><span>${f.name}</span>` +
          `<span class="tab-close" data-close-path="${p}" role="button" aria-label="Close">✕</span></div>`
        );
      })
      .join("");
  }

  function renderEditor() {
    const host = byId("ide-editor");
    if (!activePath) {
      host.innerHTML =
        '<div style="padding:40px;color:#8b8b8b;font-family:JetBrains Mono,monospace">// open a file from the explorer</div>';
      updateCrumb();
      return;
    }
    const f = FILES[activePath];
    if (viewMode === "code") {
      host.innerHTML = codeBlock(f.code, f.lang);
    } else if (viewMode === "preview") {
      host.innerHTML = `<div class="preview-canvas">${PREVIEWS[f.preview]()}</div>`;
    } else {
      host.innerHTML =
        `<div class="editor-split"><div class="split-code">${codeBlock(f.code, f.lang)}</div>` +
        `<div class="split-preview"><div class="preview-canvas">${PREVIEWS[f.preview]()}</div></div></div>`;
    }
    document
      .querySelectorAll("#ide-viewswitch button")
      .forEach((b) => b.classList.toggle("active", b.getAttribute("data-view") === viewMode));
    updateCrumb();
    updateStatus();
  }

  function setView(mode) {
    viewMode = mode;
    renderEditor();
  }

  function updateCrumb() {
    const el = byId("ide-crumb");
    if (!activePath) {
      el.textContent = "";
      return;
    }
    const parts = activePath.split("/");
    el.innerHTML = parts
      .map((s, i) =>
        i === parts.length - 1
          ? `<span style="color:#ddd">${s}</span>`
          : `<span>${s}</span>`
      )
      .join('<span class="crumb-sep">›</span>');
  }

  function updateStatus() {
    const f = activePath ? FILES[activePath] : null;
    const lang = byId("st-lang");
    if (lang && f) {
      lang.textContent =
        f.lang === "jsx"
          ? "JavaScript React"
          : f.lang === "json"
          ? "JSON"
          : f.lang === "md"
          ? "Markdown"
          : "JavaScript";
    }
  }

  /* ---------- interactive terminal ---------- */
  function termAppend(html) {
    const b = byId("term-body");
    b.insertAdjacentHTML("beforeend", html);
    b.scrollTop = b.scrollHeight;
  }

  function bootTerminal() {
    const lines = [
      '<span class="t-dim">$ npm run dev</span>',
      "",
      '<span class="t-accent">VITE v5.4.2</span>  ready in 312 ms',
      "",
      "  ➜  Local:   http://localhost:5173/",
      "  ➜  Network: use --host to expose",
      "",
      '<span class="t-dim">Type </span><span class="t-key">help</span><span class="t-dim"> to explore this portfolio from the terminal.</span>',
    ];
    byId("term-body").innerHTML = lines
      .map((l) => `<div class="term-out">${l}</div>`)
      .join("");
  }

  function termEcho(cmd) {
    termAppend(
      `<div class="term-out term-echo"><span class="term-prompt">hussein@portfolio</span><span class="term-sep">:</span><span class="term-path">~/portfolio</span><span class="term-dollar">$</span> ${escapeHtml(
        cmd
      )}</div>`
    );
  }

  function resolveFile(name) {
    const n = name.trim().toLowerCase();
    const keys = Object.keys(FILES);
    let hit = keys.find((k) => k.toLowerCase() === n);
    if (hit) return hit;
    hit = keys.find((k) => FILES[k].name.toLowerCase() === n);
    if (hit) return hit;
    const base = n.replace(/\.\w+$/, "");
    hit = keys.find((k) => FILES[k].name.toLowerCase().replace(/\.\w+$/, "") === base);
    return hit || null;
  }

  function neofetch() {
    return [
      '<span class="t-accent">      __ </span>  hussein@portfolio',
      '<span class="t-accent">  |__|  |</span>  ------------------',
      '<span class="t-accent">  |  |  |</span>  <span class="t-key">role</span>:  ' + PROFILE.title,
      '<span class="t-accent">  |  |__|</span>  <span class="t-key">loc</span>:   ' + PROFILE.location,
      "           <span class=\"t-key\">stack</span>: TS · React · Next.js · NestJS",
      "           <span class=\"t-key\">edu</span>:   B.Sc. Software Engineering (2025)",
    ].join("\n");
  }

  const TERM_CMDS = {
    help: () =>
      [
        "Available commands:",
        '  <span class="t-key">whoami</span>      who is Hussein',
        '  <span class="t-key">about</span>       professional summary',
        '  <span class="t-key">skills</span>      tech stack',
        '  <span class="t-key">projects</span>    featured work',
        '  <span class="t-key">experience</span>  work history',
        '  <span class="t-key">education</span>   degrees & courses',
        '  <span class="t-key">socials</span>     links & contact',
        '  <span class="t-key">resume</span>      open the CV',
        '  <span class="t-key">ls</span>          list project files',
        '  <span class="t-key">open</span> &lt;file&gt; open a file in the editor',
        '  <span class="t-key">neofetch</span>    system-style summary',
        '  <span class="t-key">clear</span>       clear the terminal',
      ].join("\n"),
    whoami: () =>
      `${PROFILE.fullName}\n<span class="t-dim">${PROFILE.title} · ${PROFILE.location}</span>`,
    about: () => PROFILE.summary,
    skills: () =>
      SKILLS.map(
        (g) => `<span class="t-key">${g.group}:</span> ${g.items.join(", ")}`
      ).join("\n"),
    projects: () =>
      PROJECTS.map(
        (p) =>
          `<span class="t-accent">${p.name}</span>  <span class="t-dim">${gh(
            p.repo
          )}</span>\n  ${p.description}`
      ).join("\n"),
    experience: () =>
      EXPERIENCE.map(
        (r) =>
          `<span class="t-accent">${r.title}</span> <span class="t-dim">(${r.period})</span>\n` +
          r.points.map((pt) => "  • " + pt).join("\n")
      ).join("\n"),
    education: () =>
      EDUCATION.map(
        (e) =>
          `<span class="t-accent">${e.degree}</span>\n  ${e.org} <span class="t-dim">${e.period}${
            e.grade ? " · " + e.grade : ""
          }</span>`
      ).join("\n"),
    socials: () =>
      [
        `Email:    ${PROFILE.email}`,
        `Phone:    ${PROFILE.phone}`,
        `GitHub:   ${PROFILE.github}`,
        `LinkedIn: ${PROFILE.linkedin}`,
      ].join("\n"),
    resume: () => {
      window.open(RESUME_URL, "_blank");
      return `Opening résumé… <span class="t-dim">${PROFILE.resume}</span>`;
    },
    ls: () => Object.keys(FILES).join("\n"),
    clear: () => {
      byId("term-body").innerHTML = "";
      return "";
    },
    open: (a) => {
      if (!a) return "usage: open &lt;file&gt;  (e.g. open Projects.jsx)";
      const path = resolveFile(a);
      if (!path) return `no such file: ${escapeHtml(a)}`;
      setMode("ide");
      openFile(path);
      setView("code");
      return `opening <span class="t-accent">${FILES[path].name}</span>…`;
    },
    neofetch: () => neofetch(),
    echo: (a) => escapeHtml(a),
    sudo: (a) =>
      a.trim().indexOf("hire") === 0
        ? "🎉 Access granted — Hussein is available! Email hussien212258@gmail.com"
        : '<span class="t-dim">With great power comes great responsibility. (try: sudo hire)</span>',
  };

  function runCommand(raw) {
    const cmd = (raw || "").trim();
    if (!cmd) return;
    termEcho(cmd);
    const parts = cmd.split(/\s+/);
    const name = parts.shift().toLowerCase();
    const arg = parts.join(" ");
    if (!TERM_CMDS[name]) {
      termAppend(
        `<div class="term-out"><span style="color:#f48771">command not found: ${escapeHtml(
          name
        )}</span> — try <span class="t-key">help</span></div>`
      );
      return;
    }
    const out = TERM_CMDS[name](arg);
    if (out !== "" && out != null) {
      termAppend(`<div class="term-out">${out}</div>`);
    }
  }

  /* ============================================================
     DOCS MODE
     ============================================================ */
  function propsTable(rows) {
    return (
      '<table class="docs-table"><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>' +
      rows
        .map(
          (r) =>
            `<tr><td><code>${r.prop}</code></td><td><code class="t-type">${r.type}</code></td><td>${
              r.def ? `<code>${r.def}</code>` : '<span style="color:var(--muted)">—</span>'
            }</td><td>${r.desc}</td></tr>`
        )
        .join("") +
      "</tbody></table>"
    );
  }

  function componentDoc(o) {
    return `
      <h1 id="${slug(o.title)}">${o.title}</h1>
      <p class="lead">${o.lead}</p>
      ${o.extra || ""}
      <h2 id="preview">Preview</h2>
      <div class="doc-demo">
        <div class="demo-tabs">
          <button data-tab="preview" class="active">Preview</button>
          <button data-tab="code">Code</button>
        </div>
        <div class="demo-panel demo-body-preview" data-panel="preview">${o.preview}</div>
        <div class="demo-panel demo-body-code" data-panel="code" hidden>${codeBlock(o.code, "jsx")}</div>
      </div>
      <h2 id="props">Props</h2>
      ${propsTable(o.props)}`;
  }

  const DOCS_PAGES = [
    {
      id: "introduction",
      group: "Getting Started",
      title: "Introduction",
      navTitle: "Introduction",
      render: () => `
        <h1>Introduction</h1>
        <p class="lead">Meet <strong>${PROFILE.fullName}</strong> — a ${PROFILE.title} from ${PROFILE.location}, documented like your favourite component library.</p>
        <p>${PROFILE.summary}</p>
        <div class="fact-grid">
          <div class="fact"><div class="fact-k">Role</div><div class="fact-v">${PROFILE.title}</div></div>
          <div class="fact"><div class="fact-k">Location</div><div class="fact-v">${PROFILE.location}</div></div>
          <div class="fact"><div class="fact-k">Experience</div><div class="fact-v">3+ yr Freelance</div></div>
          <div class="fact"><div class="fact-k">Education</div><div class="fact-v">B.Sc. SW Eng · 2025</div></div>
        </div>
        <div class="callout"><div class="callout-title">💡 Tip</div>This site has two modes. Use the <strong>IDE / Docs</strong> switch (top-right) or press <kbd>⌘</kbd><kbd>K</kbd> to jump anywhere.</div>
        <h2 id="explore">Explore</h2>
        <p>Browse Hussein's profile as documented components, or flip to IDE mode to read the source.</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">
          <a data-goto="projects" href="#" style="border-radius:10px;background:var(--accent);color:#fff;padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none">Browse components</a>
          <a href="${RESUME_URL}" download style="border-radius:10px;border:1px solid var(--border);padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none;color:var(--fg)">Download résumé</a>
          <a href="${PROFILE.github}" target="_blank" rel="noreferrer" style="border-radius:10px;border:1px solid var(--border);padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none;color:var(--fg)">GitHub ↗</a>
        </div>`,
    },
    {
      id: "installation",
      group: "Getting Started",
      title: "Installation",
      navTitle: "Installation",
      render: () => `
        <h1>Installation</h1>
        <p class="lead">Add Hussein to your team in one step.</p>
        <div class="codecard"><span class="cmd-prompt">$</span> npm i hussein-taha</div>
        <p>or, if you prefer:</p>
        <div class="codecard"><span class="cmd-prompt">$</span> npx hire hussein-taha --role "Full Stack Developer"</div>
        <h2 id="usage">Usage</h2>
        <p>Drop the component into your project and pass the props you need:</p>
        ${codeBlock(USAGE_SNIPPET, "jsx")}
        <div class="callout"><div class="callout-title">✅ Note</div>${PROFILE.availability} — open to freelance & full-time roles. See the <a data-goto="contact" href="#">Contact</a> page.</div>`,
    },
    {
      id: "profile",
      group: "Foundations",
      title: "Profile",
      navTitle: "Profile",
      render: () => `
        <h1>Profile</h1>
        <p class="lead">The core identity — everything you need to reach out.</p>
        <h2 id="details">Details</h2>
        <table class="docs-table"><tbody>
          <tr><td>Full name</td><td>${PROFILE.fullName}</td></tr>
          <tr><td>Title</td><td>${PROFILE.title}</td></tr>
          <tr><td>Location</td><td>${PROFILE.location}</td></tr>
          <tr><td>Email</td><td><a class="link" href="mailto:${PROFILE.email}">${PROFILE.email}</a></td></tr>
          <tr><td>Phone</td><td><a class="link" href="tel:${PROFILE.phone.replace(/\s/g, "")}">${PROFILE.phone}</a></td></tr>
          <tr><td>GitHub</td><td><a class="link" target="_blank" rel="noreferrer" href="${PROFILE.github}">@${PROFILE.githubUser}</a></td></tr>
          <tr><td>LinkedIn</td><td><a class="link" target="_blank" rel="noreferrer" href="${PROFILE.linkedin}">hussien-taha</a></td></tr>
        </tbody></table>
        <h2 id="education">Education</h2>
        <ul>${EDUCATION.map(
          (e) =>
            `<li><strong>${e.degree}</strong> — ${e.org} <span style="color:var(--muted)">(${e.period}${
              e.grade ? ", " + e.grade : ""
            })</span></li>`
        ).join("")}</ul>
        <h2 id="languages">Languages</h2>
        <ul>${LANGUAGES.map(
          (l) => `<li>${l.name} — <span style="color:var(--muted)">${l.level}</span></li>`
        ).join("")}</ul>
        <h2 id="github">GitHub</h2>
        <div class="fact-grid">
          <div class="fact"><div class="fact-k">Followers</div><div class="fact-v">${PROFILE.followers}</div></div>
          <div class="fact"><div class="fact-k">Following</div><div class="fact-v">${PROFILE.following}</div></div>
          <div class="fact"><div class="fact-k">Achievement</div><div class="fact-v">${PROFILE.achievement}</div></div>
        </div>`,
    },
    {
      id: "tech-stack",
      group: "Foundations",
      title: "Tech Stack",
      navTitle: "Tech Stack",
      render: () => `
        <h1>Tech Stack</h1>
        <p class="lead">The technologies Hussein builds with, grouped by category.</p>
        <h2 id="preview">Preview</h2>
        <div class="doc-demo">
          <div class="demo-tabs">
            <button data-tab="preview" class="active">Preview</button>
            <button data-tab="code">Code</button>
          </div>
          <div class="demo-panel demo-body-preview" data-panel="preview">${buildSkills()}</div>
          <div class="demo-panel demo-body-code" data-panel="code" hidden>${codeBlock(
            FILES["src/components/Skills.jsx"].code,
            "jsx"
          )}</div>
        </div>
        <h2 id="categories">Categories</h2>
        <table class="docs-table"><thead><tr><th>Category</th><th>Technologies</th></tr></thead><tbody>
        ${SKILLS.map(
          (g) =>
            `<tr><td><code>${g.key}</code></td><td>${g.items
              .map((i) => `<span class="chip chip-sm" style="margin:2px">${i}</span>`)
              .join(" ")}</td></tr>`
        ).join("")}
        </tbody></table>`,
    },
    {
      id: "hero",
      group: "Components",
      title: "Hero",
      navTitle: "Hero",
      render: () =>
        componentDoc({
          title: "Hero",
          lead: "The landing section — name, role and primary calls to action.",
          preview: buildHero(),
          code: FILES["src/components/Hero.jsx"].code,
          props: [
            { prop: "name", type: "string", def: '"Hussein Taha"', desc: "Display name." },
            { prop: "role", type: "string", def: '"Full Stack Developer"', desc: "Professional title." },
            { prop: "location", type: "string", def: '"Cairo, Egypt"', desc: "Base location." },
            { prop: "available", type: "boolean", def: "true", desc: "Shows the availability badge." },
          ],
        }),
    },
    {
      id: "about",
      group: "Components",
      title: "About",
      navTitle: "About",
      render: () =>
        componentDoc({
          title: "About",
          lead: "A short professional summary with a highlighted stack.",
          preview: buildAbout(),
          code: FILES["src/components/About.jsx"].code,
          props: [
            { prop: "summary", type: "string", def: "", desc: "Professional summary paragraph." },
            { prop: "stack", type: "string[]", def: "[…]", desc: "Highlighted technologies." },
          ],
        }),
    },
    {
      id: "skills",
      group: "Components",
      title: "Skills",
      navTitle: "Skills",
      render: () =>
        componentDoc({
          title: "Skills",
          lead: "Tech stack grouped by category, rendered as badges.",
          preview: buildSkills(),
          code: FILES["src/components/Skills.jsx"].code,
          props: [
            { prop: "languages", type: "string[]", def: "", desc: "Programming languages." },
            { prop: "frontend", type: "string[]", def: "", desc: "Front-end technologies." },
            { prop: "backend", type: "string[]", def: "", desc: "Back-end technologies." },
            { prop: "databases", type: "string[]", def: "", desc: "Databases." },
            { prop: "tools", type: "string[]", def: "", desc: "Tools & platforms." },
          ],
        }),
    },
    {
      id: "experience",
      group: "Components",
      title: "Experience",
      navTitle: "Experience",
      render: () =>
        componentDoc({
          title: "Experience",
          lead: "Professional experience rendered as a list of roles.",
          preview: buildExperience(),
          code: FILES["src/components/Experience.jsx"].code,
          props: [
            { prop: "title", type: "string", def: "", desc: "Role title." },
            { prop: "location", type: "string", def: "", desc: "Where the role was based." },
            { prop: "period", type: "string", def: "", desc: "Duration of the role." },
            { prop: "points", type: "string[]", def: "", desc: "Key achievements & responsibilities." },
          ],
        }),
    },
    {
      id: "projects",
      group: "Components",
      title: "Projects",
      navTitle: "Projects",
      render: () => `
        <h1>Projects</h1>
        <p class="lead">A gallery of featured work. Each card links to its GitHub repository.</p>
        <h2 id="gallery">Gallery</h2>
        <div class="proj-wrap">
          <div class="filter-bar">
            ${["All", "TypeScript", "JavaScript"]
              .map(
                (l, i) =>
                  `<button class="filter-btn${i === 0 ? " active" : ""}" data-lang="${l}">${l}</button>`
              )
              .join("")}
          </div>
          <div class="proj-grid" style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${projectCards(
            "All"
          )}</div>
        </div>
        <h2 id="props">Props</h2>
        ${propsTable([
          { prop: "name", type: "string", def: "", desc: "Repository name." },
          { prop: "tech", type: "string[]", def: "", desc: "Stack tags shown on the card." },
          { prop: "description", type: "string", def: "", desc: "Short project summary." },
          { prop: "repoUrl", type: "string", def: "", desc: "Link to the GitHub repo." },
        ])}
        <h2 id="archive">Archive</h2>
        <p>More practice & smaller repositories:</p>
        <ul style="display:flex;flex-wrap:wrap;gap:8px;padding-left:0;list-style:none">
          ${ARCHIVE.map(
            (a) =>
              `<li><a class="chip chip-sm" style="text-decoration:none;color:var(--chip-fg)" target="_blank" rel="noreferrer" href="${gh(
                a
              )}">${a} ↗</a></li>`
          ).join("")}
        </ul>`,
    },
    {
      id: "resume",
      group: "Resources",
      title: "Résumé",
      navTitle: "Résumé",
      render: () => `
        <h1>Résumé</h1>
        <p class="lead">Download the full CV or preview it right here.</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          <a href="${RESUME_URL}" download style="border-radius:10px;background:var(--accent);color:#fff;padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none">⬇ Download PDF</a>
          <a href="${RESUME_URL}" target="_blank" rel="noreferrer" style="border-radius:10px;border:1px solid var(--border);padding:11px 20px;font-size:14px;font-weight:600;text-decoration:none;color:var(--fg)">Open in new tab ↗</a>
        </div>
        <h2 id="highlights">Highlights</h2>
        <ul>
          <li>Full Stack Developer — TypeScript, React, Next.js, NestJS.</li>
          <li>1 year professional experience (Information Systems Branch, Egyptian Naval Forces) + freelance: end-to-end apps, REST & GraphQL APIs.</li>
          <li>B.Sc. Software Engineering, Assiut University (2025, Very Good).</li>
          <li>Databases: MongoDB, MySQL, PostgreSQL.</li>
        </ul>
        <h2 id="preview">Preview</h2>
        <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;height:560px">
          <iframe src="${RESUME_URL}" title="Résumé preview" style="width:100%;height:100%;border:0"></iframe>
        </div>`,
    },
    {
      id: "contact",
      group: "Resources",
      title: "Contact",
      navTitle: "Contact",
      render: () => `
        <h1>Contact</h1>
        <p class="lead">Let's build something. The fastest way to reach me is email.</p>
        <div class="callout"><div class="callout-title">💡 Tip</div>I usually reply within a day. For freelance work, include a short brief and timeline.</div>
        <h2 id="channels">Channels</h2>
        <div class="fact-grid">
          <div class="fact"><div class="fact-k">Email</div><div class="fact-v"><a class="link" href="mailto:${PROFILE.email}">${PROFILE.email}</a></div></div>
          <div class="fact"><div class="fact-k">Phone</div><div class="fact-v"><a class="link" href="tel:${PROFILE.phone.replace(/\s/g, "")}">${PROFILE.phone}</a></div></div>
          <div class="fact"><div class="fact-k">GitHub</div><div class="fact-v"><a class="link" target="_blank" rel="noreferrer" href="${PROFILE.github}">@${PROFILE.githubUser}</a></div></div>
          <div class="fact"><div class="fact-k">LinkedIn</div><div class="fact-v"><a class="link" target="_blank" rel="noreferrer" href="${PROFILE.linkedin}">Profile</a></div></div>
        </div>
        <h2 id="message">Send a message</h2>
        <form id="contact-form" style="max-width:560px;display:grid;gap:12px">
          <input required name="name" placeholder="Your name" style="padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--fg);font:inherit" />
          <input required type="email" name="from" placeholder="Your email" style="padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--fg);font:inherit" />
          <textarea required name="msg" rows="4" placeholder="Your message" style="padding:11px 13px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--fg);font:inherit;resize:vertical"></textarea>
          <button type="submit" style="justify-self:start;border-radius:10px;background:var(--accent);color:#fff;padding:11px 22px;font-weight:600;border:none;cursor:pointer">Send via email</button>
        </form>`,
      after: () => {
        const f = byId("contact-form");
        if (!f) return;
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          const fd = new FormData(f);
          const subject = encodeURIComponent(
            "Portfolio contact from " + (fd.get("name") || "")
          );
          const body = encodeURIComponent(
            (fd.get("msg") || "") +
              "\n\n— " +
              (fd.get("name") || "") +
              " (" +
              (fd.get("from") || "") +
              ")"
          );
          window.location.href =
            "mailto:" + PROFILE.email + "?subject=" + subject + "&body=" + body;
        });
      },
    },
  ];

  function renderDocs() {
    byId("docs-root").innerHTML = `
    <div class="docs-shell" id="docs-shell">
      <header class="docs-nav">
        <button class="docs-icon-btn docs-burger" id="docs-burger" aria-label="Menu">☰</button>
        <a class="docs-brand" data-goto="introduction" href="#"><img src="${encodeURI(
          PROFILE.logo
        )}" alt="logo" /><span>${PROFILE.name}</span></a>
        <span class="docs-ver">${PROFILE.version}</span>
        <div class="docs-nav-spacer"></div>
        <button class="docs-search" id="docs-search" aria-label="Search"><span>🔍</span><span class="docs-search-lbl">Search…</span><kbd>⌘K</kbd></button>
        <div class="docs-nav-links">
          <a class="docs-icon-btn" href="${PROFILE.github}" target="_blank" rel="noreferrer" title="GitHub" aria-label="GitHub">GH</a>
          <a class="docs-icon-btn" href="${PROFILE.linkedin}" target="_blank" rel="noreferrer" title="LinkedIn" aria-label="LinkedIn">in</a>
        </div>
      </header>
      <div class="docs-layout">
        <aside class="docs-sidebar" id="docs-sidebar">${docsSidebar()}</aside>
        <main class="docs-content">
          <nav class="docs-crumb" id="docs-crumb"></nav>
          <article class="prose-docs" id="docs-article"></article>
          <nav class="docs-pager" id="docs-pager"></nav>
        </main>
        <aside class="docs-toc" id="docs-toc"></aside>
      </div>
    </div>`;
  }

  function docsSidebar() {
    const groups = [];
    DOCS_PAGES.forEach((p) => {
      let g = groups.find((x) => x.name === p.group);
      if (!g) {
        g = { name: p.group, items: [] };
        groups.push(g);
      }
      g.items.push(p);
    });
    return groups
      .map(
        (g) => `
        <div class="docs-group">
          <div class="docs-group-title">${g.name}</div>
          ${g.items
            .map(
              (p) => `<button class="docs-navlink" data-page="${p.id}">${p.navTitle}</button>`
            )
            .join("")}
        </div>`
      )
      .join("");
  }

  function navigateDocs(id) {
    const page = DOCS_PAGES.find((p) => p.id === id) || DOCS_PAGES[0];
    currentPage = page.id;
    store.set("htp.page", page.id);

    const article = byId("docs-article");
    article.innerHTML = page.render();

    buildToc(article);

    byId("docs-crumb").innerHTML =
      `<span data-goto="introduction" style="cursor:pointer">Docs</span>` +
      `<span class="crumb-sep">/</span><span>${page.group}</span>` +
      `<span class="crumb-sep">/</span><span style="color:var(--fg)">${page.title}</span>`;

    buildPager(page);

    document
      .querySelectorAll(".docs-navlink")
      .forEach((b) => b.classList.toggle("active", b.getAttribute("data-page") === page.id));

    if (typeof page.after === "function") page.after();

    window.scrollTo(0, 0);
    byId("docs-shell") && byId("docs-shell").classList.remove("nav-open");
  }

  function buildToc(article) {
    const toc = byId("docs-toc");
    const heads = Array.prototype.slice.call(article.querySelectorAll("h2, h3"));
    if (!heads.length) {
      toc.innerHTML = "";
      return;
    }
    const items = heads.map((h) => {
      if (!h.id) h.id = slug(h.textContent);
      return { id: h.id, text: h.textContent, lvl: h.tagName === "H3" ? 3 : 2 };
    });
    toc.innerHTML =
      '<div class="toc-title">On this page</div>' +
      items
        .map(
          (i) =>
            `<a href="#${i.id}" class="toc-link lvl-${i.lvl}" data-toc="${i.id}">${i.text}</a>`
        )
        .join("");

    if (tocObserver) tocObserver.disconnect();
    tocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            toc
              .querySelectorAll("a")
              .forEach((a) =>
                a.classList.toggle("active", a.getAttribute("data-toc") === en.target.id)
              );
          }
        });
      },
      { rootMargin: "0px 0px -75% 0px", threshold: 0 }
    );
    heads.forEach((h) => tocObserver.observe(h));
  }

  function buildPager(page) {
    const i = DOCS_PAGES.findIndex((p) => p.id === page.id);
    const prev = DOCS_PAGES[i - 1];
    const next = DOCS_PAGES[i + 1];
    byId("docs-pager").innerHTML =
      (prev
        ? `<a class="pager-link prev" data-page="${prev.id}"><div class="pager-dir">← Previous</div><div class="pager-title">${prev.title}</div></a>`
        : "<span></span>") +
      (next
        ? `<a class="pager-link next" data-page="${next.id}"><div class="pager-dir">Next →</div><div class="pager-title">${next.title}</div></a>`
        : "<span></span>");
  }

  function gotoSection(name) {
    if (currentMode === "docs") {
      navigateDocs(name);
    } else {
      const map = {
        hero: "src/components/Hero.jsx",
        about: "src/components/About.jsx",
        skills: "src/components/Skills.jsx",
        experience: "src/components/Experience.jsx",
        projects: "src/components/Projects.jsx",
        contact: "src/components/Contact.jsx",
        introduction: "src/App.jsx",
      };
      openFile(map[name] || "src/App.jsx");
    }
  }

  /* ============================================================
     WEBSITE MODE (modern general-audience portfolio)
     ============================================================ */
  const LANG_COLORS = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Markdown: "#083fa1",
  };
  const SKILL_ICONS = {
    languages: "λ",
    frontend: "🎨",
    backend: "⚙",
    databases: "🛢",
    tools: "🛠",
  };
  const FEATURED = new Set(PROJECTS.map((p) => p.name));

  function repoCards(filter, query) {
    const q = (query || "").toLowerCase().trim();
    let list = REPOS.slice();
    if (filter && filter !== "All") list = list.filter((r) => r.language === filter);
    if (q)
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
      );
    if (!list.length)
      return '<p style="color:var(--muted);grid-column:1/-1">No repositories match your search.</p>';
    return list
      .map((r) => {
        const color = LANG_COLORS[r.language] || "#8b8b8b";
        const featured = FEATURED.has(r.name);
        return `
        <a class="repo-card${featured ? " is-featured" : ""}" href="${gh(r.name)}" target="_blank" rel="noreferrer">
          <span class="repo-glow" aria-hidden="true"></span>
          <div class="repo-top">
            <span class="repo-ico">${featured ? "★" : "▤"}</span>
            <h3 class="repo-name">${r.name}</h3>
            <span class="repo-arrow">↗</span>
          </div>
          <p class="repo-desc">${r.description || ""}</p>
          <div class="repo-foot">
            <span class="repo-lang"><span class="lang-dot" style="background:${color}"></span>${r.language}</span>
            <span class="repo-updated">Updated ${r.updated}</span>
          </div>
        </a>`;
      })
      .join("");
  }

  function renderRepoGrid(wrap) {
    if (!wrap) return;
    const grid = wrap.querySelector(".repo-grid");
    if (grid) grid.innerHTML = repoCards(siteRepoFilter, siteRepoQuery);
    const count = wrap.querySelector("#repo-count");
    if (count) {
      const n = grid ? grid.querySelectorAll(".repo-card").length : 0;
      count.textContent = n + " / " + REPOS.length + " repositories";
    }
  }

  function renderSite() {
    const langs = [...new Set(REPOS.map((r) => r.language))];
    const filters = ["All"].concat(["TypeScript", "JavaScript", "HTML"].filter((l) => langs.includes(l)));
    const rowA = [].concat(
      ...SKILLS.filter((g) => g.key === "languages" || g.key === "frontend").map((g) => g.items)
    );
    const rowB = [].concat(
      ...SKILLS.filter((g) => g.key === "backend" || g.key === "databases" || g.key === "tools").map((g) => g.items)
    );
    const mchip = (arr) => arr.map((t) => `<span class="m-chip">${t}</span>`).join("");
    byId("site-root").innerHTML = `
    <div class="site-shell">
      <header class="site-nav" id="site-nav">
        <a class="site-logo" data-scroll="home" href="#"><img src="${encodeURI(PROFILE.logo)}" alt="logo" /><span>${PROFILE.name}</span></a>
        <nav class="site-links">
          <a data-scroll="about" href="#">About</a>
          <a data-scroll="skills" href="#">Skills</a>
          <a data-scroll="experience" href="#">Experience</a>
          <a data-scroll="projects" href="#">Projects</a>
          <a data-scroll="contact" href="#">Contact</a>
        </nav>
        <div class="site-nav-cta">
          <a class="btn-ghost" href="${RESUME_URL}" download>Résumé</a>
        </div>
        <button class="site-burger" id="site-burger" aria-label="Menu">☰</button>
      </header>

      <section id="home" class="site-hero">
        <div class="aurora-bg" aria-hidden="true">
          <span class="aurora a1"></span>
          <span class="aurora a2"></span>
          <span class="aurora a3"></span>
          <span class="hero-grid"></span>
        </div>
        <div class="hero-inner">
          <div class="hero-photo reveal">
            <span class="photo-ring"></span>
            <img class="photo-img" src="${encodeURI(PROFILE.logo)}" alt="${PROFILE.name} — ${PROFILE.title}" />
            <span class="photo-badge"><span class="pulse-dot"></span> ${PROFILE.availability}</span>
            <span class="photo-chip"><b>${REPOS.length}+</b> projects</span>
          </div>
          <div class="hero-copy reveal">
            <span class="hero-eyebrow">👋 Hello, I'm</span>
            <h1 class="hero-name"><span class="grad">${PROFILE.name}</span></h1>
            <h2 class="hero-title">I'm a <span class="type" id="role-type">${PROFILE.title}</span><span class="type-caret"></span></h2>
            <p class="hero-desc">I build scalable web apps, robust APIs and clean, responsive interfaces with TypeScript, React, Next.js and NestJS — based in ${PROFILE.location}.</p>
            <div class="hero-cta">
              <a class="btn-primary" data-scroll="projects" href="#">View my work →</a>
              <a class="btn-outline" href="${RESUME_URL}" download>Download CV</a>
            </div>
            <div class="hero-socials">
              <a class="hero-social" href="${PROFILE.github}" target="_blank" rel="noreferrer" aria-label="GitHub">GH</a>
              <a class="hero-social" href="${PROFILE.linkedin}" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
              <a class="hero-social" href="mailto:${PROFILE.email}" aria-label="Email">✉</a>
            </div>
          </div>
        </div>
        <div class="hero-stats reveal">
          <div class="hero-stat"><div class="num">${REPOS.length}+</div><div class="lbl">Repositories</div></div>
          <div class="hero-stat"><div class="num">${PROFILE.followers}</div><div class="lbl">GitHub followers</div></div>
          <div class="hero-stat"><div class="num">3+</div><div class="lbl">Years freelance</div></div>
          <div class="hero-stat"><div class="num">1+</div><div class="lbl">Year professional</div></div>
          <div class="hero-stat"><div class="num">5</div><div class="lbl">Languages</div></div>
        </div>
        <a class="scroll-cue" data-scroll="about" href="#" aria-label="Scroll to about"><span></span></a>
      </section>

      <section id="about" class="site-section">
        <div class="section-head reveal">
          <span class="eyebrow">01 — About</span>
          <h2>A bit about me</h2>
        </div>
        <div class="bento reveal">
          <div class="bento-card b-bio">
            <div class="bento-ico">🧑‍💻</div>
            <h3>Who I am</h3>
            <p>${PROFILE.summary}</p>
            <p class="dim">A graduate Software Engineer who loves turning ideas into polished products — from database schema all the way to a pixel-perfect UI.</p>
          </div>
          <div class="bento-card b-now">
            <div class="bento-ico">🟢</div>
            <h4>Currently</h4>
            <p>${PROFILE.availability} — freelance &amp; full-time.</p>
          </div>
          <div class="bento-card b-loc">
            <div class="bento-ico">📍</div>
            <h4>Based in</h4>
            <p>${PROFILE.location}</p>
          </div>
          <div class="bento-card b-edu">
            <div class="bento-ico">🎓</div>
            <h4>Education</h4>
            <p>B.Sc. Software Engineering — Assiut University · 2025 (Very Good)</p>
          </div>
          <div class="bento-card b-stack">
            <div class="bento-ico">🧩</div>
            <h4>Core stack</h4>
            <div class="bento-chips">${["TypeScript", "React", "Next.js", "NestJS", "Node.js", "MongoDB", "Tailwind CSS"]
              .map((t) => `<span class="chip">${t}</span>`)
              .join("")}</div>
          </div>
          <div class="bento-card b-gh">
            <div class="bento-ico">🐙</div>
            <h4>GitHub</h4>
            <p><b>${REPOS.length}</b> repos · <b>${PROFILE.followers}</b> followers</p>
            <span class="bento-tag">🏆 ${PROFILE.achievement}</span>
          </div>
          <div class="bento-card b-lang">
            <div class="bento-ico">🗣️</div>
            <h4>Languages</h4>
            <p>${LANGUAGES.map((l) => `${l.name} <span class="dim">(${l.level})</span>`).join(" · ")}</p>
          </div>
        </div>
      </section>

      <section id="skills" class="site-section">
        <div class="section-head reveal">
          <span class="eyebrow">02 — Skills</span>
          <h2>My tech stack</h2>
          <p>The technologies I use to design, build and ship full-stack applications.</p>
        </div>
        <div class="marquee reveal">
          <div class="marquee-row">
            <div class="marquee-track">${mchip(rowA)}${mchip(rowA)}</div>
          </div>
          <div class="marquee-row rev">
            <div class="marquee-track">${mchip(rowB)}${mchip(rowB)}</div>
          </div>
        </div>
      </section>

      <section id="experience" class="site-section">
        <div class="section-head reveal">
          <span class="eyebrow">03 — Experience</span>
          <h2>Experience &amp; education</h2>
        </div>
        <div class="timeline">
          ${EXPERIENCE.map(
            (r) => `
            <div class="tl-item reveal">
              <h3>${r.title}</h3>
              <div class="tl-meta">${r.location} · ${r.period}</div>
              <ul>${r.points.map((p) => `<li>${p}</li>`).join("")}</ul>
            </div>`
          ).join("")}
          ${EDUCATION.map(
            (e) => `
            <div class="tl-item reveal">
              <h3>${e.degree}</h3>
              <div class="tl-meta">${e.org} · ${e.period}${e.grade ? " · " + e.grade : ""}</div>
            </div>`
          ).join("")}
        </div>
      </section>

      <section id="projects" class="site-section">
        <div class="section-head reveal">
          <span class="eyebrow">04 — Projects</span>
          <h2>Everything I've built</h2>
          <p>All my public repositories on GitHub — filter by language or search by name.</p>
        </div>
        <div class="repos">
          <div class="repos-bar reveal">
            <div class="repos-filters">
              ${filters
                .map(
                  (l, i) => `<button class="site-filter${i === 0 ? " active" : ""}" data-lang="${l}">${l}</button>`
                )
                .join("")}
            </div>
            <div class="repos-right">
              <span class="repo-count" id="repo-count">${REPOS.length} / ${REPOS.length} repositories</span>
              <label class="repo-search"><span>🔍</span><input id="repo-search" type="text" placeholder="Search repos…" aria-label="Search repositories" /></label>
            </div>
          </div>
          <div class="repo-grid">${repoCards("All", "")}</div>
          <div class="repos-more reveal">
            <a class="btn-outline" href="${PROFILE.github}?tab=repositories" target="_blank" rel="noreferrer">View all on GitHub ↗</a>
          </div>
        </div>
      </section>

      <section id="contact" class="site-section site-contact">
        <div class="contact-cta reveal">
          <span class="eyebrow">05 — Contact</span>
          <h2>Let's build something great</h2>
          <p>I'm currently ${PROFILE.availability.toLowerCase()}. Have a project or a role in mind? I'd love to hear about it.</p>
          <div class="contact-actions">
            <a class="btn-primary" href="mailto:${PROFILE.email}">✉ ${PROFILE.email}</a>
            <a class="btn-outline" href="${PROFILE.linkedin}" target="_blank" rel="noreferrer">Connect on LinkedIn</a>
          </div>
          <div class="contact-methods">
            <a class="contact-method" href="mailto:${PROFILE.email}"><div class="k">Email</div><div class="v">${PROFILE.email}</div></a>
            <a class="contact-method" href="tel:${PROFILE.phone.replace(/\s/g, "")}"><div class="k">Phone</div><div class="v">${PROFILE.phone}</div></a>
            <a class="contact-method" href="${PROFILE.github}" target="_blank" rel="noreferrer"><div class="k">GitHub</div><div class="v">@${PROFILE.githubUser}</div></a>
            <a class="contact-method" href="${PROFILE.linkedin}" target="_blank" rel="noreferrer"><div class="k">LinkedIn</div><div class="v">hussien-taha</div></a>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        © ${new Date().getFullYear()} ${PROFILE.fullName}. Designed &amp; built with HTML, Tailwind CSS &amp; vanilla JS.
      </footer>
    </div>`;
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - 60;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
  }

  function gotoSite(id) {
    if (currentMode !== "site") {
      setMode("site");
      requestAnimationFrame(() => scrollToSection(id));
    } else {
      scrollToSection(id);
    }
    const n = byId("site-nav");
    if (n) n.classList.remove("open");
  }

  function wireSite() {
    const root = byId("site-root");
    if (!root) return;
    root.addEventListener("input", (e) => {
      const s = e.target.closest("#repo-search");
      if (s) {
        siteRepoQuery = s.value;
        renderRepoGrid(root.querySelector(".repos"));
      }
    });
  }

  function setupSiteObservers() {
    const root = byId("site-root");
    if (!root) return;
    const reveals = Array.prototype.slice.call(root.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));

    const sections = Array.prototype.slice.call(root.querySelectorAll("section[id]"));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            root
              .querySelectorAll(".site-links a")
              .forEach((a) => a.classList.toggle("active", a.getAttribute("data-scroll") === en.target.id));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));

    setupTypewriter();
  }

  const prefersReduced = !!(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const ROLES = [
    "Full Stack Developer",
    "React & Next.js Engineer",
    "NestJS API Builder",
    "TypeScript Enthusiast",
    "Problem Solver",
  ];
  function setupTypewriter() {
    const el = document.getElementById("role-type");
    if (!el) return;
    if (prefersReduced) {
      el.textContent = ROLES[0];
      return;
    }
    let i = 0;
    let j = 0;
    let deleting = false;
    function tick() {
      const word = ROLES[i];
      if (!deleting) {
        j++;
        el.textContent = word.slice(0, j);
        if (j >= word.length) {
          deleting = true;
          setTimeout(tick, 1500);
          return;
        }
        setTimeout(tick, 68);
      } else {
        j--;
        el.textContent = word.slice(0, j);
        if (j <= 0) {
          deleting = false;
          i = (i + 1) % ROLES.length;
          setTimeout(tick, 320);
          return;
        }
        setTimeout(tick, 38);
      }
    }
    tick();
  }

  /* ============================================================
     COMMAND PALETTE (⌘K) — shared across both modes
     ============================================================ */
  function paletteCommands() {
    const cmds = [
      { ico: "🌐", label: "Switch to Website mode", hint: "Mode", run: () => setMode("site") },
      { ico: "🖥️", label: "Switch to IDE mode", hint: "Mode", run: () => setMode("ide") },
      { ico: "📖", label: "Switch to Docs mode", hint: "Mode", run: () => setMode("docs") },
      { ico: "🌓", label: "Toggle theme", hint: "Appearance", run: toggleTheme },
    ];
    [
      ["home", "Home"],
      ["about", "About"],
      ["skills", "Skills"],
      ["experience", "Experience"],
      ["projects", "Projects"],
      ["contact", "Contact"],
    ].forEach((s) =>
      cmds.push({ ico: "🌐", label: "Website · " + s[1], hint: "Section", run: () => gotoSite(s[0]) })
    );
    DOCS_PAGES.forEach((p) =>
      cmds.push({
        ico: "📄",
        label: "Docs · " + p.title,
        hint: "Page",
        run: () => {
          setMode("docs");
          navigateDocs(p.id);
        },
      })
    );
    Object.keys(FILES).forEach((path) =>
      cmds.push({
        ico: "{}",
        label: "Open " + FILES[path].name,
        hint: "File",
        run: () => {
          setMode("ide");
          openFile(path);
          setView("code");
        },
      })
    );
    cmds.push({ ico: "↗", label: "GitHub", hint: "Link", run: () => window.open(PROFILE.github, "_blank") });
    cmds.push({ ico: "↗", label: "LinkedIn", hint: "Link", run: () => window.open(PROFILE.linkedin, "_blank") });
    cmds.push({
      ico: "✉",
      label: "Email Hussein",
      hint: "Link",
      run: () => {
        window.location.href = "mailto:" + PROFILE.email;
      },
    });
    cmds.push({ ico: "⬇", label: "Download résumé", hint: "Link", run: () => window.open(RESUME_URL, "_blank") });
    return cmds;
  }

  function buildPalette() {
    PALETTE_CMDS = paletteCommands();
  }

  function openPalette() {
    const p = byId("palette");
    p.hidden = false;
    const input = byId("palette-input");
    input.value = "";
    renderPaletteList("");
    setTimeout(() => input.focus(), 0);
  }

  function closePalette() {
    const p = byId("palette");
    if (p) p.hidden = true;
  }

  function togglePalette() {
    const p = byId("palette");
    if (p.hidden) openPalette();
    else closePalette();
  }

  function renderPaletteList(q) {
    const query = (q || "").toLowerCase().trim();
    paletteFiltered = PALETTE_CMDS.filter(
      (c) =>
        !query ||
        c.label.toLowerCase().includes(query) ||
        (c.hint && c.hint.toLowerCase().includes(query))
    );
    paletteSel = 0;
    const list = byId("palette-list");
    if (!paletteFiltered.length) {
      list.innerHTML = '<li class="palette-empty">No results</li>';
      return;
    }
    list.innerHTML = paletteFiltered
      .map(
        (c, i) =>
          `<li class="palette-item${i === 0 ? " active" : ""}" data-index="${i}"><span class="pi-ico">${c.ico}</span><span class="pi-label">${c.label}</span><span class="pi-hint">${c.hint}</span></li>`
      )
      .join("");
  }

  function moveSel(d) {
    if (!paletteFiltered.length) return;
    paletteSel = (paletteSel + d + paletteFiltered.length) % paletteFiltered.length;
    const items = document.querySelectorAll(".palette-item");
    items.forEach((it, i) => it.classList.toggle("active", i === paletteSel));
    if (items[paletteSel]) items[paletteSel].scrollIntoView({ block: "nearest" });
  }

  function runSel() {
    runPaletteIndex(paletteSel);
  }

  function runPaletteIndex(i) {
    const c = paletteFiltered[i];
    if (!c) return;
    closePalette();
    c.run();
  }

  /* ============================================================
     MODE + THEME
     ============================================================ */
  function setMode(mode) {
    currentMode = mode;
    store.set("htp.mode", mode);
    const roots = { site: byId("site-root"), ide: byId("ide-root"), docs: byId("docs-root") };
    Object.keys(roots).forEach((k) => {
      if (roots[k]) roots[k].hidden = k !== mode;
    });
    const active = roots[mode] || roots.site;
    active.style.animation = "none";
    void active.offsetWidth;
    active.style.animation = "";

    document.querySelectorAll(".seg-btn").forEach((b) => {
      const on = b.getAttribute("data-mode") === mode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });

    if ((location.hash || "").replace("#", "") !== mode) {
      history.replaceState(null, "", "#" + mode);
    }
    closePalette();
    closeSettings();
  }

  function setTheme(t) {
    document.documentElement.classList.toggle("dark", t !== "light");
    store.set("htp.theme", t);
    const ico = document.querySelector("#theme-toggle .theme-ico");
    if (ico) ico.textContent = t === "light" ? "☀️" : "🌙";
    const lbl = document.querySelector("#theme-toggle .settings-row-lbl");
    if (lbl) lbl.textContent = t === "light" ? "Light mode" : "Dark mode";
  }

  function toggleTheme() {
    const cur = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(cur === "dark" ? "light" : "dark");
  }

  /* settings popover (bottom-right gear) */
  function openSettings() {
    const p = byId("settings-panel");
    if (!p) return;
    p.hidden = false;
    const c = byId("app-controls");
    if (c) c.classList.add("open");
    const t = byId("settings-toggle");
    if (t) t.setAttribute("aria-expanded", "true");
  }
  function closeSettings() {
    const p = byId("settings-panel");
    if (!p || p.hidden) return;
    p.hidden = true;
    const c = byId("app-controls");
    if (c) c.classList.remove("open");
    const t = byId("settings-toggle");
    if (t) t.setAttribute("aria-expanded", "false");
  }
  function toggleSettings() {
    const p = byId("settings-panel");
    if (!p) return;
    p.hidden ? openSettings() : closeSettings();
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function wireIDE() {
    const root = byId("ide-root");
    root.addEventListener("click", (e) => {
      const close = e.target.closest("[data-close-path]");
      if (close) {
        e.stopPropagation();
        closeTab(close.getAttribute("data-close-path"));
        return;
      }
      const tab = e.target.closest("[data-tab-path]");
      if (tab) {
        openFile(tab.getAttribute("data-tab-path"));
        return;
      }
      const folder = e.target.closest("[data-folder]");
      if (folder) {
        toggleFolder(folder.getAttribute("data-folder"));
        return;
      }
      const file = e.target.closest("[data-path]");
      if (file) {
        openFile(file.getAttribute("data-path"));
        if (window.innerWidth <= 768) {
          const w = root.querySelector(".ide-window");
          if (w) w.classList.remove("explorer-open");
        }
        return;
      }
      const view = e.target.closest("#ide-viewswitch button");
      if (view) {
        setView(view.getAttribute("data-view"));
        return;
      }
      const drawer = e.target.closest("#ide-drawer-btn");
      if (drawer) {
        const w = root.querySelector(".ide-window");
        if (w) w.classList.toggle("explorer-open");
        return;
      }
      const act = e.target.closest(".ide-activity .act");
      if (act) {
        const title = act.getAttribute("title");
        if (title === "Search") {
          openPalette();
          return;
        }
        root
          .querySelectorAll(".ide-activity .act")
          .forEach((a) => a.classList.toggle("active", a === act));
        if (title === "Explorer" && window.innerWidth <= 768) {
          const w = root.querySelector(".ide-window");
          if (w) w.classList.toggle("explorer-open");
        }
        return;
      }
    });

    const form = byId("term-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = byId("term-input");
        runCommand(inp.value);
        inp.value = "";
      });
    }
    const term = byId("ide-terminal");
    if (term) {
      term.addEventListener("click", (e) => {
        if (!e.target.closest("a")) {
          const inp = byId("term-input");
          if (inp) inp.focus();
        }
      });
    }
  }

  function wireGlobal() {
    document.addEventListener("click", (e) => {
      // close the settings popover when clicking anywhere outside it
      if (!byId("settings-panel").hidden && !e.target.closest("#app-controls")) {
        closeSettings();
      }
      const pit = e.target.closest(".palette-item");
      if (pit) {
        runPaletteIndex(parseInt(pit.getAttribute("data-index"), 10));
        return;
      }
      const pclose = e.target.closest("[data-close]");
      if (pclose) {
        closePalette();
        return;
      }
      const dt = e.target.closest(".demo-tabs button");
      if (dt) {
        const demo = dt.closest(".doc-demo");
        const tab = dt.getAttribute("data-tab");
        demo.querySelectorAll(".demo-tabs button").forEach((b) => b.classList.toggle("active", b === dt));
        demo
          .querySelectorAll(".demo-panel")
          .forEach((p) => (p.hidden = p.getAttribute("data-panel") !== tab));
        return;
      }
      const fb = e.target.closest(".filter-btn");
      if (fb) {
        const wrap = fb.closest(".proj-wrap");
        wrap.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === fb));
        wrap.querySelector(".proj-grid").innerHTML = projectCards(fb.getAttribute("data-lang"));
        return;
      }
      const pg = e.target.closest("[data-page]");
      if (pg) {
        e.preventDefault();
        navigateDocs(pg.getAttribute("data-page"));
        return;
      }
      const go = e.target.closest("[data-goto]");
      if (go) {
        e.preventDefault();
        gotoSection(go.getAttribute("data-goto"));
        return;
      }
      const burger = e.target.closest("#docs-burger");
      if (burger) {
        const s = byId("docs-shell");
        if (s) s.classList.toggle("nav-open");
        return;
      }
      const ds = e.target.closest("#docs-search");
      if (ds) {
        openPalette();
        return;
      }
      const sc = e.target.closest("[data-scroll]");
      if (sc) {
        e.preventDefault();
        gotoSite(sc.getAttribute("data-scroll"));
        return;
      }
      const sfb = e.target.closest(".site-filter");
      if (sfb) {
        const wrap = sfb.closest(".repos");
        wrap.querySelectorAll(".site-filter").forEach((b) => b.classList.toggle("active", b === sfb));
        siteRepoFilter = sfb.getAttribute("data-lang");
        renderRepoGrid(wrap);
        return;
      }
      const sburger = e.target.closest("#site-burger");
      if (sburger) {
        const n = byId("site-nav");
        if (n) n.classList.toggle("open");
        return;
      }
      const st = e.target.closest("#settings-toggle");
      if (st) {
        toggleSettings();
        return;
      }
      const seg = e.target.closest(".seg-btn");
      if (seg) {
        setMode(seg.getAttribute("data-mode"));
        return;
      }
      const th = e.target.closest("#theme-toggle");
      if (th) {
        toggleTheme();
        return;
      }
    });
  }

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      togglePalette();
      return;
    }
    const paletteOpen = !byId("palette").hidden;
    if (paletteOpen && e.key === "Escape") {
      closePalette();
      return;
    }
    if (e.key === "Escape") {
      closeSettings();
      const s = byId("docs-shell");
      if (s) s.classList.remove("nav-open");
      const w = document.querySelector(".ide-window");
      if (w) w.classList.remove("explorer-open");
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");

    renderIDE();
    renderDocs();
    renderSite();
    wireIDE();
    wireGlobal();
    wireSite();
    buildPalette();

    const pinput = byId("palette-input");
    pinput.addEventListener("input", (e) => renderPaletteList(e.target.value));
    pinput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSel(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSel(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        runSel();
      } else if (e.key === "Escape") {
        closePalette();
      }
    });

    setupSiteObservers();

    // default content
    openFile("src/components/Hero.jsx");
    bootTerminal();

    const startPage = store.get("htp.page", "introduction");
    navigateDocs(DOCS_PAGES.find((p) => p.id === startPage) ? startPage : "introduction");

    // mode from hash or storage (default: Website)
    const valid = { site: 1, ide: 1, docs: 1 };
    const hash = (location.hash || "").replace("#", "");
    const stored = store.get("htp.mode", "site");
    const mode = valid[hash] ? hash : valid[stored] ? stored : "site";
    setMode(mode);

    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "").replace("#", "");
      if (h === "site" || h === "ide" || h === "docs") setMode(h);
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
