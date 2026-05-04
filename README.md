# Dog Dash

A browser-based platformer and level creator. Play community levels, build your own, and share them.

Live at: [[dogdash.netlify.app](https://dogdash.netlify.app)](https://slipperysausage.netlify.app)

---

## Description

Dog Dash lets you play as a wiener dog climbing a vertical platformer level from bottom to top. The main mechanic is a stretch move: hold Space to extend the dog's body forward and grab onto platforms. Movement is momentum-based, so the dog carries speed and slides when you stop.

Beyond playing, you can build your own levels in a drag-and-drop grid editor and publish them for anyone to play.

---

## Controls

| Key | Action |
|-----|--------|
| A / Left arrow | Move left |
| D / Right arrow | Move right |
| W / Up arrow | Jump |
| Space | Stretch (hold to extend, release to snap) |

---

## Running locally

You will need Node.js and a Redis instance (local or cloud).

**Set up environment variables**

`server/.env`:

```
JWT_TOKEN_SECRET=your_secret_here
REDIS_URL=your_redis_url_here
```

`client/.env`:

```
VITE_API_URL=http://localhost:3000
```

**Run the app**

From the root directory:

```bash
npm run dev
```
---

## Tech stack

**Frontend**
- React + Vite
- TypeScript
- React Router
- HTML5 Canvas (level editor)
- Phaser.js (game engine)
- Netlify

**Backend**
- Node.js + Express
- TypeScript
- JWT authentication
- bcryptjs
- Redis
- Render 
```
