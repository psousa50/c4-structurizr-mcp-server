import { DSLValidator } from '../parser/validator.js';

export async function validateDsl(content: string) {
  const validator = new DSLValidator();
  const result = validator.validate(content);
  
  let text = '';
  
  if (result.isValid) {
    text = '✅ **DSL Validation Successful**\n\n';
    text += 'Your C4 Structurizr DSL is syntactically and semantically valid!\n\n';
    
    if (result.warnings && result.warnings.length > 0) {
      text += '⚠️ **Warnings:**\n\n';
      for (const warning of result.warnings) {
        text += `- ${warning.message}`;
        if (warning.location) {
          text += ` (line ${warning.location.line}, column ${warning.location.column})`;
        }
        text += '\n';
      }
    }
  } else {
    text = '❌ **DSL Validation Failed**\n\n';
    text += `Found ${result.errors.length} error(s):\n\n`;
    
    for (let i = 0; i < result.errors.length; i++) {
      const error = result.errors[i];
      text += `**Error ${i + 1}:** ${error.message}`;
      if (error.location) {
        text += ` (line ${error.location.line}, column ${error.location.column})`;
      }
      text += '\n\n';
    }
    
    if (result.warnings && result.warnings.length > 0) {
      text += '⚠️ **Additional Warnings:**\n\n';
      for (const warning of result.warnings) {
        text += `- ${warning.message}`;
        if (warning.location) {
          text += ` (line ${warning.location.line}, column ${warning.location.column})`;
        }
        text += '\n';
      }
    }
    
    text += '\n**Common Fixes:**\n';
    text += '- Check for typos in element identifiers\n';
    text += '- Ensure all referenced elements are defined\n';
    text += '- Verify proper nesting of elements (containers in software systems, components in containers)\n';
    text += '- Check that all required quotes are present for names and descriptions\n';
  }
  
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}