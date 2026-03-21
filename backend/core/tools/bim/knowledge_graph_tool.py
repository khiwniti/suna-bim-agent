"""Knowledge graph tool stub — GraphDB integration (future)."""

from core.sandbox.tool_base import SandboxToolsBase
from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata


@tool_metadata(
    display_name="Knowledge Graph",
    description="Query BIM knowledge graph (coming soon)",
    icon="Network",
    color="bg-indigo-100 dark:bg-indigo-800/50",
    weight=80,
    visible=False,
)
class KnowledgeGraphTool(SandboxToolsBase):
    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "query_knowledge_graph",
                "description": "Query the BIM knowledge graph using SPARQL or natural language (GraphDB integration — not yet configured).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "**REQUIRED** SPARQL query or natural language question",
                        },
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                },
            },
        }
    )
    async def query_knowledge_graph(self, query: str) -> ToolResult:
        return self.fail_response(
            "Knowledge graph integration not yet configured. "
            "Please set up a GraphDB connection and configure GRAPHDB_URL in environment variables."
        )
