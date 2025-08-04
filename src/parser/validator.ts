import { parse } from './generated.js';
import type { ValidationResult, ParseError, Workspace, Element } from '../types.js';

export class DSLValidator {
  private allRelationships: any[] = [];

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

  private collectAllRelationships(workspace: any): any[] {
    const relationships: any[] = [];
    
    const collectFromModel = (model: any) => {
      if (model?.relationships) {
        relationships.push(...model.relationships);
      }
      
      if (model?.elements) {
        for (const element of model.elements) {
          if (element.children?.relationships) {
            relationships.push(...element.children.relationships);
          }
          
          if (element.children?.elements) {
            for (const child of element.children.elements) {
              if (child.children?.relationships) {
                relationships.push(...child.children.relationships);
              }
            }
          }
        }
      }
    };

    if (workspace.model) {
      collectFromModel(workspace.model);
    }

    return relationships;
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
    // Store relationships for later use in dynamic step validation
    this.allRelationships = this.collectAllRelationships(workspace);
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
      
      // Validate dynamic view steps
      if (view.type === 'dynamic' && view.steps) {
        this.validateDynamicSteps(view.steps, elementIds, errors);
      }
    }
  }

  private validateDynamicSteps(steps: any[], elementIds: Set<string>, errors: ParseError[]): void {
    if (!steps) return;
    
    for (const step of steps) {
      // Validate that source element exists
      if (!elementIds.has(step.source)) {
        errors.push({
          message: `Dynamic step references undefined source element '${step.source}'`,
          location: step.location
        });
        continue;
      }
      
      // Validate that destination element exists
      if (!elementIds.has(step.destination)) {
        errors.push({
          message: `Dynamic step references undefined destination element '${step.destination}'`,
          location: step.location
        });
        continue;
      }
      
      // Check if a valid relationship path exists between source and destination
      if (!this.hasValidRelationshipPath(step.source, step.destination)) {
        errors.push({
          message: `A relationship between ${this.getElementDisplayName(step.source)} and ${this.getElementDisplayName(step.destination)} does not exist in model`,
          location: step.location
        });
      }
    }
  }

  private hasValidRelationshipPath(source: string, destination: string): boolean {
    // Check if there's a direct static relationship
    if (this.hasDirectRelationship(source, destination)) {
      return true;
    }
    
    // Check for implicit relationships (e.g., person -> software system -> container)
    if (this.hasImplicitRelationship(source, destination)) {
      return true;
    }
    
    return false;
  }

  private hasDirectRelationship(source: string, destination: string): boolean {
    return this.allRelationships.some(rel => 
      rel.source === source && rel.destination === destination
    );
  }

  private hasImplicitRelationship(source: string, destination: string): boolean {
    // This would check for implicit relationships like person -> container within software system
    // For now, return false to match official Structurizr strict behavior
    return false;
  }

  private getElementDisplayName(elementId: string): string {
    // This would map element IDs to their display names
    // For now, just capitalize the first letter and add spaces before capitals
    return elementId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
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