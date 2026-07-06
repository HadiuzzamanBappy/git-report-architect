import { Hono } from 'hono';

export const uiRouter = new Hono();

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Case Study Architect</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        :root {
            --bg-dark: #09090b;
            --surface: rgba(24, 24, 27, 0.7);
            --surface-hover: rgba(39, 39, 42, 0.8);
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --accent: #8b5cf6;
            --text: #f4f4f5;
            --text-muted: #a1a1aa;
            --border: rgba(255, 255, 255, 0.1);
            --success: #10b981;
        }

        body {
            background-color: var(--bg-dark);
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
            background-attachment: fixed;
            color: var(--text);
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 2rem 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
        }

        .container {
            width: 100%;
            max-width: 900px;
            padding: 0 2rem;
            box-sizing: border-box;
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
            background: linear-gradient(to right, #60a5fa, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.02em;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 1.1rem;
            margin: 0;
        }

        .glass-card {
            background: var(--surface);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }

        @media (max-width: 600px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        label {
            font-weight: 500;
            font-size: 0.95rem;
            color: #e4e4e7;
        }

        input, select, textarea {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border);
            color: var(--text);
            border-radius: 12px;
            padding: 0.875rem 1rem;
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.2s ease;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            background: rgba(0, 0, 0, 0.5);
        }

        textarea {
            resize: vertical;
            min-height: 200px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        button {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.75rem;
            margin-top: 1rem;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        /* Spinner animation */
        .spinner {
            display: none;
            width: 22px;
            height: 22px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .result-container {
            margin-top: 3rem;
            display: none;
            animation: slideDown 0.4s ease-out;
        }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .result-header h3 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .result-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .badge {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.35rem 1rem;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .copy-btn, .new-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--border);
            color: white;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin: 0;
            width: auto;
            text-decoration: none;
        }
        .copy-btn:hover, .new-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: none;
            box-shadow: none;
        }

        .markdown-body {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 2rem;
            font-size: 1.05rem;
            line-height: 1.7;
            color: #e4e4e7;
            overflow-x: auto;
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
            margin-top: 0;
            color: white;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
        }
        
        .markdown-body pre {
            background: rgba(0, 0, 0, 0.6);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--border);
        }
        
        .markdown-body code {
            background: rgba(0, 0, 0, 0.6);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: ui-monospace, monospace;
            font-size: 0.9em;
        }
        
        .markdown-body pre code {
            background: none;
            padding: 0;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            <h1 id="mainTitle">Git Case Study Architect</h1>
            <p class="subtitle" id="mainSubtitle">Generate premium Product Post-Mortems, PR summaries, and changelogs instantly.</p>
        </div>

        <div class="glass-card" id="formCard">
            <form id="aiForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="reportType">Report Type</label>
                        <select id="reportType" required>
                            <option value="case_study">Product Case Study / Post-Mortem</option>
                            <option value="commit">Conventional Commit Message</option>
                            <option value="changelog">Markdown Changelog</option>
                            <option value="pr">Pull Request Summary</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="model">AI Model</label>
                        <select id="model" required>
                            <optgroup label="Meta (Llama)">
                                <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Llama 3.3 70B Instruct (Fast)</option>
                                <option value="@cf/meta/llama-3.1-8b-instruct-fp8" selected>Llama 3.1 8B Instruct</option>
                                <option value="@cf/meta/llama-3.1-70b-instruct">Llama 3.1 70B Instruct</option>
                                <option value="@cf/meta/llama-3.2-3b-instruct">Llama 3.2 3B Instruct</option>
                                <option value="@cf/meta/llama-3.2-1b-instruct">Llama 3.2 1B Instruct</option>
                            </optgroup>
                            <optgroup label="Qwen & DeepSeek">
                                <option value="@cf/qwen/qwen2.5-coder-32b-instruct">Qwen 2.5 Coder 32B</option>
                                <option value="@cf/qwen/qwq-32b">QwQ 32B Reasoning</option>
                                <option value="@cf/deepseek-ai/deepseek-r1-distill-qwen-32b">DeepSeek R1 Distill 32B</option>
                            </optgroup>
                            <optgroup label="Moonshot & Zhipu">
                                <option value="@cf/moonshotai/kimi-k2.6">Kimi K2.6</option>
                                <option value="@cf/zai-org/glm-5.2">GLM 5.2</option>
                            </optgroup>
                            <optgroup label="Mistral & Google">
                                <option value="@cf/mistral/mistral-7b-instruct-v0.2">Mistral 7B Instruct v0.2</option>
                                <option value="@cf/google/gemma-7b-it">Gemma 7B IT</option>
                            </optgroup>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label for="gitData">Data Source (GitHub URL or Raw Notes)</label>
                        <textarea id="gitData" placeholder="e.g., https://github.com/honojs/hono or paste raw unstructured notes..." required></textarea>
                    </div>
                </div>

                <button type="submit" id="submitBtn">
                    <span id="btnText">Generate Architecture</span>
                    <div class="spinner" id="spinner"></div>
                </button>
            </form>
        </div>

        <div class="result-container" id="resultContainer">
            <div class="result-header">
                <h3>Generated Report</h3>
                <div class="result-actions">
                    <div class="badge" id="sourceBadge">
                        ⚡ AI
                    </div>
                    <button class="copy-btn" id="copyBtn">Copy Markdown</button>
                    <a href="/" class="new-btn" id="newBtn" style="display: none;">Generate Another</a>
                </div>
            </div>
            <div class="markdown-body" id="resultBox"></div>
        </div>
    </div>

    <script>
        let rawMarkdown = "";

        const copyBtn = document.getElementById('copyBtn');
        const aiForm = document.getElementById('aiForm');
        const formCard = document.getElementById('formCard');
        const resultContainer = document.getElementById('resultContainer');
        const resultBox = document.getElementById('resultBox');
        const sourceBadge = document.getElementById('sourceBadge');
        const newBtn = document.getElementById('newBtn');

        // Check if loading a saved case study via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const savedId = urlParams.get('id');

        if (savedId) {
            formCard.style.display = 'none';
            resultContainer.style.display = 'block';
            newBtn.style.display = 'flex';
            
            resultBox.innerHTML = '<div style="text-align: center; color: var(--primary); padding: 2rem;">Loading saved case study...</div>';

            fetch('/api/ai/case-study/' + savedId)
                .then(res => res.json())
                .then(json => {
                    if (json.error) throw new Error(json.error);
                    
                    let textResponse = json.data;
                    if (json.data.response) textResponse = json.data.response;
                    else if (json.data.choices) textResponse = json.data.choices[0].message?.content || json.data.choices[0].text || json.data;

                    rawMarkdown = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse, null, 2);
                    resultBox.innerHTML = marked.parse(rawMarkdown);
                    
                    sourceBadge.innerHTML = '💾 Saved in KV';
                    sourceBadge.style.color = '#8b5cf6';
                    sourceBadge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                    sourceBadge.style.background = 'rgba(139, 92, 246, 0.15)';
                })
                .catch(err => {
                    resultBox.innerHTML = \`<pre style="color: #ef4444;">Error loading saved report: \${err.message}</pre>\`;
                    sourceBadge.innerHTML = '❌ Error';
                });
        }

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(rawMarkdown);
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = 'rgba(16, 185, 129, 0.2)';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        });

        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');

            const model = document.getElementById('model').value;
            const gitData = document.getElementById('gitData').value;
            const reportType = document.getElementById('reportType').value;

            // Loading state
            btn.disabled = true;
            btnText.textContent = 'Analyzing...';
            spinner.style.display = 'block';
            resultContainer.style.display = 'none';

            try {
                const response = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gitData, model, reportType })
                });

                const json = await response.json();

                if (!response.ok) {
                    throw new Error(json.details || json.error || 'Failed to generate');
                }

                // Update URL to the shareable link without reloading the page
                if (json.id) {
                    window.history.pushState({}, '', \`?id=\${json.id}\`);
                    newBtn.style.display = 'flex'; // Allow them to start over
                }

                // Extract response logic
                let textResponse = json.data;
                if (json.data.response) {
                    textResponse = json.data.response;
                } else if (json.data.choices && json.data.choices.length > 0) {
                    textResponse = json.data.choices[0].message?.content || json.data.choices[0].text || json.data;
                }
                
                rawMarkdown = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse, null, 2);
                
                // Render markdown
                resultBox.innerHTML = marked.parse(rawMarkdown);
                
                // Set Badge
                if (json.source === 'cache') {
                    sourceBadge.innerHTML = '📦 Cached';
                    sourceBadge.style.color = '#60a5fa';
                    sourceBadge.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                    sourceBadge.style.background = 'rgba(96, 165, 250, 0.15)';
                } else {
                    sourceBadge.innerHTML = '⚡ Generated';
                    sourceBadge.style.color = '#10b981';
                    sourceBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    sourceBadge.style.background = 'rgba(16, 185, 129, 0.15)';
                }

                resultContainer.style.display = 'block';

                // Scroll to result
                setTimeout(() => {
                    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);

            } catch (err) {
                rawMarkdown = 'Error: ' + err.message;
                resultBox.innerHTML = \`<pre style="color: #ef4444;">\${rawMarkdown}</pre>\`;
                sourceBadge.innerHTML = '❌ Error';
                sourceBadge.style.color = '#ef4444';
                sourceBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                sourceBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                resultContainer.style.display = 'block';
            } finally {
                // Reset state
                btn.disabled = false;
                btnText.textContent = 'Generate Architecture';
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
