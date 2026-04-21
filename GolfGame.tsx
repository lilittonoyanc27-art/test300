import React, { useState, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, PerspectiveCamera, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flag, 
  RotateCcw, 
  ChevronRight, 
  Play, 
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: string;
  translation: string;
}

// --- Data: Venir vs Ir ---

const GOLF_QUESTIONS: Question[] = [
  { id: 1, text: "Juan ___ a mi casa para la cena.", options: ["viene", "va"], correct: "viene", translation: "Խուանը գալիս է իմ տուն ընթրիքի (դեպի խոսողը):" },
  { id: 2, text: "Mañana (yo) ___ al mercado central.", options: ["voy", "vengo"], correct: "voy", translation: "Վաղը ես գնում եմ կենտրոնական շուկա:" },
  { id: 3, text: "¿Cuándo ___ (tú) a Armenia de visita?", options: ["vienes", "vas"], correct: "vienes", translation: "Ե՞րբ ես գալիս Հայաստան այցելության:" },
  { id: 4, text: "Nosotros ___ al museo por la tarde.", options: ["vamos", "venimos"], correct: "vamos", translation: "Մենք կեսօրին գնում ենք թանգարան:" },
  { id: 5, text: "Mis amigos ___ a buscarme ahora.", options: ["vienen", "van"], correct: "vienen", translation: "Ընկերներս հիմա գալիս են ինձ տեսնելու:" },
  { id: 6, text: "Ella ___ a la oficina todos los lunes.", options: ["va", "viene"], correct: "va", translation: "Նա ամեն երկուշաբթի գնում է գրասենյակ:" },
  { id: 7, text: "¿Por qué no ___ (tú) aquí conmigo?", options: ["vienes", "vas"], correct: "vienes", translation: "Ինչո՞ւ չես գալիս այստեղ՝ ինձ մոտ:" },
  { id: 8, text: "Ellos ___ a la playa si no llueve.", options: ["van", "vienen"], correct: "van", translation: "Նրանք կգնան լողափ, եթե չանձրևի:" },
  { id: 9, text: "Yo siempre ___ a ayudar a mi madre.", options: ["vengo", "voy"], correct: "vengo", translation: "Ես միշտ գալիս եմ մորս օգնելու (խոսողը մոր մոտ է):" },
  { id: 10, text: "Tú ___ al cine con ella, ¿no?", options: ["vas", "vienes"], correct: "vas", translation: "Դու նրա հետ գնում ես կինո, չէ՞:" },
  { id: 11, text: "Mi primo ___ desde España mañana.", options: ["viene", "va"], correct: "viene", translation: "Իմ զարմիկը վաղը գալիս է Իսպանիայից:" },
  { id: 12, text: "Nosotros ___ a explorar el bosque.", options: ["vamos", "venimos"], correct: "vamos", translation: "Մենք գնում ենք անտառը հետազոտելու:" },
  { id: 13, text: "¿A qué hora ___ (vosotros) a la fiesta?", options: ["venís", "vais"], correct: "venís", translation: "Ժամը քանիսի՞ն եք գալիս խնջույքին (խոսողը խնջույքին է):" },
  { id: 14, text: "Ellas ___ a la escuela caminando.", options: ["van", "vienen"], correct: "van", translation: "Նրանք դպրոց են գնում ոտքով:" },
  { id: 15, text: "Ven aquí, (tú) ___ a ver las flores.", options: ["vienes", "vas"], correct: "vienes", translation: "Արի՛ այստեղ, արի տեսնելու ծաղիկները:" },
  { id: 16, text: "Mañana (nosotros) ___ a la base secreta.", options: ["vamos", "venimos"], correct: "vamos", translation: "Վաղը մենք գնում ենք գաղտնի բազա:" },
  { id: 17, text: "¿Quién ___ a la recepción hoy?", options: ["viene", "va"], correct: "viene", translation: "Ո՞վ է գալիս ընդունելությանն այսօր (խոսողը ընդունելությանն է):" },
  { id: 18, text: "Él ___ al gimnasio para entrenar.", options: ["va", "viene"], correct: "va", translation: "Նա գնում է մարզասրահ մարզվելու:" },
  { id: 19, text: "Tú ___ a mi oficina a las diez.", options: ["vienes", "vas"], correct: "vienes", translation: "Դու գալիս ես իմ գրասենյակ ժամը տասին:" },
  { id: 20, text: "Ellos ___ de compras al centro.", options: ["van", "vienen"], correct: "van", translation: "Նրանք գնում են գնումների կենտրոն:" },
];

// --- 3D Scene Components ---

const GolfBall = ({ position, shotProgress }: { position: [number, number, number], shotProgress: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // Parabolic jump animation
  const jumpHeight = Math.sin(shotProgress * Math.PI) * 2;
  const rolling = shotProgress > 0.8 ? (shotProgress - 0.8) * 5 : 0;
  const inHole = shotProgress >= 1 ? -0.4 : 0;

  useFrame((state) => {
    if (meshRef.current) {
      if (shotProgress === 0) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.25;
      } else {
        meshRef.current.position.y = 0.25 + jumpHeight + inHole;
      }
      meshRef.current.rotation.x += 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial color="white" roughness={0.1} metalness={0.2} />
    </mesh>
  );
};

const Hole = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0, 0.45, 32]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3.6, 32]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      <mesh position={[0.6, 3.2, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[1.2, 0.8, 0.02]} />
        <meshStandardMaterial color="#f43f5e" />
      </mesh>
    </group>
  );
};

const FloatingIsland = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#14532d" roughness={1} />
      </mesh>
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[12, 7, 8, 64]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      {/* Rocks and trees */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 1.2) * 9, 0.4, Math.sin(i * 1.2) * 9]} castShadow>
          <dodecahedronGeometry args={[0.6]} />
          <meshStandardMaterial color="#71717a" />
        </mesh>
      ))}
    </group>
  );
};

const Scene = ({ shotProgress }: { shotProgress: number }) => {
  const ballTransitionX = -7.5 + (shotProgress * 15);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={isMobile ? [12, 9, 12] : [14, 10, 14]} 
        fov={isMobile ? 55 : 45}
      />
      <OrbitControls 
        enablePan={false} 
        minDistance={8} 
        maxDistance={22} 
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={shotProgress === 0}
        autoRotateSpeed={0.3}
      />
      
      <Sky sunPosition={[100, 15, 100]} turbidity={0.05} rayleigh={0.4} />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1.5} />
      <Environment preset="night" />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 25, 10]} intensity={1.5} castShadow />

      <Float speed={1.3} rotationIntensity={0.05} floatIntensity={0.2}>
        <group position={[0, 0, 0]}>
          <FloatingIsland />
          <Hole position={[7.5, 0, 0]} />
          <GolfBall position={[ballTransitionX, 0.25, 0]} shotProgress={shotProgress} />
        </group>
      </Float>
    </>
  );
};

// --- Main App Component ---

export default function GolfGame() {
  const [view, setView] = useState<'intro' | 'play' | 'result'>('intro');
  const [player1, setPlayer1] = useState('Գոռ');
  const [player2, setPlayer2] = useState('Գայանե');
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [currentTurn, setCurrentTurn] = useState(0); 
  const [gameState, setGameState] = useState<'answering' | 'shot' | 'missing'>('answering');
  const [shotProgress, setShotProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isPlayer1Turn = currentTurn % 2 === 0;
  const currentPlayer = isPlayer1Turn ? player1 : player2;

  const handleStart = () => {
    setScores({ p1: 0, p2: 0 });
    setCurrentTurn(0);
    setView('play');
    setGameState('answering');
    setShotProgress(0);
  };

  const handleAnswer = (option: string) => {
    setSelectedOption(option);
    const correct = GOLF_QUESTIONS[currentTurn].correct;
    
    if (option === correct) {
      setGameState('shot');
      if (isPlayer1Turn) setScores(s => ({ ...s, p1: s.p1 + 1 }));
      else setScores(s => ({ ...s, p2: s.p2 + 1 }));
      
      let p = 0;
      const interval = setInterval(() => {
        p += 0.02;
        setShotProgress(Math.min(p, 1));
        if (p >= 1) {
          clearInterval(interval);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          setTimeout(() => nextTurn(), 1200);
        }
      }, 30);
    } else {
      setGameState('missing');
      setTimeout(() => nextTurn(), 2000);
    }
  };

  const nextTurn = () => {
    setSelectedOption(null);
    setShotProgress(0);
    if (currentTurn < GOLF_QUESTIONS.length - 1) {
      setCurrentTurn(c => c + 1);
      setGameState('answering');
    } else {
      setView('result');
    }
  };

  const winner = scores.p1 > scores.p2 ? player1 : scores.p2 > scores.p1 ? player2 : "Ոչ-ոքի";

  return (
    <div className="h-screen w-full bg-stone-950 text-white flex flex-col font-sans overflow-hidden">
      
      {/* Header HUD */}
      <header className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Trophy className="text-emerald-500 w-6 h-6" />
          <h1 className="text-xl font-black uppercase tracking-tighter italic">GOLF <span className="text-emerald-500">PRO</span></h1>
        </div>

        <div className="flex gap-2">
           <div className={`px-4 py-1 rounded-xl border-2 transition-all flex flex-col items-center min-w-[70px] ${isPlayer1Turn && view === 'play' ? 'bg-emerald-600 border-white' : 'bg-stone-900 border-stone-800 opacity-60'}`}>
             <p className="text-[8px] font-black uppercase opacity-70">Gor</p>
             <p className="text-lg font-black leading-none">{scores.p1}</p>
           </div>
           <div className={`px-4 py-1 rounded-xl border-2 transition-all flex flex-col items-center min-w-[70px] ${!isPlayer1Turn && view === 'play' ? 'bg-rose-600 border-white' : 'bg-stone-900 border-stone-800 opacity-60'}`}>
             <p className="text-[8px] font-black uppercase opacity-70">Gayane</p>
             <p className="text-lg font-black leading-none">{scores.p2}</p>
           </div>
        </div>
      </header>

      {/* 3D FIELD AT TOP (Fixed Height) */}
      <div className="h-[45vh] md:h-[50vh] w-full relative bg-stone-900 shrink-0">
        <Canvas shadows gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Scene shotProgress={shotProgress} />
          </Suspense>
        </Canvas>
        
        {/* Answer Feedback Overlay over 3D */}
        <AnimatePresence>
           {gameState === 'missing' && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none"
             >
                <div className="bg-rose-600 text-white p-4 rounded-full shadow-2xl animate-bounce">
                   <XCircle size={48} />
                </div>
                <p className="bg-black/80 px-4 py-1 rounded-full font-black text-rose-500 italic text-xl">MISS!</p>
             </motion.div>
           )}
           {gameState === 'shot' && shotProgress >= 1 && (
             <motion.div 
                initial={{ opacity: 0, scale: 2, y: 0 }}
                animate={{ opacity: 1, scale: 1.5, y: -20 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
             >
                <p className="text-5xl font-black italic uppercase text-emerald-400 drop-shadow-[0_4px_12px_rgba(0,255,0,0.8)]">HOLE IN ONE!</p>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* UI CONTENT AT BOTTOM (Question and Options) */}
      <div className="flex-1 bg-stone-950 border-t-4 border-stone-900 relative overflow-y-auto p-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          
          {view === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md w-full space-y-6 text-center py-4"
            >
              <div className="space-y-1">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Մեծ Գոլֆ <span className="text-emerald-500">Արկած</span></h2>
                <p className="text-stone-400 text-sm">Գոռն ընդդեմ Գայանեի: Venir vs Ir</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-stone-900 p-3 rounded-2xl border-2 border-stone-800">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black">G</div>
                  <input value={player1} onChange={e => setPlayer1(e.target.value)} className="bg-transparent border-none outline-none font-bold text-lg flex-1 text-white placeholder-stone-600" placeholder="Անուն 1" />
                </div>
                <div className="flex items-center gap-3 bg-stone-900 p-3 rounded-2xl border-2 border-stone-800">
                  <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center font-black">G</div>
                  <input value={player2} onChange={e => setPlayer2(e.target.value)} className="bg-transparent border-none outline-none font-bold text-lg flex-1 text-white placeholder-stone-600" placeholder="Անուն 2" />
                </div>
              </div>

              <button 
                onClick={handleStart}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-2xl transition-all"
              >
                Սկսել Խաղը
              </button>
            </motion.div>
          )}

          {view === 'play' && (
            <motion.div 
              key="play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-xl mx-auto space-y-6 py-4"
            >
              {/* Question Area */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isPlayer1Turn ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <p className="text-[10px] font-black uppercase text-stone-500 tracking-[0.2em]">
                    {currentPlayer}-ի հերթն է | Հարց {currentTurn + 1}/20
                  </p>
                </div>
                <h3 className="text-2xl md:text-4xl font-black italic tracking-tight uppercase leading-none">
                  {GOLF_QUESTIONS[currentTurn].text}
                </h3>
                <p className="text-base font-bold text-emerald-500/80 italic">
                  {GOLF_QUESTIONS[currentTurn].translation}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                 {GOLF_QUESTIONS[currentTurn].options.map((option) => (
                   <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={gameState !== 'answering'}
                      className={`
                        py-6 rounded-2xl font-black text-2xl italic uppercase transition-all shadow-lg
                        ${selectedOption === option 
                          ? (option === GOLF_QUESTIONS[currentTurn].correct ? 'bg-emerald-600 border-white text-white' : 'bg-rose-600 border-white text-white')
                          : (selectedOption && option === GOLF_QUESTIONS[currentTurn].correct ? 'bg-emerald-600 border-2 border-emerald-500 text-white' : 'bg-stone-900 border-2 border-stone-800 text-stone-500 active:scale-95')
                        }
                      `}
                   >
                     {option}
                   </button>
                 ))}
              </div>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-8"
            >
              <div className="space-y-2">
                 <Trophy size={64} className="text-yellow-500 mx-auto animate-bounce" />
                 <h2 className="text-3xl font-black uppercase italic text-emerald-500">🏆 CHAMPION 🏆</h2>
                 <p className="text-5xl font-black uppercase tracking-tighter italic text-white underline decoration-emerald-500 underline-offset-8">{winner}</p>
              </div>

              <div className="bg-stone-900 p-8 rounded-[32px] space-y-4 text-left border-4 border-emerald-500/20 w-72 mx-auto">
                 <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-black text-xs text-stone-500 uppercase tracking-widest">{player1}</span>
                    <span className="text-2xl font-black text-emerald-500">{scores.p1}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-stone-500 uppercase tracking-widest">{player2}</span>
                    <span className="text-2xl font-black text-rose-500">{scores.p2}</span>
                 </div>
              </div>

              <button 
                onClick={() => setView('intro')}
                className="bg-emerald-600 px-12 py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-emerald-500 transition-all active:scale-95"
              >
                Նորից խաղալ
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
