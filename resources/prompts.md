# Vibe Coding Prompts

## 1. App Idea Refinement

```
**APP IDEA**: [INSERT APP IDEA]

Help me refine this app idea for a 2-day development project:

**Constraints**:
- Must be completable in 2 days
- Tech stack: React + Flask + PostgreSQL


Please help me:
1. Refine the problem statement to be more specific
2. Identify 3-5 core features that are essential
3. Suggest user personas and use cases
4. Recommend technical approach
5. Identify potential challenges and solutions

Focus on making this realistic and achievable within the time constraint.
keep it short and simple
```

## 2. PRD Generation

```
# 🚀 Enhanced PRD Generation Prompt

**APP IDEA:** [INSERT YOUR APP IDEA HERE]

Generate a **comprehensive Product Requirements Document (PRD)** for a web application that can be built and deployed in **2 days with AI assistance**.

## Core Constraints & Success Criteria

### Timeline & Scope
- **Development Duration:** 2 days maximum with AI coding assistance
- **Feature Limit:** 3-5 essential features only (no nice-to-haves)
- **Complexity Level:** Each feature should be implementable in 2-3 hours
- **Quality Bar:** Production-ready, not MVP/prototype

### Required Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Flask + SQLAlchemy + Flask-CORS + JWT authentication
- **Database:** PostgreSQL
- **Hosting:** Dockerized for deployment flexibility

### Key Success Metrics
- All core user journeys must work end-to-end
- Clean, responsive UI that works on desktop and mobile
- Secure authentication and data handling
- Deployable with environment variables and proper error handling

---

## Required PRD Structure

### 1. Executive Summary
- **Problem Statement:** What pain point does this solve? (1-2 sentences)
- **Solution Overview:** How does your app solve it uniquely? (2-3 sentences)
- **Target Users:** Primary user personas (be specific)
- **Success Definition:** What does "working" look like for users?

### 2. Feature Specifications
For each of the 3-5 core features:

**Feature Name**
- **User Story:** "As a [user], I want [goal] so that [benefit]"
- **Acceptance Criteria:** Specific, testable requirements
- **Technical Complexity:** Rate 1-3 (aim for mostly 1-2s for 2-3 hour implementation)
- **Implementation Notes:** Key technical decisions or constraints

### 3. User Experience Design

#### User Personas (2-3 maximum)
- Demographics, goals, pain points, tech comfort level

#### Critical User Flows
- **Primary Flow:** Most important user journey (step-by-step)
- **Secondary Flows:** 2-3 additional key workflows
- **Error/Edge Cases:** What happens when things go wrong?

#### UI/UX Requirements
- **Design System:** Color palette (5-6 colors), typography (2-3 fonts), component style
- **Navigation Pattern:** How users move through the app
- **Responsive Breakpoints:** Mobile-first considerations
- **Accessibility:** Key considerations for usability

### 4. Technical Architecture

#### System Overview
- **Architecture Pattern:** (e.g., REST API + SPA, server-side rendering, etc.)
- **Data Flow:** How information moves through your system
- **External Dependencies:** Any third-party services or APIs

#### Database Design
- **Entity Schemas:** All tables with fields, types, constraints
- **Relationships:** Foreign keys and associations between entities  
- **ER Diagram:** Visual representation of database structure (if helpful)

#### API Specification
| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/api/endpoint` | POST | Description | `{field: type}` | `{field: type}` |

#### Security & Authentication
- Authentication method (JWT, sessions, etc.)
- Authorization levels and permissions
- Data validation and sanitization approach

### 5. Implementation Roadmap

#### Phase 1: Foundation (1-2 hours)
- [ ] Project setup and repository structure
- [ ] Development environment configuration
- [ ] Database schema creation and migrations
- [ ] Basic Flask app with CORS and middleware
- [ ] React app with routing and basic layout

#### Phase 2: Backend Core (2-3 hours)
- [ ] Authentication system (registration, login, logout)
- [ ] User model and database operations
- [ ] Core API endpoints for main features
- [ ] Data validation and error handling
- [ ] API documentation (Swagger/OpenAPI)

#### Phase 3: Frontend Development (3-4 hours)
- [ ] Authentication UI (login/signup forms)
- [ ] Main application pages and components
- [ ] State management setup (Context API or Zustand)
- [ ] API integration and error handling
- [ ] Responsive styling with Tailwind

#### Phase 4: Integration & Polish (1-2 hours)
- [ ] End-to-end testing of all user flows
- [ ] Bug fixes and error handling improvements
- [ ] Performance optimization
- [ ] Final UI polish and accessibility check

#### Phase 5: Deployment (1 hour)
- [ ] Environment variable configuration
- [ ] Production build optimization
- [ ] Docker containerization setup
- [ ] Database deployment and migrations
- [ ] Final testing in production environment

### 6. Risk Mitigation & Contingencies

#### High-Risk Elements
- Identify the 2-3 most technically challenging parts
- Provide simpler fallback approaches for each
- Timeline buffers for complex features

#### Scope Reduction Strategy
- **Must-Have:** Features required for basic functionality
- **Should-Have:** Features that can be cut if needed
- **Could-Have:** Features to add only if time permits

---

## Output Requirements

### Format & Structure
- Use proper Markdown formatting with clear hierarchy
- Include tables for structured information
- Use checkboxes for actionable items

### Level of Detail
- Detailed enough for a developer to start coding immediately

### Completeness Check
Before finalizing, ensure the PRD answers:
- ✅ What exactly are we building?
- ✅ Who is it for and why do they need it?
- ✅ How will it work technically?
- ✅ What does the development process look like?
- ✅ How will we know when it's done?

---

**Final Note:** The resulting PRD should be comprehensive enough that a skilled developer with AI assistance could build and deploy the entire application in 10 hours maximum by following the document step-by-step.
```

## 3. Landing Page Generation

```
**PRD**: [INSERT PRD CONTENT]

Generate a modern, responsive landing page for this React + TypeScript + Vite application:

**Requirements**:
- Base URL (/) should be the landing page
- Include hero section with app value proposition
- Add "Get Started" and "Sign In" buttons/forms
- Use green and white brand colors
- Make it mobile-responsive
- Keep it simple but professional

**Structure**:
- Hero section with headline, subtext, and CTA buttons
- Features section highlighting 3-5 core features
- Simple sign-in form (no backend integration needed)
- Simple sign-up form (no backend integration needed)
- Footer with basic info

**Technical Requirements**:
- Use React + TypeScript + Vite
- CSS Modules for styling
- Responsive design
- Clean, modern UI following the brand guidelines
- Forms should have basic validation (client-side only)

Generate the landing page components and routing setup.
```



## 5. Bug Fixing Template

```
**APP IDEA**: [INSERT APP IDEA]

I have a bug in my code. Please help me fix it:

**Problem**: [Describe the bug/issue]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What is happening instead]

**Code Location**: [File path and line numbers]

**Error Message**: [If any error messages]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Environment**:
- Frontend: React + TypeScript + Vite
- Backend: Flask + SQLAlchemy
- Database: PostgreSQL

Please:
1. Identify the root cause
2. Provide a fix
3. Explain why this fix works
4. Suggest how to prevent this in the future

Keep the solution simple and easy to understand.
```

