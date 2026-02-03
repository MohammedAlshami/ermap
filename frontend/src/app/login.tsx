import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { PageLayout } from '~/components/PageLayout';
import { useAuth } from '~/lib/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      if (data.user && data.token) {
        login(data.user, data.token);
        navigate({ to: '/' });
      } else {
        setError('Invalid response');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout theme="light">
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Log in</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access your projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Register
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
}
