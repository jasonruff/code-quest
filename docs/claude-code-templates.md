# Claude Code Communication Templates

## 1. New Feature Implementation Request

```markdown
# Feature Implementation Request

## Feature Name
[Name of the feature to be implemented]

## User Story Reference
[Link or ID of the user story this implements]

## Feature Requirements
[Clear, detailed description of what this feature needs to do]

## Technical Specification
[Link to or include the technical specification]

## Dependencies
- Project dependencies: [List any project dependencies]
- Environment requirements: [Any specific environment needs]
- External APIs: [Any external services needed]

## File Structure
[Description of where the code should be located and file organization]

## Implementation Guidelines
- Follow the project's coding standards
- Implement appropriate error handling
- Include comments for complex logic
- Consider performance implications

## Testing Approach
[How the feature should be tested]

## Acceptance Criteria
[Criteria that must be met for this to be considered complete]

## Security Considerations
[Any security requirements or potential concerns]

## Additional Context
[Any other information that might be helpful]
```

---

## 2. Bug Fix Request

```markdown
# Bug Fix Request

## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser/Device: [Details]
- Operating System: [Details]
- Version: [Details]

## Related Code
[Link to or snippet of relevant code if available]

## Possible Causes
[Any insights into what might be causing the issue]

## Fix Requirements
[Specific requirements for the fix]

## Testing Instructions
[How to test that the bug is fixed]

## Additional Context
[Any other relevant information]
```

---

## 3. Code Review Request

```markdown
# Code Review Request

## Code Location
[Link to or description of where the code is located]

## Purpose
[What this code does and why it was created/modified]

## Implementation Details
[Key aspects of how the code is implemented]

## Areas of Concern
[Any specific areas you want Claude Code to focus on]

## Review Checklist
- [ ] Code follows project standards
- [ ] Logic is correct
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security considerations addressed
- [ ] Tests are comprehensive

## Questions
[Any specific questions you have about the code]

## Additional Context
[Any other relevant information]
```

---

## 4. Architecture Design Request

```markdown
# Architecture Design Request

## Feature Overview
[High-level description of the feature requiring architecture]

## Requirements
[Functional and non-functional requirements]

## Technical Constraints
[Any technical limitations or requirements]

## Current Architecture
[Description of relevant parts of existing architecture]

## Design Questions
- [Specific question about architecture]
- [Specific question about architecture]

## Considerations to Address
- Scalability
- Maintainability
- Performance
- Security
- Testability

## Preferred Technologies
[Any technology preferences or requirements]

## Timeline
[When this architecture is needed]

## Additional Context
[Any other relevant information]
```

---

## 5. Refactoring Request

```markdown
# Refactoring Request

## Code to Refactor
[Link to or description of the code that needs refactoring]

## Current Issues
[Problems with the current implementation]

## Refactoring Goals
- [Goal 1]
- [Goal 2]

## Constraints
- Must maintain current functionality
- [Any other constraints]

## Testing Requirements
[How to verify the refactoring doesn't break functionality]

## Performance Expectations
[Any performance requirements for the refactored code]

## Additional Context
[Any other relevant information]
```

---

## 6. API Integration Request

```markdown
# API Integration Request

## API Overview
[Description of the API to integrate]

## API Documentation
[Link to or summary of API documentation]

## Integration Requirements
- Endpoints needed: [List of endpoints]
- Authentication method: [Details]
- Error handling requirements: [Details]

## Data Mapping
[How API data maps to application data]

## Sample Requests/Responses
[Examples of API calls and responses]

## Rate Limiting Considerations
[Any rate limiting to be aware of]

## Error Scenarios to Handle
- [Error scenario 1]
- [Error scenario 2]

## Testing Approach
[How to test the integration]

## Additional Context
[Any other relevant information]
```

---

## 7. Performance Optimization Request

```markdown
# Performance Optimization Request

## Performance Issue
[Description of the performance problem]

## Performance Metrics
- Current: [Measurement of current performance]
- Target: [Desired performance]

## Problem Area
[Specific code or functionality with performance issues]

## Profiling Results
[Any profiling data available]

## Optimization Constraints
- Must maintain functionality
- [Any other constraints]

## Areas to Consider
- Algorithm efficiency
- Resource usage
- Caching opportunities
- Query optimization

## Testing Approach
[How to verify performance improvements]

## Additional Context
[Any other relevant information]
```

---

## 8. Component Implementation Request

```markdown
# Component Implementation Request

## Component Name
[Name of the component]

## Component Purpose
[What this component does]

## Interface Requirements
```typescript
// Define expected props, methods, events, etc.
interface ComponentProps {
  // Properties
}
```

## Visual Design
[Link to designs or description of visual appearance]

## Behavior Specifications
- [Behavior 1]
- [Behavior 2]

## State Management
[How the component should manage state]

## Accessibility Requirements
[Any accessibility considerations]

## Reusability Considerations
[How the component might be reused]

## Testing Requirements
[How to test the component]

## Additional Context
[Any other relevant information]
```

---

## 9. Database Schema Request

```markdown
# Database Schema Request

## Data Requirements
[Description of data to be stored]

## Entities
- Entity 1:
  - Attributes: [List of fields and types]
  - Relationships: [How it relates to other entities]
- Entity 2:
  - Attributes: [List of fields and types]
  - Relationships: [How it relates to other entities]

## Constraints
- Primary keys: [Details]
- Foreign keys: [Details]
- Unique constraints: [Details]

## Indexing Requirements
[Fields that should be indexed]

## Query Patterns
[Common queries the schema needs to support]

## Migration Considerations
[If modifying existing schema]

## Additional Context
[Any other relevant information]
```

---

## 10. Code Documentation Request

```markdown
# Code Documentation Request

## Code to Document
[Link to or description of code that needs documentation]

## Documentation Type
- [ ] JSDoc/TSDoc comments
- [ ] README
- [ ] API documentation
- [ ] Tutorial
- [ ] Other: [Specify]

## Target Audience
[Who will read this documentation]

## Key Areas to Cover
- [Area 1]
- [Area 2]

## Examples to Include
[Specific examples that should be included]

## Related Documentation
[Links to existing related documentation]

## Additional Context
[Any other relevant information]
```
