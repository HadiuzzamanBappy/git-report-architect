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
 * Fetches the repository README and description from GitHub API.
 */
export async function fetchGithubData(url: string): Promise<string> {
    const extracted = extractOwnerRepo(url);
    if (!extracted) {
        throw new Error("Invalid GitHub URL provided.");
    }
    const { owner, repo } = extracted;

    const headers = {
        'User-Agent': 'Git-Report-Architect-Worker',
        'Accept': 'application/vnd.github.v3+json'
    };

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
            // Decode base64 using atob (available in Workers)
            readmeText = atob(readmeData.content);
        }
    }

    const combinedData = `
# Repository: ${repoData.full_name}
**Description:** ${repoData.description || 'No description provided.'}
**Primary Language:** ${repoData.language || 'Unknown'}
**Stars:** ${repoData.stargazers_count}
**Forks:** ${repoData.forks_count}
**License:** ${repoData.license?.name || 'None'}

## README.md
${readmeText}
    `.trim();

    return combinedData;
}
