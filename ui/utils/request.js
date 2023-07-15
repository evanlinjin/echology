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
