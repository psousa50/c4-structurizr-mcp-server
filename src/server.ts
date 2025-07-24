#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { validateDsl } from './tools/validate.js';
import { formatDsl } from './tools/format.js';
import { analyzeModel } from './tools/analyze.js';

const server = new Server(
  {
    name: 'c4-structurizr-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'validate-dsl',
        description: 'Validate C4 Structurizr DSL syntax and semantics',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The DSL content to validate',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'format-dsl',
        description: 'Format and prettify C4 Structurizr DSL code',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The DSL content to format',
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'analyze-model',
        description: 'Analyze C4 model structure and provide insights',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The DSL content to analyze',
            },
          },
          required: ['content'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'validate-dsl':
        return await validateDsl(args?.content as string);

      case 'format-dsl':
        return await formatDsl(args?.content as string);

      case 'analyze-model':
        return await analyzeModel(args?.content as string);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'c4://schema',
        name: 'C4 Structurizr DSL Schema',
        description: 'Complete syntax reference for the C4 Structurizr DSL',
        mimeType: 'text/markdown',
      },
      {
        uri: 'c4://examples',
        name: 'C4 Model Examples',
        description: 'Collection of common C4 model patterns and templates',
        mimeType: 'text/plain',
      },
    ],
  };
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'create-model',
        description: 'Interactive assistant for creating C4 architecture models',
        arguments: [
          {
            name: 'type',
            description: 'Type of model to create (simple, enterprise, microservices)',
            required: false,
          },
          {
            name: 'domain',
            description: 'Domain or system name for the model',
            required: false,
          },
        ],
      },
      {
        name: 'improve-architecture',
        description: 'Get suggestions for improving your C4 architecture model',
        arguments: [
          {
            name: 'current_model',
            description: 'Your current DSL model content',
            required: true,
          },
          {
            name: 'focus',
            description: 'Area to focus on (performance, scalability, security, maintainability)',
            required: false,
          },
        ],
      },
    ],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create-model':
      const modelType = args?.type || 'simple';
      const domain = args?.domain || 'My System';
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I want to create a ${modelType} C4 architecture model for "${domain}". Please help me create a comprehensive DSL model by asking me relevant questions about the system architecture, users, external systems, and internal components. Guide me through the process step by step.`,
            },
          },
        ],
      };

    case 'improve-architecture':
      const currentModel = args?.current_model;
      const focus = args?.focus || 'overall quality';
      
      if (!currentModel) {
        throw new Error('current_model argument is required for improve-architecture prompt');
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze my C4 architecture model and provide suggestions for improvement, focusing on ${focus}. Here's my current model:\n\n\`\`\`\n${currentModel}\n\`\`\`\n\nPlease provide specific, actionable recommendations to improve the architecture.`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Handle resource requests
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'c4://schema':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# C4 Structurizr DSL Schema

## Basic Structure
\`\`\`
workspace {
    model {
        // Elements and relationships
    }
    views {
        // View definitions
    }
}
\`\`\`

## Elements
- \`person <identifier> <name> [description] [tags]\`
- \`softwareSystem <identifier> <name> [description] [tags]\`
- \`container <identifier> <name> [description] [technology] [tags]\`
- \`component <identifier> <name> [description] [technology] [tags]\`

## Relationships
- \`<source> -> <destination> [description] [technology] [tags]\`

## Views
- \`systemLandscape [key] { ... }\`
- \`systemContext <softwareSystemIdentifier> [key] { ... }\`
- \`container <softwareSystemIdentifier> [key] { ... }\`
- \`component <containerIdentifier> [key] { ... }\``,
          },
        ],
      };

    case 'c4://examples':
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `workspace "Example System" "An example software architecture" {
    model {
        user = person "User" "A user of the system"
        
        softwareSystem = softwareSystem "Software System" "Description" {
            webapp = container "Web Application" "Description" "Technology"
            database = container "Database" "Description" "Technology"
            
            webapp -> database "Reads from and writes to"
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
}`,
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('C4 Structurizr MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});