# Scrum Templates for CodeQuest Project

## 1. Product Backlog Item / User Story Template

```markdown
# User Story: [Story ID]

## Story Title
[Brief, descriptive title of the functionality]

## User Story
As a [type of user],
I want [goal/desire],
So that [benefit/value].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Additional technical details, constraints, or considerations]

## Dependencies
[Links to other stories this depends on, if any]

## Estimation
Story Points: [Fibonacci number: 1, 2, 3, 5, 8, 13, etc.]

## Priority
[Must Have | Should Have | Could Have | Won't Have]
```

---

## 2. Sprint Planning Template

```markdown
# Sprint [Number] Planning

## Sprint Goal
[One-sentence description of what we aim to achieve this sprint]

## Sprint Duration
Start Date: [YYYY-MM-DD]
End Date: [YYYY-MM-DD]

## Team Capacity
Total available days: [X] days
Factoring in meetings/interruptions: [Y] days

## Sprint Backlog

| ID | User Story | Acceptance Criteria | Story Points | Assigned To | Notes |
|----|------------|---------------------|--------------|-------------|-------|
| US-01 | [Story title] | [Summarized] | [Points] | [Person] | [Notes] |
| US-02 | [Story title] | [Summarized] | [Points] | [Person] | [Notes] |

## Sprint Velocity
Planned Story Points: [Sum of all story points]
Previous Sprint Velocity: [Points completed in previous sprint]

## Risks & Mitigations
- Risk: [Description of potential risk]
  - Mitigation: [How we'll address this risk]

## Definition of "Done"
- Code is written and working locally
- Unit tests pass
- Code has been reviewed
- Feature is deployed to development environment
- Acceptance criteria are verified
```

---

## 3. Daily Scrum Template

```markdown
# Daily Scrum: [Date]

## Yesterday
- [Completed task 1]
- [Completed task 2]

## Today
- [Planned task 1]
- [Planned task 2]

## Blockers/Impediments
- [Blocker 1]
- [Blocker 2]

## Notes/Decisions
- [Any relevant notes or decisions]
```

---

## 4. Sprint Review Template

```markdown
# Sprint [Number] Review

## Sprint Goal
[The goal we set at the beginning]

## Completed Items
| ID | User Story | Acceptance Criteria | Status | Demo Notes |
|----|------------|---------------------|--------|------------|
| US-01 | [Story title] | [Summarized] | [Complete/Partial] | [Notes from demo] |
| US-02 | [Story title] | [Summarized] | [Complete/Partial] | [Notes from demo] |

## Sprint Metrics
- Planned Story Points: [X]
- Completed Story Points: [Y]
- Sprint Velocity: [Y/X]%

## Not Completed
| ID | User Story | Reason | Plan |
|----|------------|--------|------|
| US-03 | [Story title] | [Why it wasn't completed] | [Plan for this item] |

## Demo Feedback
[Notes from stakeholder feedback during demo]

## Action Items
- [Action 1]
- [Action 2]
```

---

## 5. Sprint Retrospective Template

```markdown
# Sprint [Number] Retrospective

## What Went Well
- [Positive aspect 1]
- [Positive aspect 2]

## What Could Be Improved
- [Challenge or issue 1]
- [Challenge or issue 2]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action description] | [Person] | [Date] |
| [Action description] | [Person] | [Date] |

## Experiments for Next Sprint
- [New approach or idea to try]
- [New approach or idea to try]

## Sprint Satisfaction
Scale 1-5: [Rating]
```

---

## 6. Technical Specification Template for Claude Code

```markdown
# Technical Specification: [Feature Name]

## Overview
[Brief description of the feature and its purpose]

## Requirements
[Clear statement of what the feature needs to do]

## User Interface
[Description of UI elements, with mockups if available]

## Data Models
[Details of any data structures or models needed]

## Function Specifications
- Function: [name]
  - Inputs: [parameters]
  - Processing: [what it does]
  - Outputs: [return values]
  - Error handling: [how errors are managed]

## API Endpoints (if applicable)
- Endpoint: [URL]
  - Method: [GET/POST/etc.]
  - Request format: [JSON structure]
  - Response format: [JSON structure]
  - Error responses: [Possible errors]

## Dependencies
[Libraries, APIs, or other components needed]

## Testing Criteria
[How this feature will be tested]

## Security Considerations
[Any security requirements or concerns]

## Performance Requirements
[Performance expectations or constraints]
```

---

## 7. Definition of Ready Checklist

```markdown
# Definition of Ready Checklist

## User Story: [ID and Title]

- [ ] User story is written from end-user perspective
- [ ] Acceptance criteria are clear and testable
- [ ] Story is estimated by the team
- [ ] Dependencies are identified
- [ ] Story is properly prioritized
- [ ] Technical approach is understood
- [ ] Performance criteria are defined (if applicable)
- [ ] Security requirements are understood (if applicable)
- [ ] Story can be completed in one sprint
```

---

## 8. Definition of Done Checklist

```markdown
# Definition of Done Checklist

## User Story: [ID and Title]

- [ ] All acceptance criteria met
- [ ] Code completed and checked in
- [ ] Code reviewed by another developer (or Claude)
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] No known defects
- [ ] Documentation updated
- [ ] Feature demonstrated and accepted
- [ ] Deployed to development environment
```

---

## 9. Impediment Log

```markdown
# Impediment Log

| ID | Description | Raised On | Owner | Status | Resolution | Resolved On |
|----|-------------|-----------|-------|--------|------------|-------------|
| IMP-01 | [Description] | [Date] | [Person] | [Open/Closed] | [How it was resolved] | [Date] |
```

---

## 10. Product Backlog Refinement Notes

```markdown
# Product Backlog Refinement: [Date]

## Stories Reviewed
| ID | User Story | Discussion Notes | Changes Made | New Estimate |
|----|------------|------------------|--------------|--------------|
| US-01 | [Story title] | [Key points discussed] | [What changed] | [Updated points] |

## New Stories Identified
| ID | User Story | Initial Estimate | Priority |
|----|------------|------------------|----------|
| US-XX | [Story title] | [Points] | [Priority] |

## Follow-up Items
- [Item requiring further investigation]
- [Item requiring further investigation]
```
