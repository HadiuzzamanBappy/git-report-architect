/**
 * Extracts owner and repo from a github url (e.g., https://github.com/honojs/hono)
 */
function extractOwnerRepo(url: string): { owner: string, repo: string } | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'github.com') return null;
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Fetches the repository README, package.json, commits, and description from GitHub API.
 */
export async function fetchGithubData(url: string, githubToken?: string): Promise<string> {
    const extracted = extractOwnerRepo(url);
    if (!extracted) {
        throw new Error("Invalid GitHub URL provided.");
    }
    const { owner, repo } = extracted;

    const headers: Record<string, string> = {
        'User-Agent': 'Git-Report-Architect-Worker',
        'Accept': 'application/vnd.github.v3+json'
    };
    if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Fetch Repo Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
        throw new Error(`Failed to fetch repository data: ${repoRes.statusText}`);
    }
    const repoData: any = await repoRes.json();

    // Fetch README content
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    let readmeText = "";
    if (readmeRes.ok) {
        const readmeData: any = await readmeRes.json();
        if (readmeData.content && readmeData.encoding === 'base64') {
            readmeText = atob(readmeData.content);
        }
    }

    // Fetch package.json content (for JS/TS projects)
    const pkgRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers });
    let pkgText = "";
    if (pkgRes.ok) {
        const pkgData: any = await pkgRes.json();
        if (pkgData.content && pkgData.encoding === 'base64') {
            const decoded = atob(pkgData.content);
            try {
                // only keep dependencies to save space
                const parsed = JSON.parse(decoded);
                pkgText = JSON.stringify({
                    dependencies: parsed.dependencies,
                    devDependencies: parsed.devDependencies
                }, null, 2);
            } catch {
                pkgText = decoded.substring(0, 500);
            }
        }
    }

    // Fetch recent commits
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers });
    let commitsText = "";
    if (commitsRes.ok) {
        const commitsData: any[] = await commitsRes.json();
        commitsText = commitsData.map(c => `- ${c.commit.message.split('\n')[0]} (${c.author?.login || 'unknown'})`).join('\n');
    }

    let combinedData = `
# Repository: ${repoData.full_name}
**Description:** ${repoData.description || 'No description provided.'}
**Primary Language:** ${repoData.language || 'Unknown'}
**Stars:** ${repoData.stargazers_count}
**Forks:** ${repoData.forks_count}
**License:** ${repoData.license?.name || 'None'}

## Recent Commits
${commitsText || 'No commits found.'}

${pkgText ? `## Dependencies (package.json)\n\`\`\`json\n${pkgText}\n\`\`\`\n` : ''}
## README.md
${readmeText}
    `.trim();

    // Truncate to avoid blowing up AI context limits (approx 15,000 characters)
    if (combinedData.length > 15000) {
        combinedData = combinedData.substring(0, 15000) + "\n\n...[TRUNCATED FOR CONTEXT LIMITS]";
    }

    return combinedData;
}
