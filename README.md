<h1>PrepIQ – The AI Powered StudyMate</h1>

<p>
  PrepIQ is an AI-powered, syllabus-aligned study companion that turns your own notes and syllabus into personalized, gamified exam prep content.  
  This repository currently represents the initial prototype phase of the project and is under active development.  
</p>

<hr />

<h2>Overview</h2>
<p>
  PrepIQ is an all-in-one exam preparation platform that combines Retrieval-Augmented Generation (RAG), adaptive study planning, and gamification into a single experience.  
  Students upload their syllabus, textbooks, and class notes, and PrepIQ generates context-aware notes, quizzes, mind maps, and sample papers strictly grounded in those materials.  
</p>

<h2>🚀 Features</h2>
<ul>
  <li>🎯 <strong>Syllabus-aligned learning</strong>: All content is generated only from user-uploaded documents using a RAG pipeline to minimize hallucinations.  </li>
  <li>🧠 <strong>Intelligent learning modes</strong>: Detailed notes, concise summaries, flashcards, mind maps, quizzes, and AI-generated sample papers.  </li>
  <li>💬 <strong>Context chatbot &amp; voicebot</strong>: Ask doubts and get answers from your own materials via text or voice, with history tracking.  </li>
  <li>📅 <strong>AI study planner</strong>: Adaptive schedule that adjusts to performance, exam timelines, and completion rates.  </li>
  <li>🕹️ <strong>Gamified study</strong>: Learning games, streaks, notifications, and rewards to keep preparation engaging.  </li>
  <li>📂 <strong>Document &amp; progress management</strong>: Secure upload and organization of documents, plus dashboards for progress, streaks, and analytics.  </li>
</ul>

<h2>🖼 Demo (Early UI)</h2>
<p><em>Note: These are early-stage mockups</em>  </p>
<ul>
  <li>Windows 7–style dashboard UI showcasing familiar, clean layout for the main study workspace.  </li>
  <li>Document management screen with upload, organization, and note-generation options.  </li>
  <li>Learning modes view with cards for notes, quizzes, flashcards, and mind maps.  </li>
  <li>Progress tracker with streaks, completion metrics, and visual performance graphs.  </li>
</ul>

<p >
  <img src="./assets/landing.png" alt="PrepIQ boot screen" width="720" />
  <br />
  <em>Loading – initializing the PrepIQ Windows 7–style environment.</em>
</p>

<p >
  <img src="./assets/bootload.png" alt="PrepIQ boot screen" width="720" />
  <br />
  <em>Bootload screen – initializing the PrepIQ Windows 7–style environment.</em>
</p>

<p>
  <img src="./assets/registration.png" alt="Registration screen" width="720" />
  <br />
  <em>Registration – onboarding new users into the PrepIQ ecosystem.</em>
</p>

<p >
  <img src="./assets/login.png" alt="PrepIQ login" width="720" />
  <br />
  <em>Login screen – secure sign-in for students.</em>
</p>

<p >
  <img src="./assets/dashboard.png" alt="PrepIQ dashboard" width="720" />
  <br />
  <em>Dashboard – Windows 7–inspired workspace with active apps and shortcuts.</em>
</p>

<p >
  <img src="./assets/Menu.png" alt="PrepIQ main menu" width="720" />
  <br />
  <em>Main menu – quick access to notes, quizzes, planner, and more.</em>
</p>


<p>
  <img src="./assets/uploading.png" alt="Uploading documents" width="720" />
  <br />
  <em>Uploading – securely adding syllabus and notes for RAG processing.</em>
</p>

<p>
  <img src="./assets/viewfiles.png" alt="View uploaded files" width="720" />
  <br />
  <em>File viewer – manage and review uploaded study materials.</em>
</p>

<p >
  <img src="./assets/generatenotes.png" alt="Generate notes form" width="720" />
  <br />
  <em>Generate notes – choose topics and formats for custom notes.</em>
</p>

<p >
  <img src="./assets/generatednotes.png" alt="Generated notes view" width="720" />
  <br />
  <em>Generated notes – AI-created, syllabus-aligned study material.</em>
</p>

<h2>🧩 System Workflow</h2>
<ul>
  <li><strong>Upload</strong>: User uploads syllabus, textbooks, notes, and reference PDFs.  </li>
  <li><strong>Process</strong>: Documents are chunked, embedded, and stored in a vector database.  </li>
  <li><strong>Generate</strong>: AI generates context-aware notes, questions, summaries, and sample papers from stored documents.  </li>
  <li><strong>Learn</strong>: User chooses modes like chatbot, voicebot, quizzes, flashcards, or mind maps.  </li>
  <li><strong>Track &amp; adapt</strong>: Progress, streaks, and performance feed into an adaptive planner for smarter recommendations.  </li>
</ul>

<h2>🛠 Tech Stack</h2>
<ul>
  <li><strong>Frontend:</strong> React.js, HTML5, CSS3, JavaScript (ES6), Windows 7–inspired UI.  </li>
  <li><strong>Backend:</strong> Python, Flask REST API for auth, uploads, RAG pipeline, and AI endpoints.  </li>
  <li><strong>AI / ML:</strong> RAG pipeline, Hugging Face embeddings, Groq LLM (llama-3.1-8b-instant) for fast, context-aware responses.  </li>
  <li><strong>Vector Store:</strong> Faiss for similarity search over embedded document chunks.  </li>
  <li><strong>Storage &amp; Auth:</strong> Supabase PostgreSQL for user data and Supabase Storage for documents and generated content.  </li>
</ul>

<h2>🔬 Why PrepIQ?</h2>
<table>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>PrepIQ</th>
      <th>Generic AI Tools (e.g., chat-only)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Content source</td>
      <td>Strictly from uploaded syllabus and notes.  </td>
      <td>Broad, general web or training data.  </td>
    </tr>
    <tr>
      <td>Note formats</td>
      <td>Notes, summaries, mind maps, quizzes, flashcards, sample papers.  </td>
      <td>Mostly text answers.  </td>
    </tr>
    <tr>
      <td>Study planning</td>
      <td>AI-driven adaptive study planner.  </td>
      <td>Manual or external planning.  </td>
    </tr>
    <tr>
      <td>Voice interaction</td>
      <td>Built-in voicebot tied to your materials.  </td>
      <td>Limited or not syllabus-aware.  </td>
    </tr>
    <tr>
      <td>Gamification</td>
      <td>Full gamification suite (streaks, games, rewards).  </td>
      <td>Limited or none.  </td>
    </tr>
  </tbody>
</table>

<h2>📌 Project Status</h2>
<ul>
  <li>This project is in its <strong>initial / prototype stage</strong>.  </li>
  <li>Core flows (upload → RAG processing → content generation → basic UI) are being implemented and iterated.  </li>
  <li>Interfaces, performance, and feature coverage are subject to rapid change.  </li>
</ul>
<p>
  <em>“Expect breaking changes and work-in-progress code as we evolve the architecture and features.”</em>
</p>

<h2>👥 Contributors / Team</h2>
<ul>
  <li><strong><a href="https://github.com/Eshita-Badhe">Eshita Badhe</a></strong> – Full-stack development, architecture, AI integration (RAG, embeddings, LLM).  </li>
  <li><a href="https://github.com/Aarya-Chaudhari">Aarya Chaudhari</a></strong> – UI/UX, feature design, research, and front-end experience flows.  </li>
</ul>


<h2>📂 Repository Structure</h2>
<pre><code>PrepIQ/
  |- backend/
        app.py, config.py
        rag_local.py, retrieval modules
        src/ (chunking, embeddings, ingest, multimodal 
        loader, RAG chain)
  |- src/
        |- apps/ 
            (Explorer, ChatBot, Notes, MindMaps, Planner, Games, VoiceBot, etc.) 
        |- assets/ 
            (icons, wallpapers)
        |- core UI files 
            (App.jsx, Login.jsx, Win7Desktop-Advanced.jsx)
  |- assets/ 
    (project screenshots)
  |- requirements.txt
  |- package.json
</code></pre>

<h2>🏁 Getting Started </h2>
<p>
  This section will be finalized after the first stable prototype.  
  Planned:
</p>
<ul>
  <li>Prerequisites (Node, Python, Supabase project, Groq &amp; HF keys).  </li>
  <li>Environment configuration (<code>.env</code> for frontend and backend).  </li>
  <li>Commands to run frontend and backend locally.  </li>
</ul>
