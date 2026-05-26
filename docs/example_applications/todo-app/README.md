> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Taskflow

Taskflow is a lightweight task management application for individuals and small teams. It provides a clean, focused interface for organizing work into lists with priorities, due dates, and tags.

## Features

- **Task Lists** -- Group related tasks into named lists
- **Priority Levels** -- Four priority levels: Low, Medium, High, Critical
- **Due Date Tracking** -- Set deadlines with automatic overdue highlighting
- **Tagging System** -- Apply multiple tags to tasks for flexible filtering
- **REST API** -- Full CRUD API for integrating with other tools
- **Webhook Support** -- Get notified when tasks are created, updated, or completed

## Architecture

Taskflow is built on the Retold stack:

- **Fable** for dependency injection and configuration
- **Meadow** for data persistence (SQLite by default)
- **Orator** for the REST API server
- **Pict** for the browser UI

## Getting Started

See the [Quick Start](quick-start.md) guide to get up and running in minutes.
