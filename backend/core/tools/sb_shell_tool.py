import asyncio
from typing import Optional, Dict, Any
import time
from uuid import uuid4
from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.sandbox.tool_base import SandboxToolsBase
from core.agentpress.thread_manager import ThreadManager
from core.utils.tool_output_streaming import (
    stream_tool_output,
    get_tool_output_streaming_context,
    get_current_tool_call_id,
)
from core.utils.logger import logger


@tool_metadata(
    display_name="Bash",
    description="Execute bash commands in the workspace with optional timeout",
    icon="Terminal",
    color="bg-gray-100 dark:bg-gray-800/50",
    is_core=True,
    weight=20,
    visible=True,
    usage_guide="""
## Bash - Execute bash commands in the workspace

Executes bash commands in the workspace directory with real-time output streaming. Working directory persists between commands.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

### Before Executing Commands

1. **Directory Verification:**
   - If the command will create new directories or files, first use `ls` to verify the parent directory exists
   - Example: before running "mkdir foo/bar", first use `ls foo` to check that "foo" exists

2. **Command Execution:**
   - Always quote file paths that contain spaces with double quotes
   - Example: cd "/workspace/my folder" (correct) vs cd /workspace/my folder (incorrect)

### When to Use
- Installing packages (pip install, npm install, apt-get)
- Running build commands and scripts
- Git operations (status, diff, log, add, commit)
- Running tests or linters
- System administration tasks
- Any task requiring shell execution

### When NOT to Use
- DO NOT use cat/head/tail to read files - use read_file instead
- DO NOT use sed/awk to edit files - use edit_file or str_replace instead
- DO NOT use echo/heredoc to create files - use create_file instead
- DO NOT use find for file search - use Glob patterns instead
- DO NOT use grep for content search - use search_file instead

### Important Notes
- Commands timeout after 300 seconds (5 minutes) by default
- Output is truncated if it exceeds 50000 characters
- Working directory is /workspace by default
- Use ABSOLUTE paths in commands (e.g., /workspace/src/main.py)
- Always use non-interactive flags (-y, --yes, -f) to avoid prompts

### Multiple Commands
- If commands are independent and can run in parallel, make multiple tool calls
- If commands depend on each other, chain with && (e.g., `git add . && git commit -m "message"`)
- Use `;` only when you need to run commands sequentially but don't care if earlier commands fail
- Try to maintain your current working directory by using absolute paths and avoiding `cd`

### Long-Running Processes
For background processes (servers, watches), use tmux:
```bash
# Start background server
tmux new-session -d -s myserver 'npm run dev'

# Check on process
tmux capture-pane -t myserver -p

# Kill process
tmux kill-session -t myserver
```

### Git Operations
- NEVER use git commands with -i flag (interactive mode not supported)
- NEVER use --amend unless explicitly requested
- NEVER force push to main/master
- When committing, use HEREDOC for multiline messages

### Port 8080
Port 8080 is AUTO-EXPOSED and publicly accessible. Files served from /workspace are automatically available via preview URLs.
""",
)
class SandboxShellTool(SandboxToolsBase):
    """Tool for executing shell commands in a Daytona sandbox.
    Commands run synchronously with real-time output streaming.
    For long-running processes, use tmux directly in your commands."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "execute_command",
                "description": """Execute a bash command in the workspace directory with optional timeout.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

Before executing the command:
1. If the command creates new directories/files, first verify the parent directory exists using `ls`
2. Always quote file paths that contain spaces with double quotes

Usage notes:
- Commands timeout after 300 seconds by default (max 600 seconds / 10 minutes)
- Output is truncated if it exceeds 50000 characters
- For long-running processes, use tmux: `tmux new-session -d -s name 'command'`
- Chain dependent commands with && (e.g., `git add . && git commit -m "message"`)
- Avoid using cat, head, tail, sed, awk, echo, find, grep - use dedicated tools instead""",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "**REQUIRED** - The bash command to execute. Commands run synchronously and wait for completion.",
                        },
                        "description": {
                            "type": "string",
                            "description": "**OPTIONAL** - Clear, concise description of what this command does. For simple commands (git, npm), keep it brief (5-10 words). For complex commands (piped commands, obscure flags), add enough context to clarify what it does.",
                        },
                        "folder": {
                            "type": "string",
                            "description": "**OPTIONAL** - Relative path to a subdirectory of /workspace where the command should be executed. Example: 'src/data'",
                        },
                        "timeout": {
                            "type": "integer",
                            "description": "**OPTIONAL** - Timeout in seconds (max 600). Default: 300 (5 minutes). Increase for longer operations.",
                            "default": 300,
                        },
                    },
                    "required": ["command"],
                    "additionalProperties": False,
                },
            },
        }
    )
    async def execute_command(
        self,
        command: str,
        description: Optional[str] = None,
        folder: Optional[str] = None,
        timeout: int = 300,
    ) -> ToolResult:
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()

            # Set up working directory
            cwd = self.workspace_path
            if folder:
                folder = folder.strip("/")
                cwd = f"{self.workspace_path}/{folder}"

            # Use PTY for real-time streaming
            tool_output_ctx = get_tool_output_streaming_context()
            tool_call_id = get_current_tool_call_id() or f"cmd_{str(uuid4())[:8]}"
            logger.debug(f"[SHELL STREAMING] Using tool_call_id: {tool_call_id}")

            # Track output for streaming
            output_buffer = []
            exit_code = 0

            async def on_pty_data(data: bytes):
                try:
                    text = data.decode("utf-8", errors="replace")
                    output_buffer.append(text)

                    # Stream output to frontend if we have a tool output streaming context
                    if tool_output_ctx:
                        await stream_tool_output(
                            tool_call_id=tool_call_id,
                            output_chunk=text,
                            is_final=False,
                            tool_name="execute_command",
                        )
                except Exception as e:
                    logger.warning(f"Error processing PTY output: {e}")

            try:
                from e2b import PtySize
                from uuid import uuid4 as _uuid4

                pty_session_id = f"cmd-{str(_uuid4())[:8]}"

                # Create PTY session with output callback
                pty_handle = await self.sandbox.pty.create(
                    size=PtySize(cols=120, rows=40),
                    on_data=on_pty_data,
                    cwd=cwd,
                )

                # Add marker to detect completion
                marker = f"__CMD_DONE_{str(_uuid4())[:8]}__"

                # Check if command contains a heredoc - if so, we need the marker on a new line
                # Heredocs require the delimiter (EOF, etc.) to be on its own line
                # Common heredoc patterns: << EOF, << 'EOF', << "EOF", <<- EOF, <<-'EOF', etc.
                import re

                heredoc_pattern = r'<<-?\s*[\'"]?\w+[\'"]?\s*$'
                if re.search(heredoc_pattern, command, re.MULTILINE):
                    # Command has heredoc - put marker on a separate line
                    full_command = f"{command}\necho '{marker}' $?\n"
                else:
                    full_command = f"{command}; echo '{marker}' $?\n"

                # Send the command
                await self.sandbox.pty.send_stdin(pty_handle.pid, full_command.encode())

                # Wait for completion or timeout
                # Note: marker appears TWICE in output:
                # 1. When the terminal echoes the typed command
                # 2. When the echo command actually executes after completion
                # We need to wait for the SECOND occurrence
                start_time = time.time()
                while (time.time() - start_time) < timeout:
                    await asyncio.sleep(0.1)

                    # Check if marker appeared in output (need 2 occurrences)
                    current_output = "".join(output_buffer)
                    marker_count = current_output.count(marker)
                    if marker_count >= 2:
                        # Extract exit code from the LAST marker line (the actual output)
                        try:
                            marker_idx = current_output.rfind(marker)
                            after_marker = (
                                current_output[marker_idx + len(marker) :].strip().split()[0]
                            )
                            exit_code = int(after_marker) if after_marker.isdigit() else 0
                        except:
                            exit_code = 0
                        break
                else:
                    # Timeout reached
                    exit_code = -1

                # Kill PTY session
                try:
                    await self.sandbox.pty.kill(pty_handle.pid)
                except:
                    pass

                # Clean output (remove marker line and control sequences)
                final_output = "".join(output_buffer)

                # Remove the marker line from output
                if marker in final_output:
                    marker_idx = final_output.rfind(marker)
                    # Find the start of the line containing the marker
                    line_start = final_output.rfind("\n", 0, marker_idx)
                    if line_start != -1:
                        final_output = final_output[:line_start]

                # Strip ANSI escape sequences for cleaner output
                import re

                ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
                final_output = ansi_escape.sub("", final_output)

                # Stream final message
                if tool_output_ctx:
                    await stream_tool_output(
                        tool_call_id=tool_call_id,
                        output_chunk="",
                        is_final=True,
                        tool_name="execute_command",
                    )

                if exit_code == -1:
                    return self.success_response(
                        {
                            "output": final_output.strip(),
                            "cwd": cwd,
                            "exit_code": exit_code,
                            "timeout": True,
                            "message": f"Command timed out after {timeout} seconds. For long-running processes, use tmux: `tmux new-session -d -s name 'command'`",
                        }
                    )

                return self.success_response(
                    {"output": final_output.strip(), "cwd": cwd, "exit_code": exit_code}
                )

            except Exception as pty_error:
                logger.warning(
                    f"PTY execution failed, falling back to direct execution: {pty_error}"
                )
                # Fall back to direct execution
                return await self._fallback_execute(command, cwd, timeout)

        except Exception as e:
            return self.fail_response(f"Error executing command: {str(e)}")

    async def _fallback_execute(self, command: str, cwd: str, timeout: int) -> ToolResult:
        """Fallback execution method using E2B commands.run."""
        try:
            wrapped = f"cd {cwd} && {command}"
            result = await self.sandbox.commands.run(
                f"bash -lc {__import__('shlex').quote(wrapped)}",
                timeout=timeout,
            )
            return self.success_response(
                {
                    "output": result.stdout or "",
                    "cwd": cwd,
                    "exit_code": result.exit_code,
                }
            )
        except Exception as e:
            return self.fail_response(f"Error executing command: {str(e)}")

    async def _execute_raw_command(self, command: str, retry_count: int = 0) -> Dict[str, Any]:
        """Execute a raw command directly in the sandbox."""
        try:
            await self._ensure_sandbox()
            result = await self.sandbox.commands.run(command, timeout=30)
            return {
                "output": result.stdout or "",
                "exit_code": result.exit_code,
            }
        except Exception as e:
            raise

    async def cleanup(self):
        """Clean up resources."""
        pass
