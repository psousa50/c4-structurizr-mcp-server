import { parse } from '../parser/generated.js';

interface AnalysisResult {
  elementCounts: Record<string, number>;
  relationshipCount: number;
  viewCounts: Record<string, number>;
  depth: number;
  complexity: string;
  suggestions: string[];
  elements: any[];
  relationships: any[];
}

export async function analyzeModel(content: string) {
  try {
    const ast = parse(content) as any;
    const analysis = analyzeWorkspaceInternal(ast);
    
    let text = '📊 **C4 Model Analysis**\n\n';
    
    // Overview
    text += '## Overview\n';
    text += `- **Workspace**: ${ast.name || 'Unnamed'}\n`;
    text += `- **Model Depth**: ${analysis.depth} levels\n`;
    text += `- **Complexity**: ${analysis.complexity}\n\n`;
    
    // Element statistics
    text += '## Element Statistics\n';
    for (const [type, count] of Object.entries(analysis.elementCounts)) {
      text += `- **${capitalize(type)}s**: ${count}\n`;
    }
    text += `- **Relationships**: ${analysis.relationshipCount}\n\n`;
    
    // View statistics
    text += '## View Statistics\n';
    if (Object.keys(analysis.viewCounts).length > 0) {
      for (const [type, count] of Object.entries(analysis.viewCounts)) {
        text += `- **${capitalize(type)} views**: ${count}\n`;
      }
    } else {
      text += '- No views defined\n';
    }
    text += '\n';
    
    // Element details
    if (analysis.elements.length > 0) {
      text += '## Element Details\n';
      for (const element of analysis.elements) {
        text += `### ${capitalize(element.type)}: ${element.name}\n`;
        text += `- **ID**: \`${element.id}\`\n`;
        if (element.description) {
          text += `- **Description**: ${element.description}\n`;
        }
        if (element.technology) {
          text += `- **Technology**: ${element.technology}\n`;
        }
        if (element.tags && element.tags.length > 0) {
          text += `- **Tags**: ${element.tags.join(', ')}\n`;
        }
        text += '\n';
      }
    }
    
    // Relationship details
    if (analysis.relationships.length > 0) {
      text += '## Relationship Details\n';
      for (const rel of analysis.relationships) {
        text += `- **${rel.source}** → **${rel.destination}**`;
        if (rel.description) {
          text += `: ${rel.description}`;
        }
        if (rel.technology) {
          text += ` (${rel.technology})`;
        }
        text += '\n';
      }
      text += '\n';
    }
    
    // Suggestions
    if (analysis.suggestions.length > 0) {
      text += '## 💡 Suggestions\n';
      for (const suggestion of analysis.suggestions) {
        text += `- ${suggestion}\n`;
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Analysis Failed**\n\nCannot analyze invalid DSL. Please fix syntax errors first:\n\n${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

function analyzeWorkspaceInternal(workspace: any): AnalysisResult {
  const analysis: AnalysisResult = {
    elementCounts: {},
    relationshipCount: 0,
    viewCounts: {},
    depth: 0,
    complexity: 'Simple',
    suggestions: [],
    elements: [],
    relationships: []
  };
  
  // Analyze model
  if (workspace.model) {
    analyzeModelInternal(workspace.model, analysis, 1);
  }
  
  // Analyze views
  if (workspace.views?.views) {
    for (const view of workspace.views.views) {
      analysis.viewCounts[view.type] = (analysis.viewCounts[view.type] || 0) + 1;
    }
  }
  
  // Determine complexity
  const totalElements = Object.values(analysis.elementCounts).reduce((sum, count) => sum + count, 0);
  if (totalElements <= 5 && analysis.relationshipCount <= 5) {
    analysis.complexity = 'Simple';
  } else if (totalElements <= 15 && analysis.relationshipCount <= 20) {
    analysis.complexity = 'Moderate';
  } else {
    analysis.complexity = 'Complex';
  }
  
  // Generate suggestions
  generateSuggestions(workspace, analysis);
  
  return analysis;
}

function analyzeModelInternal(model: any, analysis: AnalysisResult, currentDepth: number) {
  analysis.depth = Math.max(analysis.depth, currentDepth);
  
  if (model.elements) {
    for (const element of model.elements) {
      // Count elements
      analysis.elementCounts[element.type] = (analysis.elementCounts[element.type] || 0) + 1;
      analysis.elements.push(element);
      
      // Analyze nested elements
      if (element.children?.elements) {
        analyzeModelInternal(element.children, analysis, currentDepth + 1);
      }
    }
  }
  
  if (model.relationships) {
    analysis.relationshipCount += model.relationships.length;
    analysis.relationships.push(...model.relationships);
  }
}

function generateSuggestions(workspace: any, analysis: AnalysisResult) {
  // Workspace-level suggestions
  if (!workspace.name) {
    analysis.suggestions.push('Consider adding a name to your workspace for better documentation');
  }
  
  if (!workspace.description) {
    analysis.suggestions.push('Consider adding a description to your workspace for better context');
  }
  
  // Element suggestions
  const totalElements = Object.values(analysis.elementCounts).reduce((sum, count) => sum + count, 0);
  
  if (totalElements === 0) {
    analysis.suggestions.push('Your model has no elements. Add some people, software systems, containers, or components');
  }
  
  if (analysis.elementCounts.person === 0) {
    analysis.suggestions.push('Consider adding person elements to show who uses your system');
  }
  
  if (analysis.elementCounts.softwareSystem === 0) {
    analysis.suggestions.push('Consider adding software system elements as the main building blocks');
  }
  
  // Relationship suggestions
  if (analysis.relationshipCount === 0 && totalElements > 1) {
    analysis.suggestions.push('Add relationships between your elements to show how they interact');
  }
  
  if (analysis.relationshipCount > 0) {
    const avgRelPerElement = analysis.relationshipCount / totalElements;
    if (avgRelPerElement > 3) {
      analysis.suggestions.push('Your model has many relationships per element. Consider grouping related elements or splitting into multiple views');
    }
  }
  
  // View suggestions
  const viewCount = Object.values(analysis.viewCounts).reduce((sum, count) => sum + count, 0);
  
  if (viewCount === 0) {
    analysis.suggestions.push('Add views to visualize your architecture. Start with a system context view');
  }
  
  if (analysis.elementCounts.softwareSystem > 0 && !analysis.viewCounts.systemContext) {
    analysis.suggestions.push('Consider adding system context views for your software systems');
  }
  
  if (analysis.elementCounts.container > 0 && !analysis.viewCounts.container) {
    analysis.suggestions.push('Consider adding container views to show the internal structure of your software systems');
  }
  
  if (analysis.elementCounts.component > 0 && !analysis.viewCounts.component) {
    analysis.suggestions.push('Consider adding component views to show the internal structure of your containers');
  }
  
  // Architecture pattern suggestions
  if (analysis.elementCounts.softwareSystem > 5) {
    analysis.suggestions.push('You have many software systems. Consider creating a system landscape view to show the big picture');
  }
  
  if (analysis.depth === 1 && totalElements > 3) {
    analysis.suggestions.push('Consider breaking down your software systems into containers and components for more detail');
  }
  
  // Documentation suggestions
  const elementsWithoutDescription = analysis.elements.filter(e => !e.description).length;
  if (elementsWithoutDescription > 0) {
    analysis.suggestions.push(`${elementsWithoutDescription} element(s) are missing descriptions. Add descriptions for better documentation`);
  }
  
  const relationshipsWithoutDescription = analysis.relationships.filter(r => !r.description).length;
  if (relationshipsWithoutDescription > 0) {
    analysis.suggestions.push(`${relationshipsWithoutDescription} relationship(s) are missing descriptions. Add descriptions to clarify interactions`);
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}