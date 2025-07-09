import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import Avatar from './Avatar';

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { currentPlayer } = usePlayer();
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar 
        name={currentPlayer?.name || 'User'}
        avatarUrl={currentPlayer?.avatar_url}
        size="small"
      />
      <div>
        <div className="text-sm font-medium">
          {currentPlayer?.name || 'User'}
        </div>
        <button 
          onClick={() => signOut()} 
          className="text-xs text-blue-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
