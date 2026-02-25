"""
Book Finder Module
Discovers marketing/copywriting books from various sources or accepts manual input.
"""

import requests
from bs4 import BeautifulSoup
from dataclasses import dataclass
from typing import Optional
from pathlib import Path


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


def load_written_books() -> set[str]:
    """Load the list of books already written about."""
    filepath = Path(WRITTEN_BOOKS_FILE)
    if not filepath.exists():
        return set()

    written = set()
    for line in filepath.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            written.add(line.lower())
    return written


def save_written_book(title: str):
    """Add a book to the written list."""
    filepath = Path(WRITTEN_BOOKS_FILE)
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(f"{title}\n")


def load_curated_books(fetch_covers: bool = True) -> list[Book]:
    """Load books from the curated 'to review' list."""
    filepath = Path(BOOKS_TO_REVIEW_FILE)
    if not filepath.exists():
        return []

    written = load_written_books()
    books = []

    for line in filepath.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2:
            title, author = parts[0], parts[1]
            description = parts[2] if len(parts) > 2 else ""

            # Skip if already written
            if title.lower() in written:
                continue

            # Fetch cover URL if requested
            cover_url = None
            if fetch_covers:
                cover_url = get_book_cover_url(title, author)

            books.append(Book(
                title=title,
                author=author,
                description=description or f"A book about marketing and copywriting by {author}.",
                cover_url=cover_url
            ))

    return books


def find_books_google(query: str, max_results: int = 5) -> list[Book]:
    """
    Find books using Google Books API (free, no key required for basic usage).
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

            # Get ISBN if available
            isbn = None
            for identifier in info.get("industryIdentifiers", []):
                if identifier.get("type") == "ISBN_13":
                    isbn = identifier.get("identifier")
                    break

            book = Book(
                title=info.get("title", "Unknown"),
                author=", ".join(info.get("authors", ["Unknown"])),
                description=info.get("description", "No description available."),
                year=info.get("publishedDate", "")[:4] if info.get("publishedDate") else None,
                isbn=isbn,
                cover_url=info.get("imageLinks", {}).get("thumbnail")
            )
            books.append(book)

        return books
    except Exception as e:
        print(f"Error fetching from Google Books: {e}")
        return []


def get_book_cover_from_openlibrary(title: str, author: str = "") -> Optional[str]:
    """
    Try to get a high-resolution book cover from Open Library.
    Returns Large size cover URL if available.
    """
    try:
        # Search Open Library for the book using separate title/author params
        search_url = "https://openlibrary.org/search.json"

        # Clean up title - remove subtitles for better matching
        clean_title = title.split(":")[0].split("(")[0].strip()

        # Build params - use title and author separately for better results
        params = {"title": clean_title, "limit": 5}
        if author:
            # Get last name for author search
            author_parts = author.split()
            if author_parts:
                params["author"] = author_parts[-1]

        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("docs"):
            # Try each result until we find one with a cover
            for doc in data["docs"]:
                cover_id = doc.get("cover_i")
                if cover_id:
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
                    # Verify the cover exists by downloading a small portion
                    try:
                        # Open Library doesn't return Content-Length, so we need to check differently
                        response = requests.get(cover_url, timeout=10, stream=True)
                        if response.status_code == 200:
                            # Read first chunk to verify it's a real image
                            chunk = next(response.iter_content(chunk_size=1024), None)
                            if chunk and len(chunk) > 100:
                                print(f"Found Open Library cover (ID: {cover_id})")
                                return cover_url
                    except:
                        continue

            # Try ISBN as fallback from first result with ISBNs
            for doc in data["docs"]:
                isbns = doc.get("isbn", [])
                for isbn in isbns[:3]:  # Try first 3 ISBNs
                    cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
                    try:
                        response = requests.get(cover_url, timeout=10, stream=True)
                        if response.status_code == 200:
                            chunk = next(response.iter_content(chunk_size=1024), None)
                            if chunk and len(chunk) > 100:
                                print(f"Found Open Library cover (ISBN: {isbn})")
                                return cover_url
                    except:
                        continue

        return None
    except Exception as e:
        print(f"Open Library error: {e}")
        return None


def get_book_cover_url(title: str, author: str = "") -> Optional[str]:
    """
    Fetch a high-quality book cover URL.
    Tries Open Library first (better quality front covers), then Google Books.
    """
    print(f"Searching for cover: {title} by {author}")

    # Try Open Library first (better quality, actual front covers)
    cover_url = get_book_cover_from_openlibrary(title, author)
    if cover_url:
        return cover_url

    print("Open Library failed, trying Google Books...")

    # Fall back to Google Books - try multiple results to find best cover
    url = "https://www.googleapis.com/books/v1/volumes"
    query = f'intitle:"{title}"'
    if author:
        query += f' inauthor:"{author}"'

    params = {
        "q": query,
        "maxResults": 5,  # Get multiple results
        "printType": "books"
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Try each result to find one with a good cover
        for item in data.get("items", []):
            info = item.get("volumeInfo", {})
            image_links = info.get("imageLinks", {})

            # Try to get higher resolution images first
            for size in ["extraLarge", "large", "medium", "small", "thumbnail"]:
                if size in image_links:
                    cover_url = image_links[size]
                    cover_url = cover_url.replace("http://", "https://")
                    cover_url = cover_url.replace("&edge=curl", "")

                    # Request higher zoom level for better resolution
                    if "zoom=1" in cover_url:
                        cover_url = cover_url.replace("zoom=1", "zoom=3")
                    elif "zoom=" not in cover_url:
                        cover_url = cover_url + "&zoom=3"

                    # Verify image exists and is substantial
                    try:
                        head = requests.head(cover_url, timeout=5, allow_redirects=True)
                        content_length = int(head.headers.get('content-length', 0))
                        if head.status_code == 200 and content_length > 10000:
                            print(f"Found Google Books cover ({size}, {content_length} bytes)")
                            return cover_url
                    except:
                        continue

        # Last resort: return first available thumbnail
        if data.get("items"):
            info = data["items"][0].get("volumeInfo", {})
            thumb = info.get("imageLinks", {}).get("thumbnail")
            if thumb:
                thumb = thumb.replace("http://", "https://")
                thumb = thumb.replace("zoom=1", "zoom=3")
                return thumb

        return None
    except Exception as e:
        print(f"Error fetching book cover: {e}")
        return None


def create_manual_book(title: str, author: str, description: str = "") -> Book:
    """
    Create a book entry manually when you have a specific book in mind.
    Automatically fetches cover URL from Google Books.
    """
    cover_url = get_book_cover_url(title, author)
    return Book(
        title=title,
        author=author,
        description=description or f"A book about marketing and copywriting by {author}.",
        cover_url=cover_url
    )


def search_marketing_books(categories: list[str], max_per_category: int = 3, exclude_written: bool = True) -> list[Book]:
    """
    Search for books across multiple marketing-related categories.
    Optionally excludes books already written about.
    """
    all_books = []
    seen_titles = set()
    written_books = load_written_books() if exclude_written else set()

    for category in categories:
        books = find_books_google(category, max_per_category)
        for book in books:
            title_lower = book.title.lower()
            # Avoid duplicates and already-written books
            if title_lower not in seen_titles:
                # Check if any written book title is contained in this title (or vice versa)
                already_written = any(
                    written in title_lower or title_lower in written
                    for written in written_books
                )
                if not already_written:
                    seen_titles.add(title_lower)
                    all_books.append(book)

    return all_books


# Example usage
if __name__ == "__main__":
    # Auto-discover books
    print("=== Auto-discovered books ===")
    books = search_marketing_books(["copywriting books", "marketing strategy"])
    for book in books[:3]:
        print(f"- {book.title} by {book.author}")

    # Manual book
    print("\n=== Manual book ===")
    manual = create_manual_book(
        "Influence: The Psychology of Persuasion",
        "Robert Cialdini",
        "The classic book on the psychology of why people say yes."
    )
    print(f"- {manual.title} by {manual.author}")
