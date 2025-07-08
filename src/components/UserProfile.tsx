import { useAuth } from '../contexts/AuthContext';

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {user.user_metadata?.avatar_url && (
        <img 
          src={user.user_metadata.avatar_url} 
          alt="Profile" 
          className="w-8 h-8 rounded-full"
        />
      )}
      <div>
        <div className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</div>
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
