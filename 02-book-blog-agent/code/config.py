import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Book discovery settings - specific queries for practitioner books
BOOK_CATEGORIES = [
    "copywriting bestseller",
    "marketing strategy book",
    "sales psychology book",
    "persuasion influence book",
    "content marketing book",
    "freelance business book",
    "direct response advertising",
    "brand storytelling book",
]
MAX_BOOKS_PER_RUN = 1  # How many blog posts to generate per run

# Output settings
OUTPUT_DIR = "output"
EXAMPLES_DIR = "examples"

# Substack settings
SUBSTACK_URL = os.getenv("SUBSTACK_URL", "https://thefreelancecopywnewsletter.substack.com")
