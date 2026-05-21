# Kanban Frontend

Next.js app for a multi-tenant Kanban workspace: organizations, boards, cards, members, activity, and org-wide chat. Data is loaded from the Kanban Nest API over REST; realtime updates use [Ably](https://ably.com).

## Stack

- **Next.js 16** (App Router)
- **React 19**, **TypeScript**
- **Mantine** UI, **TanStack Query**, **Zustand** (auth)
- **@dnd-kit** for drag-and-drop on boards
- **Ably** + **@ably/chat** for realtime

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (recommended) or npm/yarn
- Kanban API running (default `http://localhost:3000`)
- Ably account with an API key ([dashboard](https://ably.com/accounts))

## Environment variables

Create `.env.local` in the project root:

```bash
# Nest API base URL (server-side fetch + membership checks for Ably tokens)
API_URL=http://localhost:3000

# Ably root API key — server only; never expose as NEXT_PUBLIC_*
ABLY_API_KEY=your-ably-api-key
```

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | Yes | Backend HTTP API used by server actions and Ably token auth |
| `ABLY_API_KEY` | Yes | Issues Ably tokens and publishes board events from the Next server |

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or pass a port, e.g. `pnpm dev -- -p 3001`).

Register or log in, create or join an org, then use boards and **Messages** for org chat.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | ESLint |

## Realtime architecture

### Org messages (`/orgs/[orgId]/messages`)

Uses **Ably Chat** (`@ably/chat/react`), not the REST messages API:

- One chat room per org: `org:{orgId}`
- `AblyChatProviders` + `ChatRoomProvider` + `OrgChatPanel` (`useMessages`, `useChatConnection`)
- Token: server action `getAblyToken` in `lib/server/ably-token.ts` (membership verified via `API_URL`)

Messages live in Ably Chat history. They are separate from any messages stored in the Nest database.

### Kanban boards (`/orgs/[orgId]/boards/[boardId]`)

Uses **Ably Pub/Sub** channels:

- Channel `board:{boardId}`, event `board`
- Client subscribes via `hooks/use-board-socket.ts` and invalidates the board query on updates
- Server publishes after card mutations in `lib/server/realtime-mutations.ts` (create / update / move / delete)

## Project layout (high level)

```
app/                    # Routes (auth, orgs, boards, messages)
components/
  chat/                 # Ably Chat providers and org chat UI
  board/                # Kanban board UI
lib/
  server/               # Server actions, API fetcher, Ably token + publish
  ably-client.ts        # Board channel subscriptions (browser)
hooks/                  # React Query hooks + board realtime hook
```

## Backend

Point `API_URL` at your Kanban Nest API. The frontend expects JWT auth (`Authorization: Bearer`) and the usual org/board/card/message endpoints for CRUD. Realtime for chat is handled on the frontend via Ably Chat; board events are published from this Next app after successful card API calls.

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Ably Chat — React](https://ably.com/docs/chat/getting-started/react)
- [Ably token authentication](https://ably.com/docs/auth/token)
