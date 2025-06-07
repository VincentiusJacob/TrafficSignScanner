const axios = require("axios");

const openAIEndpoint =
  "https://vince-mb63mgbe-eastus2.cognitiveservices.azure.com";
const openAIKey =
  "C57BMul7SGrqi12ymNhUyoTaYnsAuuIajmgVpfW6EA5FHmyKa11eJQQJ99BEACHYHv6XJ3w3AAAAACOGf571";

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const { signName } = req.body;

      if (!signName) {
        return res.status(400).json({ error: "No sign name provided" });
      }

      const prompt = `Describe the following traffic sign in English: "${signName}".`;

      const response = await axios.post(
        `${openAIEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-12-01-preview`,
        {
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIKey}`,
          },
        }
      );

      const description = response.data.choices[0].message.content.trim();
      res.json({ description });
    } else {
      res.status(405).send({ error: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("Error getting description from GPT-4:", error);
    res.status(500).json({ error: "Failed to fetch description from GPT-4" });
  }
};
