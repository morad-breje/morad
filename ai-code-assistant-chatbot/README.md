# AI Code Assistant Chatbot

AI Code Assistant Chatbot is a Streamlit application that allows users to upload code files and ask an AI assistant to explain the code, detect syntax errors, identify logical issues, review code quality, and suggest improvements.

## Project Overview

This project demonstrates AI application development, prompt engineering, LLM API integration, and user-friendly interface design. It uses the Groq API to provide fast AI responses for code explanation and debugging tasks.

## Key Features

- Upload code files in multiple programming languages
- Explain uploaded code in a clear and structured way
- Detect and fix syntax errors
- Identify logical errors and bad practices
- Review and improve code readability and maintainability
- Add comments to uploaded code
- Refactor code based on best practices
- Select from multiple Groq-supported models
- Dark themed Streamlit user interface
- Conversation history using Streamlit session state

## Supported File Types

Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML, CSS, SQL, Bash, R, TXT, and Markdown.

## Technologies Used

- Python
- Streamlit
- Groq API
- Large Language Models (LLMs)
- Prompt Engineering
- Generative AI
- HTML/CSS customization inside Streamlit

## Folder Structure

```text
ai-code-assistant-chatbot/
├── app.py
├── requirements.txt
└── README.md
```

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/ai-code-assistant-chatbot.git
cd ai-code-assistant-chatbot
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the app:

```bash
streamlit run app.py
```

5. Paste your Groq API key in the sidebar and start using the assistant.

## Groq API Key

This project does not store an API key inside the code. The user enters the key through the Streamlit sidebar while using the app.

You can create a Groq API key from the Groq Console.

## Screenshots

Add screenshots here after uploading the project to GitHub:

```text
/screenshots/home.png
/screenshots/upload-code.png
/screenshots/code-explanation.png
```

## What I Learned

- Integrating LLM APIs into a real application
- Designing effective system prompts for code explanation and debugging
- Managing uploaded files and chat history in Streamlit
- Building AI-powered developer tools
- Creating a practical AI project suitable for a professional portfolio

## Author

Morad Khalil  
Computer Science Student | Backend Developer | AI & Web Developer
