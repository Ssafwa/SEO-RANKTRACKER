# SEO Rank Tracker
this is a simple website for it to checks your rankings, audits the page, and an AI suggests what to improve.
I built this because I wanted to see where my websites rank on Google and what to fix, without paying for a big SEO tool.  

<p align="center">
  <img width="900" alt="Dashboard" src="https://github.com/user-attachments/assets/221af5d1-8821-4f74-8b72-bad622bf1c6e" />
</p>

## What it does

- **Rank Tracker:** looks up where your site shows up on Google for each keyword, using a real browser and gives the output cleanly with graph,position details & compititors (Browserbase)
- **Website audits:** scans a page and reports SEO problems like critical,warning & info and more things 
- **History:** saves past results so you can see rankings change over time
- **AI recommendations:** an AI model reads the audit and suggests fixes

## Screenshots

### Audit
<img width="900" alt="Audit" src="https://github.com/user-attachments/assets/5a737176-d990-4304-9858-b3df9eacc4b7" />

### History
<img width="900" alt="History" src="https://github.com/user-attachments/assets/8f59c9df-cb37-4540-9bbf-d3656f184c74" />

### Rank tracker
<img width="900" alt="Rank tracker" src="https://github.com/user-attachments/assets/cdbbf51e-b035-4103-addb-80a14c809909" />

### Dash Board 
<img width="900" alt="Dash Board" src="https://github.com/user-attachments/assets/0a169367-f851-4ae7-8b76-45ef57629d39" />

## Tech stack


 Frontend - React, Vite, React Router, Tailwind CSS, TypeScript 
 Backend - Node.js API (nodemon in dev) 
 Database - MongoDB Atlas 
 Rank checking - Browserbas  
 AI - Gemini 2.5 Flash through the Hack Club AI proxy (OpenAI-compatible) 
 Hosting - Vercel (app and API) 

## Project structure

```
seo-rank-tracker/
├── client/   # React frontend
└── server/   # Node API, talks to MongoDB, Browserbase and the AI
```

## Infrastructure (like a BOM)

| Item | Why I need it |
|------|---------------|
| MongoDB Atlas cluster | stores audits and ranking history |
| Browserbase account | real browser for Google rank checks |
| Server (Docker in an LXC container, Helsinki) | runs my self-hosted Browserless |
| ngrok free static domain | lets the Vercel API reach my server |
| Vercel | hosts the app |

## Getting started

**You need:** Node.js 18+, a MongoDB Atlas cluster, and a Browserbase API key (or your own Browserless).

```bash
git clone https://github.com/Ssafwa/seo-rank-tracker
cd seo-rank-tracker
```

**1. Server**

```bash
cd server
npm install
cp .env.example .env   # then fill in your own values
npm run server
```

`server/.env` needs:

```
MONGODB_URL=your_atlas_connection_string
BROWSERBASE_API_KEY=your_key
AI_API_KEY=your_key
```

**2. Client**

```bash
cd client
npm install
npm run dev
```

## Devlog: problems I ran into

<details>
<summary><b>My MongoDB Atlas cluster disappeared</b></summary>

**What happened:** [the API stopped connecting to the database]
**How I fixed it:** I made a new cluster, created a new database user, and updated the connection string in `server/.env`.
**What I learned:** [your takeaway]

</details>

<details>
<summary><b>Switching from Serper to Browserbase</b></summary>

**What happened:** I first planned to use Serper for Google results.
**How I fixed it:** I switched to Browserbase so rank checks come from a real browser, and removed the Serper key.
**Why:** [your reason]

</details>

<details>
<summary><b>Self-hosting my own Browserbase replacement</b></summary>

**What happened:** [cost / limits / wanted control]
**How I fixed it:** I ran Browserless in Docker on a server in Helsinki. I only had SSH access to it, since it runs inside Proxmox.
**What was hard:** [your story]

</details>

<details>
<summary><b>ngrok instead of a Cloudflare tunnel</b></summary>

**What happened:** my Vercel-hosted API had to reach the Browserless on my server.
**How I fixed it:** a Cloudflare quick tunnel changes its URL, so I used an ngrok free static domain, and set it up to keep running without my laptop.

</details>

<details>
<summary><b>Getting AI recommendations working</b></summary>

**What happened:** [the problem]
**How I fixed it:** I used the Hack Club AI proxy with Gemini 2.5 Flash.

</details>

## What I want to add next

- [idea 1]
- [idea 2]

## License

MIT

## Author

Made by [your name], [link to profile]
