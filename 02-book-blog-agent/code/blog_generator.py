"""
Blog Generator Module
Uses OpenAI API to generate blog posts matching your example style.
"""

import os
from pathlib import Path
from datetime import datetime
from openai import OpenAI

from config import OPENAI_API_KEY, EXAMPLES_DIR, OUTPUT_DIR
from book_finder import Book


def load_examples() -> str:
    """
    Load all example blog posts from the examples directory.
    """
    examples_path = Path(EXAMPLES_DIR)
    examples = []

    if not examples_path.exists():
        return ""

    for file in examples_path.glob("*.md"):
        content = file.read_text(encoding="utf-8")
        examples.append(f"=== Example: {file.name} ===\n{content}")

    return "\n\n".join(examples)


def generate_blog_post(book: Book, custom_instructions: str = "") -> str:
    """
    Generate a blog post about a book using OpenAI, matching the style of examples.
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set. Copy .env.example to .env and add your key.")

    client = OpenAI(api_key=OPENAI_API_KEY)

    examples = load_examples()

    system_prompt = """You are an expert blog writer specializing in book reviews and summaries for marketing, copywriting, and business books.

Follow this EXACT structure and formatting:

# [Engaging Question Title]

**A book review of "[Book Title]" by [Author]**

[INTRO - 4-5 paragraphs that hook the reader. Paint a vivid picture of the problem. Use short, punchy sentences and fragments. Build tension. Make the reader feel the pain before introducing the solution. This section should be substantial and engaging.]

## About the Author

[3-4 sentences about the author's background, credentials, and what they're known for.]

## What the Book Covers

[One sentence introducing what the book does, then 4 principles as bullet points:]

• **[Principle Name]:** [One sentence explanation]

• **[Principle Name]:** [One sentence explanation]

• **[Principle Name]:** [One sentence explanation]

• **[Principle Name]:** [One sentence explanation]

## Three Big Lessons

[Use checkmarks, NOT numbers. Each lesson on its own line:]

✅ **[Lesson as a statement.]** [1-2 sentence explanation on same line.]

✅ **[Lesson as a statement.]** [1-2 sentence explanation on same line.]

✅ **[Lesson as a statement.]** [1-2 sentence explanation on same line.]

## Why Read It?

[4-5 paragraphs explaining who this book is for and why it matters. Describe the transformation the reader will experience. Address different types of readers who would benefit. End with a strong, compelling call to action that makes the reader want to pick up this book immediately.]

CRITICAL FORMATTING RULES:
- Use bullet points (•) for book principles, NOT numbered lists
- NEVER use em-dashes (—) or en-dashes (–) ANYWHERE in the text
- Use periods to separate thoughts, never dashes
- Use colons after bold principle names
- Lessons use ✅ checkmarks, NOT numbers
- Use a conversational, direct tone"""

    user_prompt = f"""Write a blog post about this book:

BOOK DETAILS:
- Title: {book.title}
- Author: {book.author}
- Description: {book.description}
{f'- Year: {book.year}' if book.year else ''}

{f'ADDITIONAL INSTRUCTIONS: {custom_instructions}' if custom_instructions else ''}

EXAMPLE BLOG POSTS TO MATCH:
{examples if examples else 'No examples provided yet. Write a professional book review/summary blog post.'}

Now write the blog post for "{book.title}". Output ONLY the blog post content in Markdown format,
starting with the title as an H1 heading."""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=4000,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

    content = response.choices[0].message.content

    # Post-process: Clean up formatting
    import re

    # Remove any em-dashes or en-dashes that slipped through
    content = content.replace("—", ".")  # em-dash to period
    content = content.replace("–", ".")  # en-dash to period
    content = content.replace(" .", ".")  # fix " ." from replacement
    content = content.replace("..", ".")  # fix double periods

    # Clean up double spaces
    content = content.replace("  ", " ")

    return content


def save_blog_post(content: str, book: Book) -> Path:
    """
    Save the generated blog post to the output directory.
    """
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)

    # Create filename from book title
    safe_title = "".join(c if c.isalnum() or c in " -" else "" for c in book.title)
    safe_title = safe_title.replace(" ", "-").lower()[:50]

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}-{safe_title}.md"

    filepath = output_path / filename
    filepath.write_text(content, encoding="utf-8")

    return filepath


# Example usage
if __name__ == "__main__":
    from book_finder import create_manual_book

    # Test with a manual book
    book = create_manual_book(
        "Made to Stick",
        "Chip Heath, Dan Heath",
        "Why some ideas survive and others die. The Heath brothers reveal the anatomy of sticky ideas."
    )

    print(f"Generating blog post for: {book.title}")
    print("(This requires OPENAI_API_KEY to be set)")

    try:
        content = generate_blog_post(book)
        filepath = save_blog_post(content, book)
        print(f"Saved to: {filepath}")
    except ValueError as e:
        print(f"Error: {e}")
