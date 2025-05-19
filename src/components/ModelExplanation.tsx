
import { useState } from 'react';
import { getAnomalyModelExplanation } from '@/utils/anomalyDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, Brain, Info } from 'lucide-react';

export function ModelExplanation() {
  const [showFeedback, setShowFeedback] = useState(false);
  const modelInfo = getAnomalyModelExplanation();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-lg">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          Anomaly Detection Model
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowFeedback(!showFeedback)}
        >
          {showFeedback ? 'Hide Feedback' : 'Give Feedback'}
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {modelInfo.shortDescription}
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="methodology">
            <AccordionTrigger>Methodology</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {modelInfo.methodology.map((item, index) => (
                  <li key={index} className="text-sm">{item}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="accuracy">
            <AccordionTrigger>Accuracy & Performance</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-2">{modelInfo.accuracy}</p>
              <div className="flex items-center text-sm text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Results are for demonstration purposes only and should not be used for actual trading decisions.</span>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="limitations">
            <AccordionTrigger>Limitations</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {modelInfo.limitations.map((item, index) => (
                  <li key={index} className="text-sm">{item}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {showFeedback && (
          <div className="mt-4 border rounded-md p-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Model Feedback
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your feedback helps improve our anomaly detection capabilities.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Was this anomaly accurate?</label>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Yes</Button>
                  <Button size="sm" variant="outline">No</Button>
                  <Button size="sm" variant="outline">Unsure</Button>
                </div>
              </div>
              
              <div>
                <label htmlFor="feedback" className="text-sm font-medium block mb-1">Additional Comments</label>
                <textarea 
                  id="feedback" 
                  className="w-full h-20 p-2 border rounded-md text-sm bg-background"
                  placeholder="Please provide any additional observations..."
                ></textarea>
              </div>
              
              <Button className="w-full" size="sm">
                Submit Feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
