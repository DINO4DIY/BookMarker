# URL Bookmark Organizer

A full-stack application for organizing and categorizing bookmarks, built with React, Hono, and oRPC.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Hono with oRPC for type-safe APIs
- **Validation**: Zod
- **Storage**: unstorage (file-based key-value store)
- **AI**: Vercel AI SDK with OpenAI/OpenRouter provider support

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Project Structure

```
src/
  client/           # React frontend
    components/     # UI components organized by feature
    styles/         # Global CSS (Tailwind)
  server/           # Hono backend
    lib/            # Shared utilities (e.g. KV storage)
    rpc/            # oRPC procedure definitions
      bookmarker/   # Bookmark organization logic
      demo/         # Reference implementations
    routes/         # HTTP route definitions
```

## Architecture

The app uses oRPC to provide full-stack type safety — API procedures defined on the server are consumed on the client with automatic TypeScript types. The server serves both the API (`/rpc`) and static files (`/input/`, `/output/`), with all other routes falling through to the React client entry point.

## Key Dependencies

- [React](https://react.dev/) - UI framework
- [Vite](https://vite.dev/) — Build tool & dev server
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first CSS
- [oRPC](https://orpc.unnoq.com/) — Type-safe RPC
- [Hono](https://hono.dev/) — Server framework
- [Zod](https://zod.dev/) — Schema validation
- [unstorage](https://unstorage.unjs.io/) — Key-value storage