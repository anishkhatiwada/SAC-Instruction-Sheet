# SAC Instruction Sheet Generator

A full-stack web application for generating SAC (Style, Aspect, Content) instruction sheets using AI-powered image analysis.

## Features

- **Image Upload & Analysis**: Upload images and get AI-powered analysis
- **Dynamic Form Generation**: Forms adapt based on image analysis results
- **PDF Generation**: Generate professional instruction sheets
- **Modern Tech Stack**: React frontend, Node.js backend, OpenAI integration

## Tech Stack

- **Frontend**: React 19, Vite, React PDF
- **Backend**: Node.js, Express, OpenAI API
- **Image Processing**: Sharp
- **Deployment**: Ready for deployment

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up your OpenAI API key
4. Start the development servers

## Backend Setup

```bash
cd sac-backend
npm install
# Copy .env and add your OPENAI_API_KEY
npm start
```

## Frontend Setup

```bash
cd sac-frontend
npm install
npm run dev
```

## Usage

1. Start both backend (port 5050) and frontend (port 5173)
2. Upload an image in the frontend
3. Fill out the generated form
4. Generate and download your SAC instruction sheet

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/fields` - Get form field definitions
- `POST /api/analyze` - Analyze uploaded image

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

- **Aspect Ratio Detection**  
  Automatic detection of image dimensions and aspect ratio.  
  Supports: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9`, and custom ratios.

- **Format Detection**  
  Identifies output format (PNG, JPG, not applicable for other types).

- **AI-Powered Analysis**  
  Uses **OpenAI GPT-4.1** for image classification.

- **Dynamic Form Fields**  
  Comprehensive metadata form with categories:
  - Gender
  - Subject
  - Situation
  - Age Range
  - Style
  - Shot Distance
  - Camera Angle
  - Lighting
  - Background
  - Location
  - City & Nationality mapping
  - Custom additional words

- **PDF Export**  
  Generate structured PDF instruction sheets from analysis results.

---

## Running Instructions

Follow the steps below to run the project locally.

---
Replace openai api key in .env.example/ sac-backend

### 1️⃣ Start the Backend Server

Open a terminal and navigate to the backend directory:

```bash
cd sac-backend
npm install
node server.js
Backend will run on:http://localhost:5050


### Start the Backend Server
Open a new terminal window and navigate to the frontend directory:
cd sac-frontend
npm install
npm run dev
Frontend will run on:http://localhost:5173
