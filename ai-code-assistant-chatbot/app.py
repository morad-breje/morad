import streamlit as st
from groq import Groq

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Code Assistant",
    page_icon="🤖",
    layout="wide",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    .stApp { background-color: #0f1117; }

    [data-testid="stSidebar"] {
        background-color: #1a1d27;
        border-right: 1px solid #2e3148;
    }

    [data-testid="stChatMessage"] {
        background-color: #1e2130;
        border-radius: 12px;
        padding: 4px 8px;
        margin-bottom: 8px;
        border: 1px solid #2e3148;
    }

    code { background-color: #0d1117 !important; }
    pre  { background-color: #0d1117 !important; border-radius: 8px !important; }

    [data-testid="stFileUploader"] {
        background-color: #1e2130;
        border-radius: 10px;
        padding: 8px;
        border: 1px dashed #4a4e6e;
    }

    .stButton > button {
        background: linear-gradient(135deg, #f97316, #fb923c);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        transition: opacity .2s;
    }
    .stButton > button:hover { opacity: .85; }

    [data-testid="stChatInput"] textarea {
        background-color: #1e2130 !important;
        border: 1px solid #4a4e6e !important;
        border-radius: 10px !important;
        color: #e0e0e0 !important;
    }

    .gradient-title {
        background: linear-gradient(90deg, #f97316, #fb923c);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2rem;
        font-weight: 800;
    }
</style>
""", unsafe_allow_html=True)

# ── Available Groq models ─────────────────────────────────────────────────────
GROQ_MODELS = {
    "llama-3.3-70b-versatile": "Llama 3.3 · 70B  (best quality)",
    "llama-3.1-8b-instant":    "Llama 3.1 · 8B   (fastest)",
    "mixtral-8x7b-32768":      "Mixtral · 8×7B   (large context)",
    "gemma2-9b-it":            "Gemma 2 · 9B     (Google)",
}

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert code assistant with deep knowledge across all programming languages and paradigms.

Your capabilities:
1. **Code Explanation**: Break down code clearly — explain what each part does, why it exists, and how pieces connect.
2. **Syntax Error Detection & Fixing**: Spot and correct syntax errors; show the corrected version with a brief explanation.
3. **Logical Error Detection & Fixing**: Identify logical bugs (wrong conditions, off-by-one errors, incorrect algorithms, etc.) and suggest fixes.
4. **Code Review**: Point out bad practices, potential runtime errors, and improvements.

Formatting rules:
- Always use fenced code blocks with the correct language tag (```python, ```js, etc.).
- When fixing code, show BOTH the original problematic snippet AND the corrected version (label them "❌ Before" and "✅ After").
- Keep explanations friendly, structured, and concise — use bullet points and headers where helpful.
- If code is uploaded, always reference it by filename.
"""

# ── Session state ─────────────────────────────────────────────────────────────
defaults = {
    "messages": [],
    "uploaded_code": None,
    "uploaded_filename": None,
    "groq_api_key": "",
    "selected_model": "llama-3.3-70b-versatile",
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# ── Call Groq ─────────────────────────────────────────────────────────────────
def ask_groq(user_message: str, code_context: str | None = None) -> str:
    client = Groq(api_key=st.session_state.groq_api_key)

    messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in st.session_state.messages:
        messages_payload.append({"role": m["role"], "content": m["content"]})

    if code_context:
        full_message = (
            f"The user has uploaded a file with the following code:\n\n"
            f"```\n{code_context}\n```\n\n"
            f"User request: {user_message}"
        )
    else:
        full_message = user_message

    messages_payload.append({"role": "user", "content": full_message})

    response = client.chat.completions.create(
        model=st.session_state.selected_model,
        messages=messages_payload,
        max_tokens=4096,
        temperature=0.3,
    )
    return response.choices[0].message.content

# ── Detect language ───────────────────────────────────────────────────────────
def detect_language(filename: str) -> str:
    ext_map = {
        ".py": "python",  ".js": "javascript", ".ts": "typescript",
        ".java": "java",  ".cpp": "cpp",        ".c": "c",
        ".cs": "csharp",  ".go": "go",          ".rs": "rust",
        ".rb": "ruby",    ".php": "php",         ".swift": "swift",
        ".kt": "kotlin",  ".html": "html",       ".css": "css",
        ".sql": "sql",    ".sh": "bash",         ".r": "r",
    }
    for ext, lang in ext_map.items():
        if filename.lower().endswith(ext):
            return lang
    return "text"

# ═══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ═══════════════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown('<div class="gradient-title">⚡ Code Assistant</div>', unsafe_allow_html=True)
    st.caption("Powered by Groq API")
    st.divider()

    # ── API Key ────────────────────────────────────────────────────────────────
    st.markdown("### 🔑 Groq API Key")
    api_key_input = st.text_input(
        "Groq API Key",
        type="password",
        placeholder="gsk_...",
        value=st.session_state.groq_api_key,
        label_visibility="collapsed",
    )
    if api_key_input:
        st.session_state.groq_api_key = api_key_input
        st.success("✅ API key saved")
    else:
        st.warning("⚠️ Paste your key above to start.  \n[Get one free → console.groq.com](https://console.groq.com/keys)")

    # ── Model selector ─────────────────────────────────────────────────────────
    st.markdown("### 🧠 Model")
    selected = st.selectbox(
        "Choose model",
        options=list(GROQ_MODELS.keys()),
        format_func=lambda k: GROQ_MODELS[k],
        index=list(GROQ_MODELS.keys()).index(st.session_state.selected_model),
        label_visibility="collapsed",
    )
    st.session_state.selected_model = selected
    st.divider()

    # ── File uploader ──────────────────────────────────────────────────────────
    st.markdown("### 📂 Upload Code File")
    uploaded_file = st.file_uploader(
        "Drop your file here",
        type=["py", "js", "ts", "java", "cpp", "c", "cs", "go", "rs",
              "rb", "php", "swift", "kt", "html", "css", "sql", "sh",
              "r", "txt", "md"],
        label_visibility="collapsed",
    )

    if uploaded_file:
        raw = uploaded_file.read()
        try:
            code_text = raw.decode("utf-8")
        except UnicodeDecodeError:
            code_text = raw.decode("latin-1")

        st.session_state.uploaded_code = code_text
        st.session_state.uploaded_filename = uploaded_file.name
        lang = detect_language(uploaded_file.name)
        st.success(f"✅ **{uploaded_file.name}** loaded")
        with st.expander("👁 Preview", expanded=False):
            st.code(code_text[:2000] + ("…" if len(code_text) > 2000 else ""), language=lang)

    elif st.session_state.uploaded_code:
        st.info(f"📄 **{st.session_state.uploaded_filename}** active")
        if st.button("🗑 Clear file"):
            st.session_state.uploaded_code = None
            st.session_state.uploaded_filename = None
            st.rerun()

    st.divider()

    # ── Quick actions ──────────────────────────────────────────────────────────
    st.markdown("### ⚡ Quick Actions")
    quick_actions = {
        "🔍 Explain this code":     "Please explain what this code does in detail.",
        "🐛 Find & fix all errors":  "Find all syntax and logical errors in this code and provide the fixed version.",
        "✨ Review & improve":       "Review this code and suggest improvements for readability, efficiency, and best practices.",
        "📝 Add comments":           "Add clear, helpful inline comments to this code.",
        "🔄 Refactor":               "Refactor this code to make it cleaner and more maintainable.",
    }

    for label, prompt in quick_actions.items():
        if st.button(label, use_container_width=True):
            if not st.session_state.groq_api_key:
                st.error("❌ Enter your Groq API key first.")
            elif not st.session_state.uploaded_code:
                st.warning("⚠️ Upload a code file first.")
            else:
                st.session_state._pending_prompt = prompt

    st.divider()
    if st.button("🗑 Clear chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN AREA
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("## 💬 Chat with your Code")
if st.session_state.uploaded_filename:
    st.caption(f"Analysing: **{st.session_state.uploaded_filename}** · Model: `{st.session_state.selected_model}`")
else:
    st.caption("Upload a file in the sidebar, then use a Quick Action or type below.")

# Render conversation
for msg in st.session_state.messages:
    avatar = "🧑‍💻" if msg["role"] == "user" else "🤖"
    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])

# ── Quick-action injection ────────────────────────────────────────────────────
pending = st.session_state.pop("_pending_prompt", None)
if pending:
    with st.chat_message("user", avatar="🧑‍💻"):
        st.markdown(pending)
    st.session_state.messages.append({"role": "user", "content": pending})

    with st.chat_message("assistant", avatar="🤖"):
        with st.spinner("Groq is thinking…"):
            try:
                reply = ask_groq(pending, st.session_state.uploaded_code)
            except Exception as e:
                reply = f"❌ **Error:** {e}"
        st.markdown(reply)
    st.session_state.messages.append({"role": "assistant", "content": reply})
    st.rerun()

# ── Chat input ────────────────────────────────────────────────────────────────
if user_input := st.chat_input("Ask anything about your code…"):
    if not st.session_state.groq_api_key:
        st.error("❌ Please enter your Groq API key in the sidebar first.")
    else:
        with st.chat_message("user", avatar="🧑‍💻"):
            st.markdown(user_input)
        st.session_state.messages.append({"role": "user", "content": user_input})

        with st.chat_message("assistant", avatar="🤖"):
            with st.spinner("Groq is thinking…"):
                try:
                    reply = ask_groq(user_input, st.session_state.uploaded_code)
                except Exception as e:
                    reply = f"❌ **Error:** {e}"
            st.markdown(reply)
        st.session_state.messages.append({"role": "assistant", "content": reply})
        st.rerun()

# ── Empty state ───────────────────────────────────────────────────────────────
if not st.session_state.messages:
    st.markdown("""
    <div style="text-align:center; padding: 50px 0; color: #555;">
        <div style="font-size: 3.5rem;">⚡</div>
        <h3 style="color:#f97316;">Ready to assist!</h3>
        <p style="color:#666; max-width:480px; margin:auto;">
            1️⃣ Paste your <b>Groq API key</b> in the sidebar<br>
            2️⃣ <b>Upload</b> a code file<br>
            3️⃣ Click a <b>Quick Action</b> or type your question
        </p>
    </div>
    """, unsafe_allow_html=True)
