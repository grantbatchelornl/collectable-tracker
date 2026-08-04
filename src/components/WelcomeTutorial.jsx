import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Camera,
  TrendingUp,
  BookOpen,
  Repeat,
  Users,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const SLIDES = [
  {
    icon: Camera,
    title: 'Add Collectibles Fast',
    description: 'Snap a photo and AI identifies your card, coin, Funko, or memorabilia instantly — no manual typing.',
    color: 'bg-primary',
  },
  {
    icon: TrendingUp,
    title: 'Track Real Market Values',
    description: 'AI checks verified sold listings and updates your collection value automatically. Lock values you trust.',
    color: 'bg-gain',
  },
  {
    icon: BookOpen,
    title: 'Collection Binders',
    description: 'Create binders for any set — Pokémon, Magic, Lorcana, Sports, Funko, Coins. AI generates the full checklist and tracks your completion %.',
    color: 'bg-gold',
  },
  {
    icon: Repeat,
    title: 'Trade Center',
    description: 'Find trade matches, negotiate offers, and build your trader reputation. Use Convention Mode at live events.',
    color: 'bg-purple-500',
  },
  {
    icon: Users,
    title: 'Community & Leagues',
    description: 'Compete on leaderboards, join leagues, set collection goals, and discover other collectors.',
    color: 'bg-blue-500',
  },
];

export default function WelcomeTutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-20 h-20 rounded-3xl ${slide.color} flex items-center justify-center mb-6 shadow-lg`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        {/* Content */}
        <h1 className="font-display text-2xl font-bold text-center mb-3">{slide.title}</h1>
        <p className="text-muted-foreground text-center text-sm leading-relaxed mb-10">
          {slide.description}
        </p>

        {/* Actions */}
        <div className="w-full space-y-2">
          <Button
            onClick={() => (isLast ? onComplete() : setStep(step + 1))}
            className="w-full h-12 font-medium"
          >
            {isLast ? (
              <>Get Started <ArrowRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
          {!isLast && (
            <button
              onClick={onComplete}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2"
            >
              Skip tutorial
            </button>
          )}
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}
        </div>
      </div>

      <div className="text-center pb-8">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          COLLECTABLE Tracker
        </div>
      </div>
    </div>
  );
}