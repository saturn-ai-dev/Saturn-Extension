# Saturn AI Workspace 🪐

A sleek, AI-powered browser workspace that transforms your new tab page into a powerful, source-grounded AI assistant powered by Google Gemini.

## ✨ Features

- **AI-Powered New Tab**: Instant access to Google Gemini directly from your home screen.
- **Source Grounding**: AI responses come with verifiable citations and links.
- **Smart Widgets**: Built-in Calculator, Scratchpad, and Media Player.
- **Beautiful Themes**: Switch between Glass, Galaxy, Midnight, and more.
- **Secure Sandbox**: Safe code execution environment for math and programming tasks.
- **Privacy Focused**: Your data stays local; only AI queries are sent to the API.

## 🛠️ Installation Guide

Follow these steps to get Saturn running on your browser.

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or higher)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/saturn-extension.git
cd saturn-extension
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Key
Create a file named `.env.local` in the root directory of the project:
```bash
# Create the file
touch .env.local
```
Open `.env.local` and add your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Build the Extension
Run the build script to generate the extension files:
```bash
npm run deploy
```
This will create a `dist` folder in your project directory containing the compiled extension.

### 5. Load into Chrome / Brave / Edge
1. Open your browser and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle switch in the top right corner).
3. Click the **Load unpacked** button.
4. Select the `dist` folder located inside the `saturn-extension` directory you just built.
5. Open a new tab, and Saturn will launch!

## 🧩 Troubleshooting

- **Black Screen?** Ensure you ran `npm run deploy` and not just `npm run build`.
- **API Errors?** Double-check your `.env.local` file and ensure your Gemini API key is valid.
- **Code Execution Not Working?** Ensure you are using the latest version; we use a secure sandbox for `eval()` operations.

Built with ❤️ using **React**, **Vite**, **TailwindCSS**, and **Google Gemini**.
