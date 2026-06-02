# Diagrams

Docuserve supports [Mermaid](https://mermaid.js.org/) diagrams out of the box. Any fenced code block with the language `mermaid` is automatically rendered as an interactive diagram.

## Flowcharts

Flowcharts describe processes and decision trees.

<!-- bespoke diagram: edit diagrams/flowcharts.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Flowcharts](diagrams/flowcharts.svg)

**Source:**

````
<!-- bespoke diagram: edit diagrams/flowcharts-2.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Flowcharts](diagrams/flowcharts-2.svg)
````

### Horizontal flowchart

Use `graph LR` for left-to-right layouts.

<!-- bespoke diagram: edit diagrams/horizontal-flowchart.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Horizontal flowchart](diagrams/horizontal-flowchart.svg)

**Source:**

````
<!-- bespoke diagram: edit diagrams/horizontal-flowchart-2.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Horizontal flowchart](diagrams/horizontal-flowchart-2.svg)
````

## Sequence Diagrams

Sequence diagrams show interactions between participants over time.

<!-- bespoke diagram: edit diagrams/sequence-diagrams.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Sequence Diagrams](diagrams/sequence-diagrams.svg)

**Source:**

````
<!-- bespoke diagram: edit diagrams/sequence-diagrams-2.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Sequence Diagrams](diagrams/sequence-diagrams-2.svg)
````

## Class Diagrams

Class diagrams describe object-oriented structures and relationships.

```mermaid
classDiagram
    class Fable {
        +settings
        +log
        +addServiceType(name, class)
        +instantiateServiceProvider(name)
    }
    class ServiceProviderBase {
        +fable
        +options
        +serviceType
        +initialize()
    }
    class Meadow {
        +schema
        +query
        +doRead()
        +doReads()
        +doCreate()
        +doUpdate()
        +doDelete()
    }
    class Orator {
        +server
        +startService()
        +use(middleware)
    }
    class Pict {
        +views
        +providers
        +render()
    }

    Fable <|-- ServiceProviderBase
    ServiceProviderBase <|-- Meadow
    ServiceProviderBase <|-- Orator
    ServiceProviderBase <|-- Pict
```

**Source:**

````
```mermaid
classDiagram
    class Fable {
        +settings
        +log
        +addServiceType(name, class)
        +instantiateServiceProvider(name)
    }
    class ServiceProviderBase {
        +fable
        +options
        +serviceType
        +initialize()
    }
    class Meadow {
        +schema
        +query
        +doRead()
        +doReads()
        +doCreate()
        +doUpdate()
        +doDelete()
    }
    class Orator {
        +server
        +startService()
        +use(middleware)
    }
    class Pict {
        +views
        +providers
        +render()
    }

    Fable <|-- ServiceProviderBase
    ServiceProviderBase <|-- Meadow
    ServiceProviderBase <|-- Orator
    ServiceProviderBase <|-- Pict
```
````

## State Diagrams

State diagrams model the lifecycle of an entity.

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> InProgress : Start work
    InProgress --> Review : Submit for review
    Review --> InProgress : Request changes
    Review --> Approved : Approve
    Approved --> Deployed : Deploy
    Deployed --> [*]
    InProgress --> Blocked : Dependency issue
    Blocked --> InProgress : Resolved
```

**Source:**

````
```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> InProgress : Start work
    InProgress --> Review : Submit for review
    Review --> InProgress : Request changes
    Review --> Approved : Approve
    Approved --> Deployed : Deploy
    Deployed --> [*]
    InProgress --> Blocked : Dependency issue
    Blocked --> InProgress : Resolved
```
````

## Entity Relationship Diagrams

ER diagrams show database tables and their relationships.

<!-- bespoke diagram: edit diagrams/entity-relationship-diagrams.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Entity Relationship Diagrams](diagrams/entity-relationship-diagrams.svg)

**Source:**

````
<!-- bespoke diagram: edit diagrams/entity-relationship-diagrams-2.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Entity Relationship Diagrams](diagrams/entity-relationship-diagrams-2.svg)
````

## Gantt Charts

Gantt charts show project timelines and task dependencies.

```mermaid
gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Core
        Fable v5           :done, f5, 2025-01-01, 30d
        Meadow v3           :active, m3, after f5, 45d
    section Server
        Orator v2           :o2, after m3, 30d
        Orator Endpoints    :oe, after o2, 20d
    section Frontend
        Pict v3             :p3, after f5, 60d
        Pict Forms          :pf, after p3, 30d
    section Tooling
        Docuserve v1        :ds, after p3, 20d
        Indoctrinate v2     :ind, after ds, 15d
```

**Source:**

````
```mermaid
gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Core
        Fable v5           :done, f5, 2025-01-01, 30d
        Meadow v3           :active, m3, after f5, 45d
    section Server
        Orator v2           :o2, after m3, 30d
        Orator Endpoints    :oe, after o2, 20d
    section Frontend
        Pict v3             :p3, after f5, 60d
        Pict Forms          :pf, after p3, 30d
    section Tooling
        Docuserve v1        :ds, after p3, 20d
        Indoctrinate v2     :ind, after ds, 15d
```
````

## Pie Charts

Pie charts show proportional data.

```mermaid
pie title Module Distribution
    "Pict" : 15
    "Meadow" : 13
    "Orator" : 6
    "Fable" : 6
    "Utility" : 10
```

**Source:**

````
```mermaid
pie title Module Distribution
    "Pict" : 15
    "Meadow" : 13
    "Orator" : 6
    "Fable" : 6
    "Utility" : 10
```
````

## Git Graph

Git graphs visualize branch history and merge strategies.

```mermaid
gitGraph
    commit id: "initial"
    branch feature
    checkout feature
    commit id: "add feature"
    commit id: "tests"
    checkout main
    commit id: "hotfix"
    merge feature id: "merge feature"
    commit id: "release"
```

**Source:**

````
```mermaid
gitGraph
    commit id: "initial"
    branch feature
    checkout feature
    commit id: "add feature"
    commit id: "tests"
    checkout main
    commit id: "hotfix"
    merge feature id: "merge feature"
    commit id: "release"
```
````

## Tips

- Mermaid is loaded from CDN. An internet connection is required for diagrams to render.
- If Mermaid is unavailable, the raw diagram source is displayed as a code block.
- Mermaid supports many more diagram types. See the [Mermaid documentation](https://mermaid.js.org/intro/) for the full reference.
- Keep diagrams focused. Complex diagrams with dozens of nodes become hard to read. Split them into smaller diagrams if needed.
