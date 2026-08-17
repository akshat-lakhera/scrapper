import os
import pytest
from app.config import settings

@pytest.fixture(autouse=True)
def force_local_provider_for_unit_tests(monkeypatch):
    """
    Enforces that unit tests always use LocalProvider (zero network calls, 100% offline).
    This guarantees 100% test suite reliability without spending live API credits.
    """
    monkeypatch.setattr(settings, "SCRAPER_PROVIDER", "local")
