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
            clean = val.replace(",", "")
            # Look for "4.5 out of 5" pattern
            out_of_m = re.search(r"(\d+(?:\.\d+)?)\s*(?:out of|/)\s*\d+", clean, re.I)
            if out_of_m:
                try:
                    return float(out_of_m.group(1))
                except ValueError:
                    pass

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
            "title": ["productname", "itemtitle", "heading", "producttitle", "displayname", "itemname"],
            "job_title": ["position", "role", "designation", "jobrole", "jobheading", "opening", "jobtitle"],
            "company": ["employer", "hiringorganization", "organization", "agency", "firm", "businessname", "employername", "currentcompany"],
            "location": ["joblocation", "city", "place", "worklocation", "addresslocality", "region"],
            "salary": ["compensation", "payrate", "basesalary", "stipend", "remuneration", "wage", "salarypill"],
            "availability": ["stockstatus", "instock", "stock", "inventory", "itemavailability"],
            "rating": ["reviewscore", "ratingvalue", "stars", "aggregaterating", "score", "reviewsrating"],
            "review_count": ["reviews", "numreviews", "totalreviews", "ratingscount", "reviewcount", "reviewscount"],
            "seller": ["merchant", "vendor", "soldby", "brand", "shopname"],
            "description": ["details", "summary", "jobdescription", "productdescription", "about", "posttext", "biography"],
            "post_id": ["tweetid", "statusid", "entryid", "itemid"],
            "author_username": ["handle", "screenname", "userhandle", "profilehandle", "userposted", "username"],
            "author_name": ["fullname", "displayname", "creatorname", "pagename", "name"],
            "likes": ["favorites", "hearts", "likecount", "numlikes", "likescount", "likes"],
            "likes_count": ["favorites", "hearts", "likecount", "numlikes", "likes"],
            "reposts": ["shares", "reposts", "retweetcount", "numshares", "retweets", "sharescount"],
            "retweets_count": ["shares", "reposts", "retweetcount", "numshares", "retweets", "sharescount"],
            "replies": ["comments", "commentscount", "numcomments", "replies"],
            "replies_count": ["comments", "commentscount", "numcomments", "replies"],
            "followers_count": ["followers", "subscribercount", "connections"],
            "place_name": ["business", "storename", "placename", "venue"]
        }

        for target_field, synonyms in semantic_map.items():
            if target_field in field_names:
                if any(syn == clean_key or syn in clean_key for syn in synonyms):
                    return target_field

        # 4. Fuzzy similarity fallback (>= 0.70 ratio)
        matches = difflib.get_close_matches(raw_key.lower(), field_names, n=1, cutoff=0.70)
        if matches:
            return matches[0]

        return None

    @staticmethod
    def normalize_record(raw_record: Dict[str, Any], schema: ScrapeSchema) -> Dict[str, Any]:
        """
        Normalizes arbitrary raw dictionary into target schema with type coercion.
        """
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
                    cleaned = str(raw_val).strip()
                    normalized[name] = cleaned if len(cleaned) > 0 else None

            elif field.data_type == "boolean":
                if isinstance(raw_val, bool):
                    normalized[name] = raw_val
                elif isinstance(raw_val, str):
                    normalized[name] = raw_val.lower() in ("true", "1", "yes", "in_stock", "instock", "available")
                else:
                    normalized[name] = bool(raw_val)
            else:
                normalized[name] = raw_val

        # Infer currency from any raw price/salary field if currency was not explicitly matched
        if "currency" in schema.get_all_field_names() and normalized.get("currency") is None:
            for k, v in raw_record.items():
                if any(tok in k.lower() for tok in ["price", "salary", "cost", "mrp"]):
                    inferred_cur = Normalizer.parse_currency(str(v))
                    if inferred_cur:
                        normalized["currency"] = inferred_cur
                        break

        return normalized
