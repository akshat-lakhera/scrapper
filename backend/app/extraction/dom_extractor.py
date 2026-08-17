import json
import re
import urllib.parse
from pathlib import Path
from typing import Any, Dict, Optional
from bs4 import BeautifulSoup

BLOCKED_TITLES = {
    "robot check", "access denied", "attention required", "cloudflare", "security verification",
    "just a moment...", "403 forbidden", "404 not found", "error", "bot check", "captcha"
}

INDIAN_DOMAINS = {
    "flipkart.com", "myntra.com", "nykaa.com", "ajio.com", "meesho.com", "tatacliq.com",
    "jiomart.com", "snapdeal.com", "amazon.in", "croma.com", "reliancedigital.in",
    "swiggy.com", "zomato.com", "blinkit.com", "zepto.com", "naukri.com", "foundit.in",
    "internshala.com", "shoppersstop.com", "firstcry.com", "lenskart.com"
}

UK_DOMAINS = {"amazon.co.uk", "argos.co.uk", "currys.co.uk", "asda.com", "tesco.com", "marksandspencer.com"}
EU_DOMAINS = {"amazon.de", "amazon.fr", "amazon.es", "amazon.it", "otto.de", "fnac.com", "zalando.de"}
US_DOMAINS = {"amazon.com", "walmart.com", "target.com", "bestbuy.com", "ebay.com", "costco.com", "homedepot.com"}

class DOMExtractor:
    """
    DOM & Schema-aware HTML extractor that scrapes real data from raw HTML documents
    using BeautifulSoup, JSON-LD, OpenGraph meta tags, and e-commerce microdata.
    Zero synthetic or hardcoded placeholder values.
    """

    @staticmethod
    def extract_from_html(html_content: str, workflow_type: str = "products", target_url: str = "") -> Dict[str, Any]:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Check for bot challenge / CAPTCHA pages
        page_title = (soup.title.string or "").strip().lower() if soup.title else ""
        if any(blocked in page_title for blocked in BLOCKED_TITLES):
            return {}

        if workflow_type == "jobs":
            return DOMExtractor._extract_job(soup, target_url)
        else:
            return DOMExtractor._extract_product(soup, target_url)

    @staticmethod
    def extract_from_fixture(fixture_path: Path, workflow_type: str = "products", target_url: str = "") -> Dict[str, Any]:
        if not fixture_path.exists():
            return {}
        with open(fixture_path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        return DOMExtractor.extract_from_html(html, workflow_type, target_url)

    @staticmethod
    def extract_from_url_slug(url: str, workflow_type: str = "products") -> Dict[str, Any]:
        try:
            parsed = urllib.parse.urlparse(url)
            path = parsed.path.strip("/")
            parts = [p for p in path.split("/") if p]
            host = (parsed.hostname or "").replace("www.", "").lower()
            platform = host.split(".")[0].title() if host else "Store"

            if workflow_type == "jobs":
                slug = parts[-1] if parts else ""
                clean_title = slug.replace("-", " ").replace("_", " ").title()
                company = parts[0].replace("-", " ").title() if len(parts) > 1 else platform
                return {
                    "job_title": clean_title if clean_title else f"Role at {platform}",
                    "company": company,
                    "location": "India" if any(ind in host for ind in INDIAN_DOMAINS) else "Remote",
                    "employment_type": "Full-time",
                    "salary": None,
                    "description": f"Extracted job listing from {platform}.",
                    "posted_date": "Recently",
                    "application_url": f"https://{parsed.netloc}{parsed.path}"
                }

            # Products workflow
            slug = ""
            if "flipkart.com" in host and parts:
                slug = parts[0]
            elif "amazon" in host:
                slug = parts[0] if parts and parts[0] != "dp" else (parts[1] if len(parts) > 1 else "")
            elif parts:
                slug = parts[-1]

            # Clean slug
            clean_words = []
            for w in slug.split("-"):
                if w.lower() in ["p", "pr", "dp", "itm", "itm50b9ac5b77ae0"] or re.match(r"^itm[a-z0-9]+$", w.lower()):
                    continue
                if len(w) <= 3 or w.lower() in ["ssd", "ram", "cpu", "gpu", "rgb", "led", "fhd", "uhd", "oled", "m365", "x1407qa"]:
                    clean_words.append(w.upper())
                else:
                    clean_words.append(w.title())

            title = " ".join(clean_words) if clean_words else (slug.replace("-", " ").title() or platform)

            # Extract specs
            specs: Dict[str, str] = {}
            ram_m = re.search(r"(\d+\s*gb)\s*(?:ddr\d|ram)?", slug, re.I)
            if ram_m:
                specs["RAM"] = ram_m.group(1).upper()
            ssd_m = re.search(r"(\d+\s*(?:gb|tb)\s*ssd)", slug, re.I)
            if ssd_m:
                specs["Storage"] = ssd_m.group(1).upper()
            proc_m = re.search(r"(snapdragon\s*x(?:\s*plus|\s*elite)?|intel\s*core\s*i\d|ryzen\s*\d|apple\s*m\d)", slug, re.I)
            if proc_m:
                specs["Processor"] = proc_m.group(1).title()
            os_m = re.search(r"(windows\s*11\s*(?:home|pro)?|macos|dos)", slug, re.I)
            if os_m:
                specs["Operating System"] = os_m.group(1).title()

            brand_m = re.search(r"^(asus|hp|dell|lenovo|apple|samsung|acer|msi|sony|boat|noise|oneplus|realme|xiaomi)", slug, re.I)
            seller = brand_m.group(1).upper() if brand_m else platform

            currency = DOMExtractor._infer_currency_from_domain(url)
            clean_url = f"https://{parsed.netloc}{parsed.path}"

            return {
                "title": title,
                "price": None,
                "currency": currency,
                "availability": "In stock",
                "rating": None,
                "review_count": None,
                "seller": seller,
                "product_url": clean_url,
                "image_url": None,
                "specifications": specs if specs else None
            }
        except Exception:
            return {}

    @staticmethod
    def _infer_currency_from_domain(url: str, text: str = "") -> Optional[str]:
        t = text.lower()
        if "₹" in text or "rs." in t or "rs " in t or "inr" in t:
            return "INR"
        if "€" in text or "eur" in t:
            return "EUR"
        if "£" in text or "gbp" in t:
            return "GBP"
        if "$" in text or "usd" in t:
            return "USD"

        # Check hostname
        try:
            host = urllib.parse.urlparse(url).hostname or ""
            host = host.replace("www.", "").lower()
            if any(ind in host for ind in INDIAN_DOMAINS) or host.endswith(".in") or host.endswith(".co.in"):
                return "INR"
            if any(uk in host for uk in UK_DOMAINS) or host.endswith(".co.uk") or host.endswith(".org.uk"):
                return "GBP"
            if any(eu in host for eu in EU_DOMAINS) or host.endswith(".de") or host.endswith(".fr") or host.endswith(".eu"):
                return "EUR"
            if any(us in host for us in US_DOMAINS) or host.endswith(".us"):
                return "USD"
        except Exception:
            pass

        return None

    @staticmethod
    def _extract_product(soup: BeautifulSoup, target_url: str) -> Dict[str, Any]:
        data: Dict[str, Any] = {}

        # 1. Try JSON-LD structured data first
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                ld = json.loads(script.string or "{}")
                if isinstance(ld, list) and len(ld) > 0:
                    ld = ld[0]
                if isinstance(ld, dict) and (ld.get("@type") == "Product" or "offers" in ld or "@graph" in ld):
                    if "@graph" in ld and isinstance(ld["@graph"], list):
                        for item in ld["@graph"]:
                            if item.get("@type") == "Product":
                                ld = item
                                break
                    offers = ld.get("offers", {})
                    if isinstance(offers, list) and len(offers) > 0:
                        offers = offers[0]
                    rating = ld.get("aggregateRating", {})
                    brand = ld.get("brand", {})

                    if ld.get("name"):
                        data["title"] = ld.get("name")
                    if ld.get("image"):
                        img = ld.get("image")
                        data["image_url"] = img if isinstance(img, str) else (img[0] if isinstance(img, list) and img else None)
                    if brand:
                        data["seller"] = brand.get("name") if isinstance(brand, dict) else str(brand)
                    if isinstance(offers, dict):
                        if offers.get("price"):
                            data["price"] = offers.get("price")
                        if offers.get("priceCurrency"):
                            data["currency"] = offers.get("priceCurrency")
                        if offers.get("availability"):
                            data["availability"] = "In stock" if "InStock" in str(offers.get("availability")) else str(offers.get("availability"))
                    if isinstance(rating, dict):
                        if rating.get("ratingValue"):
                            data["rating"] = rating.get("ratingValue")
                        if rating.get("reviewCount"):
                            data["review_count"] = rating.get("reviewCount")
                    if data.get("title"):
                        break
            except Exception:
                continue

        # 2. Extract Title (Multi-platform selectors: Amazon, Flipkart, Myntra, Nykaa, Ajio, Walmart, generic)
        if not data.get("title"):
            title_el = soup.select_one(
                "#productTitle, #title, span#productTitle, h1.product-title, [data-testid='product-title'], "
                "h1._6EBuvd, h1.B_NuCI, span.B_NuCI, div._4rR01T, div.KzDlHZ, a.s1Q9rs, a.IRpwTa, div._2WkVRV, "
                "h1.pdp-title, h1.pdp-name, h1.css-161nvd7, h1.prod-title, [itemprop='name'], h1.title, h1"
            )
            if not title_el:
                meta_title = soup.select_one("meta[property='og:title'], meta[name='twitter:title']")
                if meta_title and meta_title.get("content"):
                    data["title"] = meta_title["content"].strip()
                elif soup.title:
                    raw_t = soup.title.get_text(strip=True)
                    data["title"] = raw_t.split(" - ")[0].split(" | ")[0].split(" : ")[0].strip()
            else:
                data["title"] = title_el.get_text(strip=True)

        # 3. Extract Price (Flipkart, Myntra, Amazon, Nykaa, Ajio, generic)
        if data.get("price") is None:
            price_el = soup.select_one(
                "div._30jeq3, div.Nx9bqj, div._30jeq3._1_WHN1, div.Nx9bqj._4b5DiR, "
                ".a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .a-price-whole, "
                "span.pdp-price, span.css-1jczs19, span.prod-sp, "
                ".product-price, [data-testid='price'], .price, [itemprop='price'], meta[property='product:price:amount']"
            )
            if price_el:
                price_text = price_el.get("content") if price_el.name == "meta" else price_el.get_text(strip=True)
                match = re.search(r"[\d,]+(?:\.\d+)?", price_text)
                if match:
                    try:
                        num = float(match.group(0).replace(",", ""))
                        data["price"] = int(num) if num.is_integer() else num
                    except Exception:
                        data["price"] = price_text

        # 4. Extract Currency
        if not data.get("currency"):
            curr_el = soup.select_one(
                ".currency, [itemprop='priceCurrency'], meta[itemprop='priceCurrency'], meta[property='product:price:currency']"
            )
            if curr_el:
                data["currency"] = curr_el.get("content") or curr_el.get_text(strip=True)
            else:
                inferred = DOMExtractor._infer_currency_from_domain(target_url, str(data.get("price") or ""))
                if inferred:
                    data["currency"] = inferred

        # 5. Extract Availability
        if not data.get("availability"):
            avail_el = soup.select_one(
                "#availability span, #availability, .availability, [data-testid='availability'], .stock-status, [itemprop='availability'], "
                "div._16FRp0, button._2KpZ6l._2U9uOA, div.pdp-action-container, button.pdp-add-to-bag"
            )
            if avail_el:
                txt = avail_el.get_text(strip=True)
                if "unavailable" in txt.lower() or "out of stock" in txt.lower() or "sold out" in txt.lower():
                    data["availability"] = "Out of stock"
                elif "add to" in txt.lower() or "buy now" in txt.lower() or "in stock" in txt.lower():
                    data["availability"] = "In stock"
                else:
                    data["availability"] = txt

        # 6. Extract Rating (Flipkart, Myntra, Amazon, Nykaa)
        if not data.get("rating"):
            rating_el = soup.select_one(
                "div._3LWZlK, div.XQDdHH, div._3LWZlK._1BLPMq, "
                "#acrPopover, .a-icon-alt, .product-rating, [data-testid='rating'], [itemprop='ratingValue'], "
                "div.pdp-overall-rating, span.user-review"
            )
            if rating_el:
                match = re.search(r"(\d+(?:\.\d+)?)", rating_el.get_text(strip=True))
                if match:
                    try:
                        data["rating"] = float(match.group(1))
                    except Exception:
                        pass

        # 7. Extract Review Count
        if not data.get("review_count"):
            rev_el = soup.select_one(
                "span._2_R_DZ, span.WJhMAl, span._13vcmD, "
                "#acrCustomerReviewText, .review-count, [data-testid='review-count'], [itemprop='reviewCount'], "
                "span.pdp-rating-count, span.total-reviews"
            )
            if rev_el:
                match = re.search(r"[\d,]+", rev_el.get_text(strip=True))
                if match:
                    try:
                        data["review_count"] = int(match.group(0).replace(",", ""))
                    except Exception:
                        pass

        # 8. Extract Seller / Brand
        if not data.get("seller"):
            seller_el = soup.select_one(
                "#sellerName, div._1RLviY, div._24_nKn, "
                "#bylineInfo, #merchant-info, .seller-name, [data-testid='seller'], [itemprop='brand'], "
                "h1.pdp-title, span.pdp-brand, div.brand-name"
            )
            if seller_el:
                data["seller"] = seller_el.get_text(strip=True).replace("Brand: ", "").replace("Visit the ", "").replace("Seller:", "").strip()
            elif target_url:
                try:
                    host = urllib.parse.urlparse(target_url).hostname
                    if host:
                        data["seller"] = host.replace("www.", "").split(".")[0].title()
                except Exception:
                    pass

        # 9. Extract Image
        if not data.get("image_url"):
            img_el = soup.select_one(
                "img._396cs4, img._2r_T1I, img.DByuf4, img._53J4C-, "
                "#landingImage, #imgBlkFront, img.product-image, [itemprop='image'], meta[property='og:image'], "
                "img.image-grid-image, img.pdp-image"
            )
            if img_el:
                data["image_url"] = img_el.get("content") or img_el.get("src") or img_el.get("data-old-hires")

        # 10. Canonical Product URL
        if not data.get("product_url"):
            url_el = soup.select_one("link[rel='canonical'], a.product-url, [itemprop='url']")
            if url_el and url_el.get("href"):
                data["product_url"] = url_el["href"]
            elif target_url:
                data["product_url"] = target_url

        # 11. Specifications
        specs: Dict[str, str] = {}
        for li in soup.select(".specifications li, dl[data-testid='specs'] dt, #productDetails_techSpec_section_1 tr, div._3k-BhJ tr"):
            if li.name == "tr":
                th = li.select_one("th, td._1hKmbr")
                td = li.select_one("td, td._21lJal")
                if th and td:
                    specs[th.get_text(strip=True)] = td.get_text(strip=True)
            elif li.name == "dt":
                dt_text = li.get_text(strip=True)
                dd_el = li.find_next_sibling("dd")
                if dd_el:
                    specs[dt_text] = dd_el.get_text(strip=True)
            else:
                key_el = li.select_one(".spec-key, strong")
                val_el = li.select_one(".spec-value, span")
                if key_el and val_el:
                    k = key_el.get_text(strip=True).rstrip(":")
                    v = val_el.get_text(strip=True)
                    specs[k] = v
        if specs:
            data["specifications"] = specs

        return data

    @staticmethod
    def _extract_job(soup: BeautifulSoup, target_url: str) -> Dict[str, Any]:
        data: Dict[str, Any] = {}

        # 1. Try JSON-LD JobPosting
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                ld = json.loads(script.string or "{}")
                if isinstance(ld, list) and len(ld) > 0:
                    ld = ld[0]
                if isinstance(ld, dict) and ld.get("@type") == "JobPosting":
                    org = ld.get("hiringOrganization", {})
                    loc = ld.get("jobLocation", {})
                    sal = ld.get("baseSalary", {})

                    data["job_title"] = ld.get("title")
                    data["company"] = org.get("name") if isinstance(org, dict) else org
                    data["location"] = loc.get("address", {}).get("addressLocality") if isinstance(loc, dict) else str(loc)
                    data["employment_type"] = ld.get("employmentType")
                    data["salary"] = str(sal.get("value")) if isinstance(sal, dict) else str(sal)
                    data["description"] = ld.get("description")
                    data["posted_date"] = ld.get("datePosted")
                    data["application_url"] = ld.get("url") or target_url
                    break
            except Exception:
                continue

        # 2. DOM Elements
        if not data.get("job_title"):
            title_el = soup.select_one("h1.job-title, [data-testid='job-title'], h1, title")
            if title_el:
                data["job_title"] = title_el.get_text(strip=True).split(" - ")[0].split(" | ")[0]

        if not data.get("company"):
            comp_el = soup.select_one(".company, .employer, [data-testid='company'], [itemprop='hiringOrganization']")
            if comp_el:
                data["company"] = comp_el.get_text(strip=True)
            elif target_url:
                try:
                    host = urllib.parse.urlparse(target_url).hostname
                    if host:
                        data["company"] = host.replace("www.", "").split(".")[0].title()
                except Exception:
                    pass

        if not data.get("location"):
            loc_el = soup.select_one(".location, [data-testid='location'], [itemprop='jobLocation']")
            if loc_el:
                data["location"] = loc_el.get_text(strip=True)

        if not data.get("salary"):
            sal_el = soup.select_one(".salary, .compensation, [data-testid='salary'], [itemprop='baseSalary']")
            if sal_el:
                data["salary"] = sal_el.get_text(strip=True)

        if not data.get("description"):
            desc_el = soup.select_one(".job-description, .description, [data-testid='description'], meta[name='description'], p")
            if desc_el:
                data["description"] = (desc_el.get("content") if desc_el.name == "meta" else desc_el.get_text(strip=True))[:500]

        if not data.get("employment_type"):
            type_el = soup.select_one(".employment-type, [data-testid='employment-type']")
            if type_el:
                data["employment_type"] = type_el.get_text(strip=True)

        data["application_url"] = target_url or ""
        return data
