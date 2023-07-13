export async function GET(url) {
    const response = await fetch(url);
    return await response.json();
}
