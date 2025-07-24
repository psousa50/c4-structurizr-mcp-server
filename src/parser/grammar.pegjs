{
  function makeLocation(location) {
    return {
      line: location.start.line,
      column: location.start.column
    };
  }
}

start
  = workspace

workspace
  = "workspace" _ name:string? _ description:string? _ "{" _ directives:directive_list _ model:model _ views:views _ "}" _ {
    return {
      type: 'workspace',
      name: name || null,
      description: description || null,
      directives: directives || [],
      model,
      views,
      location: makeLocation(location())
    };
  }

directive_list
  = directives:(directive _)* {
    return directives.map(d => d[0]);
  }

directive
  = "!" directive_name:identifier _ directive_value:directive_value? _ {
    return {
      type: 'directive',
      name: directive_name,
      value: directive_value || null,
      location: makeLocation(location())
    };
  }

directive_value
  = identifier
  / string
  / [a-zA-Z0-9_-]+ { return text(); }

model
  = "model" _ "{" _ elements:element_list _ relationships:relationship_list _ "}" _ {
    return {
      type: 'model',
      elements,
      relationships,
      location: makeLocation(location())
    };
  }

element_list
  = elements:(element _)* {
    return elements.map(e => e[0]);
  }

element
  = person
  / software_system
  / container
  / component

person
  = id:identifier _ "=" _ "person" _ name:string _ description:string? _ tags:tag_spec? _ {
    return {
      type: 'person',
      id,
      name,
      description: description || null,
      tags: tags || [],
      location: makeLocation(location())
    };
  }

software_system
  = id:identifier _ "=" _ "softwareSystem" _ name:string _ description:string? _ tags:tag_spec? _ children:software_system_children? _ {
    return {
      type: 'softwareSystem',
      id,
      name,
      description: description || null,
      tags: tags || [],
      children: children || [],
      location: makeLocation(location())
    };
  }

software_system_children
  = "{" _ elements:element_list _ relationships:relationship_list _ "}" _ {
    return { elements, relationships };
  }

container
  = id:identifier _ "=" _ "container" _ name:string _ description:string? _ technology:string? _ tags:tag_spec? _ children:container_children? _ {
    return {
      type: 'container',
      id,
      name,
      description: description || null,
      technology: technology || null,
      tags: tags || [],
      children: children || [],
      location: makeLocation(location())
    };
  }

container_children
  = "{" _ elements:element_list _ relationships:relationship_list _ "}" _ {
    return { elements, relationships };
  }

component
  = id:identifier _ "=" _ "component" _ name:string _ description:string? _ technology:string? _ tags:tag_spec? _ {
    return {
      type: 'component',
      id,
      name,
      description: description || null,
      technology: technology || null,
      tags: tags || [],
      location: makeLocation(location())
    };
  }

relationship_list
  = relationships:(relationship _)* {
    return relationships.map(r => r[0]);
  }

relationship
  = source:identifier _ "->" _ destination:identifier _ description:string? _ technology:string? _ tags:tag_spec? _ {
    return {
      type: 'relationship',
      source,
      destination,
      description: description || null,
      technology: technology || null,
      tags: tags || [],
      location: makeLocation(location())
    };
  }

views
  = "views" _ "{" _ view_list:view_list _ styles:styles_block? _ themes:themes_directive? _ "}" _ {
    return {
      type: 'views',
      views: view_list,
      styles: styles || null,
      themes: themes || null,
      location: makeLocation(location())
    };
  }

view_list
  = views:(view _)* {
    return views.map(v => v[0]);
  }

view
  = system_landscape_view
  / system_context_view
  / container_view
  / component_view
  / dynamic_view
  / deployment_view

system_landscape_view
  = "systemLandscape" _ key:string? _ "{" _ properties:view_properties _ "}" _ {
    return {
      type: 'systemLandscape',
      key: key || null,
      ...properties,
      location: makeLocation(location())
    };
  }

system_context_view
  = "systemContext" _ systemId:identifier _ key:string? _ "{" _ properties:view_properties _ "}" _ {
    return {
      type: 'systemContext',
      softwareSystemId: systemId,
      key: key || null,
      ...properties,
      location: makeLocation(location())
    };
  }

container_view
  = "container" _ systemId:identifier _ key:string? _ "{" _ properties:view_properties _ "}" _ {
    return {
      type: 'container',
      softwareSystemId: systemId,
      key: key || null,
      ...properties,
      location: makeLocation(location())
    };
  }

component_view
  = "component" _ containerId:identifier _ key:string? _ "{" _ properties:view_properties _ "}" _ {
    return {
      type: 'component',
      containerId: containerId,
      key: key || null,
      ...properties,
      location: makeLocation(location())
    };
  }

dynamic_view
  = "dynamic" _ systemId:identifier _ key:string? _ title:string? _ "{" _ steps:dynamic_step_list _ properties:view_properties _ "}" _ {
    return {
      type: 'dynamic',
      softwareSystemId: systemId,
      key: key || null,
      title: title || null,
      steps,
      ...properties,
      location: makeLocation(location())
    };
  }

deployment_view
  = "deployment" _ systemId:identifier _ environment:string _ key:string? _ "{" _ properties:view_properties _ "}" _ {
    return {
      type: 'deployment',
      softwareSystemId: systemId,
      environment,
      key: key || null,
      ...properties,
      location: makeLocation(location())
    };
  }

dynamic_step_list
  = steps:(dynamic_step _)* {
    return steps.map(s => s[0]);
  }

dynamic_step
  = source:identifier _ "->" _ destination:identifier _ description:string _ {
    return {
      type: 'dynamicStep',
      source,
      destination,
      description,
      location: makeLocation(location())
    };
  }

view_properties
  = properties:(view_property _)* {
    const result = {
      include: [],
      exclude: [],
      autoLayout: null,
      title: null,
      description: null,
      animation: null
    };
    
    properties.forEach(([prop]) => {
      if (prop.type === 'include') {
        result.include = result.include.concat(prop.elements);
      } else if (prop.type === 'exclude') {
        result.exclude = result.exclude.concat(prop.elements);
      } else if (prop.type === 'autoLayout') {
        result.autoLayout = prop.direction || true;
      } else if (prop.type === 'title') {
        result.title = prop.value;
      } else if (prop.type === 'description') {
        result.description = prop.value;
      } else if (prop.type === 'animation') {
        result.animation = prop.elements;
      }
    });
    
    return result;
  }

view_property
  = include_property
  / exclude_property
  / auto_layout_property
  / title_property
  / description_property
  / animation_property

include_property
  = "include" _ elements:element_selector_list {
    return { type: 'include', elements };
  }

exclude_property
  = "exclude" _ elements:element_selector_list {
    return { type: 'exclude', elements };
  }

auto_layout_property
  = "autoLayout" _ direction:layout_direction? {
    return { type: 'autoLayout', direction: direction || null };
  }

title_property
  = "title" _ value:string {
    return { type: 'title', value };
  }

description_property
  = "description" _ value:string {
    return { type: 'description', value };
  }

animation_property
  = "animation" _ "{" _ elements:animation_element_list _ "}" {
    return { type: 'animation', elements };
  }

animation_element_list
  = elements:(element_selector _)* {
    return elements.map(e => e[0]);
  }

layout_direction
  = "lr" { return "lr"; }
  / "rl" { return "rl"; }
  / "tb" { return "tb"; }
  / "bt" { return "bt"; }

element_selector_list
  = first:element_selector _ rest:("," _ element_selector)* {
    return [first].concat(rest.map(r => r[2]));
  }

element_selector
  = "*" { return "*"; }
  / identifier

styles_block
  = "styles" _ "{" _ rules:style_rule_list _ "}" _ {
    return {
      type: 'styles',
      rules,
      location: makeLocation(location())
    };
  }

style_rule_list
  = rules:(style_rule _)* {
    return rules.map(r => r[0]);
  }

style_rule
  = "element" _ selector:string _ "{" _ properties:style_property_list _ "}" _ {
    return {
      type: 'elementStyle',
      selector,
      properties,
      location: makeLocation(location())
    };
  }
  / "relationship" _ selector:string _ "{" _ properties:style_property_list _ "}" _ {
    return {
      type: 'relationshipStyle',
      selector,
      properties,
      location: makeLocation(location())
    };
  }

style_property_list
  = properties:(style_property _)* {
    return properties.map(p => p[0]);
  }

style_property
  = name:identifier _ value:style_value {
    return {
      type: 'styleProperty',
      name,
      value,
      location: makeLocation(location())
    };
  }

style_value
  = color_value
  / string
  / identifier

color_value
  = "#" digits:[0-9a-fA-F]+ {
    return "#" + digits.join('');
  }

themes_directive
  = "themes" _ theme_name:identifier _ {
    return {
      type: 'themes',
      name: theme_name,
      location: makeLocation(location())
    };
  }

tag_spec
  = tag_array
  / tag_string

tag_array
  = "[" _ first:string _ rest:("," _ string)* _ "]" {
    return [first].concat(rest.map(r => r[2]));
  }

tag_string
  = tag:string {
    return [tag];
  }

identifier
  = [a-zA-Z_][a-zA-Z0-9_]* {
    return text();
  }

string
  = '"' chars:string_char* '"' {
    return chars.join('');
  }

string_char
  = !'"' char:. {
    return char;
  }

hash_comment
  = "#" [ \t] (![\r\n] .)*

line_comment
  = "//" (![\r\n] .)*

block_comment
  = "/*" (!"*/" .)* "*/"

comment
  = hash_comment
  / line_comment
  / block_comment

_ "whitespace"
  = ([ \t\r\n] / comment)*