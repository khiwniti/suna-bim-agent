"""
Step 9: Carbon BIM Admin API Key
"""

from setup.steps.base import BaseStep, StepResult
from setup.utils.secrets import generate_admin_api_key


class CarbonBIMStep(BaseStep):
    """Auto-generate Carbon BIM admin API key."""

    name = "carbon-bim"
    display_name = "Carbon BIM Admin API Key"
    order = 9
    required = True
    depends_on = ["requirements"]

    def run(self) -> StepResult:
        # Always generate a new key (overwrite existing if any)
        self.info("Generating a secure admin API key for Carbon BIM administrative functions...")

        self.config.carbon_bim.CARBON_BIM_ADMIN_API_KEY = generate_admin_api_key()

        self.success("Carbon BIM admin API key generated.")
        self.success("Carbon BIM admin configuration saved.")

        return StepResult.ok(
            "Carbon BIM admin key generated",
            {"carbon-bim": self.config.carbon_bim.model_dump()},
        )

    def get_config_keys(self):
        return ["CARBON_BIM_ADMIN_API_KEY"]

    def is_complete(self) -> bool:
        return bool(self.config.carbon_bim.CARBON_BIM_ADMIN_API_KEY)
