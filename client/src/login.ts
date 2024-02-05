import env from "./env";

const redirect_uri = `http://${env.VITE_SERVER_HOST}:${env.VITE_WEB_SERVER_PORT}/callback`;

export async function redirectToAuthCodeFlow() {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", env.VITE_SPOTIFY_CLIENT_ID);
  params.append("response_type", "code");
  params.append("redirect_uri", redirect_uri);
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string) {
  const verifier = localStorage.getItem("verifier");
  if (!verifier) throw new Error("No verifier found in local storage");

  const params = new URLSearchParams();
  params.append("client_id", env.VITE_SPOTIFY_CLIENT_ID);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirect_uri);
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!result.ok) {
    let msg = "Token request failed";
    try {
      const res = await result.json();
      msg += `: ${res.error} - ${res.error_description}`;
    } catch (err) {
      console.error(err);
    }
    throw new Error(msg);
  }

  const { access_token, expires_in } = await result.json();
  return {
    token: access_token as string,
    expiresAt: Date.now() + expires_in * 1000 - 1000,
  };
}

function generateCodeVerifier(length: number) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function logout() {
  localStorage.clear();
  window.location.reload();
}
