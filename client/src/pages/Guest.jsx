import Game from '../components/Game.jsx';  
  
export default function GuestPage() {  
  return (  
    <div className="page-content">  
      <Game isGuest={true} />  
    </div>  
  );  
} 
