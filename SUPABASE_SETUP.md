# Supabase Authentication Setup

This guide will help you set up Supabase authentication for OpenCode Manager.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A Supabase project

## Step 1: Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in your project details:
   - **Name**: OpenCode Manager (or any name you prefer)
   - **Database Password**: Create a strong password
   - **Region**: Choose a region close to your users
4. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the left sidebar
2. Navigate to **API** settings
3. You'll find two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long JWT string starting with `eyJ...`

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials to the `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Configure Email Authentication (Optional)

By default, Supabase enables email/password authentication. However, you may want to customize the email templates and settings:

1. In your Supabase dashboard, go to **Authentication** > **Email Templates**
2. Customize the confirmation and password reset email templates
3. Configure the redirect URLs in **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:5173` (for development) or your production URL
   - **Redirect URLs**: Add your allowed redirect URLs

## Step 5: Enable Email Confirmations (Optional)

By default, Supabase requires email confirmation for new signups:

1. Go to **Authentication** > **Settings**
2. Under **Email Auth**, you can toggle "Enable email confirmations"
3. For development, you might want to disable this temporarily

## Step 6: Test the Authentication

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:5173/login`
3. Try signing up with a test email and password
4. Check your email for the confirmation link (if email confirmations are enabled)
5. Sign in with your credentials

## Optional: Set Up Additional Authentication Providers

Supabase supports various OAuth providers (Google, GitHub, etc.):

1. Go to **Authentication** > **Providers**
2. Enable and configure the providers you want to use
3. Add the OAuth callback URLs to your provider's app settings
4. Update the `LoginForm` component to include social login buttons

## Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use environment variables** for all sensitive credentials
3. **Enable Row Level Security (RLS)** on your Supabase tables to control data access
4. **Rotate your keys** regularly in production
5. **Use different Supabase projects** for development and production

## Troubleshooting

### "Invalid API key" error
- Double-check that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Make sure there are no extra spaces or quotes in the `.env` file
- Restart your development server after changing environment variables

### Email confirmations not working
- Check your spam folder
- Verify the email templates in Supabase dashboard
- Ensure your email provider is not blocking Supabase emails
- For development, consider disabling email confirmations

### Users can't sign in
- Check the browser console for error messages
- Verify the user exists in **Authentication** > **Users** in Supabase dashboard
- Ensure the user's email is confirmed (if email confirmations are enabled)

## Architecture

The authentication implementation follows these patterns:

- **Service Layer**: `/frontend/src/services/supabaseClient.ts` - Singleton Supabase client
- **State Layer**: `/frontend/src/stores/authStore.ts` - Zustand store for auth state management
- **UI Layer**: `/frontend/src/components/auth/` - React components for login, signup, and user menu
- **Route Protection**: `/frontend/src/components/auth/ProtectedRoute.tsx` - Higher-order component for protected routes

## Database Setup (Optional)

If you need to store additional user data:

1. Create tables in your Supabase project (e.g., `profiles`, `user_settings`)
2. Enable Row Level Security (RLS) policies to protect user data
3. Create a trigger to automatically create a profile when a user signs up:

```sql
-- Create a profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Create a policy that allows users to view their own profile
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

-- Create a function to handle new user creation
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger that calls the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Next Steps

- Customize the login form styling to match your brand
- Add password reset functionality
- Implement user profile management
- Add role-based access control
- Set up email templates for better user experience
