"""
Book Blog Agent - OpenAI-powered conversational agent with tools.

This agent can:
- Search for books via Google Books API
- Load books from a curated list
- Check which books have already been written about
- Generate blog posts in your style
- Save posts and track completed books
"""

import json
from openai import OpenAI

from config import OPENAI_API_KEY
from tools import (
    search_books,
    get_curated_books,
    get_written_books,
    load_style_examples,
    save_blog_post,
    mark_book_complete,
    publish_to_substack,
)


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_books",
            "description": "Search for marketing, copywriting, and business books using Google Books API. Use this when the user asks about finding books on a specific topic or when they want to discover new books.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for finding books (e.g., 'copywriting', 'marketing psychology', 'persuasion')"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_curated_books",
            "description": "Load the curated list of books from books_to_review.txt. These are pre-selected books the user wants to write about. Returns only books that haven't been written about yet.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_written_books",
            "description": "Get the list of books that have already been written about. Use this to check what's been done or to avoid duplicates.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "load_style_examples",
            "description": "Load example blog posts from the examples/ folder. Use this before writing a blog post to understand and match the user's writing style. Always call this before generating content.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_blog_post",
            "description": "Save a generated blog post to a markdown file in the output/ folder. Call this after generating the blog post content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The book title (used for the filename)"
                    },
                    "content": {
                        "type": "string",
                        "description": "The full blog post content in Markdown format"
                    }
                },
                "required": ["title", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mark_book_complete",
            "description": "Mark a book as written/complete so it won't be suggested again. Call this after successfully saving a blog post.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The exact title of the book to mark as complete"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "publish_to_substack",
            "description": "Publish a blog post to Substack as a draft. This opens a browser window using your existing Chrome session, navigates to Substack's editor, enters the content, and saves it as a draft. Use this after generating a blog post to publish it directly to Substack.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The post title"
                    },
                    "content": {
                        "type": "string",
                        "description": "The full blog post content in Markdown format"
                    },
                    "subtitle": {
                        "type": "string",
                        "description": "Optional subtitle for the post"
                    }
                },
                "required": ["title", "content"]
            }
        }
    }
]


SYSTEM_PROMPT = """You are a helpful book blog writing assistant. You help users write blog posts about marketing, copywriting, and business books.

Your capabilities:
1. Search for books using the Google Books API
2. Access a curated list of books the user wants to write about
3. Check which books have already been written about
4. Load example blog posts to match the user's writing style
5. Generate blog posts and save them to files
6. Track which books are complete
7. Publish blog posts directly to Substack as drafts

When writing a blog post:
1. ALWAYS load the style examples first using load_style_examples
2. Study the examples carefully to match the user's exact style, tone, and format
3. Generate the blog post content yourself - you ARE the writer
4. Save the post using save_blog_post
5. Mark the book complete using mark_book_complete
6. If the user wants to publish to Substack, use publish_to_substack to create a draft

Writing guidelines:
- Match the structure and format of the example posts exactly
- Include actionable takeaways and key insights
- Write in an engaging, helpful tone
- Use Markdown formatting
- Start with an H1 title

When users ask what books are available:
- First check the curated list with get_curated_books
- You can also search for more books with search_books

Be conversational and helpful. Ask clarifying questions when needed."""


class BookBlogAgent:
    """
    A conversational OpenAI agent for generating book blog posts.
    """

    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY not set. Copy .env.example to .env and add your key."
            )

        self.client = OpenAI(api_key=OPENAI_API_KEY)
        self.conversation_history = []
        self.tools = TOOL_DEFINITIONS
        self.system_prompt = SYSTEM_PROMPT

    def _execute_tool(self, tool_name: str, tool_input: dict) -> str:
        """Execute a tool and return the result as a string."""
        try:
            if tool_name == "search_books":
                result = search_books(
                    query=tool_input["query"],
                    max_results=tool_input.get("max_results", 5)
                )
            elif tool_name == "get_curated_books":
                result = get_curated_books()
            elif tool_name == "get_written_books":
                result = get_written_books()
            elif tool_name == "load_style_examples":
                result = load_style_examples()
            elif tool_name == "save_blog_post":
                result = save_blog_post(
                    title=tool_input["title"],
                    content=tool_input["content"]
                )
            elif tool_name == "mark_book_complete":
                result = mark_book_complete(title=tool_input["title"])
            elif tool_name == "publish_to_substack":
                result = publish_to_substack(
                    title=tool_input["title"],
                    content=tool_input["content"],
                    subtitle=tool_input.get("subtitle", "")
                )
            else:
                result = f"Unknown tool: {tool_name}"

            if isinstance(result, (list, dict)):
                return json.dumps(result, indent=2)
            return str(result)

        except Exception as e:
            return f"Error executing {tool_name}: {str(e)}"

    def chat(self, user_message: str) -> str:
        """
        Process a user message and return the agent's response.
        Handles tool calls in a loop until the agent produces a final response.
        """
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        messages = [{"role": "system", "content": self.system_prompt}] + self.conversation_history

        while True:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                max_tokens=8096,
                messages=messages,
                tools=self.tools,
            )

            choice = response.choices[0]
            message = choice.message

            if choice.finish_reason == "tool_calls" and message.tool_calls:
                # Add assistant message with tool calls to history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": message.content,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in message.tool_calls
                    ]
                })

                # Execute each tool and add results
                for tool_call in message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_input = json.loads(tool_call.function.arguments)
                    tool_result = self._execute_tool(tool_name, tool_input)

                    self.conversation_history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result
                    })

                # Rebuild messages for next iteration
                messages = [{"role": "system", "content": self.system_prompt}] + self.conversation_history

            else:
                # Final response
                final_response = message.content or ""
                self.conversation_history.append({
                    "role": "assistant",
                    "content": final_response
                })
                return final_response

    def reset_conversation(self):
        """Clear the conversation history to start fresh."""
        self.conversation_history = []
