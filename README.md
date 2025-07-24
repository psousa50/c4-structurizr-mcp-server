# C4 Structurizr MCP Server

A Model Context Protocol (MCP) server for validating, formatting, and analyzing C4 Structurizr DSL files.

## Features

- **DSL Validation**: Comprehensive syntax and semantic validation for C4 Structurizr DSL
- **Code Formatting**: Automatic formatting and prettification of DSL code
- **Model Analysis**: Detailed analysis of your architecture models with insights and suggestions
- **Documentation Resources**: Built-in DSL schema reference and examples

## MCP Tools

### `validate-dsl`
Validates C4 Structurizr DSL syntax and semantics, providing detailed error messages with line/column information.

**Input**: DSL content as string
**Output**: Validation results with errors, warnings, and suggestions

### `format-dsl`
Formats and prettifies C4 Structurizr DSL code with consistent indentation and structure.

**Input**: DSL content as string
**Output**: Formatted DSL code

### `analyze-model`
Analyzes C4 model structure and provides insights including:
- Element and relationship statistics
- Model complexity assessment
- Architecture improvement suggestions
- Missing documentation warnings

**Input**: DSL content as string
**Output**: Comprehensive analysis report

## MCP Resources

### `c4://schema`
Complete syntax reference for the C4 Structurizr DSL

### `c4://examples`
Collection of common C4 model patterns and templates

## Usage

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the MCP server:
   ```bash
   npm start
   ```

3. The server runs on stdio and can be used with any MCP-compatible client.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate PEG.js parser:
   ```bash
   npm run grammar
   ```

3. Build TypeScript:
   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

## DSL Support

This server supports the full C4 Structurizr DSL syntax including:

- **Elements**: person, softwareSystem, container, component
- **Relationships**: directional relationships with descriptions and technology
- **Views**: systemLandscape, systemContext, container, component
- **Properties**: names, descriptions, technologies, tags
- **Nesting**: containers within software systems, components within containers

## Example DSL

```structurizr
workspace "Example System" "An example software architecture" {
    model {
        user = person "User" "A user of the system"
        
        softwareSystem = softwareSystem "Software System" "My example system" {
            webapp = container "Web Application" "Main web app" "React"
            database = container "Database" "Data storage" "PostgreSQL"
            
            webapp -> database "Reads from and writes to" "SQL"
        }
        
        user -> softwareSystem "Uses"
    }
    
    views {
        systemContext softwareSystem {
            include *
            autoLayout
        }
        
        container softwareSystem {
            include *
            autoLayout
        }
    }
}
```