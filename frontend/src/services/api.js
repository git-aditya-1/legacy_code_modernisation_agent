// ─── API Service Layer ───────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api";

// ─── Existing: Single File Mode ──────────────────────────────────────────────

export const modernizeStream = async (fileData, onUpdate, onError) => {
  try {
    const response = await fetch(`${API_BASE}/modernize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        file_name: fileData.fileName, 
        code: fileData.code 
      }),
    });

    if (!response.ok) throw new Error("Failed to connect to backend");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

      lines.forEach((line) => {
        try {
          const payload = JSON.parse(line.replace("data: ", ""));
          if (payload.error) onError(payload.error);
          else onUpdate(payload);
        } catch (e) {
          console.error("Error parsing JSON chunk", e);
        }
      });
    }
  } catch (err) {
    onError(err.message);
  }
};


// ─── New: GitHub Repo Mode ───────────────────────────────────────────────────

export const cloneRepo = async (repoUrl) => {
  const response = await fetch(`${API_BASE}/repo/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  return response.json();
};


export const modernizeRepoStream = async (repoName, onUpdate, onError) => {
  try {
    const response = await fetch(`${API_BASE}/repo/${repoName}/modernize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to start repo modernization");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

      lines.forEach((line) => {
        try {
          const payload = JSON.parse(line.replace("data: ", ""));
          if (payload.error) onError(payload.error);
          else onUpdate(payload);
        } catch (e) {
          console.error("Error parsing repo stream chunk", e);
        }
      });
    }
  } catch (err) {
    onError(err.message);
  }
};


export const approveFile = async (repoName, filePath, approved, modernizedCode = null) => {
  const response = await fetch(`${API_BASE}/repo/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_name: repoName,
      file_path: filePath,
      approved,
      modernized_code: modernizedCode,
    }),
  });
  return response.json();
};