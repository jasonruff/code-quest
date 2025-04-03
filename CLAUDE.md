# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- Run project: `npm run dev`
- Lint code: `npm run lint`
- Run tests: `npm test`
- Run single test: `npm test -- -t "test name"`

## Code Style Guidelines
- **JavaScript ES6+**: Use modern JS features (let/const, arrow functions, destructuring)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Formatting**: 2-space indentation, 80-character line limit
- **Error Handling**: Use try/catch with specific error messages
- **Comments**: JSDoc style for functions with @param and @returns
- **File Structure**: One class per file, organized by feature
- **Variable Declaration**: Always use const unless reassignment is needed
- **String Literals**: Use backticks for template strings
- **Imports**: Group and organize by type (core, external, internal)
- **Logging**: Use console.error for errors, console.log for debugging

## HTML/CSS Guidelines
- Use semantic HTML5 elements
- Mobile-first responsive design
- BEM methodology for CSS class naming