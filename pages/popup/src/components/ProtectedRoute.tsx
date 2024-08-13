import { retrieveKey } from '@extension/storage/lib/keyStore';
import Login from '@src/screens/Login';
import Popup from '@src/Popup';
import Create from '@src/screens/Create';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSession } from '@extension/storage/lib/session';

const PrivateRoute = ({ children, to }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const result = await retrieveKey('myKeyId', null);
        const session = await getSession('myKeyId');
        if (session !== null) {
          navigate('/home');
        }

        setIsAuthenticated(result);
      } catch (error) {
        console.error('Failed to retrieve key:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  return isAuthenticated ? children : <Create />;
};

export default PrivateRoute;
