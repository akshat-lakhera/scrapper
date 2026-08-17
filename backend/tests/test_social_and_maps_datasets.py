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
