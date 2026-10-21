# Kura

**Sort a messy inbox of videos into a real library — on your machine.**

Kura is a desktop app for people who download or dump a lot of video files and need a fast way to file them, label them, and keep track of what they’ve already watched. Point it at an inbox folder and a library root, work through new files one by one, then browse by folder, model, tag, or playlist. Playback uses your system player; history and “completed” stay separate so opening a video doesn’t auto-archive it.

Built with **Tauri 2**, **React**, **TypeScript**, and **Rust**. Fully local — your files never leave your computer.

![Kura](public/screenshot.png)

---

## What you can do

| Area | What it does |
| --- | --- |
| **Transfer** | Pull from an inbox, preview, pick folder / models / tags, move into the library |
| **Folders** | Browse the library by folder; sort and open videos |
| **Models & tags** | Label people and topics so the library stays searchable |
| **Playlists** | Group videos into custom lists |
| **Play** | Open in [Celluloid](https://github.com/celluloid-player/celluloid) (fullscreen, resume position) |
| **History** | YouTube-style list of recently played videos (play does **not** mark completed) |
| **Completed** | Explicitly mark videos done; from history you can complete **and** send the file to the system trash in one step |
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
- [Celluloid](https://github.com/celluloid-player/celluloid) on your `PATH` (external player)

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

- Clicking a video opens it in **Celluloid**.
- That action only sets **last played** time → it shows up under **History**.
- It does **not** mark the video as completed.

### History menu

On each history card (⋯ menu):

- **Mark as completed** — marks watched, moves the file to the **system trash**, and soft-deletes the DB row (removed from history).
- **Remove from watch history** — clears play history only; the file stays in the library.

### Completed

Videos you mark watched (without the history “complete + trash” path) appear here as thumbnail + duration grids so you can review what’s done.

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
| Player won’t open | Install Celluloid and ensure `celluloid` is on your `PATH` |
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
| Media | Local HTTP range server for thumbs; Celluloid for playback |
| Icons | lucide-react |

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

---

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so the direction is clear before you invest time.
