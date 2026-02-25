#!/usr/bin/env python3
"""
Book Blog Agent - Interactive Chat Interface

Usage:
    python chat.py

Commands:
    /quit, /exit - Exit the chat
    /reset       - Reset conversation history
    /help        - Show help message

Example prompts:
    "What books haven't I written about yet?"
    "Write a blog post about Influence by Cialdini"
    "Search for books about persuasion"
    "Show me my curated book list"
"""

from agent import BookBlogAgent


HELP_MESSAGE = """
Book Blog Agent - Help
=======================

This is a conversational AI assistant that helps you write blog posts
about marketing, copywriting, and business books.

Example commands:
  - "What books are on my list?"
  - "What have I already written about?"
  - "Write a blog post about [book title]"
  - "Search for books about [topic]"
  - "What should I write about next?"

Commands:
  /quit, /exit - Exit the chat
  /reset       - Reset conversation history
  /help        - Show this help message
"""


def main():
    print("\n" + "=" * 50)
    print("  Book Blog Agent")
    print("  Type /help for commands, /quit to exit")
    print("=" * 50 + "\n")

    try:
        agent = BookBlogAgent()
    except ValueError as e:
        print(f"Error: {e}")
        print("\nMake sure you have set ANTHROPIC_API_KEY in your .env file.")
        return

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ["/quit", "/exit", "quit", "exit"]:
            print("\nGoodbye!")
            break

        if user_input.lower() == "/reset":
            agent.reset_conversation()
            print("\nConversation reset.\n")
            continue

        if user_input.lower() == "/help":
            print(HELP_MESSAGE)
            continue

        print("\nAgent: ", end="", flush=True)

        try:
            response = agent.chat(user_input)
            print(response)
            print()
        except Exception as e:
            print(f"\nError: {e}\n")


if __name__ == "__main__":
    main()
