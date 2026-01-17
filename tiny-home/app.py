import os
import requests
import json
import re
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv

# Load environment variables from .env file if it exists (for local development)
load_dotenv(dotenv_path=os.path.join(os.getcwd(), 'tiny-home', '.env'))

# Initialize Flask with explicit template and static folders for deployment
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY environment variable not set!")
    print("Please set it in a .env file (localhost) or in Render dashboard (production) to use the AI features.")
else:
    print(f"SUCCESS: GROQ_API_KEY loaded (length: {len(GROQ_API_KEY)})")
    print(f"Key starts with: {GROQ_API_KEY[:10]}...")
    print(f"Key ends with: ...{GROQ_API_KEY[-10:]}")
    print(f"Contains spaces: {' ' in GROQ_API_KEY}")

def extract_json_from_text(text):
    """Extract JSON from text, handling markdown code blocks."""
    text = text.strip()
    # Try to find JSON in markdown code blocks (use greedy match for nested objects)
    json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, re.DOTALL)
    if json_match:
        return json_match.group(1)
    # Try to find JSON object directly (match from first { to last })
    start_idx = text.find('{')
    if start_idx != -1:
        # Count braces to find matching closing brace
        brace_count = 0
        for i in range(start_idx, len(text)):
            if text[i] == '{':
                brace_count += 1
            elif text[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    return text[start_idx:i+1]
    return text

def generate_tiny_home(prompt):
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set!")
        return {"error": "GROQ_API_KEY environment variable not set. Please configure your API key.", "explanation": "API key not configured. Please set the GROQ_API_KEY environment variable.", "rooms": []}

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role":"system","content":"You are an expert in tiny home design. Always assume a practical style and California climate. Respond ONLY with valid JSON in this structure:\n{\n  \"explanation\": \"...\",\n  \"rooms\": [\n    {\"name\":\"Room\",\"x\":0,\"y\":0,\"width\":3,\"length\":3,\"height\":2.5,\"features\":[\"door\",\"window\"]},\n    ...\n  ]\n}"},
            {"role":"user","content":prompt}
        ]
    }
    
    try:
        res = requests.post(url, headers=headers, json=data, timeout=30)
        res.raise_for_status()
        result = res.json()
        
        if "choices" not in result or len(result["choices"]) == 0:
            return {"error": "No response from AI API", "explanation": "The AI service returned an unexpected response.", "rooms": []}
        
        content = result["choices"][0]["message"]["content"].strip()
        
        # Extract JSON from the content (handles markdown code blocks)
        json_str = extract_json_from_text(content)
        
        # Parse the JSON
        layout = json.loads(json_str)
        
        # Validate structure
        if "rooms" not in layout:
            layout["rooms"] = []
        if "explanation" not in layout:
            layout["explanation"] = "Layout generated successfully."
            
        return layout
        
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}", "explanation": "Failed to connect to the AI service. Please check your internet connection and try again.", "rooms": []}
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse JSON response: {str(e)}", "explanation": "The AI service returned invalid data. Please try again.", "rooms": [], "raw_content": content[:500] if 'content' in locals() else None}
    except KeyError as e:
        return {"error": f"Unexpected response structure: {str(e)}", "explanation": "The AI service returned an unexpected response format.", "rooms": [], "raw": result if 'result' in locals() else None}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "explanation": "An unexpected error occurred. Please try again.", "rooms": []}

@app.route("/")
def index():
    response = app.make_response(render_template("index.html"))
    # Prevent caching of the HTML file
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/generate-layout", methods=["POST"])
def generate_layout():
    try:
        data = request.get_json() or {}
        num_people = data.get('num_people', 1)
        budget = data.get('budget', '')
        needs = data.get('needs', '')
        
        # Validate input
        if not isinstance(num_people, (int, float)) or num_people < 1:
            num_people = 1
        if not isinstance(budget, str):
            budget = str(budget) if budget else ''
        if not isinstance(needs, str):
            needs = str(needs) if needs else ''
        
        prompt = f"""
Design a California-practical tiny home for:
- People: {num_people}
- Budget: {budget}
- Needs: {needs}

Output ONLY JSON with \"explanation\" and a \"rooms\" list, each room having x,y,width,length,height and features like [\"door\",\"window\",\"plant\",\"bed\"].
"""
        layout = generate_tiny_home(prompt)
        print(f"Generated layout response: {json.dumps(layout, indent=2)[:500]}")  # Debug logging
        return jsonify(layout)
    except Exception as e:
        return jsonify({"error": f"Request processing failed: {str(e)}", "explanation": "An error occurred while processing your request. Please try again.", "rooms": []})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT",5000)))
