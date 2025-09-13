import { useAuth } from '../contexts/AuthContext'; 
import Game from '../components/Game.jsx'; 
 
export default function PlayPage() { 
  const { user } = useAuth(); 
 
  // Redirect to login if not authenticated 
  if (!user) { 
    return ( 
      <div className="page-content"> 
        <div className="text-center"> 
          <h3>?? Authentication Required</h3> 
          <p>Please log in to play the game.</p> 
        </div> 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="page-content"> 
      <Game isGuest={false} /> 
    </div> 
  ); 
}
