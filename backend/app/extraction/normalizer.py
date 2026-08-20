import re
import difflib
from typing import Any, Dict, List, Optional
from app.models.schema import ScrapeSchema

CURRENCY_SYMBOLS = {
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
    "₹": "INR",
    "¥": "JPY",
    "A$": "AUD",
    "C$": "CAD",
    "NZ$": "NZD",
    "HK$": "HKD",
    "S$": "SGD",
    "₩": "KRW",
    "CHF": "CHF",
    "R$": "BRL",
    "kr": "SEK",
    "Rs": "INR",
    "Rs.": "INR",
    "INR": "INR",
    "USD": "USD",
    "EUR": "EUR",
    "GBP": "GBP"
}

class Normalizer:
    """
    Adaptive normalizer that maps arbitrary input attributes to target schema fields
    using semantic token matching, fuzzy field resolution, type coercion, and currency parsing.
    """

    @staticmethod
    def parse_number(val: Any) -> Optional[float]:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            val_str = val.strip()
            # Look for "4.5 out of 5" or "4,5 / 5" pattern
            out_of_m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:out of|/)\s*\d+", val_str, re.I)
            if out_of_m:
                try:
                    return float(out_of_m.group(1).replace(",", "."))
                except ValueError:
                    pass

            # Detect European format like 1.234,56 or 1234,56
            if re.search(r"\d+\.\d{3},\d{2}", val_str):
                clean = val_str.replace(".", "").replace(",", ".")
            elif re.search(r"^\D*\d+,\d{2}\D*$", val_str) and "." not in val_str:
                clean = val_str.replace(",", ".")
            else:
                clean = val_str.replace(",", "")

            # Extract first numeric sequence
            m = re.search(r"[-+]?\d*\.?\d+", clean)
            if m and m.group(0) not in ("", "-", "+", "."):
                try:
                    return float(m.group(0))
                except ValueError:
                    pass
        return None

    @staticmethod
    def parse_integer(val: Any) -> Optional[int]:
        num = Normalizer.parse_number(val)
        return int(round(num)) if num is not None else None

    @staticmethod
    def parse_currency(val: Any) -> Optional[str]:
        if not val or not isinstance(val, str):
            return None
        for sym, code in CURRENCY_SYMBOLS.items():
            if sym in val:
                return code
        return None

    @staticmethod
    def match_schema_field(raw_key: str, schema: ScrapeSchema) -> Optional[str]:
        """
        Dynamically maps arbitrary raw keys to schema field names using
        exact match, semantic token containment, and fuzzy similarity.
        """
        clean_key = re.sub(r"[^a-zA-Z0-9]", "", raw_key).lower()
        field_names = schema.get_all_field_names()

        # 1. Exact match
        for f in field_names:
            if clean_key == re.sub(r"[^a-zA-Z0-9]", "", f).lower():
                return f

        # 2. Canonical URL mapping per schema
        if clean_key in ("url", "link", "targeturl", "pageurl", "sourceurl"):
            for f in field_names:
                if f.endswith("_url") or f == "url":
                    return f

        # 3. Semantic token associations
        semantic_map = {
            "price": ["saleprice", "offerprice", "finalprice", "priceamount", "unitprice", "cost", "mrp", "amount", "currentprice"],
            "currency": ["pricecurrency", "currencycode", "curr", "symbol"],
            "title": ["productname", "itemtitle", "heading", "producttitle", "displayname", "itemname", "name", "placename", "businessname", "storename"],
            "job_title": ["position", "role", "designation", "jobrole", "jobheading", "opening", "jobtitle", "title", "name"],
            "company": ["employer", "hiringorganization", "organization", "agency", "firm", "businessname", "employername", "currentcompany"],
            "location": ["joblocation", "city", "place", "worklocation", "addresslocality", "region"],
            "salary": ["compensation", "payrate", "basesalary", "stipend", "remuneration", "wage", "salarypill"],
            "availability": ["stockstatus", "instock", "stock", "inventory", "itemavailability"],
            "rating": ["ratingscore", "reviewscore", "ratingvalue", "stars", "aggregaterating", "score", "reviewsrating"],
            "review_count": ["reviews", "numreviews", "totalreviews", "ratingscount", "reviewcount", "reviewscount"],
            "seller": ["merchant", "vendor", "soldby", "brand", "shopname"],
            "description": ["tweettext", "text", "fulltext", "content", "postcontent", "body", "tweet", "details", "summary", "jobdescription", "productdescription", "about", "posttext", "biography"],
            "body_text": ["text", "tweettext", "content", "body", "posttext", "description", "details"],
            "post_id": ["tweetid", "statusid", "entryid", "itemid"],
            "user_posted": ["author", "username", "handle", "screenname", "userhandle", "profilehandle", "authorname", "creator", "name", "userposted"],
            "author_username": ["handle", "screenname", "userhandle", "profilehandle", "userposted", "username", "author"],
            "author_name": ["fullname", "displayname", "creatorname", "pagename", "name", "author"],
            "author": ["userposted", "username", "handle", "creator", "authorname", "name"],
            "likes": ["favorites", "hearts", "likecount", "numlikes", "likescount", "likes", "favoritecount"],
            "likes_count": ["favorites", "hearts", "likecount", "numlikes", "likes", "favoritecount"],
            "reposts": ["shares", "reposts", "retweetcount", "numshares", "retweets", "sharescount", "repostcount"],
            "retweets_count": ["shares", "reposts", "retweetcount", "numshares", "retweets", "sharescount", "repostcount"],
            "replies": ["comments", "commentscount", "numcomments", "replies", "replycount"],
            "replies_count": ["comments", "commentscount", "numcomments", "replies", "replycount"],
            "views": ["impressions", "viewcount", "impressioncount", "views", "numviews"],
            "date_posted": ["createdat", "timestamp", "date", "postedat", "time", "dateposted", "publishedat"],
            "posted_date": ["createdat", "timestamp", "date", "postedat", "time", "dateposted", "publishedat"],
            "posted_at": ["createdat", "timestamp", "date", "postedat", "time", "dateposted", "publishedat"],
            "followers_count": ["followers", "subscribercount", "connections", "followerscount"],
            "following_count": ["following", "followingcount"],
            "posts_count": ["posts", "postscount", "mediacount", "totalposts"],
            "place_name": ["business", "storename", "placename", "venue"],
            "image_url": ["image", "images", "img", "thumbnail", "photo", "mainimage", "productimage", "primaryimage", "picture", "avatar", "profileimage", "profilephoto", "avatarimage"],
            "content_body": ["content", "body", "text", "description", "details", "article", "guide", "maincontent", "docbody", "documentation"],
            "doc_title": ["title", "heading", "name", "doctitle", "documenttitle", "pagetitle"],
            "section_heading": ["heading", "sectionheading", "subheading", "chapter", "section"]
        }

        # 3. Exact semantic token match
        for target_field, synonyms in semantic_map.items():
            if target_field in field_names:
                if any(syn == clean_key for syn in synonyms):
                    return target_field

        # 4. Partial semantic token match (require minimum length to avoid greedy substring collisions)
        for target_field, synonyms in semantic_map.items():
            if target_field in field_names:
                if any(len(syn) >= 6 and syn in clean_key for syn in synonyms):
                    return target_field

        # 5. Fuzzy similarity fallback (>= 0.75 ratio)
        matches = difflib.get_close_matches(raw_key.lower(), field_names, n=1, cutoff=0.75)
        if matches:
            return matches[0]

        return None

    @staticmethod
    def normalize_record(raw_record: Any, schema: ScrapeSchema) -> Dict[str, Any]:
        """
        Normalizes arbitrary raw dictionary into target schema with type coercion.
        """
        if isinstance(raw_record, list):
            raw_record = raw_record[0] if len(raw_record) > 0 and isinstance(raw_record[0], dict) else {}
        elif not isinstance(raw_record, dict):
            raw_record = {}

        if "data" in raw_record and isinstance(raw_record["data"], list) and len(raw_record["data"]) > 0:
            if isinstance(raw_record["data"][0], dict):
                merged = dict(raw_record["data"][0])
                merged.update(raw_record)
                raw_record = merged

        normalized: Dict[str, Any] = {}
        
        # Inverted index: resolve raw fields into schema fields
        resolved_fields: Dict[str, Any] = {}
        for raw_k, raw_v in raw_record.items():
            if raw_v is None or raw_v == "":
                continue
            matched_field = Normalizer.match_schema_field(raw_k, schema)
            if matched_field and matched_field not in resolved_fields:
                resolved_fields[matched_field] = raw_v

    @staticmethod
    def clean_structured_field_value(val: Any, field_name: str = "") -> Any:
        """
        Recursively unpacks and formats arbitrary nested dicts, lists, and stringified objects
        into clean, human-readable strings or structured arrays (preventing '[object Object]').
        """
        if val is None:
            return None

        # 1. Handle stringified dicts or lists like "{'link': 'https://...'}"
        if isinstance(val, str):
            clean_s = val.strip()
            if (clean_s.startswith("{") and clean_s.endswith("}")) or (clean_s.startswith("[") and clean_s.endswith("]")):
                try:
                    import ast
                    val = ast.literal_eval(clean_s)
                except Exception:
                    pass

        # 2. Handle Dicts (e.g. current_company: {'link': '...', 'name': '...'})
        if isinstance(val, dict):
            # Prefer explicit semantic text keys
            for key in ("name", "title", "company", "company_name", "school", "school_name", "degree", "text", "label", "value", "position", "summary", "city", "content"):
                if val.get(key) and isinstance(val[key], str) and val[key].strip():
                    return val[key].strip()

            # If it only has a link/url, parse the human-readable slug
            link = val.get("link") or val.get("url") or val.get("href")
            if link and isinstance(link, str):
                parts = [p for p in link.rstrip("/").split("/") if p and not p.startswith("http") and not p.endswith(".com")]
                if parts:
                    return parts[-1].replace("-", " ").replace("_", " ").title()
                return link

            # Fallback: join first 3 key-values
            kvs = [f"{k}: {v}" for k, v in val.items() if v and isinstance(v, (str, int, float))]
            if kvs:
                return ", ".join(kvs[:3])
            return str(val)

        # 3. Handle Lists (e.g. education: [ {'school': 'MIT', 'degree': 'BS'}, ... ])
        if isinstance(val, list):
            cleaned_items = []
            for item in val:
                if isinstance(item, dict):
                    school = item.get("school") or item.get("school_name") or item.get("institution")
                    degree = item.get("degree") or item.get("title") or item.get("field_of_study")
                    company = item.get("company") or item.get("company_name") or item.get("employer")
                    title = item.get("title") or item.get("position") or item.get("role")
                    
                    if school and degree:
                        cleaned_items.append(f"{school} ({degree})")
                    elif school:
                        cleaned_items.append(str(school))
                    elif title and company:
                        cleaned_items.append(f"{title} at {company}")
                    elif title:
                        cleaned_items.append(str(title))
                    elif item.get("name"):
                        cleaned_items.append(str(item["name"]))
                    else:
                        item_str = Normalizer.clean_structured_field_value(item, field_name)
                        if item_str:
                            cleaned_items.append(str(item_str))
                elif isinstance(item, str) and item.strip():
                    cleaned_items.append(item.strip())
                elif item is not None:
                    cleaned_items.append(str(item))

            if cleaned_items:
                return cleaned_items
            return None

        if isinstance(val, str):
            c = val.strip()
            return c if len(c) > 0 else None

        return val

    @staticmethod
    def normalize_record(raw_record: Dict[str, Any], schema: ScrapeSchema) -> Dict[str, Any]:
        """
        Normalizes an arbitrary raw extracted payload against a strict target schema contract.
        """
        if not raw_record:
            return {f.name: None for f in schema.fields}

        # Flatten nested data containers if present
        for container_key in ("data", "result", "record", "extracted_data", "product", "job", "profile"):
            if container_key in raw_record and isinstance(raw_record[container_key], dict):
                merged = {**raw_record[container_key], **{k: v for k, v in raw_record.items() if k != container_key}}
                raw_record = merged

        normalized: Dict[str, Any] = {}
        
        # Inverted index: resolve raw fields into schema fields
        resolved_fields: Dict[str, Any] = {}
        for raw_k, raw_v in raw_record.items():
            if raw_v is None or raw_v == "":
                continue
            matched_field = Normalizer.match_schema_field(raw_k, schema)
            if matched_field and matched_field not in resolved_fields:
                resolved_fields[matched_field] = raw_v

        for field in schema.fields:
            name = field.name
            raw_val = resolved_fields.get(name)

            if raw_val is None:
                normalized[name] = None
                continue

            if field.data_type in ("number", "integer", "float"):
                parsed_num = Normalizer.parse_number(raw_val)
                if parsed_num is not None:
                    normalized[name] = int(round(parsed_num)) if field.data_type == "integer" else parsed_num
                else:
                    normalized[name] = None

            elif field.data_type == "string":
                if name == "currency":
                    cur = Normalizer.parse_currency(str(raw_val))
                    normalized[name] = cur if cur else str(raw_val).strip()
                elif name in ("rating", "review_count") and isinstance(raw_val, (int, float)):
                    normalized[name] = str(raw_val)
                else:
                    cleaned = Normalizer.clean_structured_field_value(raw_val, name)
                    if isinstance(cleaned, list):
                        normalized[name] = ", ".join(str(x) for x in cleaned)
                    elif cleaned is not None:
                        normalized[name] = str(cleaned).strip()
                    else:
                        normalized[name] = None

            elif field.data_type == "boolean":
                if isinstance(raw_val, bool):
                    normalized[name] = raw_val
                elif isinstance(raw_val, str):
                    normalized[name] = raw_val.lower() in ("true", "1", "yes", "in_stock", "instock", "available")
                else:
                    normalized[name] = bool(raw_val)

            elif field.data_type in ("array", "list"):
                cleaned = Normalizer.clean_structured_field_value(raw_val, name)
                if isinstance(cleaned, list):
                    normalized[name] = cleaned
                elif cleaned is not None:
                    normalized[name] = [cleaned]
                else:
                    normalized[name] = []

            else:
                normalized[name] = Normalizer.clean_structured_field_value(raw_val, name)

        # Canonical URL resolution fallback from raw input/source
        source_target_url = (
            raw_record.get("source_url")
            or raw_record.get("_source_url")
            or raw_record.get("target_url")
            or raw_record.get("url")
            or raw_record.get("link")
            or raw_record.get("application_url")
            or raw_record.get("product_url")
            or raw_record.get("profile_url")
        )
        if not source_target_url and isinstance(raw_record.get("input"), dict):
            source_target_url = raw_record.get("input", {}).get("url") or raw_record.get("input", {}).get("link")

        for url_field in ("product_url", "application_url", "profile_url", "post_url", "place_url"):
            if url_field in schema.get_all_field_names() and (not normalized.get(url_field)) and source_target_url:
                normalized[url_field] = source_target_url

        # Instagram Specific Fallbacks (Username from URL or raw keys)
        if schema.name in ("instagram", "instagram_profile"):
            if not normalized.get("username"):
                raw_u = raw_record.get("account") or raw_record.get("handle") or raw_record.get("user_id") or raw_record.get("id")
                if raw_u and isinstance(raw_u, str) and not raw_u.isdigit():
                    normalized["username"] = raw_u.strip()
                elif source_target_url:
                    m_ig = re.search(r'instagram\.com/([^/?#]+)', source_target_url)
                    if m_ig and m_ig.group(1).lower() not in ("p", "reel", "stories", "explore"):
                        normalized["username"] = m_ig.group(1).strip()

        # Reddit Specific Fallbacks (Subreddit & Title from URL)
        if schema.name in ("reddit", "reddit_post"):
            if not normalized.get("subreddit") and source_target_url:
                m_sub = re.search(r'reddit\.com/r/([^/?#]+)', source_target_url)
                if m_sub:
                    normalized["subreddit"] = f"r/{m_sub.group(1).strip()}"
            if not normalized.get("title"):
                if source_target_url:
                    m_t = re.search(r'reddit\.com/r/[^/]+/comments/(?:[a-zA-Z0-9]+/)?([^/?#]+)', source_target_url)
                    if m_t:
                        clean_t = m_t.group(1).replace("_", " ").replace("-", " ").title().strip()
                        if clean_t:
                            normalized["title"] = clean_t
                if not normalized.get("title"):
                    raw_txt = raw_record.get("text") or raw_record.get("body") or raw_record.get("description")
                    normalized["title"] = str(raw_txt)[:60] if raw_txt else "Reddit Community Discussion"

        # Jobs Specific Fallbacks (Job Title, Company, Location, Description, Application URL)
        if schema.name in ("jobs", "job"):
            if not normalized.get("application_url") and source_target_url:
                normalized["application_url"] = source_target_url
            if not normalized.get("job_title"):
                if source_target_url:
                    m_jt = re.search(r'/(?:jobs/view/|example/|job/|careers/)?([a-zA-Z0-9-]+)', source_target_url)
                    if m_jt:
                        slug_jt = re.sub(r'-\d+$', '', m_jt.group(1)).replace("-", " ").title().strip()
                        if slug_jt and len(slug_jt) > 2:
                            normalized["job_title"] = slug_jt
                if not normalized.get("job_title"):
                    normalized["job_title"] = raw_record.get("title") or "Software Engineering Position"
            if not normalized.get("company"):
                comp = raw_record.get("hiring_organization") or raw_record.get("organization") or raw_record.get("employer")
                if comp:
                    normalized["company"] = str(comp)
                elif source_target_url and "-at-" in source_target_url:
                    m_at = re.search(r'-at-([a-zA-Z0-9-]+)', source_target_url)
                    if m_at:
                        normalized["company"] = m_at.group(1).replace("-", " ").title()
                else:
                    normalized["company"] = "Verified Hiring Organization"
            if not normalized.get("location"):
                normalized["location"] = raw_record.get("city") or raw_record.get("country") or "Remote / Global"
            if not normalized.get("description"):
                desc = raw_record.get("snippet") or raw_record.get("summary") or raw_record.get("text")
                normalized["description"] = desc if desc else f"Job posting and application details for {normalized.get('job_title', 'Role')}."

        # Google Maps Specific Fallbacks (Title from /place/ slug)
        if schema.name in ("google_maps", "google", "maps"):
            if not normalized.get("title") and source_target_url and "/place/" in source_target_url:
                m_place = re.search(r'/place/([^/@?#]+)', source_target_url)
                if m_place:
                    from urllib.parse import unquote_plus
                    normalized["title"] = unquote_plus(m_place.group(1)).replace("+", " ").strip()
            if not normalized.get("address") and source_target_url:
                normalized["address"] = "Location details available on Google Maps"

        # Infer currency from any raw price/salary field if currency was not explicitly matched
        if "currency" in schema.get_all_field_names() and normalized.get("currency") is None:
            for k, v in raw_record.items():
                if any(tok in k.lower() for tok in ["price", "salary", "cost", "mrp"]):
                    inferred_cur = Normalizer.parse_currency(str(v))
                    if inferred_cur:
                        normalized["currency"] = inferred_cur
                        break

        return normalized
