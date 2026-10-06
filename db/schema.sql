-- The database is a build artifact: `npm run seed` drops and recreates it
-- from content/. Never edit data/bible.db by hand; edit content/ instead.

DROP TABLE IF EXISTS search_index;
DROP TABLE IF EXISTS stage_sections;
DROP TABLE IF EXISTS stages;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS blocks;

CREATE TABLE stages (
  slug        TEXT PRIMARY KEY,
  position    INTEGER NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  artifact    TEXT NOT NULL,
  summary     TEXT NOT NULL,
  source_path TEXT NOT NULL
);

CREATE TABLE stage_sections (
  stage_slug  TEXT NOT NULL REFERENCES stages(slug) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('details', 'recommendations', 'research')),
  body_html   TEXT NOT NULL,
  source_path TEXT NOT NULL,
  PRIMARY KEY (stage_slug, kind)
);

-- The home intro (slug 'home') and the secondary pages.
CREATE TABLE pages (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  nav_label   TEXT NOT NULL,
  nav_order   INTEGER NOT NULL,
  in_nav      INTEGER NOT NULL DEFAULT 1 CHECK (in_nav IN (0, 1)),
  body_html   TEXT NOT NULL,
  source_path TEXT NOT NULL
);

-- Pre-rendered fragments for the home page (dynamics SVGs and actor lists).
CREATE TABLE blocks (
  key  TEXT PRIMARY KEY,
  html TEXT NOT NULL
);

-- Plain-text index for /search. The content set is small, so a LIKE scan is
-- fast enough and keeps the behaviour identical on every SQLite build.
CREATE TABLE search_index (
  url      TEXT PRIMARY KEY,
  title    TEXT NOT NULL,
  text     TEXT NOT NULL,
  position INTEGER NOT NULL
);
