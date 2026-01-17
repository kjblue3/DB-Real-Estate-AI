import os
import requests
import json
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY environment variable not set. Please set it to use the AI features.")

def generate_tiny_home(prompt):
    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY environment variable not set. Please configure your API key.", "explanation": "API key not configured. Please set the GROQ_API_KEY environment variable."}

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role":"system","content":"You are an expert in tiny home design. Always assume a practical style and California climate. Respond ONLY with valid JSON in this structure:\n{\n  \"explanation\": \"...\",\n  \"rooms\": [\n    {\"name\":\"Room\",\"x\":0,\"y\":0,\"width\":3,\"length\":3,\"height\":2.5,\"features\":[\"door\",\"window\"]},\n    ...\n  ]\n}"},
            {"role":"user","content":prompt}
        ]
    }
    res = requests.post(url, headers=headers, json=data)
    result = res.json()
    try:
        content = result["choices"][0]["message"]["content"].strip()
        return json.loads(content)
    except Exception as e:
        return {"error": str(e), "raw": result}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-layout", methods=["POST"])
def generate_layout():
    data = request.get_json()
    prompt = f"""
Design a California-practical tiny home for:
- People: {data.get('num_people')}
- Budget: {data.get('budget')}
- Needs: {data.get('needs')}

Output ONLY JSON with \"explanation\" and a \"rooms\" list, each room having x,y,width,length,height and features like [\"door\",\"window\",\"plant\",\"bed\"].
"""
    layout = generate_tiny_home(prompt)
    return jsonify(layout)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT",5000)))
