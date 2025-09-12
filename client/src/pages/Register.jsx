import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setOk(''); setPending(true);
    
    // Validazione lato client
    if (password !== confirmPassword) {
      setErr('Le password non corrispondono');
      setPending(false);
      return;
    }
    
    if (password.length < 3) {
      setErr('La password deve essere almeno di 3 caratteri');
      setPending(false);
      return;
    }
    
    if (username.trim().length < 3) {
      setErr('Lo username deve essere almeno di 3 caratteri');
      setPending(false);
      return;
    }
    
    try {
      await register(username.trim(), password);
      setOk('Account created! Welcome!');
      
      // Reindirizza alla home
      setTimeout(() => nav('/'), 800);
    } catch (e) {
      setErr(e.message);
    } finally { setPending(false); }
  };

  return (
    <div className="page small">
      <h2>Register</h2>
      {err && <div className="error">{err}</div>}
      {ok && <div className="info">{ok}</div>}
      <form onSubmit={onSubmit} className="card" noValidate>
        <label htmlFor="ru">Username</label>
        <input id="ru" required minLength={3} maxLength={32}
               value={username} onChange={e=>setU(e.target.value)} />
        <label htmlFor="rp">Password</label>
        <input id="rp" type="password" required minLength={3}
               value={password} onChange={e=>setP(e.target.value)} />
        <label htmlFor="rcp">Confirm Password</label>
        <input id="rcp" type="password" required minLength={3}
               value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
               style={{ borderColor: password && confirmPassword && password !== confirmPassword ? '#dc3545' : '' }} />
        {password && confirmPassword && password !== confirmPassword && (
          <small style={{ color: '#dc3545', marginTop: '0.25rem' }}>
            Le password non corrispondono
          </small>
        )}
        <button disabled={pending || (password && confirmPassword && password !== confirmPassword)}>
          Create account
        </button>
      </form>
      <p style={{marginTop:'.75rem'}}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
