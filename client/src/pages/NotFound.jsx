import { Link } from 'react-router-dom';
import { ArrowLeft, Clapperboard } from 'lucide-react';
export default function NotFound() { return <main className="not-found-page container-wide"><div className="not-found-icon"><Clapperboard size={32}/></div><span className="eyebrow"><span className="eyebrow-dot"/> WRONG TURN IN THE STORY</span><h1>404<span>.</span></h1><h2>This scene isn't in the script.</h2><p>The page you're looking for may have moved or never made the final cut.</p><Link to="/" className="btn btn-accent"><ArrowLeft size={16}/> Back to the main screen</Link></main>; }
