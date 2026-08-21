import pytest
from app.models.schema import get_schema_by_name, SCHEMA_REGISTRY
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.providers.brightdata_provider import BrightDataProvider

def test_social_and_maps_schemas_registered():
    for schema_name in ["x", "twitter", "linkedin", "facebook", "instagram", "google_maps", "google"]:
        schema = get_schema_by_name(schema_name)
        assert schema is not None, f"Schema {schema_name} should be registered in SCHEMA_REGISTRY"
        assert len(schema.fields) > 0
        assert len(schema.get_required_field_names()) > 0

def test_x_post_normalization():
    schema = get_schema_by_name("x")
    raw_tweet = {
        "url": "https://x.com/FabrizioRomano/status/1683559267524136962",
        "user_posted": "Fabrizio Romano",
        "description": "HERE WE GO! Transfer confirmed.",
        "likes": "145,200",
        "retweets": "23,100",
        "replies": "1,450",
        "views": "3,400,000",
        "date_posted": "2023-07-24"
    }
    normalized = Normalizer.normalize_record(raw_tweet, schema)
    assert normalized["post_url"] == "https://x.com/FabrizioRomano/status/1683559267524136962"
    assert normalized["user_posted"] == "Fabrizio Romano"
    assert normalized["description"] == "HERE WE GO! Transfer confirmed."
    assert normalized["likes"] == 145200
    assert normalized["reposts"] == 23100
    assert normalized["replies"] == 1450
    assert normalized["views"] == 3400000

    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0

def test_linkedin_profile_normalization():
    schema = get_schema_by_name("linkedin")
    raw_profile = {
        "url": "https://www.linkedin.com/in/elad-moshe-05a90413/",
        "name": "Elad Moshe",
        "headline": "VP Product & Data Systems",
        "current_company": "Bright Data",
        "location": "Tel Aviv, Israel",
        "about": "Building scalable web intelligence platforms.",
        "connections": "500+"
    }
    normalized = Normalizer.normalize_record(raw_profile, schema)
    assert normalized["profile_url"] == "https://www.linkedin.com/in/elad-moshe-05a90413/"
    assert normalized["name"] == "Elad Moshe"
    assert normalized["headline"] == "VP Product & Data Systems"
    assert normalized["current_company"] == "Bright Data"
    assert normalized["connections"] == 500

    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0

def test_linkedin_nested_dicts_and_arrays_normalization():
    """Verifies that arbitrary nested dicts and list of dicts (like education and current_company) unpack cleanly without '[object Object]'."""
    schema = get_schema_by_name("linkedin")
    raw_profile = {
        "url": "https://www.linkedin.com/in/wilson-pereira-barros/",
        "name": "Wilson Barros",
        "headline": "Senior Software Engineer",
        "current_company": {"link": "https://www.linkedin.com/company/nubank/", "name": "Nubank"},
        "location": "São Paulo, Brazil",
        "about": "Senior software engineer with 20+ years of experience.",
        "connections": 500,
        "education": [
            {"school": "University of São Paulo", "degree": "Computer Science"},
            {"school": "MIT Professional Education"}
        ],
        "experience": [
            {"title": "Tech Lead", "company": "Nubank"},
            {"title": "Senior Engineer", "company": "Globo"}
        ]
    }
    normalized = Normalizer.normalize_record(raw_profile, schema)
    assert normalized["name"] == "Wilson Barros"
    assert normalized["current_company"] == "Nubank"
    assert normalized["education"] == ["University of São Paulo (Computer Science)", "MIT Professional Education"]
    assert normalized["experience"] == ["Tech Lead at Nubank", "Senior Engineer at Globo"]

    # Also test when current_company is link-only dict
    raw_profile_link_only = {
        "url": "https://www.linkedin.com/in/test-user/",
        "name": "Test User",
        "current_company": "{'link': 'https://www.linkedin.com/company/amazon/'}"
    }
    normalized2 = Normalizer.normalize_record(raw_profile_link_only, schema)
    assert normalized2["current_company"] == "Amazon"

def test_facebook_post_normalization():
    schema = get_schema_by_name("facebook")
    raw_post = {
        "url": "https://www.facebook.com/LeBron/",
        "page_name": "LeBron James",
        "post_text": "Strive for greatness! #LakeShow",
        "likes_count": "54,200",
        "comments_count": "3,120",
        "shares_count": "890",
        "posted_at": "2025-01-15"
    }
    normalized = Normalizer.normalize_record(raw_post, schema)
    assert normalized["post_url"] == "https://www.facebook.com/LeBron/"
    assert normalized["page_name"] == "LeBron James"
    assert normalized["post_text"] == "Strive for greatness! #LakeShow"
    assert normalized["likes_count"] == 54200
    assert normalized["comments_count"] == 3120
    assert normalized["shares_count"] == 890

    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0

def test_instagram_profile_normalization():
    schema = get_schema_by_name("instagram")
    raw_ig = {
        "url": "https://www.instagram.com/cats_of_world_/",
        "username": "cats_of_world_",
        "full_name": "Cats of World",
        "biography": "Daily dose of feline elegance.",
        "followers_count": "1,250,000",
        "following_count": "120",
        "posts_count": "3,450",
        "is_verified": "true"
    }
    normalized = Normalizer.normalize_record(raw_ig, schema)
    assert normalized["profile_url"] == "https://www.instagram.com/cats_of_world_/"
    assert normalized["username"] == "cats_of_world_"
    assert normalized["followers_count"] == 1250000
    assert normalized["is_verified"] is True

    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0

def test_google_maps_normalization():
    schema = get_schema_by_name("google_maps")
    raw_place = {
        "url": "https://www.google.com/maps/place/Pizza+Inn+Magdeburg/",
        "title": "Pizza Inn Magdeburg",
        "address": "Halberstaedter Str. 120, 39112 Magdeburg, Germany",
        "rating": "4.6",
        "reviews_count": "850",
        "phone": "+49 391 123456",
        "website": "https://pizzainn.de",
        "category": "Pizza restaurant",
        "latitude": 52.1263086,
        "longitude": 11.6094743
    }
    normalized = Normalizer.normalize_record(raw_place, schema)
    assert normalized["place_url"] == "https://www.google.com/maps/place/Pizza+Inn+Magdeburg/"
    assert normalized["title"] == "Pizza Inn Magdeburg"
    assert normalized["address"] == "Halberstaedter Str. 120, 39112 Magdeburg, Germany"
    assert normalized["rating"] == 4.6
    assert normalized["reviews_count"] == 850
    assert normalized["latitude"] == 52.1263086

    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0

def test_provider_dataset_resolution():
    provider = BrightDataProvider()
    assert provider._resolve_dataset_id("", "x") == "gd_lwxkxvnf1cynvib9co"
    assert provider._resolve_dataset_id("", "linkedin") == "gd_l1viktl72bvl7bjuj0"
    assert provider._resolve_dataset_id("", "facebook") == "gd_lkaxegm826bjpoo9m5"
    assert provider._resolve_dataset_id("", "instagram") == "gd_l1vikfch901nx3by4"
    assert provider._resolve_dataset_id("", "google_maps") == "gd_m8ebnr0q2qlklc02fz"


def test_instagram_profile_with_brightdata_deprecated_null_fields():
    """
    Verifies that Instagram Scraper (gd_l1vikfch901nx3by4) output schema changes
    where fields like has_channel, is_business_account, posts, related_accounts
    return null are gracefully handled without schema or validation failures.
    """
    schema = get_schema_by_name("instagram")
    raw_payload_with_deprecated_nulls = {
        "url": "https://www.instagram.com/openai/",
        "username": "openai",
        "full_name": "OpenAI",
        "biography": "Creating safe AGI that benefits all of humanity.",
        "followers_count": "5,400,000",
        "following_count": "15",
        "posts_count": "240",
        "is_verified": True,
        # Deprecated fields returned as Null by Bright Data
        "has_channel": None,
        "is_business_account": None,
        "is_professional_account": None,
        "avg_engagement": None,
        "business_category_name": None,
        "category_name": None,
        "business_address": None,
        "related_accounts": None,
        "posts": None
    }

    normalized = Normalizer.normalize_record(raw_payload_with_deprecated_nulls, schema)
    assert normalized["profile_url"] == "https://www.instagram.com/openai/"
    assert normalized["username"] == "openai"
    assert normalized["full_name"] == "OpenAI"
    assert normalized["followers_count"] == 5400000
    assert normalized["posts_count"] == 240
    assert normalized["is_verified"] is True

    # Validate against schema contract
    is_valid, missing, errors = Validator.validate_record(normalized, schema)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0
    
    score = Validator.calculate_quality_score(normalized, schema, is_valid)
    assert score == 100
