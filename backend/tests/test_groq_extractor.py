import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.extraction.groq_extractor import GroqExtractor
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA
from app.extraction.validator import Validator
from app.extraction.normalizer import Normalizer

@pytest.mark.asyncio
async def test_groq_extractor_disabled_without_key():
    with patch("app.config.settings.GROQ_API_KEY", ""):
        assert not GroqExtractor.is_enabled()
        result = await GroqExtractor.extract_fields("<html>Sample</html>", PRODUCT_SCHEMA, "https://example.com")
        assert result is None

@pytest.mark.asyncio
async def test_groq_extractor_successful_product_extraction():
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = '{"title": "Sony WH-1000XM5 Wireless Headphones", "price": 29990.0, "currency": "INR", "availability": "In stock", "seller": "Sony India", "product_url": "https://amazon.in/dp/B09XS7JWHH", "rating": 4.6, "review_count": 1250}'
    mock_response.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.config.settings.GROQ_API_KEY", "gsk_test_key_123"):
        with patch("groq.AsyncGroq", return_value=mock_client):
            result = await GroqExtractor.extract_fields("<html><body>Sony WH-1000XM5 for Rs 29,990</body></html>", PRODUCT_SCHEMA, "https://amazon.in/dp/B09XS7JWHH")
            assert result is not None
            assert result["title"] == "Sony WH-1000XM5 Wireless Headphones"
            assert result["price"] == 29990.0
            assert result["currency"] == "INR"

            # Validate against Pydantic schema
            normalized = Normalizer.normalize_record(result, PRODUCT_SCHEMA)
            is_valid, missing, errors = Validator.validate_record(normalized, PRODUCT_SCHEMA)
            assert is_valid
            assert len(missing) == 0

@pytest.mark.asyncio
async def test_groq_extractor_failure_handled_safely():
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=Exception("Groq API rate limit exceeded"))

    with patch("app.config.settings.GROQ_API_KEY", "gsk_test_key_123"):
        with patch("groq.AsyncGroq", return_value=mock_client):
            result = await GroqExtractor.extract_fields("<html>Broken</html>", PRODUCT_SCHEMA, "https://example.com")
            assert result is None
