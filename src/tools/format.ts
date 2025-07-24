import { parse } from '../parser/generated.js';

export async function formatDsl(content: string) {
  try {
    const ast = parse(content) as any;
    const formatted = formatWorkspace(ast);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ **DSL Formatted Successfully**\n\n\`\`\`\n${formatted}\n\`\`\``,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Formatting Failed**\n\nCannot format invalid DSL. Please fix syntax errors first:\n\n${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

function formatWorkspace(workspace: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = '';
  
  result += `${indentStr}workspace`;
  if (workspace.name) {
    result += ` "${workspace.name}"`;
  }
  if (workspace.description) {
    result += ` "${workspace.description}"`;
  }
  result += ' {\n';
  
  if (workspace.model) {
    result += formatModel(workspace.model, indent + 1);
  }
  
  if (workspace.views) {
    result += '\n' + formatViews(workspace.views, indent + 1);
  }
  
  result += `${indentStr}}\n`;
  return result;
}

function formatModel(model: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = `${indentStr}model {\n`;
  
  if (model.elements && model.elements.length > 0) {
    for (const element of model.elements) {
      result += formatElement(element, indent + 1);
    }
  }
  
  if (model.relationships && model.relationships.length > 0) {
    if (model.elements && model.elements.length > 0) {
      result += '\n';
    }
    for (const relationship of model.relationships) {
      result += formatRelationship(relationship, indent + 1);
    }
  }
  
  result += `${indentStr}}\n`;
  return result;
}

function formatElement(element: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = `${indentStr}${element.id} = ${element.type} "${element.name}"`;
  
  if (element.description) {
    result += ` "${element.description}"`;
  }
  
  if (element.technology) {
    result += ` "${element.technology}"`;
  }
  
  if (element.tags && element.tags.length > 0) {
    result += ` [${element.tags.map((tag: string) => `"${tag}"`).join(', ')}]`;
  }
  
  if (element.children && (element.children.elements?.length > 0 || element.children.relationships?.length > 0)) {
    result += ' {\n';
    
    if (element.children.elements && element.children.elements.length > 0) {
      for (const child of element.children.elements) {
        result += formatElement(child, indent + 1);
      }
    }
    
    if (element.children.relationships && element.children.relationships.length > 0) {
      if (element.children.elements && element.children.elements.length > 0) {
        result += '\n';
      }
      for (const relationship of element.children.relationships) {
        result += formatRelationship(relationship, indent + 1);
      }
    }
    
    result += `${indentStr}}`;
  }
  
  result += '\n';
  return result;
}

function formatRelationship(relationship: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = `${indentStr}${relationship.source} -> ${relationship.destination}`;
  
  if (relationship.description) {
    result += ` "${relationship.description}"`;
  }
  
  if (relationship.technology) {
    result += ` "${relationship.technology}"`;
  }
  
  if (relationship.tags && relationship.tags.length > 0) {
    result += ` [${relationship.tags.map((tag: string) => `"${tag}"`).join(', ')}]`;
  }
  
  result += '\n';
  return result;
}

function formatViews(views: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = `${indentStr}views {\n`;
  
  if (views.views && views.views.length > 0) {
    for (let i = 0; i < views.views.length; i++) {
      if (i > 0) result += '\n';
      result += formatView(views.views[i], indent + 1);
    }
  }
  
  result += `${indentStr}}\n`;
  return result;
}

function formatView(view: any, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  let result = `${indentStr}${view.type}`;
  
  if (view.softwareSystemId) {
    result += ` ${view.softwareSystemId}`;
  }
  
  if (view.containerId) {
    result += ` ${view.containerId}`;
  }
  
  if (view.key) {
    result += ` "${view.key}"`;
  }
  
  result += ' {\n';
  
  const viewIndentStr = '  '.repeat(indent + 1);
  
  if (view.include && view.include.length > 0) {
    result += `${viewIndentStr}include ${view.include.join(', ')}\n`;
  }
  
  if (view.exclude && view.exclude.length > 0) {
    result += `${viewIndentStr}exclude ${view.exclude.join(', ')}\n`;
  }
  
  if (view.autoLayout) {
    result += `${viewIndentStr}autoLayout\n`;
  }
  
  result += `${indentStr}}\n`;
  return result;
}