#!/usr/bin/env python3
"""
Book Blog Agent
Generates monthly blog posts about marketing and copywriting books.

Usage:
    python main.py                    # Auto-discover and generate
    python main.py --manual           # Enter book details manually
    python main.py --list             # List discovered books without generating
    python main.py --publish          # Generate and publish to Substack as draft
    python main.py --manual --publish # Manual entry + publish to Substack
"""

import argparse
from pathlib import Path

from config import BOOK_CATEGORIES, MAX_BOOKS_PER_RUN, SUBSTACK_URL
from book_finder import search_marketing_books, create_manual_book, save_written_book, load_curated_books, Book
from blog_generator import generate_blog_post, save_blog_post, load_examples
from substack_publisher import publish_to_substack


def extract_title_and_subtitle(content: str) -> tuple[str, str, str]:
    """
    Extract title and subtitle from generated markdown content.
    Returns (title, subtitle, body_content).
    """
    lines = content.split('\n')
    title = ""
    subtitle = ""
    content_start = 0

    # Extract title from first H1
    for i, line in enumerate(lines):
        if line.startswith('# '):
            title = line[2:].strip()
            content_start = i + 1
            break

    # Check if next non-empty line is a subtitle (bold text like **A book review of...**)
    for i in range(content_start, min(content_start + 3, len(lines))):
        line = lines[i].strip()
        if line.startswith('**') and line.endswith('**'):
            subtitle = line[2:-2].strip()  # Remove ** markers
            content_start = i + 1
            break
        elif line and not line.startswith('**'):
            break

    body = '\n'.join(lines[content_start:]).strip()
    return title, subtitle, body


def check_examples():
    """Check if example blog posts exist."""
    examples = load_examples()
    if not examples:
        print("\n[!] No example blog posts found in 'examples/' folder.")
        print("   Add your example .md files there so the AI can match your style.")
        print("   The agent will still work, but posts won't match your format.\n")
        return False
    return True


def run_auto_discover(dry_run: bool = False, publish: bool = False):
    """Discover books automatically and generate blog posts."""
    # First try curated list
    print("Checking curated book list...")
    books = load_curated_books()

    if books:
        print(f"\nFound {len(books)} books in your curated list:\n")
        for i, book in enumerate(books[:10], 1):
            print(f"  {i}. {book.title} by {book.author}")
    else:
        # Fall back to auto-discovery
        print("Curated list empty. Searching online...")
        books = search_marketing_books(BOOK_CATEGORIES, max_per_category=3)

        if not books:
            print("No books found. Add books to books_to_review.txt or use --manual mode.")
            return

        print(f"\nFound {len(books)} books online:\n")
        for i, book in enumerate(books[:10], 1):
            print(f"  {i}. {book.title} by {book.author}")

    if dry_run:
        print("\n(Dry run - no blog posts generated)")
        return

    check_examples()

    # Generate posts for top books
    print(f"\nGenerating {MAX_BOOKS_PER_RUN} blog post(s)...\n")

    for book in books[:MAX_BOOKS_PER_RUN]:
        print(f"Generating post for: {book.title}...")
        try:
            content = generate_blog_post(book)
            filepath = save_blog_post(content, book)
            save_written_book(book.title)  # Track so we don't write about it again
            print(f"[OK] Saved: {filepath}\n")

            if publish:
                print(f"Publishing to Substack...")
                post_title, post_subtitle, post_body = extract_title_and_subtitle(content)
                result = publish_to_substack(
                    title=post_title or book.title,
                    subtitle=post_subtitle,
                    content=post_body,
                    substack_url=SUBSTACK_URL,
                    cover_image_url=book.cover_url or ""
                )
                if result["status"] == "success":
                    print(f"[OK] {result['message']}\n")
                else:
                    print(f"[ERROR] {result['message']}\n")
        except Exception as e:
            print(f"[ERROR] {e}\n")


def run_manual(publish: bool = False):
    """Manually enter book details and generate a blog post."""
    check_examples()

    print("\nEnter book details:\n")

    title = input("Book title: ").strip()
    if not title:
        print("Title is required.")
        return

    author = input("Author: ").strip()
    if not author:
        print("Author is required.")
        return

    description = input("Brief description (optional): ").strip()

    custom_instructions = input("Any special instructions for the blog post? (optional): ").strip()

    book = create_manual_book(title, author, description)

    print(f"\nGenerating blog post for: {book.title}...")

    try:
        content = generate_blog_post(book, custom_instructions)
        filepath = save_blog_post(content, book)
        save_written_book(book.title)  # Track so we don't write about it again
        print(f"\n[OK] Blog post saved to: {filepath}")

        if publish:
            print(f"\nPublishing to Substack...")
            post_title, post_subtitle, post_body = extract_title_and_subtitle(content)
            result = publish_to_substack(
                title=post_title or book.title,
                subtitle=post_subtitle,
                content=post_body,
                substack_url=SUBSTACK_URL,
                cover_image_url=book.cover_url or ""
            )
            if result["status"] == "success":
                print(f"[OK] {result['message']}")
            else:
                print(f"[ERROR] {result['message']}")
    except Exception as e:
        print(f"\n[ERROR] {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate blog posts about marketing and copywriting books."
    )
    parser.add_argument(
        "--manual", "-m",
        action="store_true",
        help="Manually enter book details instead of auto-discovering"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List discovered books without generating posts"
    )
    parser.add_argument(
        "--publish", "-p",
        action="store_true",
        help="Publish generated posts to Substack as drafts"
    )

    args = parser.parse_args()

    print("\nBook Blog Agent\n" + "=" * 40)

    if args.manual:
        run_manual(publish=args.publish)
    else:
        run_auto_discover(dry_run=args.list, publish=args.publish)


if __name__ == "__main__":
    main()
