from core.prompts.core_prompt import CORE_SYSTEM_PROMPT
from core.agents.embodied_carbon_prompt import EMBODIED_CARBON_ANALYST_PROMPT

SUNA_CONFIG = {
    "name": "Carbon BIM",
    "description": "Carbon BIM is your AI assistant with access to various tools and integrations to help you with tasks across domains.",
    "model": "carbon-bim/basic",
    "system_prompt": CORE_SYSTEM_PROMPT,
    "configured_mcps": [],
    "custom_mcps": [],
    "agentpress_tools": {
        # Core file and shell operations
        "sb_shell_tool": True,
        "sb_files_tool": True,
        "sb_expose_tool": True,
        "sb_upload_file_tool": True,
        "sb_git_sync": True,
        
        # Search and research tools
        "web_search_tool": True,
        "image_search_tool": True,
        
        # AI vision and image tools
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        "sb_design_tool": True,
        
        # Document and content creation
        "sb_presentation_tool": True,
        "sb_kb_tool": True,

        # search tools (disabled - exa-py removed due to openai 2.x incompatibility)
        "people_search_tool": False,
        "company_search_tool": False,

        "browser_tool": True,
        
        # Agent builder tools
        "agent_config_tool": True,
        "agent_creation_tool": True,
        "mcp_search_tool": True,
        "credential_profile_tool": True,
        "trigger_tool": True
    },
    "is_default": True
}

# ---------------------------------------------------------------------------
# Embodied Carbon Analyst — specialist preset
# Installed alongside the default Carbon BIM agent for every new user.
# ---------------------------------------------------------------------------
EMBODIED_CARBON_ANALYST_CONFIG = {
    "name": "Embodied Carbon Analyst",
    "description": "Specialist agent for embodied carbon analysis of BIM/IFC models. Uses Thai TGO emission factors, EN 15978 lifecycle accounting (A1–D), and TREES green building certification benchmarks.",
    "model": "carbon-bim/basic",
    "system_prompt": EMBODIED_CARBON_ANALYST_PROMPT,
    "configured_mcps": [],
    "custom_mcps": [],
    "agentpress_tools": {
        # BIM-specific tools
        "bim_embodied_carbon_service_tool": True,
        "bim_carbon_tool": True,
        "bim_ifc_parser_tool": True,
        "bim_knowledge_graph_tool": True,
        # File access for IFC uploads
        "sb_files_tool": True,
        "sb_upload_file_tool": True,
        "sb_vision_tool": True,
        # Keep shell + presentation for report generation
        "sb_shell_tool": True,
        "sb_presentation_tool": True,
        # Optional: disable unrelated tools to keep the agent focused
        "web_search_tool": False,
        "browser_tool": False,
    },
    "is_default": False,
    "icon_name": "bar-chart-3",
    "icon_color": "#FFFFFF",
    "icon_background": "#059669",   # Emerald-600
    "metadata": {
        "is_embodied_carbon_analyst": True,
        "preset_version": "1.0",
        "tags": ["BIM", "embodied carbon", "TREES", "TGO", "EN15978", "sustainability"],
    },
}

# ---------------------------------------------------------------------------
# Cache Configuration
# Redis-based caching for expensive computations (carbon calculations, IFC parsing)
# ---------------------------------------------------------------------------
import os

CACHE_CONFIG = {
    "enabled": os.getenv("CACHE_ENABLED", "true").lower() == "true",
    "default_ttl": int(os.getenv("CACHE_DEFAULT_TTL", "3600")),  # 1 hour
    "carbon_ttl": int(os.getenv("CACHE_CARBON_TTL", "3600")),    # 1 hour
    "ifc_ttl": int(os.getenv("CACHE_IFC_TTL", "86400")),         # 24 hours
    "max_size_mb": int(os.getenv("CACHE_MAX_SIZE_MB", "1024")),  # 1GB
}

