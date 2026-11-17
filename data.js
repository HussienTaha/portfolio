/* ============================================================
   data.js — single source of truth
   Both modes (IDE + Docs) render from these values.
   Loaded as a classic script: these top-level consts are
   available to app.js (shared global lexical scope).
   ============================================================ */

const PROFILE = {
  name: "Hussein Taha",
  fullName: "Hussein Taha Hussein Ismail",
  title: "Full Stack Developer",
  location: "Cairo, Egypt",
  email: "hussien212258@gmail.com",
  phone: "+20 155 634 4022",
  github: "https://github.com/HussienTaha",
  githubUser: "HussienTaha",
  linkedin: "https://www.linkedin.com/in/hussien-taha-99ba24386",
  followers: 11,
  following: 9,
  achievement: "Pull Shark",
  version: "v2025.1",
  resume: "Hussein Taha CV.pdf",
  logo: "logo.jfif",
  availability: "Available for work",
  summary:
    "Results-driven Full Stack Developer with one year of professional experience in the Information Systems Branch of the Egyptian Naval Forces, complemented by freelance experience. Specializing in building scalable web applications, robust APIs, and responsive user interfaces. Proficient in TypeScript, React, Next.js (Front-End), and NestJS (Back-End), with a strong foundation in software engineering principles. Passionate about writing clean, efficient code and delivering high-quality, performance-optimized solutions.",
};

const SKILLS = [
  { key: "languages", group: "Languages", items: ["TypeScript", "JavaScript", "Python", "Java", "C#"] },
  { key: "frontend", group: "Front-End", items: ["React", "Next.js", "HTML5", "CSS3", "SASS", "Bootstrap", "Tailwind CSS"] },
  { key: "backend", group: "Back-End", items: ["Node.js", "Express.js", "NestJS"] },
  { key: "databases", group: "Databases", items: ["MongoDB", "MySQL", "PostgreSQL"] },
  { key: "tools", group: "Tools & Platforms", items: ["Git", "Docker", "Postman", "VS Code", "AWS", "Firebase", "CI/CD"] },
];

const EXPERIENCE = [
  {
    title: "Freelance Full Stack Developer",
    location: "Cairo, Egypt",
    period: "2024 — Present",
    points: [
      "Developed end-to-end web applications using TypeScript, Next.js (front-end), and NestJS (back-end).",
      "Designed and implemented RESTful APIs and GraphQL endpoints.",
      "Built responsive, accessible user interfaces using React, Next.js, Bootstrap, and Tailwind CSS.",
      "Modeled database schemas and optimized queries using MongoDB and MySQL.",
      "Managed full project lifecycles independently, ensuring timely delivery and client satisfaction.",
    ],
  },
  {
    title: "Full-Stack Developer",
    location: "Information Systems Branch, Egyptian Naval Forces",
    period: "2026 — 2027",
    points: [
      "Developed internal full-stack applications for the Egyptian Naval Forces information systems.",
      "Collaborated with cross-functional teams to deliver secure, high-performance solutions.",
      "Maintained and enhanced existing systems, ensuring reliability and compliance."
    ]
  }
];

const EDUCATION = [
  {
    degree: "B.Sc. in Software Engineering",
    org: "Faculty of Computers & Information, Assiut University, Department of Software Engineering",
    period: "Graduated 2025",
    grade: "Grade: Very Good",
  },
  {
    degree: "Full Stack Development Course",
    org: "Route Academy",
    period: "Diploma",
    grade: "",
  },
];

const LANGUAGES = [
  { name: "Arabic", level: "Native" },
  { name: "English", level: "Fluent" },
];

/* Featured projects — rendered as cards (Docs) and files (IDE) */
const PROJECTS = [
  {
    name: "TaskFlow-jira",
    repo: "TaskFlow-jira",
    language: "TypeScript",
    tech: ["TypeScript", "Next.js", "NestJS"],
    description:
      "Full-stack, real-time task management system (Jira-style) for managing tasks, teams and progress in a way that feels fast and organized.",
  },
  {
    name: "Chat_Social_App",
    repo: "Chat_Social_App",
    language: "JavaScript",
    tech: ["JavaScript", "Socket.IO", "Node.js"],
    description:
      "Real-time social chatting app: connect with friends, create groups and conversations. Real-time messaging built with Socket.IO on client and server.",
  },
  {
    name: "E-commerceApp-Nestjs",
    repo: "E-commerceApp-Nestjs",
    language: "TypeScript",
    tech: ["TypeScript", "NestJS", "REST"],
    description: "E-commerce application powered by a NestJS back-end: auth, catalog, cart and orders.",
  },
  {
    name: "Kalematy",
    repo: "Kalematy",
    language: "TypeScript",
    tech: ["TypeScript", "Next.js"],
    description: "A TypeScript web application focused on a clean, content-driven experience.",
  },
  {
    name: "socialApp",
    repo: "socialApp",
    language: "TypeScript",
    tech: ["TypeScript", "Node.js"],
    description: "A social platform built with TypeScript and a modular back-end.",
  },
  {
    name: "sarahaApp",
    repo: "sarahaApp",
    language: "JavaScript",
    tech: ["JavaScript", "Node.js"],
    description: "Anonymous messaging application (Saraha-style) with a simple, friendly flow.",
  },
  {
    name: "LibraryManagementSystem_Backend_Node.js",
    repo: "LibraryManagementSystem_Backend_Node.js",
    language: "JavaScript",
    tech: ["JavaScript", "Node.js", "Express.js"],
    description: "Back-end for a library management system: books, members and borrowing workflows.",
  },
  {
    name: "FreshCart-E-commerce-App",
    repo: "FreshCart-E-commerce-App",
    language: "JavaScript",
    tech: ["JavaScript", "REST", "CSS3"],
    description: "E-commerce storefront with product listing, cart and checkout UI.",
  },
];

/* Smaller / practice repos shown compactly */
const ARCHIVE = [
  "nexori",
  "movies",
  "FoodDex",
  "game-project",
  "crudsystem",
  "weather",
  "loginsystem",
];

/* Every public GitHub repository (from info.txt), newest first.
   Shown in full on the Website mode Projects section. */
const REPOS = [
  { name: "TaskFlow-jira", language: "TypeScript", updated: "Aug 2026", description: "Full-stack, real-time task & team management system (Jira-style), built from the ground up to keep tasks, teams and progress fast and organized." },
  { name: "nexori", language: "JavaScript", updated: "Jul 2026", description: "A JavaScript web project." },
  { name: "Kalematy", language: "TypeScript", updated: "May 2026", description: "A content-driven TypeScript web application." },
  { name: "E-commerceApp-Nestjs", language: "TypeScript", updated: "Jan 2026", description: "E-commerce application powered by a NestJS back-end: auth, catalog, cart and orders." },
  { name: "sarahaApp", language: "JavaScript", updated: "Nov 2025", description: "Anonymous messaging application (Saraha-style) with a simple, friendly flow." },
  { name: "socialApp", language: "TypeScript", updated: "Nov 2025", description: "A social platform built with TypeScript and a modular back-end." },
  { name: "Chat_Social_App", language: "JavaScript", updated: "Nov 2025", description: "Real-time social chatting app: connect with friends, create groups and conversations — powered by Socket.IO on client and server." },
  { name: "LibraryManagementSystem_Backend_Node.js", language: "JavaScript", updated: "Sep 2025", description: "Node.js back-end for a library management system: books, members and borrowing workflows." },
  { name: "movies", language: "JavaScript", updated: "Mar 2025", description: "A movie browsing app that lists and searches films from a public API." },
  { name: "FoodDex", language: "JavaScript", updated: "Feb 2025", description: "A food discovery / recipes application." },
  { name: "game-project", language: "JavaScript", updated: "Feb 2025", description: "An interactive browser game." },
  { name: "FreshCart-E-commerce-App", language: "JavaScript", updated: "Feb 2025", description: "E-commerce storefront with product listing, cart and checkout UI." },
  { name: "crudsystem", language: "JavaScript", updated: "Dec 2024", description: "A CRUD operations system demo (create, read, update, delete)." },
  { name: "weather", language: "JavaScript", updated: "Dec 2024", description: "A weather forecast web app." },
  { name: "loginsystem", language: "HTML", updated: "Dec 2024", description: "A login / authentication UI." },
];
