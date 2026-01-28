# Interview AI - AI-Powered Interview Practice Platform

A modern, SaaS-style web application for practicing AI-powered mock interviews. Built with React, Vite, and Tailwind CSS.

## 🚀 Features

### Core Features
- **AI-Powered Interviews**: Practice with AI-generated interview questions
- **Audio Recording**: Record your answers using browser MediaRecorder API
- **Real-time Feedback**: Get instant feedback and scoring on your performance
- **Interview History**: Track all your past interviews with detailed analytics
- **Usage Management**: Monitor your interview quota and usage limits

### User Interface
- **Modern Design**: Clean, minimal SaaS-style interface with slate + indigo color scheme
- **Responsive Layout**: Desktop-first design that works perfectly on mobile
- **Fixed Header & Sidebar**: Easy navigation with collapsible sidebar
- **Smooth Animations**: Polished transitions and hover effects
- **Toast Notifications**: Real-time feedback for user actions

### Pages
1. **Authentication**
   - Login page with form validation
   - Registration page
   - Protected routes

2. **Dashboard**
   - Statistics cards (total interviews, completion rate, average score)
   - Recent interviews table
   - Quick action cards
   - Usage limit warnings

3. **Interview Setup**
   - Job position selection (Frontend, Backend, Full Stack, etc.)
   - Difficulty level selection (Beginner, Intermediate, Advanced)
   - Question set selection (Technical, Behavioral, Mixed)

4. **Interview Session** (Core Feature)
   - Question display with category tags
   - Audio recording controls with timer
   - Progress tracking
   - Real-time recording status
   - Answer playback
   - Next question navigation

5. **Interview Summary**
   - Overall score display
   - Strengths and improvements breakdown
   - Question-by-question feedback
   - Detailed analytics

6. **History**
   - Filterable interview list
   - Search functionality
   - Sort by date or score
   - View detailed summaries

7. **Payment/License**
   - Current plan display
   - Usage quota tracking
   - Plan comparison (Free, Pro, Enterprise)
   - Bank transfer instructions
   - Copy-to-clipboard functionality

8. **Settings**
   - Profile management
   - Password change
   - Notification preferences
   - Account deletion

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Axios** - HTTP client

### UI Components
- Custom Button, Card, Input components
- Modal dialogs
- Toast notifications
- Usage limit hooks

## 📦 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       └── Toast.jsx
├── layouts/
│   └── MainLayout.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── InterviewSetup.jsx
│   ├── InterviewSession.jsx
│   ├── InterviewSummary.jsx
│   ├── History.jsx
│   ├── Payment.jsx
│   └── Settings.jsx
├── services/
│   └── api.js
├── hooks/
│   └── useUsageLimit.js
├── utils/
│   └── cn.js
├── App.jsx
├── main.jsx
└── index.css
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
cd Aiz_Project
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 🔐 Authentication

The app uses JWT token-based authentication stored in localStorage. On successful login:
- Token is stored in `localStorage.getItem('token')`
- User info is stored in `localStorage.getItem('user')`

Protected routes automatically redirect to `/login` if no token is found.

## 🎨 Design System

### Colors
- **Primary**: Indigo (indigo-600, indigo-700)
- **Secondary**: Slate (slate-600, slate-700)
- **Background**: slate-50
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red

### Spacing
- Consistent padding: p-4, p-6, p-8
- Card gaps: gap-4, gap-6
- Section spacing: space-y-4, space-y-6

### Shadows
- Cards: shadow-sm, hover:shadow-md, shadow-lg
- Modals: shadow-xl
- Buttons: shadow-sm hover:shadow-md

## 🎯 API Integration

The app is designed to work with a .NET Web API backend. All API endpoints are mocked with placeholder data.

### Expected API Endpoints

```
Authentication:
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me

Interviews:
GET  /api/interviews
POST /api/interviews
GET  /api/interviews/:id
POST /api/interviews/:id/start
POST /api/interviews/:id/questions/:questionId/answer
POST /api/interviews/:id/complete
GET  /api/interviews/:id/summary

Dashboard:
GET  /api/dashboard/stats
GET  /api/dashboard/recent-interviews

Payment:
GET  /api/payment/plan
GET  /api/payment/usage
POST /api/payment/request

Settings:
GET  /api/settings/profile
PUT  /api/settings/profile
POST /api/settings/change-password
```

### API Configuration

Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url/api';
```

## 🎤 Audio Recording

The Interview Session page uses the browser's MediaRecorder API to record audio answers:

```javascript
// Get user permission
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Create MediaRecorder instance
const mediaRecorder = new MediaRecorder(stream);

// Handle recorded data
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};

// Stop recording
mediaRecorder.stop();

// Create audio blob
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
```

## 📱 Responsive Design

- **Desktop**: Full sidebar visible, multi-column layouts
- **Tablet**: Collapsible sidebar, 2-column layouts
- **Mobile**: Hidden sidebar (toggle button), single-column layouts

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🔄 State Management

Currently using React's built-in state management (useState, useContext). For scaling:
- Consider Redux Toolkit for global state
- React Query for server state
- Zustand for lightweight state management

## 🚨 Usage Limits

The app includes a comprehensive usage limit system:

- **Usage Hook**: `useUsageLimit()` provides limit checking
- **Warning Banners**: Show when approaching or exceeding limits
- **Disabled Actions**: Buttons disabled when limit reached
- **Upgrade Prompts**: Direct users to payment page

## 📝 Mock Data

All data is currently mocked for frontend-only development:
- Interview questions and results
- User statistics
- Usage limits
- Payment plans

Replace mock data with actual API calls when backend is ready.

## 🔧 Customization

### Changing Colors
Edit `tailwind.config.js` and `src/index.css` to customize the color scheme.

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/layout/Sidebar.jsx`

### Modifying Interview Questions
Update the `questions` array in `src/pages/InterviewSession.jsx`

## 🐛 Known Limitations

- No actual AI processing (frontend only)
- Mock API responses
- Audio files not sent to backend
- No real payment processing
- Browser compatibility: Requires MediaRecorder API support

## 📄 License

This is a frontend-only implementation for educational/demonstration purposes.

## 🤝 Contributing

This is a frontend-only project. Focus areas for contribution:
- UI/UX improvements
- Additional interview question types
- Better responsive design
- Accessibility enhancements
- Performance optimizations

## 📞 Support

For issues or questions about the frontend implementation, please check the code comments and component documentation.

---

**Note**: This is a frontend-only implementation. Backend integration, AI logic, and payment processing need to be implemented separately.
