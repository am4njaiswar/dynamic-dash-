// test-history.ts
async function testHistory() {
  const userId = "user_123";
  const baseUrl = "http://localhost:3000/api/history";

  console.log("--- Testing History POST (Saving Data) ---");
  const saveResponse = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      messages: [
        { role: "user", content: "Hello, record this." },
        { role: "assistant", content: "I have recorded this in MongoDB." }
      ]
    }),
  });
  const savedData = await saveResponse.json();
  console.log("POST Status:", saveResponse.status);
  console.log("Saved Session ID:", savedData._id);

  console.log("\n--- Testing History GET (Retrieving Data) ---");
  const getResponse = await fetch(`${baseUrl}?userId=${userId}`);
  const history = await getResponse.json();
  console.log("GET Status:", getResponse.status);
  console.log("Messages Retrieved:", history.length);
  console.log("First Message Content:", history[0]?.content);
}

testHistory();