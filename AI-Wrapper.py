import requests

def generate_tiny_home(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": "Bearer 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",
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

    print("STATUS CODE:", response.status_code)
    print("RAW RESPONSE:", response.text)

    try:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error parsing response: {e}\nFull response: {response.text}"
    
user_input = """
Design a tiny home for:
- 2 adults and 1 child
- Budget: $40,000
- Climate: Hot and humid
- Needs: Solar power, composting toilet, child-safe design
- Style: Tropical minimalist
"""

output = generate_tiny_home(user_input)
print(output)
