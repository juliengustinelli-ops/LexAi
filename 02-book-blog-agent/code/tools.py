"""
Tool implementations for the Book Blog Agent.
These functions are called by the Claude agent when using tools.
"""

import json
import requests
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Optional

from config import EXAMPLES_DIR, OUTPUT_DIR
from substack_publisher import publish_to_substack as _publish_to_substack, SUBSTACK_URL


WRITTEN_BOOKS_FILE = "books_written.txt"
BOOKS_TO_REVIEW_FILE = "books_to_review.txt"


@dataclass
class Book:
    title: str
    author: str
    description: str
    year: Optional[str] = None
    isbn: Optional[str] = None
    cover_url: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


def search_books(query: str, max_results: int = 5) -> list[dict]:
    """
    Search for books using Google Books API.
    Returns a list of book dictionaries with title, author, description, etc.
    """
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {
        "q": f"{query} subject:business",
        "maxResults": max_results,
        "orderBy": "relevance",
        "printType": "books",
        "langRestrict": "en"
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        books = []
        for item in data.get("items", []):
            info = item.get("volumeInfo", {})

            isbn = None
            for identifier in info.get("industryIdentifiers", []):
                if identifier.get("type") == "ISBN_13":
                    isbn = identifier.get("identifier")
                    break

            book = {
                "title": info.get("title", "Unknown"),
                "author": ", ".join(info.get("authors", ["Unknown"])),
                "description": info.get("description", "No description available."),
                "year": info.get("publishedDate", "")[:4] if info.get("publishedDate") else None,
                "isbn": isbn,
                "cover_url": info.get("imageLinks", {}).get("thumbnail")
            }
            books.append(book)

        return books
    except Exception as e:
        return [{"error": f"Error fetching from Google Books: {str(e)}"}]


def get_curated_books() -> list[dict]:
    """
    Load books from the curated 'books_to_review.txt' list.
    Returns books that haven't been written about yet.
    """
    filepath = Path(BOOKS_TO_REVIEW_FILE)
    if not filepath.exists():
        return [{"error": "No curated book list found. Create books_to_review.txt"}]

    written = _load_written_books_set()
    books = []

    for line in filepath.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2:
            title, author = parts[0], parts[1]
            description = parts[2] if len(parts) > 2 else ""

            if title.lower() in written:
                continue

            books.append({
                "title": title,
                "author": author,
                "description": description or f"A book about marketing and copywriting by {author}."
            })

    return books


def get_written_books() -> list[str]:
    """
    Get the list of books that have already been written about.
    """
    return list(_load_written_books_set())


def _load_written_books_set() -> set[str]:
    """Internal helper to load written books as a set."""
    filepath = Path(WRITTEN_BOOKS_FILE)
    if not filepath.exists():
        return set()

    written = set()
    for line in filepath.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            written.add(line.lower())
    return written


def load_style_examples() -> str:
    """
    Load all example blog posts from the examples directory.
    These help the agent match your writing style.
    """
    examples_path = Path(EXAMPLES_DIR)
    examples = []

    if not examples_path.exists():
        return "No example blog posts found in the examples/ folder. Posts will use a default style."

    for file in examples_path.glob("*.md"):
        content = file.read_text(encoding="utf-8")
        examples.append(f"=== Example: {file.name} ===\n{content}")

    if not examples:
        return "No example blog posts found in the examples/ folder. Posts will use a default style."

    return "\n\n".join(examples)


def save_blog_post(title: str, content: str) -> str:
    """
    Save a generated blog post to the output directory.
    Returns the path where the file was saved.
    """
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(exist_ok=True)

    safe_title = "".join(c if c.isalnum() or c in " -" else "" for c in title)
    safe_title = safe_title.replace(" ", "-").lower()[:50]

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}-{safe_title}.md"

    filepath = output_path / filename
    filepath.write_text(content, encoding="utf-8")

    return str(filepath)


def mark_book_complete(title: str) -> str:
    """
    Mark a book as written so it won't be suggested again.
    """
    filepath = Path(WRITTEN_BOOKS_FILE)
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(f"{title}\n")
    return f"Marked '{title}' as complete. It won't be suggested again."


def publish_to_substack(title: str, content: str, subtitle: str = "") -> dict:
    """
    Publish a blog post to Substack as a draft.
    Uses the existing Chrome browser session for authentication.

    Args:
        title: The post title
        content: The post content in Markdown format
        subtitle: Optional subtitle for the post

    Returns:
        dict with status and message
    """
    return _publish_to_substack(
        title=title,
        content=content,
        subtitle=subtitle,
        substack_url=SUBSTACK_URL,
        headless=False  # Show browser so user can see what's happening
    )
