import { Hono } from 'hono';

export const uiRouter = new Hono();

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Playground</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f111a;
            --surface: #1e2130;
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --border: #334155;
            --success: #10b981;
        }

        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            width: 100%;
            max-width: 800px;
            padding: 2rem;
            box-sizing: border-box;
        }

        .card {
            background: var(--surface);
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 2rem;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h1 {
            margin-top: 0;
            font-size: 1.8rem;
            font-weight: 600;
            background: linear-gradient(to right, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        p.subtitle {
            color: var(--text-muted);
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
            color: #cbd5e1;
        }

        select, textarea {
            width: 100%;
            background: rgba(15, 17, 26, 0.6);
            border: 1px solid var(--border);
            color: var(--text);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            box-sizing: border-box;
            transition: all 0.2s ease;
        }

        select:focus, textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        textarea {
            resize: vertical;
            min-height: 120px;
        }

        button {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s, transform 0.1s;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
        }

        button:hover {
            background: var(--primary-hover);
        }

        button:active {
            transform: scale(0.98);
        }

        button:disabled {
            background: var(--border);
            cursor: not-allowed;
            transform: none;
        }

        /* Spinner animation */
        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .result-container {
            margin-top: 2rem;
            display: none;
        }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .result-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #cbd5e1;
        }

        .badge {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .result-box {
            background: rgba(15, 17, 26, 0.4);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.5rem;
            font-size: 0.95rem;
            line-height: 1.6;
            white-space: pre-wrap;
            overflow-x: auto;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="card">
            <h1>AI Playground</h1>
            <p class="subtitle">Test your Cloudflare Workers AI models instantly.</p>

            <form id="aiForm">
                <div class="form-group">
                    <label for="model">Model ID (Select or Type)</label>
                    <input type="text" id="model" list="model-list" value="@cf/qwen/qwen2.5-coder-32b-instruct" required>
                    <datalist id="model-list">
                        <option value="@cf/qwen/qwen2.5-coder-32b-instruct">
                        <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">
                        <option value="@cf/meta/llama-3.1-8b-instruct-fp8">
                        <option value="@hf/thebloke/mistral-7b-instruct-v0.1-awq">
                    </datalist>
                    <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 0.5rem;">Find more models on the <a href="https://developers.cloudflare.com/workers-ai/models/" target="_blank" style="color: var(--primary);">Cloudflare Dashboard</a>.</small>
                </div>

                <div class="form-group">
                    <label for="prompt">Your Prompt</label>
                    <textarea id="prompt" placeholder="Write a short poem about coding..." required></textarea>
                </div>

                <button type="submit" id="submitBtn">
                    <span id="btnText">Generate Response</span>
                    <div class="spinner" id="spinner"></div>
                </button>
            </form>

            <div class="result-container" id="resultContainer">
                <div class="result-header">
                    <h3>Response</h3>
                    <div class="badge" id="sourceBadge">
                        ⚡ AI
                    </div>
                </div>
                <div class="result-box" id="resultBox"></div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('aiForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            const resultContainer = document.getElementById('resultContainer');
            const resultBox = document.getElementById('resultBox');
            const sourceBadge = document.getElementById('sourceBadge');

            const model = document.getElementById('model').value;
            const prompt = document.getElementById('prompt').value;

            // Loading state
            btn.disabled = true;
            btnText.textContent = 'Generating...';
            spinner.style.display = 'block';
            resultContainer.style.display = 'none';

            try {
                const response = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, model })
                });

                const json = await response.json();

                if (!response.ok) {
                    throw new Error(json.details || json.error || 'Failed to generate');
                }

                // Show response
                let textResponse = json.data;
                if (json.data.response) {
                    textResponse = json.data.response;
                } else if (json.data.choices && json.data.choices.length > 0) {
                    textResponse = json.data.choices[0].message?.content || json.data.choices[0].text || json.data;
                }
                
                resultBox.textContent = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse, null, 2);
                
                // Set Badge
                if (json.source === 'cache') {
                    sourceBadge.innerHTML = '📦 Cached';
                    sourceBadge.style.color = '#38bdf8';
                    sourceBadge.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                    sourceBadge.style.background = 'rgba(56, 189, 248, 0.1)';
                } else {
                    sourceBadge.innerHTML = '⚡ AI Generated';
                    sourceBadge.style.color = '#10b981';
                    sourceBadge.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                    sourceBadge.style.background = 'rgba(16, 185, 129, 0.1)';
                }

                resultContainer.style.display = 'block';

            } catch (err) {
                resultBox.textContent = 'Error: ' + err.message;
                sourceBadge.innerHTML = '❌ Error';
                sourceBadge.style.color = '#ef4444';
                sourceBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                sourceBadge.style.background = 'rgba(239, 68, 68, 0.1)';
                resultContainer.style.display = 'block';
            } finally {
                // Reset state
                btn.disabled = false;
                btnText.textContent = 'Generate Response';
                spinner.style.display = 'none';
            }
        });
    </script>
</body>
</html>
`;

uiRouter.get('/', (c) => {
    return c.html(HTML_CONTENT);
});
