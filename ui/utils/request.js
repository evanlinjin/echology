export async function GET(url) {
  const response = await fetch(url);
  return await response.json();
}

export async function POST(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ ...body }),
    });
    return await response.json();
  } catch (error) {
    alert(error);
  }
}

// export async function POST(url, body) {
//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//       },
//       body: JSON.stringify({ ...body }),
//     });
//     console.log("response", response);
//     // if (!response.ok) {
//     //   throw new Error(`HTTP error! Status: ${response.status}`);
//     // }
//
//     return await response.json();
//   } catch (error) {
//     console.error("An error occurred:", error);
//     throw error; // Rethrow the error to handle it where the function is called
//   }
// }
