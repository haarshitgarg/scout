# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scout is an AI agent system designed for automated testing and issue resolution based on previous test results and historical data. The project aims to create a multi-agent architecture that can:

- Automatically test code changes and create JIRA tickets
- Build code and deploy to test environments
- Perform automated testing with DoIP (Diagnostics over Internet Protocol) messages via Ethernet
- Analyze logs against rules/requirements/test cases
- Store and vectorize execution results for future reference
- Provide intelligent failure analysis by comparing against historical data

## Architecture

The system follows a multi-agent architecture with a central controlling agent managing job-based execution:

- **Agent 1 (Developer PC)**: Handles build/create/merge requests and job scheduling
- **Agent 2 (GitHub Integration)**: Monitors CI completion and triggers relevant agents
- **Agent 3 (Business Logic)**: Manages test sequence decisions, log analysis, and notifications

## Data Storage Strategy

- **Vectorized Database**: Stores execution reports for similarity matching
- **SQL Database**: Maintains historical JIRA tickets and metadata
- **File Database**: Preserves detailed execution logs

## Development Status

POC implementation completed with web-based frontend and backend server. Ready for demonstration to management.

## Common Development Commands

**Backend Server:**
- `npm run dev` - Start development server with hot reload (port 3001)
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

**Frontend (React):**
- `cd client && npm start` - Start React development server (port 3000)
- `cd client && npm run build` - Build for production

**Full Development Setup:**
1. Terminal 1: `npm run dev` (backend)
2. Terminal 2: `cd client && npm start` (frontend)
3. Open http://localhost:3000 for the web interface

## Current POC Features

- **Web Interface**: Material-UI based React frontend with TypeScript
- **Real-time Updates**: WebSocket connection for live test execution progress
- **Mock DoIP Simulator**: Simulates ECU communication with realistic responses
- **Test Sequence Builder**: Form-based interface for creating DoIP message sequences
- **Failure Analysis**: Mock similar failure detection with suggested solutions
- **Execution History**: Persistent storage of test results with detailed logs

## Key Concepts

- **DoIP Testing**: The system specializes in DoIP message testing over Ethernet
- **Sequence Intelligence**: Agents can determine optimal test sequences (e.g., sending "22 D0 5B" messages to ECU1 until receiving "22 D0 00")
- **Historical Analysis**: Failure patterns are analyzed against vectorized historical data to provide contextual solutions
- **Automated Workflow**: End-to-end automation from code changes to test results and documentation
