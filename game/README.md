# AI Tutor Game

A Next.js application featuring an interactive 3D classroom environment for AI-powered tutoring.

## Features

- 🏫 3D Classroom Visualization
- 👨‍🏫 Teacher-Student Interaction Panels
- 🎮 Game Mode
- 📊 Real-time Knowledge Flow Tracking
- 🎨 Modern UI with Tailwind CSS and Radix UI

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Using Docker (Recommended)

#### Quick Deploy
```bash
./deploy.sh
```

#### Manual Docker Commands
```bash
# Build the image
docker build -t ai-tutor-game .

# Run the container
docker run -d \
  --name ai-tutor-game \
  -p 3000:3000 \
  --restart unless-stopped \
  ai-tutor-game
```

#### Using Docker Compose
```bash
docker-compose up -d
```

### Cloud Deployment Options

#### Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

#### Other Platforms
- **Railway**: Connect your GitHub repo
- **Render**: Use the Dockerfile
- **Fly.io**: Use the Dockerfile
- **AWS/GCP/Azure**: Use container registries

## Environment Variables

The application currently runs without external dependencies in development mode. For production deployment with analytics, ensure the following environment variables are set:

- `VERCEL_ANALYTICS_ID` - For Vercel Analytics (optional)

## Architecture

- **Frontend**: Next.js 16 with App Router
- **UI**: Tailwind CSS + Radix UI components
- **3D Graphics**: Three.js + React Three Fiber
- **State Management**: React hooks
- **Deployment**: Docker containerization

## Ports

- **3000**: Main application port

## Access the Application

Once deployed, access the application at:
- **Local**: http://localhost:3000
- **Docker**: http://localhost:3000
- **Production**: Your deployment URL