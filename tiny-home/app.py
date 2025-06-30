import os
import requests
import json

from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def generate_tiny_home(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are an expert in tiny home design who responds ONLY with strict JSON."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()

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

    prompt = f"""Design a tiny home layout for:
- People: {data.get('num_people')}
- Budget: {data.get('budget')}
- Climate: {data.get('climate')}
- Needs: {data.get('needs')}
- Style: {data.get('style')}

Return ONLY valid JSON with this structure:
{{
  "rooms": [
    {{"name": "Room name", "x": 0, "y": 0, "width": 3, "length": 3, "height": 2.5}},
    ...
  ]
}}
"""

    layout = generate_tiny_home(prompt)
    return jsonify(layout)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
