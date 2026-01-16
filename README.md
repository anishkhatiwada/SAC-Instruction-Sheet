# SAC Instruction Sheet – Image Analysis System

A full-stack web application for analyzing images and extracting metadata, including aspect ratio detection, output format detection, and AI-powered image classification.

---

## Features

- **Image Upload & Preview**  
  Upload images with live preview.

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
