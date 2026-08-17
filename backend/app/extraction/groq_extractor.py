import json
import logging
import re
from typing import Any, Dict, Optional
from app.config import settings
from app.models.schema import ScrapeSchema

logger = logging.getLogger("marketscout.groq_extractor")

class GroqExtractor:
    """
    Groq LLM-powered structured field extractor and normalizer.
    Used strictly downstream of Bright Data Scraper Studio retrieval.
    Transforms raw scraped web content into strictly typed, schema-compliant JSON.
    """

    @staticmethod
    def is_enabled() -> bool:
        return bool(settings.GROQ_API_KEY)

    @staticmethod
    async def extract_fields(
        scraped_content: str,
        schema: ScrapeSchema,
        target_url: str = ""
    ) -> Optional[Dict[str, Any]]:
        """
        Sends raw scraped content from Bright Data along with the target schema to Groq.
        Returns structured dictionary matching the schema fields, or None if extraction fails.
        """
        if not settings.GROQ_API_KEY:
            logger.debug("GROQ_API_KEY not configured, skipping Groq extraction step.")
            return None

        # Intelligently clean/truncate content to stay within token limits if HTML is massive
        cleaned_content = GroqExtractor._clean_content(scraped_content)
        if not cleaned_content:
            return None

        field_specs = []
        for f in schema.fields:
            field_specs.append(f"- {f.name} ({f.data_type}, required={f.required}): {f.description}")
        fields_str = "\n".join(field_specs)

        system_prompt = (
            "You are a high-precision structured data extraction engine. "
            "Your task is to extract exact, factual structured data from the provided web page content "
            "retrieved by Bright Data and map it strictly to the requested schema. "
            "Output ONLY a valid JSON object matching the requested fields. "
            "Do not invent facts or create hallucinations. If a field is not present in the content, return null for that field."
        )

        user_prompt = (
            f"Target URL: {target_url}\n"
            f"Schema: {schema.name} - {schema.description}\n\n"
            f"Required Fields:\n{fields_str}\n\n"
            f"Scraped Web Content:\n{cleaned_content}\n\n"
            "Extract all available fields and return the JSON object."
        )

        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            
            response = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=1500
            )

            raw_json_str = response.choices[0].message.content or "{}"
            parsed_data = json.loads(raw_json_str)
            logger.info(f"Groq successfully extracted structured data for {schema.name} from {target_url}")
            return parsed_data
        except Exception as e:
            logger.warning(f"Groq structured extraction failed: {e}")
            return None

    @staticmethod
    def _clean_content(content: str, max_chars: int = 16000) -> str:
        if not content:
            return ""
        # Strip script and style tags to minimize token usage
        cleaned = re.sub(r"<script.*?</script>", "", content, flags=re.DOTALL | re.IGNORECASE)
        cleaned = re.sub(r"<style.*?</style>", "", cleaned, flags=re.DOTALL | re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if len(cleaned) > max_chars:
            return cleaned[:max_chars]
        return cleaned
