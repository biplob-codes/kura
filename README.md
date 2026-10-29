# Kura

**Sort a messy inbox of videos into a real library — on your machine.**

Kura is a desktop app for people who download or dump a lot of video files and need a fast way to file them, label them, and keep track of what they’ve already watched. Point it at an inbox folder and a library root, work through new files one by one, then browse by folder, model, tag, or playlist. Playback uses your system default video player; history and “completed” stay separate so opening a video doesn’t auto-archive it.

Built with **Tauri 2**, **React**, **TypeScript**, and **Rust**. Fully local — your files never leave your computer.

![Kura](public/screenshot.png)

---

## What you can do

| Area | What it does |
| --- | --- |
| **Transfer** | Pull from an inbox, preview, pick folder / models / tags, move into the library |
| **Folders** | Browse the library by folder; sort and open videos |
| **Models & tags** | Label people and topics so the library stays searchable. Model views list **all** linked videos (including completed and deleted) |
| **Playlists** | Group videos into custom lists |
| **Play** | Open with the **system default video player** (normal window, not forced fullscreen) |
| **History** | YouTube-style list of recently played videos (play does **not** mark completed) |
| **Completed** | Videos marked done appear here (including ones completed + trashed from History). Cards show title and size and are not clickable |
| **Thumbnails** | Optional stills on transfer via ffmpeg (needs PostgreSQL) |
| **Theme** | Light, dark, or system |
| **Lock** | Optional password gate on launch |

---

## Requirements

### Required

- [Node.js](https://nodejs.org/) **18+**
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- OS packages for [Tauri 2](https://v2.tauri.app/start/prerequisites/) (Linux / macOS / Windows)
- A default video player registered for your video file types on the OS

### Optional (library DB + thumbnails)

- [ffmpeg](https://ffmpeg.org/) on your `PATH`
- [PostgreSQL](https://www.postgresql.org/) running and reachable

Without PostgreSQL you can still use path-based transfer; full library features (home, folders, models, history, completed) expect the database to be enabled in Settings.

---

## Quick start

```bash
git clone https://github.com/biplob-codes/kura.git
cd kura
pnpm install
pnpm tauri dev
```

### First-run setup

1. Open **Settings**.
2. Set **inbox** (where new files land) and **library** (where organized folders live).
3. If you use PostgreSQL:
   - Turn the database on and paste a connection URL, e.g.  
     `postgres://user:password@localhost:5432/kura`
   - Save so migrations run.
4. Optionally enable **thumbnails** (needs ffmpeg + DB).
5. Optionally set an **app password** to lock the UI on launch.

Then open **Transfer**, work through the inbox, and browse **Home**, **Folders**, **Models**, **Playlists**, **History**, and **Completed**.

### Production build

```bash
pnpm tauri build
```

Installers / binaries land under `src-tauri/target/release/` (and the platform bundle folder for your OS).

---

## How the main flows work

### Transfer (inbox → library)

1. Drop files into the inbox directory you configured.
2. Open **Transfer**. Preview the current file, choose a destination folder, and attach models/tags as needed.
3. Confirm — the file is moved into the library and registered in the database (when DB is enabled). Thumbnails are generated if that option is on.

### Playback and history

- Clicking a video opens it with the **system default player** (windowed so minimize / close controls stay available).
- That action only sets **last played** time → it shows up under **History**.
- It does **not** mark the video as completed.

### History menu

On each history card (⋯ menu):

- **Mark as completed** — marks watched, moves the file to the **system trash**, soft-deletes the DB row, and removes it from History. The video still appears under **Completed**.
- **Remove from watch history** — clears play history only; the file stays in the library.

### Completed

Videos marked completed (including the History “complete + trash” path) appear here grouped by date. Each card shows thumbnail, duration, **title**, and **file size**. Cards are display-only (not clickable).

### Models

- The models list counts **all** videos linked to each model (watched, unwatched, deleted, or not).
- Opening a model shows **every** linked video.
- On model detail cards, a **light green tick** in the top-left corner marks videos that were deleted (trashed). Deleted videos cannot be opened for playback.

---

## Project layout

```
kura/
├── src/                      # React UI
│   ├── components/
│   ├── pages/
│   ├── routes.tsx
│   └── …
├── src-tauri/
│   ├── src/                  # Rust: commands, DB, transfer queue, media server
│   ├── migrations/           # sqlx PostgreSQL migrations
│   └── …
├── public/                   # Static assets (screenshot, default thumbnail)
├── package.json
└── README.md
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm tauri dev` | Dev app (Vite + Tauri) |
| `pnpm dev` | Frontend only (Vite) |
| `pnpm build` | Typecheck + frontend production build |
| `pnpm tauri build` | Full desktop bundle |

---

## Troubleshooting

| Issue | What to try |
| --- | --- |
| “Database is not connected” | Enable DB in Settings, check URL, save again so migrations run |
| Player won’t open | Ensure a default video player is set for the file type on your OS |
| No thumbnails | Enable thumbnails in Settings; install ffmpeg; DB must be connected |
| Migrations failed | Check Postgres is up and the user can create tables; fix URL and save Settings again |
| Linux Tauri deps | Follow [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/) |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Desktop | Tauri 2 |
| UI | React 19, TypeScript, Tailwind CSS 4, React Router |
| Backend | Rust, sqlx |
| DB | PostgreSQL (optional but recommended) |
| Media | Local HTTP range server for thumbs; system default player for playback |
| Icons | lucide-react |

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

---

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so the direction is clear before you invest time.
