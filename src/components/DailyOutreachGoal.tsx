import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, TrendingUp, Edit2, Check, Flame } from 'lucide-react';
import { BusinessLead } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface DailyOutreachGoalProps {
  leads: BusinessLead[];
  currentUser?: User | null;
}

export const DailyOutreachGoal: React.FC<DailyOutreachGoalProps> = ({
  leads,
  currentUser
}) => {
  const [goalTarget, setGoalTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pegadaian_daily_outreach_goal');
      return saved ? Math.max(1, parseInt(saved, 10)) : 10;
    } catch {
      return 10;
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<number>(goalTarget);

  // Calculate actual leads contacted today (status: Terkirim, Merespon, Closing)
  const contactedCount = leads.filter(l => 
    l.statusKontak === 'Terkirim' || 
    l.statusKontak === 'Merespon' || 
    l.statusKontak === 'Closing'
  ).length;

  const percentage = Math.min(100, Math.round((contactedCount / goalTarget) * 100));
  const isGoalAchieved = contactedCount >= goalTarget;

  // Sync goal with Firestore if user is signed in
  useEffect(() => {
    if (!currentUser) return;
    const fetchGoalFromCloud = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const goalDocRef = doc(db, 'users', currentUser.uid, 'dailyGoals', todayStr);
        const snap = await getDoc(goalDocRef);
        if (snap.exists() && snap.data().target) {
          const cloudTarget = snap.data().target;
          setGoalTarget(cloudTarget);
          setTempTarget(cloudTarget);
        }
      } catch (e) {
        console.warn('Could not load daily goal from firestore:', e);
      }
    };
    fetchGoalFromCloud();
  }, [currentUser]);

  const handleSaveGoal = async () => {
    const valid = Math.max(1, Math.min(100, tempTarget || 10));
    setGoalTarget(valid);
    setIsEditing(false);
    try {
      localStorage.setItem('pegadaian_daily_outreach_goal', valid.toString());
    } catch (e) {
      console.warn('Local storage error:', e);
    }

    if (currentUser) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const goalDocRef = doc(db, 'users', currentUser.uid, 'dailyGoals', todayStr);
        await setDoc(goalDocRef, {
          target: valid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not sync daily goal to firestore:', e);
      }
    }
  };

  return (
    <div className="bg-[#031d16]/80 border border-emerald-900/60 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
      
      {/* Title & Goal Target Editor */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
          <Target className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Target Kontak Harian</span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={100}
              value={tempTarget}
              onChange={(e) => setTempTarget(parseInt(e.target.value, 10) || 1)}
              className="w-12 px-1.5 py-0.5 text-xs bg-emerald-950 border border-emerald-500 rounded text-white text-center font-bold focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveGoal}
              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              title="Simpan Target"
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempTarget(goalTarget);
              setIsEditing(true);
            }}
            className="flex items-center gap-1 text-[11px] text-emerald-300/80 hover:text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-800/60 transition-colors"
            title="Ubah Target Harian"
          >
            <span>Target: <strong className="text-white font-mono">{goalTarget}</strong></span>
            <Edit2 className="w-2.5 h-2.5 ml-0.5 text-emerald-400" />
          </button>
        )}
      </div>

      {/* Progress Numbers & Badge */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono tracking-tight text-white">
            {contactedCount}
          </span>
          <span className="text-xs text-emerald-300/70 font-mono">
            / {goalTarget} Prospek
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isGoalAchieved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Target Tercapai!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-200 border border-emerald-800/60">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-emerald-950/90 rounded-full h-2 overflow-hidden relative border border-emerald-900/50">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isGoalAchieved 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300' 
              : percentage >= 50 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500' 
              : 'bg-gradient-to-r from-amber-500 to-emerald-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Motivational Micro Subtitle */}
      <div className="flex items-center justify-between text-[10px] text-emerald-300/70 mt-2">
        <span className="truncate">
          {isGoalAchieved 
            ? 'Kerja luar biasa! Siap closing pencairan.' 
            : `${goalTarget - contactedCount} prospek lagi untuk capai target.`}
        </span>
        {isGoalAchieved && (
          <Flame className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
        )}
      </div>

    </div>
  );
};
