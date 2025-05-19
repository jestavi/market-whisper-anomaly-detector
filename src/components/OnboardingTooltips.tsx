
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { X } from "lucide-react";

export function OnboardingTooltips() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Check if this is the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('anomalyDetector_hasVisitedBefore');
    if (!hasVisitedBefore) {
      setShowWelcome(true);
      localStorage.setItem('anomalyDetector_hasVisitedBefore', 'true');
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Stock Market Anomaly Detector",
      description: "This application helps you identify unusual patterns and anomalies in stock market data. Let's take a quick tour of the main features."
    },
    {
      title: "Select a Stock",
      description: "Start by selecting a stock symbol from the dropdown menu. You can choose from popular companies like Apple (AAPL), Microsoft (MSFT), and others."
    },
    {
      title: "Choose a Time Range",
      description: "Select a time period to analyze. Use the preset buttons (1D, 1W, 1M, etc.) for quick access, or select a custom date range with the calendar."
    },
    {
      title: "Explore the Chart",
      description: "The interactive chart displays price history and highlights detected anomalies. Toggle between line and candlestick views, and show/hide volume data for deeper analysis."
    },
    {
      title: "Examine Anomalies",
      description: "The Detected Anomalies panel lists unusual price and volume events. Click on any anomaly to see detailed information and analysis."
    },
    {
      title: "Ready to Start!",
      description: "You're all set to explore market anomalies. If you need help later, look for the info icons throughout the application."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowWelcome(false);
    }
  };

  const handleSkip = () => {
    setShowWelcome(false);
  };

  return (
    <>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {steps[currentStep].title}
            </DialogTitle>
            <DialogDescription>
              {steps[currentStep].description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                ></div>
              ))}
            </div>
            <DialogFooter className="sm:justify-end">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <TooltipProvider>
        <div className="fixed bottom-4 right-4 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 shadow-lg flex items-center justify-center"
                onClick={() => setShowWelcome(true)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Help & Tutorial</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </>
  );
}
