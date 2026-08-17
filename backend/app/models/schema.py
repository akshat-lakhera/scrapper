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


# Built-in PRODUCT_SCHEMA as specified in MarketScout requirements
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

# Built-in JOB_SCHEMA as specified in MarketScout requirements
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

SCHEMA_REGISTRY: Dict[str, ScrapeSchema] = {
    "products": PRODUCT_SCHEMA,
    "jobs": JOB_SCHEMA,
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
    else:
        return (
            f"Extract structured data from this public page according to schema '{schema.name}'.\n"
            f"Fields to extract: {field_names}.\n"
            "Do not invent values. Use null when unavailable."
        )
