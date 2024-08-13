import React, { useEffect } from 'react';
import { useNavigate, redirect } from 'react-router-dom';
import { Button } from '@extension/ui';
import { useStorageSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useAppStore } from '@extension/storage/lib/store';
import { unlockWallet } from '@extension/storage/lib/session';

const Login = () => {
  const theme = useStorageSuspense(exampleThemeStorage);
  const [password, setPassword] = useAppStore(state => [state.password, state.setPassword]);
  const [error, setError] = React.useState('');
  const isLight = theme === 'light';
  const navigate = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    unlockWallet('myKeyId', password);
    navigate('/home');
  }

  return (
    <div className={`p-4 flex flex-col     App gap-4 ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <h1 className="text-2xl font-bold">Login</h1>
      <div>
        <form className="flex flex-col gap-1" action="" onSubmit={e => submit(e)}>
          <input
            onChange={e => setPassword(e.target.value)}
            value={password}
            className="border-2 border-gray-300 rounded-md p-2 "
            type="password"
            placeholder="Password"
          />
          <Button type="submit" className="text-lg rounded-md font-semibold">
            Login
          </Button>
          {error && (
            <div className="px-2 py-1 bg-red-100 mt-3 rounded-md">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
