export async function GET(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const responseText = await response.text();
      return JSON.parse(responseText);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function POST(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ ...body }),
    });
    if (!response.ok) {
      const responseText = await response.text();
      return JSON.parse(responseText);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}
