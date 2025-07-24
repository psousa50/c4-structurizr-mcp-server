export interface ParseError {
  message: string;
  location?: {
    line: number;
    column: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ParseError[];
  warnings?: ParseError[];
}

export interface Directive {
  type: 'directive';
  name: string;
  value?: string;
  location?: {
    line: number;
    column: number;
  };
}

export interface Element {
  id: string;
  type: 'person' | 'softwareSystem' | 'container' | 'component';
  name: string;
  description?: string;
  technology?: string;
  tags?: string[];
  children?: {
    elements: Element[];
    relationships: Relationship[];
  };
  location?: {
    line: number;
    column: number;
  };
}

export interface Relationship {
  type: 'relationship';
  source: string;
  destination: string;
  description?: string;
  technology?: string;
  tags?: string[];
  location?: {
    line: number;
    column: number;
  };
}

export interface DynamicStep {
  type: 'dynamicStep';
  source: string;
  destination: string;
  description: string;
  location?: {
    line: number;
    column: number;
  };
}

export interface Model {
  type: 'model';
  elements: Element[];
  relationships: Relationship[];
  location?: {
    line: number;
    column: number;
  };
}

export interface StyleProperty {
  type: 'styleProperty';
  name: string;
  value: string;
  location?: {
    line: number;
    column: number;
  };
}

export interface StyleRule {
  type: 'elementStyle' | 'relationshipStyle';
  selector: string;
  properties: StyleProperty[];
  location?: {
    line: number;
    column: number;
  };
}

export interface StylesBlock {
  type: 'styles';
  rules: StyleRule[];
  location?: {
    line: number;
    column: number;
  };
}

export interface ThemesDirective {
  type: 'themes';
  name: string;
  location?: {
    line: number;
    column: number;
  };
}

export interface View {
  key?: string;
  type: 'systemLandscape' | 'systemContext' | 'container' | 'component' | 'dynamic' | 'deployment';
  softwareSystemId?: string;
  containerId?: string;
  environment?: string;
  title?: string;
  steps?: DynamicStep[];
  include?: string[];
  exclude?: string[];
  autoLayout?: boolean | string;
  description?: string;
  animation?: string[][];
  location?: {
    line: number;
    column: number;
  };
}

export interface Views {
  type: 'views';
  views: View[];
  styles?: StylesBlock;
  themes?: ThemesDirective;
  location?: {
    line: number;
    column: number;
  };
}

export interface Workspace {
  type: 'workspace';
  name?: string;
  description?: string;
  directives?: Directive[];
  model: Model;
  views: Views;
  location?: {
    line: number;
    column: number;
  };
}