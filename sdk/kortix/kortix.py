from .api import agents, threads
from .agent import CarbonBIMAgent
from .thread import CarbonBIMThread
from .tools import AgentPressTools, MCPTools


class CarbonBIM:
    def __init__(self, api_key: str, api_url="https://api.kortix.com/v1"):
        self._agents_client = agents.create_agents_client(api_url, api_key)
        self._threads_client = threads.create_threads_client(api_url, api_key)

        self.Agent = CarbonBIMAgent(self._agents_client)
        self.Thread = CarbonBIMThread(self._threads_client)
