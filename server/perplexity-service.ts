interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface LearningExplanation {
  explanation: string;
  sources: string[];
  relatedFacts: string[];
  commonness: 'very_common' | 'common' | 'uncommon' | 'rare';
}

export class PerplexityService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateExplanation(question: string, correctAnswer: string, userWasCorrect: boolean): Promise<LearningExplanation> {
    const systemPrompt = userWasCorrect 
      ? `You are an expert Jeopardy tutor. The user answered correctly. Provide additional context and learning material about this topic.`
      : `You are an expert Jeopardy tutor helping a student learn from their mistake. Provide a clear explanation and additional context.`;

    const userPrompt = userWasCorrect
      ? `Great job! You correctly answered: "${correctAnswer}" to the question "${question}". 

Create a comprehensive learning blurb that includes:
1. Why this answer is correct and its significance
2. Related trivia and interesting facts about this topic
3. How common or rare this type of question is on Jeopardy (very common, common, uncommon, or rare)
4. Additional context that deepens understanding
5. Memory aids or connections to help retention

Make this engaging and educational, focusing on building broader knowledge around this topic.`
      : `The correct answer to "${question}" is "${correctAnswer}".

Create a comprehensive learning blurb that includes:
1. Clear explanation of why this is the correct answer
2. Key facts and context for remembering this answer
3. Related trivia and interesting facts about this topic
4. How common or rare this type of question is on Jeopardy (very common, common, uncommon, or rare)
5. Memory techniques or associations that could help
6. Broader context that helps understand the subject

Make this educational and engaging, helping build knowledge from this mistake.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 500,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const explanation = data.choices[0]?.message?.content || 'No explanation available';
      const sources = data.citations || [];

      // Extract related facts from the explanation (simple approach - split by numbered points)
      const relatedFacts = this.extractRelatedFacts(explanation);
      const commonness = this.extractCommonness(explanation);

      return {
        explanation,
        sources,
        relatedFacts,
        commonness
      };
    } catch (error) {
      console.error('Error generating explanation:', error);
      // Return fallback explanation
      return {
        explanation: `The correct answer is ${correctAnswer}. This is a common Jeopardy topic that appears frequently in trivia competitions.`,
        sources: [],
        relatedFacts: [],
        commonness: 'common' as const
      };
    }
  }

  async generateStudyMaterial(category: string, topic?: string): Promise<{
    title: string;
    content: string;
    sources: string[];
    relatedTopics: string[];
  }> {
    const prompt = topic 
      ? `Create comprehensive study material for Jeopardy contestants about ${topic} in the ${category} category.`
      : `Create comprehensive study material for Jeopardy contestants about key topics in the ${category} category.`;

    const detailedPrompt = `${prompt}

Please provide:
1. A clear, informative title
2. Detailed content covering key facts, dates, names, and concepts that commonly appear on Jeopardy
3. Important connections and relationships between concepts
4. Memory aids and interesting details that help with retention
5. List related topics that contestants should also study

Focus on information that would be valuable for someone preparing for Jeopardy, including both basic facts and deeper knowledge that demonstrates expertise.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Jeopardy coach creating study materials for contestants. Focus on facts, dates, names, and concepts that frequently appear on the show.'
            },
            {
              role: 'user',
              content: detailedPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
          return_related_questions: false,
          search_recency_filter: 'year',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || 'Study material not available';
      const sources = data.citations || [];

      // Extract title and related topics from content
      const { title, cleanedContent } = this.extractTitleFromContent(content, category, topic);
      const relatedTopics = this.extractRelatedTopics(content);

      return {
        title,
        content: cleanedContent,
        sources,
        relatedTopics
      };
    } catch (error) {
      console.error('Error generating study material:', error);
      return {
        title: `${category} Study Guide`,
        content: `Study material for ${category} category. Key concepts and facts commonly appearing on Jeopardy.`,
        sources: [],
        relatedTopics: []
      };
    }
  }

  private extractRelatedFacts(explanation: string): string[] {
    // Simple extraction of numbered points or bullet points as related facts
    const facts: string[] = [];
    const lines = explanation.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Look for numbered points (1., 2., etc.) or bullet points (•, -, *)
      if (/^[\d+\.\-\*\•]/.test(trimmed) && trimmed.length > 10) {
        // Remove the numbering/bullet and clean up
        const cleaned = trimmed.replace(/^[\d+\.\-\*\•]\s*/, '').trim();
        if (cleaned.length > 10) {
          facts.push(cleaned);
        }
      }
    }
    
    return facts.slice(0, 5); // Limit to 5 related facts
  }

  private extractTitleFromContent(content: string, category: string, topic?: string): { title: string; cleanedContent: string } {
    const lines = content.split('\n');
    let title = topic ? `${topic} - ${category}` : `${category} Study Guide`;
    let cleanedContent = content;

    // Look for potential title in first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 5 && line.length < 100 && !line.includes('.') && line === line.toUpperCase()) {
        title = line;
        cleanedContent = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }

    return { title, cleanedContent };
  }

  private extractRelatedTopics(content: string): string[] {
    const topics: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('related') && (lower.includes('topics') || lower.includes('subjects'))) {
        // Found a related topics section
        const index = lines.indexOf(line);
        for (let i = index + 1; i < Math.min(index + 6, lines.length); i++) {
          const topicLine = lines[i].trim();
          if (topicLine.length > 3 && topicLine.length < 50) {
            const cleaned = topicLine.replace(/^[\d+\.\-\*\•]\s*/, '').trim();
            if (cleaned.length > 3) {
              topics.push(cleaned);
            }
          }
        }
        break;
      }
    }
    
    return topics.slice(0, 8); // Limit to 8 related topics
  }

  private extractCommonness(content: string): 'very_common' | 'common' | 'uncommon' | 'rare' {
    const lower = content.toLowerCase();
    
    if (lower.includes('very common') || lower.includes('extremely common') || lower.includes('frequently appears')) {
      return 'very_common';
    } else if (lower.includes('uncommon') || lower.includes('less common') || lower.includes('infrequent')) {
      return 'uncommon';
    } else if (lower.includes('rare') || lower.includes('rarely') || lower.includes('seldom')) {
      return 'rare';
    } else {
      return 'common'; // Default fallback
    }
  }
}

export const perplexityService = new PerplexityService(process.env.PERPLEXITY_API_KEY || '');