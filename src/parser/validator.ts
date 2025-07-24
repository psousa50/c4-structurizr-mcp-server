import { parse } from './generated.js';
import type { ValidationResult, ParseError, Workspace, Element } from '../types.js';

export class DSLValidator {
  validate(content: string): ValidationResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];

    try {
      // Parse the DSL content
      const ast = parse(content) as any;
      
      // Perform semantic validation
      this.validateSemantics(ast, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (parseError: any) {
      // Handle PEG.js parse errors
      const error: ParseError = {
        message: parseError.message || 'Syntax error',
        location: parseError.location ? {
          line: parseError.location.start.line,
          column: parseError.location.start.column
        } : undefined
      };

      return {
        isValid: false,
        errors: [error],
        warnings
      };
    }
  }

  private validateSemantics(workspace: any, errors: ParseError[], warnings: ParseError[]): void {
    if (!workspace || workspace.type !== 'workspace') {
      errors.push({
        message: 'Invalid workspace structure',
        location: workspace?.location
      });
      return;
    }

    // Collect all element IDs for reference validation
    const elementIds = this.collectElementIds(workspace);
    
    // Validate unique identifiers
    this.validateUniqueIdentifiers(workspace, errors);
    
    // Validate relationships reference valid elements
    this.validateRelationshipReferences(workspace, elementIds, errors);
    
    // Validate view references
    this.validateViewReferences(workspace, elementIds, errors);
    
    // Check for common patterns and best practices
    this.validateBestPractices(workspace, warnings);
  }

  private collectElementIds(workspace: any): Set<string> {
    const ids = new Set<string>();
    
    const collectFromModel = (model: any) => {
      if (!model?.elements) return;
      
      for (const element of model.elements) {
        ids.add(element.id);
        
        // Recursively collect from nested elements
        if (element.children?.elements) {
          for (const child of element.children.elements) {
            ids.add(child.id);
            
            if (child.children?.elements) {
              for (const grandChild of child.children.elements) {
                ids.add(grandChild.id);
              }
            }
          }
        }
      }
    };

    if (workspace.model) {
      collectFromModel(workspace.model);
    }

    return ids;
  }

  private validateUniqueIdentifiers(workspace: any, errors: ParseError[]): void {
    const seenIds = new Map<string, any>();
    
    const checkElement = (element: any) => {
      if (seenIds.has(element.id)) {
        errors.push({
          message: `Duplicate identifier '${element.id}'. First defined at line ${seenIds.get(element.id).location?.line}`,
          location: element.location
        });
      } else {
        seenIds.set(element.id, element);
      }
      
      // Check nested elements
      if (element.children?.elements) {
        for (const child of element.children.elements) {
          checkElement(child);
        }
      }
    };

    if (workspace.model?.elements) {
      for (const element of workspace.model.elements) {
        checkElement(element);
      }
    }
  }

  private validateRelationshipReferences(workspace: any, elementIds: Set<string>, errors: ParseError[]): void {
    const checkRelationships = (relationships: any[]) => {
      if (!relationships) return;
      
      for (const rel of relationships) {
        if (!elementIds.has(rel.source)) {
          errors.push({
            message: `Relationship source '${rel.source}' references undefined element`,
            location: rel.location
          });
        }
        
        if (!elementIds.has(rel.destination)) {
          errors.push({
            message: `Relationship destination '${rel.destination}' references undefined element`,
            location: rel.location
          });
        }
      }
    };

    // Check model-level relationships
    if (workspace.model?.relationships) {
      checkRelationships(workspace.model.relationships);
    }
    
    // Check nested relationships in elements
    const checkElementRelationships = (elements: any[]) => {
      if (!elements) return;
      
      for (const element of elements) {
        if (element.children?.relationships) {
          checkRelationships(element.children.relationships);
        }
        if (element.children?.elements) {
          checkElementRelationships(element.children.elements);
        }
      }
    };

    if (workspace.model?.elements) {
      checkElementRelationships(workspace.model.elements);
    }
  }

  private validateViewReferences(workspace: any, elementIds: Set<string>, errors: ParseError[]): void {
    if (!workspace.views?.views) return;
    
    for (const view of workspace.views.views) {
      // Validate softwareSystemId references
      if (view.softwareSystemId && !elementIds.has(view.softwareSystemId)) {
        errors.push({
          message: `View references undefined software system '${view.softwareSystemId}'`,
          location: view.location
        });
      }
      
      // Validate containerId references  
      if (view.containerId && !elementIds.has(view.containerId)) {
        errors.push({
          message: `View references undefined container '${view.containerId}'`,
          location: view.location
        });
      }
      
      // Validate include/exclude element references
      const validateElementRefs = (refs: string[], type: string) => {
        if (!refs) return;
        
        for (const ref of refs) {
          if (ref !== '*' && !elementIds.has(ref)) {
            errors.push({
              message: `View ${type} references undefined element '${ref}'`,
              location: view.location
            });
          }
        }
      };
      
      validateElementRefs(view.include, 'include');
      validateElementRefs(view.exclude, 'exclude');
    }
  }

  private validateBestPractices(workspace: any, warnings: ParseError[]): void {
    // Check if workspace has a name and description
    if (!workspace.name) {
      warnings.push({
        message: 'Consider adding a name to your workspace for better documentation',
        location: workspace.location
      });
    }
    
    if (!workspace.description) {
      warnings.push({
        message: 'Consider adding a description to your workspace for better documentation',
        location: workspace.location
      });
    }
    
    // Check for elements without descriptions
    const checkElementDescriptions = (elements: any[]) => {
      if (!elements) return;
      
      for (const element of elements) {
        if (!element.description) {
          warnings.push({
            message: `Consider adding a description to ${element.type} '${element.id}'`,
            location: element.location
          });
        }
        
        if (element.children?.elements) {
          checkElementDescriptions(element.children.elements);
        }
      }
    };
    
    if (workspace.model?.elements) {
      checkElementDescriptions(workspace.model.elements);
    }
    
    // Check for relationships without descriptions
    const checkRelationshipDescriptions = (relationships: any[]) => {
      if (!relationships) return;
      
      for (const rel of relationships) {
        if (!rel.description) {
          warnings.push({
            message: `Consider adding a description to relationship '${rel.source} -> ${rel.destination}'`,
            location: rel.location
          });
        }
      }
    };
    
    if (workspace.model?.relationships) {
      checkRelationshipDescriptions(workspace.model.relationships);
    }
  }
}