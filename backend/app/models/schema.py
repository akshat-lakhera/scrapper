from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SchemaField(BaseModel):
    name: str = Field(..., description="Field name identifier")
    description: str = Field(..., description="Description of the target extraction field")
    data_type: Literal["string", "integer", "number", "boolean", "url", "date", "object"] = Field(
        ..., description="Expected field data type"
    )
    required: bool = Field(default=False, description="Whether this field is mandatory for validity gate")


class ScrapeSchema(BaseModel):
    name: str = Field(..., description="Unique schema name identifier")
    description: str = Field(..., description="Workflow schema description")
    fields: List[SchemaField] = Field(..., description="List of schema fields")

    def get_field(self, field_name: str) -> Optional[SchemaField]:
        for f in self.fields:
            if f.name == field_name:
                return f
        return None

    def get_required_field_names(self) -> List[str]:
        return [f.name for f in self.fields if f.required]

    def get_all_field_names(self) -> List[str]:
        return [f.name for f in self.fields]


# Built-in PRODUCT_SCHEMA
PRODUCT_SCHEMA = ScrapeSchema(
    name="products",
    description="Product listings for discovery and price comparison",
    fields=[
        SchemaField(name="title", description="Product title", data_type="string", required=True),
        SchemaField(name="price", description="Current product price", data_type="number", required=True),
        SchemaField(name="currency", description="Currency code", data_type="string", required=True),
        SchemaField(name="availability", description="Availability or stock status", data_type="string", required=True),
        SchemaField(name="rating", description="Average rating from 0 to 5", data_type="number", required=False),
        SchemaField(name="review_count", description="Number of reviews", data_type="integer", required=False),
        SchemaField(name="seller", description="Seller or retailer name", data_type="string", required=False),
        SchemaField(name="product_url", description="Canonical product URL", data_type="url", required=True),
        SchemaField(name="image_url", description="Product image URL", data_type="url", required=False),
        SchemaField(name="specifications", description="Product specifications", data_type="object", required=False),
    ]
)

# Built-in JOB_SCHEMA
JOB_SCHEMA = ScrapeSchema(
    name="jobs",
    description="Public job listings for job discovery",
    fields=[
        SchemaField(name="job_title", description="Job title", data_type="string", required=True),
        SchemaField(name="company", description="Hiring company", data_type="string", required=True),
        SchemaField(name="location", description="Job location", data_type="string", required=True),
        SchemaField(name="employment_type", description="Employment type", data_type="string", required=False),
        SchemaField(name="salary", description="Salary or compensation text", data_type="string", required=False),
        SchemaField(name="description", description="Job description", data_type="string", required=True),
        SchemaField(name="posted_date", description="Date the job was posted", data_type="date", required=False),
        SchemaField(name="application_url", description="Application URL", data_type="url", required=True),
    ]
)

# Built-in X_POST_SCHEMA (Twitter)
X_POST_SCHEMA = ScrapeSchema(
    name="x",
    description="X (Twitter) posts, author metadata, metrics and engagements",
    fields=[
        SchemaField(name="post_url", description="X Post Canonical URL", data_type="url", required=True),
        SchemaField(name="user_posted", description="Author Display Name or Handle", data_type="string", required=True),
        SchemaField(name="description", description="Tweet or Post text content", data_type="string", required=True),
        SchemaField(name="likes", description="Number of likes/favorites", data_type="integer", required=False),
        SchemaField(name="reposts", description="Number of retweets/reposts", data_type="integer", required=False),
        SchemaField(name="replies", description="Number of replies", data_type="integer", required=False),
        SchemaField(name="views", description="Number of post impressions", data_type="integer", required=False),
        SchemaField(name="date_posted", description="Timestamp of post creation", data_type="date", required=False),
        SchemaField(name="media", description="Attached media, images, or video links", data_type="object", required=False),
    ]
)

# Built-in LINKEDIN_PROFILE_SCHEMA
LINKEDIN_PROFILE_SCHEMA = ScrapeSchema(
    name="linkedin",
    description="LinkedIn professional profiles, career history and education",
    fields=[
        SchemaField(name="profile_url", description="LinkedIn Profile URL", data_type="url", required=True),
        SchemaField(name="name", description="Full profile name", data_type="string", required=True),
        SchemaField(name="headline", description="Professional headline or title", data_type="string", required=False),
        SchemaField(name="current_company", description="Current employer/organization", data_type="string", required=False),
        SchemaField(name="location", description="Geographic location", data_type="string", required=False),
        SchemaField(name="about", description="Summary or About section", data_type="string", required=False),
        SchemaField(name="connections", description="Number of connections", data_type="integer", required=False),
        SchemaField(name="experience", description="List of past and present positions", data_type="object", required=False),
        SchemaField(name="education", description="List of educational institutions", data_type="object", required=False),
    ]
)

# Built-in FACEBOOK_POST_SCHEMA
FACEBOOK_POST_SCHEMA = ScrapeSchema(
    name="facebook",
    description="Facebook public page posts, engagement and media",
    fields=[
        SchemaField(name="post_url", description="Facebook post canonical link", data_type="url", required=True),
        SchemaField(name="page_name", description="Page or author name", data_type="string", required=True),
        SchemaField(name="post_text", description="Text content of the post", data_type="string", required=True),
        SchemaField(name="likes_count", description="Number of likes/reactions", data_type="integer", required=False),
        SchemaField(name="comments_count", description="Number of comments", data_type="integer", required=False),
        SchemaField(name="shares_count", description="Number of shares", data_type="integer", required=False),
        SchemaField(name="posted_at", description="Timestamp of post creation", data_type="date", required=False),
    ]
)

# Built-in INSTAGRAM_PROFILE_SCHEMA
INSTAGRAM_PROFILE_SCHEMA = ScrapeSchema(
    name="instagram",
    description="Instagram public profiles, bio, followers and media counts",
    fields=[
        SchemaField(name="profile_url", description="Instagram Profile URL", data_type="url", required=True),
        SchemaField(name="username", description="Instagram handle username", data_type="string", required=True),
        SchemaField(name="full_name", description="Full display name", data_type="string", required=False),
        SchemaField(name="biography", description="Bio description text", data_type="string", required=False),
        SchemaField(name="followers_count", description="Total followers count", data_type="integer", required=False),
        SchemaField(name="following_count", description="Total following count", data_type="integer", required=False),
        SchemaField(name="posts_count", description="Total number of media posts", data_type="integer", required=False),
        SchemaField(name="is_verified", description="Verified account badge status", data_type="boolean", required=False),
    ]
)

# Built-in GOOGLE_MAPS_SCHEMA
GOOGLE_MAPS_SCHEMA = ScrapeSchema(
    name="google_maps",
    description="Google Maps place listings, business details, reviews and coordinates",
    fields=[
        SchemaField(name="place_url", description="Google Maps place URL", data_type="url", required=True),
        SchemaField(name="title", description="Business or place name", data_type="string", required=True),
        SchemaField(name="address", description="Physical street address", data_type="string", required=True),
        SchemaField(name="rating", description="Average star rating (0-5)", data_type="number", required=False),
        SchemaField(name="reviews_count", description="Total review count", data_type="integer", required=False),
        SchemaField(name="phone", description="Contact phone number", data_type="string", required=False),
        SchemaField(name="website", description="Official website URL", data_type="url", required=False),
        SchemaField(name="category", description="Primary business category", data_type="string", required=False),
        SchemaField(name="latitude", description="Geographic latitude coordinate", data_type="number", required=False),
        SchemaField(name="longitude", description="Geographic longitude coordinate", data_type="number", required=False),
    ]
)

# Built-in REDDIT_POST_SCHEMA
REDDIT_POST_SCHEMA = ScrapeSchema(
    name="reddit",
    description="Reddit public post discussions, subreddits, upvotes and comments",
    fields=[
        SchemaField(name="post_url", description="Reddit post canonical URL", data_type="url", required=True),
        SchemaField(name="title", description="Post title heading", data_type="string", required=True),
        SchemaField(name="subreddit", description="Subreddit community name", data_type="string", required=False),
        SchemaField(name="user_posted", description="Author username", data_type="string", required=False),
        SchemaField(name="description", description="Body text content of the submission", data_type="string", required=False),
        SchemaField(name="upvotes", description="Number of upvotes or score", data_type="integer", required=False),
        SchemaField(name="num_comments", description="Total comments count", data_type="integer", required=False),
        SchemaField(name="date_posted", description="Submission timestamp or UTC date", data_type="string", required=False),
    ]
)

# Built-in TECH_DOCS_SCHEMA (Long-tail / Technical Documentation)
TECH_DOCS_SCHEMA = ScrapeSchema(
    name="tech_docs",
    description="Technical documentation, API references, guides and code snippets",
    fields=[
        SchemaField(name="doc_title", description="Documentation title or guide name", data_type="string", required=True),
        SchemaField(name="section_heading", description="Current section or chapter heading", data_type="string", required=True),
        SchemaField(name="content_body", description="Main documentation article or text body", data_type="string", required=True),
        SchemaField(name="code_snippet", description="Extracted code block or example", data_type="string", required=False),
        SchemaField(name="last_updated", description="Last revision date or release version", data_type="string", required=False),
        SchemaField(name="doc_url", description="Canonical documentation page URL", data_type="url", required=True),
    ]
)

SCHEMA_REGISTRY: Dict[str, ScrapeSchema] = {
    "products": PRODUCT_SCHEMA,
    "jobs": JOB_SCHEMA,
    "x": X_POST_SCHEMA,
    "twitter": X_POST_SCHEMA,
    "linkedin": LINKEDIN_PROFILE_SCHEMA,
    "facebook": FACEBOOK_POST_SCHEMA,
    "instagram": INSTAGRAM_PROFILE_SCHEMA,
    "google_maps": GOOGLE_MAPS_SCHEMA,
    "google": GOOGLE_MAPS_SCHEMA,
    "maps": GOOGLE_MAPS_SCHEMA,
    "reddit": REDDIT_POST_SCHEMA,
    "reddit_post": REDDIT_POST_SCHEMA,
    "tech_docs": TECH_DOCS_SCHEMA,
    "docs": TECH_DOCS_SCHEMA,
    "documentation": TECH_DOCS_SCHEMA,
}


def get_schema_by_name(name: str) -> Optional[ScrapeSchema]:
    return SCHEMA_REGISTRY.get(name.lower())


def generate_brightdata_instruction(schema: ScrapeSchema) -> str:
    """Generates natural language extraction instruction for Bright Data Scraper Studio."""
    field_names = ", ".join(schema.get_all_field_names())
    
    if schema.name == "products":
        return (
            "Extract product listings from this public page.\n\n"
            f"Return one structured JSON object per product with:\n{field_names}.\n\n"
            "Do not invent values. Use null when a field is unavailable.\n"
            "Preserve the exact requested output field names.\n"
            "Normalize price as a number and currency as a currency code.\n"
            "Return valid structured data."
        )
    elif schema.name == "jobs":
        return (
            "Extract public job listings from this page.\n\n"
            f"Return one structured JSON object per job with:\n{field_names}.\n\n"
            "Do not invent values. Use null when a field is unavailable.\n"
            "Preserve the exact requested output field names.\n"
            "Return valid structured data."
        )
    elif schema.name in ("x", "twitter"):
        return (
            "Extract public post content, author metadata and engagement statistics from this X (Twitter) status.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name == "linkedin":
        return (
            "Extract public professional background, current position and educational history from this LinkedIn profile.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name == "facebook":
        return (
            "Extract public post text, reaction counts and media from this Facebook post.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name == "instagram":
        return (
            "Extract public profile biographical details, follower counts and post metrics from this Instagram account.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name in ("google_maps", "google", "maps"):
        return (
            "Extract place name, address, contact details, rating and coordinates from this Google Maps location.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name == "reddit":
        return (
            "Extract post title, subreddit, body text, upvotes and comment count from this Reddit thread.\n\n"
            f"Fields: {field_names}."
        )
    elif schema.name in ("tech_docs", "docs", "documentation"):
        return (
            "Extract technical documentation content, section headings, and code snippets from this developer documentation page.\n\n"
            f"Fields: {field_names}."
        )
    else:
        return (
            f"Extract structured data from this public page according to schema '{schema.name}'.\n"
            f"Fields to extract: {field_names}.\n"
            "Do not invent values. Use null when unavailable."
        )
