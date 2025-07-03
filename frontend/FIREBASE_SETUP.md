# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Enable **Google** authentication (optional)
4. Configure any additional providers as needed

## 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** → **Web**
4. Register your app and copy the configuration

## 4. Environment Variables

Create a `.env` file in the `frontend` directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

## 5. Backend Updates Needed

You'll also need to update your backend to handle Firebase tokens instead of Auth0 tokens. The main changes are:

1. **Token Verification**: Use Firebase Admin SDK to verify tokens
2. **User Creation**: Create users in your database using Firebase UID
3. **Authentication Middleware**: Update to verify Firebase tokens

## 6. Firebase Features

### Email Verification
- Firebase automatically sends verification emails
- Users can't access protected features until email is verified
- Built-in email verification status tracking

### Google Sign-In
- One-click Google authentication
- Automatic profile picture and name import
- Seamless integration with Firebase

### Security Rules
- Firebase provides built-in security
- No duplicate email accounts allowed
- Automatic token refresh

## 7. Migration Benefits

✅ **Simpler Setup**: No complex Auth0 configuration
✅ **Better Email Verification**: Built-in and automatic
✅ **Google Integration**: Native Google sign-in
✅ **Cost Effective**: Firebase has generous free tier
✅ **Better UX**: Faster authentication flow
✅ **No Duplicate Emails**: Firebase prevents this automatically 
