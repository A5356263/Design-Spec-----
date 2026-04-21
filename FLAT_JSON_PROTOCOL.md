# Flat JSON Protocol

## Root Shape

Output must be a JSON object with this shape:

```json
{
  "root": "string-node-id",
  "elements": {
    "node-id": {
      "type": "Card",
      "props": {},
      "children": ["child-node-id"]
    }
  }
}
```

## Required Fields

- `root`: the entry node id of the page tree
- `elements`: a flat node map keyed by node id
- `type`: component type from `config/ANT_LITE_CATALOG.json`
- `props`: props object, only allowed keys for that type
- `children`: ordered child node ids

## Hard Rules

- Every `children` reference must exist in `elements`
- A node cannot reference itself
- `children` cannot contain duplicate ids
- Do not add custom top-level fields
- Do not add custom node fields outside `type`, `props`, `children`

## Stage Rules

- `stage_1_skeleton`: only output layout skeleton and module containers
- `stage_2_components`: add component nodes without filling rich content data
- `stage_3_content`: fill content props without changing approved structure
