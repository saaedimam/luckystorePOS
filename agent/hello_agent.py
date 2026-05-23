import os
import asyncio
from dotenv import load_dotenv
from google.antigravity import Agent, LocalAgentConfig

load_dotenv(".env.local")

async def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment. Set it in .env or export it before running.")

    config = LocalAgentConfig(api_key=api_key)
    async with Agent(config=config) as agent:
        response = await agent.chat("Hello, world! I am an Antigravity agent.")
        print(await response.text())

if __name__ == "__main__":
    asyncio.run(main())
