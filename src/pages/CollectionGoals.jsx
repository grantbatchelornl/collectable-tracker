import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import GoalCard from '@/components/goals/GoalCard';
import CreateGoalModal from '@/components/goals/CreateGoalModal';
import { ArrowLeft, Plus, Target, Loader2 } from 'lucide-react';

export default function CollectionGoals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    try {
      const data = await base44.entities.CollectionGoal.filter({ user_id: user.id, status: 'active' }, '-created_date', 50);
      setGoals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (goalId, updates) => {
    try {
      await base44.entities.CollectionGoal.update(goalId, updates);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateGoal = async (data) => {
    try {
      await base44.entities.CollectionGoal.create(data);
      setShowCreate(false);
      loadGoals();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Collection Goals</h1>
          <p className="text-xs text-muted-foreground">Track and complete your collection milestones</p>
        </div>
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> New Goal
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">No Goals Yet</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">
            Set a collection goal to track your progress, see what's missing, and get AI recommendations.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGoalModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreateGoal} />
      )}
    </div>
  );
}