import requests
import json

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": "Bearer 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",
    "Content-Type": "application/json"
}
data = {
    "model": "llama3-70b-8192",
    "messages": [
        {"role":"system","content":"You are an expert in tiny home design. Always assume a practical style and California climate. Respond ONLY with valid JSON in this structure:\n{\n  \"explanation\": \"...\",\n  \"rooms\": [\n    {\"name\":\"Room\",\"x\":0,\"y\":0,\"width\":3,\"length\":3,\"height\":2.5,\"features\":[\"door\",\"window\"]},\n    ...\n  ]\n}"},
        {"role":"user","content":"Design a California-practical tiny home for:\n- People: 2\n- Budget: 50000\n- Needs: kitchen,bathroom\n\nOutput ONLY JSON with \"explanation\" and a \"rooms\" list, each room having x,y,width,length,height and features like [\"door\",\"window\",\"plant\",\"bed\"]."}
    ]
}
response = requests.post(url, headers=headers, json=data)
print("Status Code:", response.status_code)
print("Response:", response.text[:1000])