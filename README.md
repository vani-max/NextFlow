# NextFlow — AI Workflow Builder
 
A pixel-perfect clone of Krea.ai's workflow builder, focused on LLM workflows. Build, connect, and execute AI pipelines visually using a drag-and-drop canvas.
 
**Live Demo:** [next-flow-hlzm.vercel.app](https://next-flow-hlzm.vercel.app)
 
---
 
## Features
 
- **Visual Workflow Canvas** — Drag and drop nodes onto a React Flow canvas with smooth pan/zoom and dot grid background
- **6 Node Types** — Text, Upload Image, Upload Video, Run LLM, Crop Image, Extract Frame
- **LLM Integration** — Groq API (llama-3.3-70b) with vision support via Trigger.dev background tasks
- **File Uploads** — Direct browser-to-Transloadit uploads for images and videos
- **FFmpeg Processing** — Crop images and extract video frames via Transloadit's robot pipeline
- **Parallel Execution** — Independent branches in the DAG execute concurrently
- **Workflow History** — Right sidebar shows all runs with node-level execution details
- **Save/Load** — Workflows persist to PostgreSQL via Prisma
- **Export/Import** — Download and upload workflows as JSON
- **Authentication** — Clerk-powered sign in/sign up with protected routes
- **Pulsating Glow** — Nodes animate with purple glow during execution
- **Collapsible Sidebar** — Left panel collapses to icon-only mode
---
 
## Tech Stack
 
| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Flow | Visual canvas |
| Zustand | State management |
| Clerk | Authentication |
| Prisma + Neon | Database ORM + PostgreSQL |
| Trigger.dev | Background task execution |
| Groq API | LLM inference (llama-3.3-70b) |
| Transloadit | File uploads + media processing |
| Zod | Schema validation |
| Lucide React | Icons |
| Vercel | Deployment |
 
---
 
## Node Types
 
### Text Node
Simple textarea with an output handle. Used to pass prompts and messages to other nodes.
 
### Upload Image Node
Uploads images directly to Transloadit CDN. Accepts JPG, PNG, WEBP, GIF. Shows preview after upload.
 
### Upload Video Node
Uploads videos directly to Transloadit CDN. Accepts MP4, MOV, WEBM, M4V. Shows video player after upload.
 
### Run LLM Node
Executes AI inference via Groq API through a Trigger.dev background task. Supports:
- 3 input handles: `system_prompt`, `user_message`, `images`
- Model selection (llama-3.3-70b-versatile, llama-4-scout vision)
- Inline output display
- Graceful fallback when quota is exceeded
### Crop Image Node
Crops images using Transloadit's image resize robot. Configurable x%, y%, width%, height% via input handles or manual fields.
 
### Extract Frame Node
Extracts a single frame from a video at a specified timestamp (seconds or percentage) using Transloadit's video thumbs robot.
 
---
 
## Getting Started
 
### Prerequisites
- Node.js 18+
- npm
### Installation
 
```bash
git clone https://github.com/vani-max/NextFlow.git
cd NextFlow
npm install --legacy-peer-deps
```
 
### Environment Variables
 
Create `.env` and `.env.local` files in the root directory:
 
**.env**
```env
DATABASE_URL=postgresql://...your_neon_pooled_url...
DIRECT_URL=postgresql://...your_neon_direct_url...
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
TRIGGER_SECRET_KEY=tr_dev_...
TRIGGER_PROJECT_ID=proj_...
TRANSLOADIT_KEY=your_transloadit_key
TRANSLOADIT_SECRET=your_transloadit_secret
```
 
**.env.local**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_TRANSLOADIT_KEY=your_transloadit_key
GROQ_API_KEY=your_groq_key
```
 
### Database Setup
 
```bash
npx prisma generate
npx prisma migrate dev --name init
```
 
### Running Locally
 
You need **two terminals** running simultaneously:
 
**Terminal 1 — Next.js dev server:**
```bash
npm run dev
```
 
**Terminal 2 — Trigger.dev worker:**
```bash
npx trigger.dev@latest dev --skip-update-check
```
 
Visit [http://localhost:3000](http://localhost:3000)
 
---
 
## API Keys Setup
 
| Service | URL | Purpose |
|---------|-----|---------|
| Neon | [neon.tech](https://neon.tech) | PostgreSQL database |
| Clerk | [clerk.com](https://clerk.com) | Authentication |
| Groq | [console.groq.com](https://console.groq.com) | LLM inference |
| Trigger.dev | [trigger.dev](https://trigger.dev) | Background tasks |
| Transloadit | [transloadit.com](https://transloadit.com) | File uploads |
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com) | Gemini API (optional) |
 
---
 
## Sample Workflow — Product Marketing Kit
 
The app includes a pre-built sample workflow demonstrating all features. Click **"Sample"** in the toolbar to load it.
 
```
Branch A (runs in parallel):
Upload Image → Crop Image → LLM #1 (Product Description)
 
Branch B (runs in parallel):
Upload Video → Extract Frame
 
Convergence:
LLM #1 output + Both images → LLM #2 (Marketing Tweet)
```
 
---
 
## Deployment
 
### Vercel
 
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy
### Trigger.dev Production
 
Deploy tasks to Trigger.dev cloud:
```bash
npx trigger.dev@latest deploy
```
 
Add production environment variables in Trigger.dev dashboard → Environment Variables.
 
Make sure to use the **Production** secret key (`tr_prod_...`) in Vercel, not the dev key.
 
---
 
## Project Structure
 
```
src/
├── app/
│   ├── api/
│   │   ├── execute/          # Task execution routes (llm, crop, extract-frame, status)
│   │   ├── upload/           # File upload routes (image, video)
│   │   └── workflow/         # Workflow CRUD + history routes
│   ├── sign-in/              # Clerk auth pages
│   ├── sign-up/
│   └── workflow/             # Main workflow page
├── components/
│   ├── nodes/                # Custom node components (6 types)
│   ├── sidebar/              # Left + Right sidebars
│   ├── TopToolbar.tsx        # Save, Sample, Import, Export, Run buttons
│   └── WorkflowCanvas.tsx    # React Flow canvas
├── lib/
│   ├── executeWorkflow.ts    # Client-side DAG execution orchestrator
│   ├── workflowExecutor.ts   # DAG utilities (topological sort, parallel groups)
│   ├── sampleWorkflow.ts     # Pre-built sample workflow
│   └── prisma.ts             # Prisma client singleton
├── store/
│   └── workflowStore.ts      # Zustand state (nodes, edges, history, undo/redo)
├── trigger/
│   ├── llm-task.ts           # Groq LLM Trigger.dev task
│   ├── crop-image-task.ts    # Transloadit crop Trigger.dev task
│   └── extract-frame-task.ts # Transloadit frame extraction Trigger.dev task
└── types/
    └── nodes.ts              # TypeScript node type definitions
```
