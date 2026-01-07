# Supabase Authentication - Quick Start Guide

This guide will help you get started with the newly implemented Supabase authentication system.

## What's New

OpenCode Manager now has a complete authentication system powered by Supabase! Users must sign in to access the application.

## Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in project details and create

### 2. Get Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: Starts with `eyJ...`

### 3. Configure Environment

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Copy the example file
cp .env.example .env

# Add these lines to your .env file:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start Development

```bash
# Install dependencies (if not already done)
pnpm install

# Start the dev server
pnpm dev

# Visit http://localhost:5173
# You'll be redirected to /login
```

## First Time Use

### Sign Up

1. Navigate to `http://localhost:5173/login`
2. Click "Don't have an account? Sign up"
3. Enter your email and password
4. Check your email for confirmation (if enabled)
5. You're in!

### Sign In

1. Navigate to `http://localhost:5173/login`
2. Enter your email and password
3. Click "Sign In"

### Sign Out

1. Click the user icon in the top right
2. Select "Sign out"

## Features

- ✅ **Email/Password Authentication** - Secure sign up and sign in
- ✅ **Session Persistence** - Stay logged in across page reloads
- ✅ **Protected Routes** - Automatic redirect to login when needed
- ✅ **User Menu** - Easy access to account and sign out
- ✅ **Form Validation** - Client-side validation for better UX
- ✅ **Error Handling** - Clear error messages

## Troubleshooting

### "Supabase not configured" warning

- Make sure you added the Supabase credentials to your `.env` file
- Restart your dev server after changing `.env`
- Double-check the URL and key are correct (no extra spaces)

### Can't sign in

- Check if the user exists in **Authentication** → **Users** in Supabase dashboard
- Verify email if confirmations are enabled
- Check browser console for error messages

### Email not received

- Check spam folder
- Verify email settings in Supabase dashboard
- For development, consider disabling email confirmations in **Authentication** → **Settings**

## Advanced Configuration

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for:
- Customizing email templates
- Adding OAuth providers (Google, GitHub, etc.)
- Setting up Row Level Security (RLS)
- Creating user profile tables
- Production deployment tips

## Architecture

The authentication system uses:

- **Service Layer**: Supabase client (`frontend/src/services/supabaseClient.ts`)
- **State Layer**: Zustand store (`frontend/src/stores/authStore.ts`)
- **UI Layer**: React components (`frontend/src/components/auth/`)
- **Protection**: Route wrapper (`frontend/src/components/auth/ProtectedRoute.tsx`)

## Development vs Production

### Development
- Use separate Supabase project for development
- Can disable email confirmations for faster testing
- Use test email addresses

### Production
- Create a separate Supabase project for production
- Enable email confirmations
- Set proper redirect URLs
- Enable Row Level Security (RLS) on tables
- Consider rate limiting

## Next Features to Add (Optional)

Want to extend the authentication system? Consider adding:

1. **Password Reset**
   - Add "Forgot password?" link
   - Create reset password page
   - Use Supabase's built-in reset flow

2. **User Profiles**
   - Create profiles table in Supabase
   - Add profile edit page
   - Store user preferences

3. **OAuth Login**
   - Enable Google/GitHub in Supabase
   - Add social login buttons
   - Simplify sign-up flow

4. **Role-Based Access**
   - Add roles to user metadata
   - Protect admin routes
   - Show/hide features by role

## Support

For issues or questions:

1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup
2. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
3. Check Supabase documentation: https://supabase.com/docs
4. Open an issue on GitHub

## Summary

You now have a production-ready authentication system! 🎉

The implementation:
- ✅ Works out of the box with Supabase
- ✅ Follows best practices
- ✅ Is fully tested
- ✅ Is well-documented
- ✅ Is type-safe
- ✅ Has no memory leaks

Just add your Supabase credentials and you're ready to go!
