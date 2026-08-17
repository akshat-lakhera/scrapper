import json
import re
import logging
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import unquote_plus, urlparse
from bs4 import BeautifulSoup
from app.models.schema import ScrapeSchema
from app.models.extractor_rule import ExtractorRuleBundle, FieldRule, FieldTrace
from app.extraction.normalizer import Normalizer

class MultiStrategyEngine:
    """
    Multi-strategy website extractor that applies prioritized extraction methods:
    1. Versioned CSS & XPath selectors from ExtractorRuleBundle (domain & template specific)
    2. Schema.org JSON-LD structured blocks
    3. OpenGraph & Semantic Meta Tags
    4. Generic Semantic Heuristics (Microdata, semantic data-* attributes, label proximity, and dynamic token matching)
    
    Selectors are configured and maintained in versioned rule bundles per domain and template signature.
    """

    @staticmethod
    def extract(
        html: str,
        schema: ScrapeSchema,
        target_url: str,
        rule_bundle: Optional[ExtractorRuleBundle] = None
    ) -> Tuple[Dict[str, Any], List[FieldTrace]]:
        soup = BeautifulSoup(html, "html.parser")
        raw_record: Dict[str, Any] = {}
        traces: List[FieldTrace] = []

        # 1. Parse JSON-LD blocks
        json_ld_data = MultiStrategyEngine._extract_json_ld(soup, schema.name)

        # 2. Parse Meta tags
        meta_data = MultiStrategyEngine._extract_meta_tags(soup)

        # 3. Extract each field in schema
        for field in schema.fields:
            name = field.name
            val: Any = None
            strategy_used = "none"
            selector_used = None
            confidence = 0.0

            field_rule: Optional[FieldRule] = rule_bundle.field_rules.get(name) if rule_bundle else None

            # Strategy 1: Versioned CSS Selector from Rule Bundle
            if field_rule and field_rule.primary_css:
                css_val = MultiStrategyEngine._extract_css(soup, field_rule.primary_css, field_rule.attribute)
                if css_val:
                    val = css_val
                    strategy_used = "versioned_css"
                    selector_used = field_rule.primary_css
                    confidence = field_rule.confidence

            # Strategy 1b: Fallback CSS Selectors from Rule Bundle
            if not val and field_rule and field_rule.fallback_css:
                for fallback in field_rule.fallback_css:
                    css_val = MultiStrategyEngine._extract_css(soup, fallback, field_rule.attribute)
                    if css_val:
                        val = css_val
                        strategy_used = "fallback_css"
                        selector_used = fallback
                        confidence = field_rule.confidence * 0.9
                        break

            # Strategy 2: JSON-LD Structured Data
            if not val and json_ld_data:
                j_val = MultiStrategyEngine._resolve_json_ld_field(json_ld_data, name)
                if j_val:
                    val = j_val
                    strategy_used = "json_ld"
                    selector_used = "script[type='application/ld+json']"
                    confidence = 0.98

            # Strategy 3: Meta Tags
            if not val and meta_data:
                m_val = MultiStrategyEngine._resolve_meta_field(meta_data, name)
                if m_val:
                    val = m_val
                    strategy_used = "meta_tags"
                    selector_used = f"meta[{name}]"
                    confidence = 0.90

            # Strategy 4: Generic Semantic Heuristics (Microdata, Structural & Proximity)
            if not val:
                sem_val, sem_sel = MultiStrategyEngine._infer_generic_semantic_dom(soup, name, field.data_type, target_url)
                if sem_val:
                    val = sem_val
                    strategy_used = "semantic_dom"
                    selector_used = sem_sel
                    confidence = 0.75

            # Strategy 5: Target URL for canonical link fields
            if not val and "url" in name:
                val = target_url
                strategy_used = "target_url"
                selector_used = "canonical_url"
                confidence = 1.0

            raw_record[name] = val
            traces.append(FieldTrace(
                field_name=name,
                strategy_used=strategy_used,
                selector_used=selector_used,
                raw_value=val,
                is_valid=val is not None,
                confidence=confidence if val is not None else 0.0
            ))

        # Inject canonical URLs into raw record
        raw_record["source_url"] = target_url
        raw_record["target_url"] = target_url

        # Normalize the extracted dictionary against the schema definition
        normalized_record = Normalizer.normalize_record(raw_record, schema)
        normalized_record["source_url"] = target_url

        # Update normalized values in traces
        for trace in traces:
            trace.normalized_value = normalized_record.get(trace.field_name)

        return normalized_record, traces

    @staticmethod
    def _extract_json_ld(soup: BeautifulSoup, schema_type: str) -> Dict[str, Any]:
        """Extracts and parses Schema.org JSON-LD blocks."""
        combined: Dict[str, Any] = {}
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string.strip())
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        if "@graph" in item and isinstance(item["@graph"], list):
                            for g in item["@graph"]:
                                if isinstance(g, dict):
                                    combined.update(g)
                        else:
                            combined.update(item)
            except Exception:
                continue
        return combined

    @staticmethod
    def _resolve_json_ld_field(json_ld: Dict[str, Any], field_name: str) -> Optional[Any]:
        if field_name == "title":
            return json_ld.get("name") or json_ld.get("headline")
        if field_name == "price":
            offers = json_ld.get("offers")
            if isinstance(offers, dict):
                return offers.get("price") or offers.get("lowPrice")
            elif isinstance(offers, list) and offers:
                return offers[0].get("price")
            return json_ld.get("price")
        if field_name == "currency":
            offers = json_ld.get("offers")
            if isinstance(offers, dict):
                return offers.get("priceCurrency")
            elif isinstance(offers, list) and offers:
                return offers[0].get("priceCurrency")
            return json_ld.get("priceCurrency")
        if field_name == "availability":
            offers = json_ld.get("offers")
            if isinstance(offers, dict):
                return offers.get("availability")
            return json_ld.get("availability")
        if field_name == "rating":
            rating = json_ld.get("aggregateRating")
            if isinstance(rating, dict):
                return rating.get("ratingValue")
            return json_ld.get("ratingValue")
        if field_name == "review_count":
            rating = json_ld.get("aggregateRating")
            if isinstance(rating, dict):
                return rating.get("reviewCount") or rating.get("ratingCount")
            return json_ld.get("reviewCount")
        if field_name in ("seller", "brand"):
            brand = json_ld.get("brand") or json_ld.get("seller")
            if isinstance(brand, dict):
                return brand.get("name")
            return brand

        # Job field resolution
        if field_name == "job_title":
            return json_ld.get("title") or json_ld.get("name")
        if field_name == "company":
            org = json_ld.get("hiringOrganization")
            if isinstance(org, dict):
                return org.get("name")
            return json_ld.get("hiringOrganization")
        if field_name == "location":
            loc = json_ld.get("jobLocation")
            if isinstance(loc, dict):
                addr = loc.get("address")
                if isinstance(addr, dict):
                    return f"{addr.get('addressLocality', '')}, {addr.get('addressCountry', '')}".strip(", ")
                return loc.get("name")
            return loc
        if field_name == "salary":
            sal = json_ld.get("baseSalary")
            if isinstance(sal, dict):
                val = sal.get("value")
                if isinstance(val, dict):
                    return f"{val.get('value')} {sal.get('currency', '')}"
                return sal.get("value")
            return sal
        if field_name == "description":
            return json_ld.get("description")
        if field_name == "posted_date":
            return json_ld.get("datePosted")

        return json_ld.get(field_name)

    @staticmethod
    def _extract_meta_tags(soup: BeautifulSoup) -> Dict[str, str]:
        meta_dict: Dict[str, str] = {}
        for meta in soup.find_all("meta"):
            name = meta.get("property") or meta.get("name") or meta.get("itemprop")
            content = meta.get("content")
            if name and content:
                meta_dict[name.lower()] = content.strip()
        return meta_dict

    @staticmethod
    def _resolve_meta_field(meta: Dict[str, str], field_name: str) -> Optional[str]:
        og_title = meta.get("og:title") or meta.get("twitter:title") or meta.get("title") or ""
        og_desc = meta.get("og:description") or meta.get("twitter:description") or meta.get("description") or ""

        # Specialized Job Field Parsing (LinkedIn, Indeed, Lever, etc.)
        if field_name == "job_title":
            m_title = re.search(r'hiring\s+(.+?)(?:\s+in\s+|\s+\|\s*LinkedIn|$)', og_title, re.I)
            if m_title:
                return m_title.group(1).strip()
            if 'Job Title:' in og_desc:
                m_jt = re.search(r'Job Title:\s*([^E\n]+?)(?:Experience:|Location:|Company:|\.|$)', og_desc, re.I)
                if m_jt:
                    return m_jt.group(1).strip()
            if og_title:
                clean_t = re.sub(r'\s*\|\s*LinkedIn.*$', '', og_title, flags=re.I)
                clean_t = re.sub(r'^(.+?)\s+hiring\s+', '', clean_t, flags=re.I)
                clean_t = re.sub(r'\s+in\s+.+$', '', clean_t, flags=re.I).strip()
                if clean_t:
                    return clean_t

        if field_name == "company":
            m_comp = re.search(r'^(.+?)(?:\s+hiring\s+)', og_title, re.I)
            if m_comp:
                return m_comp.group(1).strip()
            if 'Company:' in og_desc:
                m_c = re.search(r'Company:\s*([^.\n]+)', og_desc, re.I)
                if m_c:
                    return m_c.group(1).strip()
            site_n = meta.get("og:site_name")
            if site_n and site_n.lower() not in ("linkedin", "indeed", "glassdoor", "lever", "greenhouse"):
                return site_n
            return None

        if field_name == "location":
            if 'Location:' in og_desc:
                m_loc = re.search(r'Location:\s*([^C\n]+?)(?:Company:|\.|$)', og_desc, re.I)
                if m_loc:
                    return m_loc.group(1).strip()
            m_loc2 = re.search(r'\sin\s+(.+?)(?:\s+\|\s*LinkedIn|$)', og_title, re.I)
            if m_loc2:
                return m_loc2.group(1).strip()

        # Google Maps metadata parsing
        if field_name in ("title", "place_name") and ("google" in meta.get("og:site_name", "").lower() or "maps" in meta.get("og:url", "").lower()):
            if og_title:
                clean_m = re.sub(r'\s*-\s*Google Maps.*$', '', og_title, flags=re.I).strip()
                if clean_m and clean_m.lower() != "google maps":
                    return clean_m
            if og_desc and "·" in og_desc:
                parts = [p.strip() for p in og_desc.split("·")]
                if parts and not parts[0].startswith(("★", "http")):
                    return parts[0]

        if field_name == "address":
            if og_desc:
                # Often in Google Maps: "★★★★☆ · Restaurant · Winckelmannstraße 16, 39108 Magdeburg"
                if "·" in og_desc:
                    parts = [p.strip() for p in og_desc.split("·")]
                    # Address is typically the last non-empty part
                    for p in reversed(parts):
                        if any(c.isdigit() for c in p) and len(p) > 5:
                            return p
                return og_desc.strip()

        # Specialized Social / LinkedIn Profile / Post Parsing
        if field_name in ("name", "user_posted", "author", "username"):
            # X / Twitter
            m_x = re.search(r'^(.+?)(?:\s*\(@[a-zA-Z0-9_]+\)|\s+on\s+X|\s*/\s*X|$)', og_title, re.I)
            if m_x and m_x.group(1).strip() and not m_x.group(1).strip().lower().startswith(('see ', 'login', 'sign in')):
                return m_x.group(1).strip()
            # Instagram
            m_ig = re.search(r'^(.+?)(?:\s*\(@[a-zA-Z0-9_.]+\)|\s*•\s*Instagram|$)', og_title, re.I)
            if m_ig and m_ig.group(1).strip() and not m_ig.group(1).strip().lower().startswith(('see ', 'login', 'sign in')):
                return m_ig.group(1).strip()
            # LinkedIn Post / Profile
            m_name = re.search(r'See\s+(.+?)[’\']s activity', og_title, re.I)
            if m_name:
                return m_name.group(1).strip()
            m_author = re.search(r'^(.+?)(?:\s+on\s+LinkedIn|\s+posted\s+|\s*-\s*)', og_title, re.I)
            if m_author and not m_author.group(1).strip().lower().startswith(('see ', 'login', 'sign in')):
                return m_author.group(1).strip()
            return meta.get("author") or meta.get("twitter:creator") or meta.get("profile:first_name")

        if field_name == "headline":
            if og_title:
                return re.sub(r'\s*\|\s*LinkedIn.*$', '', og_title, flags=re.I).strip()

        if field_name in ("about", "biography", "post_text", "body_text"):
            if og_desc:
                return og_desc.strip()

        if field_name == "subreddit":
            m_sub = re.search(r'r/([a-zA-Z0-9_]+)', og_title, re.I)
            if m_sub:
                return m_sub.group(1).strip()

        if field_name == "title":
            clean_t = re.sub(r'\s*:\s*r/[a-zA-Z0-9_]+.*$', '', og_title, flags=re.I)
            clean_t = re.sub(r'\s*-\s*Google Maps.*$', '', clean_t, flags=re.I)
            clean_t = re.sub(r'\s*\|\s*LinkedIn.*$', '', clean_t, flags=re.I)
            if clean_t.strip():
                return clean_t.strip()

        # Follower & Engagement metrics parsed from OpenGraph summaries
        if field_name == "followers_count":
            m_f = re.search(r'([0-9.,]+[KMBkmb]?)\s+Followers', og_desc, re.I)
            if m_f:
                return m_f.group(1)
        if field_name == "following_count":
            m_fg = re.search(r'([0-9.,]+[KMBkmb]?)\s+Following', og_desc, re.I)
            if m_fg:
                return m_fg.group(1)
        if field_name == "posts_count":
            m_p = re.search(r'([0-9.,]+[KMBkmb]?)\s+Posts', og_desc, re.I)
            if m_p:
                return m_p.group(1)
        if field_name in ("likes", "likes_count"):
            m_l = re.search(r'([0-9.,]+[KMBkmb]?)\s+Likes', og_desc, re.I)
            if m_l:
                return m_l.group(1)

        lookup: Dict[str, List[str]] = {
            "title": ["og:title", "twitter:title", "title"],
            "job_title": ["og:title", "twitter:title", "job:title"],
            "description": ["og:description", "twitter:description", "description"],
            "price": ["product:price:amount", "og:price:amount", "price"],
            "currency": ["product:price:currency", "og:price:currency", "currency"],
            "seller": ["og:site_name", "product:brand", "author"],
            "company": ["og:site_name", "author"],
            "image_url": ["og:image", "twitter:image"],
            "product_url": ["og:url", "canonical"],
            "application_url": ["og:url", "canonical"],
            "profile_url": ["og:url", "canonical"],
            "post_url": ["og:url", "canonical"],
            "place_url": ["og:url", "canonical"],
            "address": ["og:description", "place:location:address", "description"]
        }
        candidates = lookup.get(field_name, [field_name])
        for cand in candidates:
            if cand in meta:
                return meta[cand]
        return None

    @staticmethod
    def _extract_css(soup: BeautifulSoup, selector: str, attribute: Optional[str] = None) -> Optional[str]:
        try:
            elem = soup.select_one(selector)
            if not elem:
                return None
            if attribute:
                return elem.get(attribute)
            return elem.get_text(separator=" ", strip=True)
        except Exception:
            return None

    @staticmethod
    def _infer_generic_semantic_dom(soup: BeautifulSoup, field_name: str, data_type: str, target_url: str = "") -> Tuple[Optional[str], Optional[str]]:
        """
        Generic semantic heuristics based on Microdata, data-* attributes,
        semantic HTML5 tags, regex token matching, and label proximity.
        """
        # 1. Schema.org Microdata itemprop
        elem = soup.select_one(f"[itemprop='{field_name}']")
        if elem:
            return elem.get("content") or elem.get_text(strip=True), f"[itemprop='{field_name}']"

        # 2. Generic data-* attributes matching field name
        elem = soup.select_one(f"[data-{field_name}], [data-testid='{field_name}'], [data-automation='{field_name}']")
        if elem:
            return elem.get(f"data-{field_name}") or elem.get_text(strip=True), f"[data-{field_name}]"

        # 3. HTML5 Headings for Title / Heading Fields
        if field_name in ("title", "job_title", "place_name"):
            # Google Maps URL extraction fallback
            if ("google.com/maps" in target_url or "maps.google." in target_url) and "/place/" in target_url:
                m_place = re.search(r'/place/([^/@?#]+)', target_url)
                if m_place:
                    clean_place = unquote_plus(m_place.group(1)).replace("+", " ").strip()
                    if clean_place:
                        return clean_place, "google_maps_url_slug"

            # LinkedIn Job URL extraction fallback
            if "linkedin.com/jobs/view/" in target_url:
                m_job_slug = re.search(r'/jobs/view/([a-zA-Z0-9-]+?)(?:-at-|-in-|\d|$)', target_url)
                if m_job_slug:
                    slug_text = m_job_slug.group(1).replace("-", " ").strip().title()
                    if slug_text and not slug_text.isdigit() and len(slug_text) > 4:
                        return slug_text, "linkedin_url_slug"

            h1 = soup.select_one("h1, .top-card-layout__title, .job-details-jobs-unified-top-card__job-title")
            if h1 and len(h1.get_text(strip=True)) > 3:
                clean_h1 = re.sub(r'\s*\|\s*LinkedIn.*$', '', h1.get_text(strip=True), flags=re.I).strip()
                if clean_h1.lower() not in ("linkedin", "google maps", "sign in", "join linkedin"):
                    return clean_h1, "h1"

            title_tag = soup.select_one("title")
            if title_tag and len(title_tag.get_text(strip=True)) > 3:
                clean_title = re.sub(r'\s*\|\s*LinkedIn.*$', '', title_tag.get_text(strip=True), flags=re.I)
                clean_title = re.sub(r'\s*-\s*Google Maps.*$', '', clean_title, flags=re.I).strip()
                if clean_title.lower() not in ("linkedin", "google maps", "sign in", "join linkedin"):
                    return clean_title, "title_tag"

        # LinkedIn Company DOM Heuristics
        if field_name == "company":
            comp_elem = soup.select_one(".topcard__org-name-link, [data-tracking-control-name='public_jobs_topcard-org-name'], .sub-nav-cta__sub-title, .job-details-jobs-unified-top-card__company-name")
            if comp_elem and comp_elem.get_text(strip=True):
                return comp_elem.get_text(strip=True), "linkedin_company_class"
            if "linkedin.com/jobs" in target_url:
                m_comp_url = re.search(r'-at-([a-zA-Z0-9-]+?)(?:-in-|-|\d|$)', target_url)
                if m_comp_url:
                    comp_name = m_comp_url.group(1).replace("-", " ").strip().title()
                    if comp_name:
                        return comp_name, "linkedin_company_slug"
            title_tag = soup.select_one("title")
            if title_tag:
                m_hiring = re.search(r'^(.+?)\s+hiring\s+', title_tag.get_text(strip=True), re.I)
                if m_hiring:
                    return m_hiring.group(1).strip(), "title_hiring_company"

        # LinkedIn Location DOM Heuristics
        if field_name == "location":
            loc_elem = soup.select_one(".topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet, [data-tracking-control-name='public_jobs_topcard-location']")
            if loc_elem and loc_elem.get_text(strip=True):
                return loc_elem.get_text(strip=True), "linkedin_location_class"

        # LinkedIn & General Description DOM Heuristics
        if field_name in ("description", "job_description", "post_text", "body_text"):
            desc_elem = soup.select_one(".show-more-less-html__markup, .description__text, .job-details-jobs-unified-top-card__description, [data-testid='tweetText'], article p")
            if desc_elem and len(desc_elem.get_text(strip=True)) > 5:
                return desc_elem.get_text(strip=True), "semantic_description_class"

        # 4. Proximity Text Anchor (find label/span/dt containing the field name)
        for label_tag in soup.find_all(["label", "dt", "span", "th"], limit=40):
            txt = label_tag.get_text(strip=True).lower()
            if field_name.replace("_", " ") in txt and len(txt) < 30:
                sibling = label_tag.find_next_sibling(["span", "dd", "td", "div", "p"])
                if sibling and sibling.get_text(strip=True):
                    val = sibling.get_text(strip=True)
                    if data_type in ("number", "integer") and not re.search(r"\d", val):
                        continue
                    return val, f"{label_tag.name} ~ {sibling.name}"

        # 5. Dynamic class token synonyms
        token_synonyms = {
            "title": ["title", "heading", "name"],
            "job_title": ["job-title", "job_title", "title", "position", "role"],
            "price": ["price", "product-price", "offer-price", "saleprice"],
            "currency": ["currency", "curr"],
            "availability": ["availability", "stock", "inventory"],
            "rating": ["rating", "stars", "score"],
            "review_count": ["review-count", "reviews", "review_count", "count"],
            "seller": ["seller-name", "seller", "brand", "vendor", "merchant"],
            "company": ["company-name", "company", "employer", "organization"],
            "location": ["job-location", "location", "city", "place", "address"],
            "salary": ["salary", "compensation", "wage", "pay"],
            "description": ["job-description", "description", "summary", "about", "details"]
        }

        synonyms = token_synonyms.get(field_name, [field_name.replace("_", "-")])
        for syn in synonyms:
            token_pat = re.compile(rf"\b{re.escape(syn)}\b", re.I)
            for elem in soup.find_all(attrs={"class": token_pat}):
                if "url" in field_name:
                    txt = elem.get("href") or elem.get("src") or elem.get("content") or target_url
                elif elem.name == "a":
                    txt = elem.get("href") or elem.get_text(strip=True)
                elif elem.name == "img":
                    txt = elem.get("src") or elem.get_text(strip=True)
                else:
                    txt = elem.get_text(separator=" ", strip=True)

                if txt and len(txt) > 0:
                    if data_type in ("number", "integer") and not re.search(r"\d", txt):
                        continue
                    cls_name = " ".join(elem.get("class", []))
                    return txt, f".{cls_name.split()[0]}"

        return None, None
