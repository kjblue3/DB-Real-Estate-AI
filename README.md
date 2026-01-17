# DB Real Estate AI - Tiny Home Generator

A 3D tiny home generator powered by AI using Groq's Llama model and Babylon.js for visualization.

## Features

- AI-powered tiny home design generation
- Interactive 3D visualization with Babylon.js
- First-person interior exploration
- California climate optimization
- Customizable parameters (people, budget, needs)

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DB-Real-Estate-AI
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Create a `.env` file in the `tiny-home/` directory:

   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

   Get your Groq API key from: https://console.groq.com/keys

4. **Run the application**
   ```bash
   cd tiny-home
   python app.py
   ```

   The app will be available at http://localhost:5000

## Deployment

This app is configured for deployment on Render.com. The `render.yaml` file contains the deployment configuration.

To deploy:
1. Push your code to GitHub
2. Connect your GitHub repo to Render
3. Set the `GROQ_API_KEY` environment variable in Render's dashboard
4. Deploy!

## API Endpoints

- `GET /` - Main application page
- `POST /generate-layout` - Generate a tiny home layout

  Request body:
  ```json
  {
    "num_people": 2,
    "budget": "50000",
    "needs": "kitchen,bathroom,office"
  }
  ```

## Technologies Used

- **Backend**: Flask (Python)
- **AI**: Groq API (Llama 3)
- **Frontend**: HTML, JavaScript
- **3D Visualization**: Babylon.js
- **Deployment**: Render.com