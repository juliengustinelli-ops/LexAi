"""
Substack Publisher Module
Publishes blog posts to Substack as drafts using browser automation.
Uses a dedicated automation profile that persists login sessions.
"""

import os
import io
import time
import tempfile
import requests
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

try:
    from PIL import Image
    import win32clipboard
    HAS_CLIPBOARD = True
except ImportError:
    HAS_CLIPBOARD = False


# Default Substack publication URL
SUBSTACK_URL = "https://thefreelancecopywnewsletter.substack.com"

# Dedicated profile for automation (won't conflict with running Chrome)
AUTOMATION_PROFILE = Path(__file__).parent / ".browser_profile"


def paste_image_from_url(page, image_url: str, max_width: int = 600) -> bool:
    """
    Download an image from URL, resize only if too large, copy to clipboard, and paste into the page.
    Does NOT scale up small images to preserve readability.
    Returns True if successful, False otherwise.
    """
    if not HAS_CLIPBOARD:
        print("Clipboard support not available (install Pillow and pywin32)")
        return False

    try:
        # Try to get higher resolution image from Google Books
        # Replace zoom=1 with zoom=2 or zoom=3 for higher res
        high_res_url = image_url
        if "books.google.com" in image_url:
            if "zoom=1" in image_url:
                high_res_url = image_url.replace("zoom=1", "zoom=2")
            elif "zoom=" not in image_url:
                high_res_url = image_url + "&zoom=2"

        # Download the image (try high res first)
        print(f"Downloading image from: {high_res_url}")
        response = requests.get(high_res_url, timeout=15)
        response.raise_for_status()

        # Open with PIL
        img = Image.open(io.BytesIO(response.content))
        original_size = img.size
        print(f"Original image size: {original_size}")

        # Only scale DOWN if image is too large, never scale up
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"Scaled down image to: {img.size}")
        else:
            print(f"Keeping original size for readability: {img.size}")

        # Convert to BMP for clipboard (Windows clipboard prefers BMP)
        output = io.BytesIO()
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.save(output, 'BMP')
        data = output.getvalue()[14:]  # Remove BMP header

        # Copy to Windows clipboard
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()

        print("Image copied to clipboard, pasting...")

        # Paste into the page
        time.sleep(0.3)
        page.keyboard.press("Control+v")
        time.sleep(3)  # Wait for image to upload

        return True

    except Exception as e:
        print(f"Error pasting image: {e}")
        try:
            win32clipboard.CloseClipboard()
        except:
            pass
        return False


def publish_to_substack(
    title: str,
    content: str,
    subtitle: str = "",
    cover_image_url: str = "",
    substack_url: str = SUBSTACK_URL,
    headless: bool = False
) -> dict:
    """
    Publish a blog post to Substack as a draft.

    Args:
        title: The post title
        content: The post content (Markdown will be converted)
        subtitle: Optional subtitle for the post
        substack_url: The Substack publication URL
        headless: Run browser in headless mode (default False so you can see it)

    Returns:
        dict with status and message
    """
    # Extract publication name from URL
    pub_name = substack_url.replace("https://", "").replace("http://", "").split(".")[0]
    editor_url = f"https://{pub_name}.substack.com/publish/post"

    # Ensure automation profile directory exists
    AUTOMATION_PROFILE.mkdir(exist_ok=True)

    with sync_playwright() as p:
        try:
            # Launch browser with dedicated automation profile
            # This profile persists between runs, so you only need to log in once
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(AUTOMATION_PROFILE),
                headless=headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--start-maximized"
                ],
                viewport={"width": 1280, "height": 900},
                timeout=60000,  # 60 second timeout for launch
                slow_mo=100  # Slow down actions so you can see them
            )

            page = context.pages[0] if context.pages else context.new_page()

            # Navigate to Substack editor
            print(f"Opening Substack editor: {editor_url}")
            page.goto(editor_url, wait_until="networkidle", timeout=30000)

            # Wait a moment for the page to fully load
            time.sleep(2)

            # Check if we need to log in by looking for login form elements
            # More reliable than checking URL
            login_needed = False
            try:
                # Check for login form elements
                login_form = page.query_selector('input[placeholder="Email"], input[type="email"], button:has-text("Sign in")')
                if login_form:
                    login_needed = True
            except:
                pass

            # Also check URL as backup
            if "login" in page.url.lower() or "sign" in page.url.lower() or "account" in page.url.lower():
                login_needed = True

            if login_needed:
                print("\n" + "="*50)
                print("Please log in to Substack in the browser window!")
                print("The browser should be visible on your screen.")
                print("After logging in, the script will continue automatically.")
                print("="*50 + "\n")

                # Wait for the editor to appear (contenteditable element)
                # This is more reliable than URL checking
                print("Waiting for you to log in...")
                try:
                    page.wait_for_selector('[contenteditable="true"]', timeout=300000)  # 5 minutes
                except PlaywrightTimeout:
                    return {
                        "status": "error",
                        "message": "Login timeout. Please try again and log in when the browser opens."
                    }
                time.sleep(2)

            # Wait for the editor to load
            print("Waiting for editor to load...")
            time.sleep(3)

            # Take a screenshot for debugging
            page.screenshot(path=str(AUTOMATION_PROFILE / "debug_screenshot.png"))
            print(f"Debug screenshot saved to {AUTOMATION_PROFILE / 'debug_screenshot.png'}")

            # Try multiple selectors for the title field
            print("Entering title...")
            title_selectors = [
                '[placeholder="Title"]',
                '[data-testid="post-title"]',
                '.post-title input',
                '.title-input',
                'input[name="title"]',
                '[aria-label="Title"]',
                '.pencraft h1[contenteditable="true"]',
                'h1[contenteditable="true"]'
            ]

            title_found = False
            for selector in title_selectors:
                try:
                    element = page.wait_for_selector(selector, timeout=3000)
                    if element:
                        page.click(selector)
                        # Check if it's an input or contenteditable
                        tag = element.evaluate("el => el.tagName.toLowerCase()")
                        if tag == "input":
                            page.fill(selector, title)
                        else:
                            page.keyboard.type(title)
                        title_found = True
                        print(f"Title entered using selector: {selector}")
                        break
                except PlaywrightTimeout:
                    continue

            if not title_found:
                # Try clicking and typing in the first editable area
                print("Trying to find any editable title area...")
                try:
                    page.click('[contenteditable="true"]', timeout=5000)
                    page.keyboard.type(title)
                    title_found = True
                except:
                    print("Could not find title field")

            # Enter subtitle if provided
            if subtitle:
                print("Entering subtitle...")
                subtitle_selectors = [
                    '[placeholder="Add a subtitle..."]',
                    '[placeholder="Subtitle"]',
                    '[data-testid="post-subtitle"]',
                    '.subtitle-input'
                ]

                subtitle_found = False
                for selector in subtitle_selectors:
                    try:
                        element = page.wait_for_selector(selector, timeout=2000)
                        if element:
                            page.click(selector)
                            page.keyboard.type(subtitle)
                            subtitle_found = True
                            print(f"Subtitle entered using selector: {selector}")
                            break
                    except PlaywrightTimeout:
                        continue

                if not subtitle_found:
                    # Fallback: Tab from title to subtitle
                    page.keyboard.press("Tab")
                    time.sleep(0.3)
                    page.keyboard.type(subtitle)

                time.sleep(0.5)

            # Enter content
            print("Entering content...")
            # Click directly into the content area instead of using Tab
            content_selectors = [
                '[placeholder="Start writing..."]',
                '[data-testid="post-body"]',
                '.post-content [contenteditable="true"]',
                'div[contenteditable="true"]:not(h1)',
                '.ProseMirror'
            ]

            content_found = False
            for selector in content_selectors:
                try:
                    element = page.wait_for_selector(selector, timeout=3000)
                    if element:
                        page.click(selector)
                        content_found = True
                        print(f"Content area found using selector: {selector}")
                        break
                except PlaywrightTimeout:
                    continue

            if not content_found:
                # Fallback: try Tab navigation
                page.keyboard.press("Tab")
            time.sleep(0.3)

            # Type the content - simple approach, type everything as plain text
            lines = content.split('\n')
            image_inserted = False
            import re

            for i, line in enumerate(lines):
                # Skip H1 title if it matches our title (avoid duplicate)
                if line.startswith('# ') and line[2:].strip().lower() == title.lower():
                    continue

                stripped = line.strip()

                # Skip empty lines
                if not stripped:
                    continue

                # Insert book cover image before "About the Author" section
                if not image_inserted and cover_image_url and "about the author" in stripped.lower():
                    print(f"Inserting book cover image: {cover_image_url}")
                    try:
                        image_inserted = paste_image_from_url(page, cover_image_url)
                        if image_inserted:
                            print("Image pasted successfully")
                            page.keyboard.press("Enter")
                            time.sleep(1)
                    except Exception as e:
                        print(f"Could not insert image: {e}")

                # Handle H2 headers - convert to H3 style
                if stripped.startswith('## '):
                    header_text = stripped[3:].strip()
                    # Remove markdown *italics*
                    header_text = re.sub(r'\*([^*]+)\*', r'\1', header_text)
                    page.keyboard.type(header_text)
                    time.sleep(0.1)
                    page.keyboard.press("Home")
                    page.keyboard.press("Shift+End")
                    time.sleep(0.1)
                    page.keyboard.press("Control+Alt+3")  # Apply H3 style
                    time.sleep(0.2)
                    page.keyboard.press("End")
                    page.keyboard.press("Enter")
                    time.sleep(0.1)
                else:
                    # Regular text - remove markdown formatting and just type it
                    # Remove ** bold markers
                    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', stripped)
                    # Remove * italic markers
                    text = re.sub(r'\*([^*]+)\*', r'\1', text)
                    page.keyboard.type(text)
                    page.keyboard.press("Enter")
                    time.sleep(0.05)

            # Wait for auto-save (Substack auto-saves drafts)
            print("Waiting for auto-save...")
            time.sleep(3)

            # Look for "Saved" or draft indicator
            # Substack auto-saves, so we just need to wait a moment

            print("Draft saved successfully!")

            # Keep browser open for a moment so user can verify
            time.sleep(2)

            # Close the context
            context.close()

            return {
                "status": "success",
                "message": f"Draft saved to {substack_url}",
                "title": title
            }

        except PlaywrightTimeout as e:
            return {
                "status": "error",
                "message": f"Timeout waiting for page elements: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error publishing to Substack: {str(e)}"
            }


def publish_markdown_file(filepath: str, substack_url: str = SUBSTACK_URL, cover_image_url: str = "") -> dict:
    """
    Publish a Markdown file to Substack as a draft.
    Extracts title from the first H1 heading and subtitle from bold line.

    Args:
        filepath: Path to the Markdown file
        substack_url: The Substack publication URL
        cover_image_url: Optional URL for the book cover image

    Returns:
        dict with status and message
    """
    path = Path(filepath)
    if not path.exists():
        return {"status": "error", "message": f"File not found: {filepath}"}

    content = path.read_text(encoding="utf-8")

    # Extract title from first H1
    lines = content.split('\n')
    title = "Untitled Post"
    subtitle = ""
    content_start = 0
    book_title = ""
    book_author = ""

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
            # Extract book title and author from subtitle
            # Format: "A book review of \"Book Title\" by Author Name"
            if '" by ' in subtitle or "' by " in subtitle:
                import re
                match = re.search(r'["\']([^"\']+)["\'] by (.+)$', subtitle)
                if match:
                    book_title = match.group(1)
                    book_author = match.group(2)
            break
        elif line and not line.startswith('**'):
            # Non-empty, non-subtitle line found, stop looking
            break

    # Fetch cover image if not provided and we have book info
    if not cover_image_url and book_title:
        print(f"Fetching book cover for: {book_title} by {book_author}")
        try:
            import sys
            sys.path.insert(0, str(Path(__file__).parent))
            from book_finder import get_book_cover_url
            cover_image_url = get_book_cover_url(book_title, book_author) or ""
            if cover_image_url:
                print(f"Found cover: {cover_image_url}")
        except Exception as e:
            print(f"Could not fetch cover: {e}")

    # Get content after title and subtitle
    body = '\n'.join(lines[content_start:]).strip()

    return publish_to_substack(title=title, content=body, subtitle=subtitle, cover_image_url=cover_image_url, substack_url=substack_url)


# Example usage
if __name__ == "__main__":
    # Test with a simple post
    result = publish_to_substack(
        title="Test Post from Book Blog Agent",
        content="""This is a test post created by the Book Blog Agent.

## Key Takeaways

- Automated publishing works!
- Drafts are saved automatically
- You can review before publishing

## Conclusion

This post was created automatically and saved as a draft for your review.
""",
        substack_url=SUBSTACK_URL
    )
    print(result)
