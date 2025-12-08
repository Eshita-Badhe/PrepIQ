#  PrepIQ 

## 🚀 Getting Started

### 1. Clone the Repository
Open your terminal (Command Prompt or PowerShell) and run:
```
git clone https://github.com/Eshita-Badhe/PrepIQ
cd  PrepIQ/ExanBuddy
```


### 2. Install Dependencies
This installs all the required libraries (like React and Vite) listed in `package.json`.
```
npm install
```

### 3. Run the Development Server
Start the local server to see your app in the browser:
```
npm run dev
```

```
cd backend
python app.py
```
> Open the link shown in the terminal (usually `http://localhost:5173/`) to view your app.

---

## 📂 Project Structure & Where to Add Code

Here is a guide on where to create new files based on your current folder structure.

### 1. HTML Code
**Location:** `index.html` (in the root folder)
*   This is the main entry point.
*   **Do not** add your page content here directly. React injects content into the `<div id="root"></div>`.
*   Use this file only to change the `<title>`, add external fonts, or CDN links.

### 2. React Components (The UI)
**Location:** `src/` folder
*   **Main App Component:** `src/App.jsx` (Start editing here!)
*   **New Components:** Create a new folder `src/components/` and add files there.
    *   *Example:* `src/components/Counter.jsx`
    *   *Example:* `src/components/Navbar.jsx`

### 3. CSS / Styling
**Location:** `src/` folder
*   **Global Styles:** `src/index.css` (Applied to the whole app)
*   **Component Styles:** `src/App.css` (Specific to App.jsx) or create new CSS files alongside your components.
    *   *Example:* `src/components/Counter.css`

### 4. JavaScript Logic
**Location:** `src/` folder
*   Write your JavaScript logic directly inside your `.jsx` components.
*   For helper functions (like math or formatting), create a folder `src/utils/` and add `.js` files there.
    *   *Example:* `src/utils/helpers.js`

---

## 🐍 Adding a Python Flask Backend

Since this is a React project, the backend usually lives in a separate folder to keep things organized.

### 1. Create Backend Folder
Create a new folder named `backend` in your root directory (next to `src` and `public`).
*   **Location:** ` PrepIQ/backend/`

### 2. Add Flask Files
Inside the `backend` folder, create your Python files:
*   `app.py` (Main Flask application)
*   `requirements.txt` (List of Python libraries)

### 3. Example Structure
```
 PrepIQ/
├── node_modules/
├── public/

├── src/ <-- REACT FRONTEND HERE
│ ├── assets/
│ ├── App.jsx
│ ├── main.jsx <-- JS file
│ └── index.css <-- CSS file

├── backend/ <-- PYTHON FLASK BACKEND HERE
│ ├── app.py
│ └── requirements.txt

├── index.html <-- MAIN ENTRY POINT
├── OTHER HTML PAGES

├── package.json
└── vite.config.js
```

### 4. Connecting React to Flask
To fetch data from your Flask backend, you will use `fetch()` or `axios` in your React components (e.g., inside `App.jsx`).
*   *Example URL:* `http://localhost:5000/api/data`


#### >>> Key Tips for Project
- Create HTML: Make new file in root folder with .html.
- Create CSS: Make new file in src folder with .css.
- Create JS: Make new file in src folder with .jsx.
- Create Flask: Make new file in backend folder with .py.
- Create Component: Make a new file in src folder with .jsx.

#### Push your features to GitHub
> Set your default branch locally
```
git branch -M your-branch-name
```
<br/>

> Through your branch
```
git add .
git commit -m "What feature your are adding"
git push -u origin your-branch-name
```
---
> Before starting a new feature always check for updates by team memeber

And if any ,
```
git pull orgin main
```
