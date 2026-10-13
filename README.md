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


 - Frontend - React, Vite, React Router, Tailwind CSS, TypeScript 
 - Backend - Node.js API (nodemon in dev) 
 - Database - MongoDB Atlas 
 - Rank checking - Browserbas  
 - AI - Gemini 2.5 Flash through the Hack Club AI proxy (OpenAI-compatible) 
 - Hosting - Vercel (app and API) 

## Project structure

```
seo-rank-tracker/
-  client/   # React frontend
-  server/   # Node API, talks to MongoDB, Browserbase and the AI
```

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
cp .env.example .env  
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

## License

MIT

## Author

Made by safwan, https://github.com/Ssafwa

> [!NOTE]
> A NOTE FOR HACKCLUB SHIPWRIGHTS
> This readme is fully writen by me 
>  <img width="1920" height="1028" alt="image" src="https://github.com/user-attachments/assets/c3ba197a-4e7d-46a2-8823-d868379978b8" />

> and this website took me above 18  houres so i dont use any ai 



