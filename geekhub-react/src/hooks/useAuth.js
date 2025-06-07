import { useAuthContext } from '../context/AuthContext';

const useAuth = () => {
  const { user, loading } = useAuthContext();
  return { user, loading };
};

export default useAuth;
