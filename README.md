# Saturn AI Workspace 🪐

A sleek, AI-powered browser workspace that transforms your new tab page into a powerful, source-grounded AI assistant powered by Google Gemini.

## ✨ Benefits and Features

- **AI-Powered New Tab**: Instant access to Google Gemini directly from your home screen.
- **Source Grounding**: AI responses come with verifiable citations and links.
- **Smart Widgets**: Built-in Calculator, Scratchpad, and Dashboard.
- **Beautiful Themes**: Switch between Glass, Galaxy, Midnight, and more.
- **Secure Sandbox**: Safe code execution environment for math and programming tasks.
- **Privacy Focused**: Your data stays local; only AI queries are sent to the API.
- **Super Customizable**: Themes, Personality - All in your control
- **Several Modes**: Fast, Web, Deep (with parallel test time compute), Direct (the most concise answer possible), Image And Video Generation
- **Models**: Choose your own models!
- **Incognito**: No history saved!
- **Dashboard**: Quick Start To Your Favorite Apps
- **Personas**: Personalize Your AI into different personalities, using them as and when you need to!

## 🛠️ Installation Guide

Follow these steps to get Saturn running on your browser.

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/saksham-loonker/Saturn-extension.git
cd Saturn-extension
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
Run the build script to generate the extension files:
```bash
npm run deploy
```
This will create a `dist` folder in your project directory containing the compiled extension.

### 4. Load into Chrome / Brave / Edge
1. Open your browser and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle switch in the top right corner).
3. Click the **Load unpacked** button.
4. Select the `dist` folder located inside the `saturn-extension` directory you just built.
5. Open a new tab, and Saturn will launch!

### 3. Configure API Key
Open settings and paste your API key. You can also select models based on your preference and tier of your Gemini API key.

## 🧩 Troubleshooting

- **Black Screen?** Ensure you ran `npm run deploy` and not just `npm run build`.
- **API Errors?** Double-check your settings and ensure your Gemini API key is valid.
- **Code Execution Not Working?** Ensure you are using the latest version; we use a secure sandbox for `eval()` operations.

Built using **React**, **Vite**, **TailwindCSS**, and **Google Gemini** by **Saksham Loonker**, **Vivan Jhaveri** and **Kian Pipalia**.
