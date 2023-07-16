export async function GET(url) {
  const response = await fetch(url);
  return await response.json();
}

export async function POST(url, body) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ ...body }),
  });
  return await response.json();
}

// export const API_ROOT = "/api";
// export const API_ROOT = `${process.env.SERVER_HOST}/api`;
