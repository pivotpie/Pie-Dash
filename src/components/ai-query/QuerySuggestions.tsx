// components/ai-query/QuerySuggestions.tsx
import React from 'react';
import { Button } from '../ui/button';
import { AIService } from '../../services/aiService';

interface QuerySuggestionsProps {
  onSuggestionClick: (question: string) => void;
}

export const QuerySuggestions: React.FC<QuerySuggestionsProps> = ({ 
  onSuggestionClick 
}) => {
  const suggestions = AIService.PRESET_QUERIES;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        Try asking about:
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion.question)}
            className="text-left h-auto p-3 justify-start"
          >
            <div>
              <div className="font-medium text-sm">{suggestion.question}</div>
              <div className="text-xs text-gray-500 mt-1">
                {suggestion.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      {/* Custom query examples */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="text-sm font-medium text-blue-900 mb-2">
          Example Questions:
        </h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div>• "Which restaurants in Al Quoz are overdue for collection?"</div>
          <div>• "Show me the top 5 service providers by volume"</div>
          <div>• "How many 100+ gallon collections happened last week?"</div>
          <div>• "Which areas have the most critical delays?"</div>
          <div>• "What's the average time between collections for restaurants?"</div>
        </div>
      </div>
    </div>
  );
};