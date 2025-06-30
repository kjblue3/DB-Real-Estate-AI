from flask import Flask, request, render_template
import requests

app = Flask(__name__)

GROQ_API_KEY = "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"

def generate_tiny_home(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are an expert in tiny home design."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    try:
        return result["choices"][0]["message"]["content"]
    except:
        return f"Error: {result.get('error', 'Unknown error')}"

@app.route("/", methods=["GET", "POST"])
def home():
    output = ""
    if request.method == "POST":
        num_people = request.form["num_people"]
        budget = request.form["budget"]
        climate = request.form["climate"]
        needs = request.form["needs"]
        style = request.form["style"]

        prompt = f"""Design a tiny home for:
        - {num_people}
        - Budget: {budget}
        - Climate: {climate}
        - Needs: {needs}
        - Style: {style}
        """

        output = generate_tiny_home(prompt)

    return render_template("index.html", output=output)

if __name__ == "__main__":
    app.run(debug=True)
