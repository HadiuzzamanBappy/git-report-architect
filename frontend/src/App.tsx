import { useState, useEffect } from 'react'
import { marked } from 'marked'
import './App.css'

function App() {
  const [reportType, setReportType] = useState('case_study')
  const [model, setModel] = useState('@cf/meta/llama-3.1-8b-instruct-fp8')
  const [gitData, setGitData] = useState('')
  const [loading, setLoading] = useState(false)
  const [rawMarkdown, setRawMarkdown] = useState('')
  const [sourceBadge, setSourceBadge] = useState<{ text: string, color: string, border: string, bg: string } | null>(null)
  const [error, setError] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSavedView, setIsSavedView] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const savedId = urlParams.get('id')

    if (savedId) {
      setIsSavedView(true)
      setRawMarkdown('<div style="text-align: center; color: var(--primary); padding: 2rem;">Loading saved case study...</div>')
      
      // Call the API
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      fetch(`${API_BASE_URL}/api/ai/case-study/${savedId}`)
        .then(res => res.json())
        .then(json => {
          if (json.error) throw new Error(json.error)
          
          let textResponse = json.data
          if (json.data.response) textResponse = json.data.response
          else if (json.data.choices) textResponse = json.data.choices[0].message?.content || json.data.choices[0].text || json.data
          
          const md = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse, null, 2)
          setRawMarkdown(md)
          setSourceBadge({
            text: '💾 Saved in KV',
            color: '#8b5cf6',
            border: 'rgba(139, 92, 246, 0.3)',
            bg: 'rgba(139, 92, 246, 0.15)'
          })
          setError(false)
        })
        .catch(err => {
          setRawMarkdown(`Error loading saved report: ${err.message}`)
          setError(true)
          setSourceBadge({
            text: '❌ Error',
            color: '#ef4444',
            border: 'rgba(239, 68, 68, 0.3)',
            bg: 'rgba(239, 68, 68, 0.15)'
          })
        })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRawMarkdown('')
    setError(false)
    setSourceBadge(null)

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitData, model, reportType })
      })

      if (!response.ok) {
        const json = await response.json().catch(() => ({ error: 'Failed to generate' }))
        throw new Error(json.details || json.error || 'Failed to generate')
      }

      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('text/event-stream')) {
        const reportId = response.headers.get('X-Report-Id')
        if (reportId) {
          window.history.pushState({}, '', `?id=${reportId}`)
          setIsSavedView(true)
        }
        setSourceBadge({
          text: '⚡ Generating...',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          bg: 'rgba(16, 185, 129, 0.15)'
        })
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.substring(6))
                  fullText += data.response || ''
                  setRawMarkdown(fullText)
                } catch (e) {}
              }
            }
          }
        }
        setSourceBadge({
          text: '⚡ Generated',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          bg: 'rgba(16, 185, 129, 0.15)'
        })
      } else {
        const json = await response.json()
        if (json.id) {
          window.history.pushState({}, '', `?id=${json.id}`)
          setIsSavedView(true)
        }

        let textResponse = json.data
        if (json.data?.response) {
          textResponse = json.data.response
        } else if (json.data?.choices && json.data.choices.length > 0) {
          textResponse = json.data.choices[0].message?.content || json.data.choices[0].text || json.data
        }
        
        const md = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse, null, 2)
        setRawMarkdown(md)

        if (json.source === 'cache') {
          setSourceBadge({
            text: '📦 Cached',
            color: '#60a5fa',
            border: 'rgba(96, 165, 250, 0.3)',
            bg: 'rgba(96, 165, 250, 0.15)'
          })
        } else {
          setSourceBadge({
            text: '⚡ Generated',
            color: '#10b981',
            border: 'rgba(16, 185, 129, 0.3)',
            bg: 'rgba(16, 185, 129, 0.15)'
          })
        }
      }
    } catch (err: any) {
      setRawMarkdown(`Error: ${err.message}`)
      setError(true)
      setSourceBadge({
        text: '❌ Error',
        color: '#ef4444',
        border: 'rgba(239, 68, 68, 0.3)',
        bg: 'rgba(239, 68, 68, 0.15)'
      })
    } finally {
      setLoading(false)
      setTimeout(() => {
        document.getElementById('resultContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([rawMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `case-study-${new Date().getTime()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Git Case Study Architect</h1>
        <p className="subtitle">Generate premium Product Post-Mortems, PR summaries, and changelogs instantly.</p>
      </div>

      {!isSavedView && (
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="reportType">Report Type</label>
                <select 
                  id="reportType" 
                  required 
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                >
                  <option value="case_study">Product Case Study / Post-Mortem</option>
                  <option value="commit">Conventional Commit Message</option>
                  <option value="changelog">Markdown Changelog</option>
                  <option value="pr">Pull Request Summary</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="model">AI Model</label>
                <select 
                  id="model" 
                  required
                  value={model}
                  onChange={e => setModel(e.target.value)}
                >
                  <optgroup label="Meta (Llama)">
                    <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Llama 3.3 70B Instruct (Fast)</option>
                    <option value="@cf/meta/llama-3.1-8b-instruct-fp8">Llama 3.1 8B Instruct</option>
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

              <div className="form-group full-width">
                <label htmlFor="gitData">Data Source (GitHub URL or Raw Notes)</label>
                <textarea 
                  id="gitData" 
                  placeholder="e.g., https://github.com/honojs/hono or paste raw unstructured notes..." 
                  required
                  value={gitData}
                  onChange={e => setGitData(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              <span>{loading ? 'Analyzing...' : 'Generate Architecture'}</span>
              {loading && <div className="spinner"></div>}
            </button>
          </form>
        </div>
      )}

      {(rawMarkdown || loading) && (
        <div className="result-container" id="resultContainer">
          <div className="result-header">
            <h3>Generated Report</h3>
            <div className="result-actions">
              {sourceBadge && (
                <div 
                  className="badge" 
                  style={{ 
                    color: sourceBadge.color, 
                    borderColor: sourceBadge.border, 
                    backgroundColor: sourceBadge.bg 
                  }}
                >
                  {sourceBadge.text}
                </div>
              )}
              {rawMarkdown && !error && (
                <>
                  <button 
                    className="copy-btn" 
                    onClick={handleCopy}
                    style={isCopied ? { background: 'rgba(16, 185, 129, 0.2)' } : {}}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button 
                    className="copy-btn" 
                    onClick={handleDownload}
                  >
                    Download .md
                  </button>
                </>
              )}
              {isSavedView && (
                <a href="/" className="new-btn">Generate Another</a>
              )}
            </div>
          </div>
          <div 
            className="markdown-body" 
            style={error ? { color: '#ef4444' } : {}}
            dangerouslySetInnerHTML={error ? undefined : { __html: marked.parse(rawMarkdown) as string }}
          >
            {error ? <pre>{rawMarkdown}</pre> : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
