import hashlib
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup

class TemplateFingerprinter:
    """
    Analyzes website URLs and DOM structures to group scrapers by domain and template signature.
    Prevents one site's DOM repair logic from polluting another site's rules.
    """

    @staticmethod
    def extract_domain(url: str) -> str:
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc or parsed.path.split("/")[0]
            # Strip port and www prefix
            domain = netloc.split(":")[0].lower()
            if domain.startswith("www."):
                domain = domain[4:]
            return domain or "custom-domain"
        except Exception:
            return "custom-domain"

    @staticmethod
    def compute_template_signature(html: str, url: str) -> str:
        """
        Computes a deterministic hash of the structural HTML skeleton,
        ignoring text, whitespace, and dynamic session parameters.
        """
        try:
            soup = BeautifulSoup(html, "html.parser")
            structural_tags = []
            
            # Walk top container nodes
            for tag in soup.find_all(["main", "article", "section", "header", "div", "form"], limit=50):
                tag_id = tag.get("id", "")
                tag_classes = " ".join(tag.get("class", []))
                # Filter out randomized CSS module hash classes (e.g. css-1a2b3c)
                stable_classes = " ".join(c for c in tag_classes.split() if not re.search(r"[a-f0-9]{6,}", c))
                structural_tags.append(f"{tag.name}#{tag_id}.{stable_classes}")

            skeleton = "|".join(structural_tags[:30])
            sig_hash = hashlib.md5(skeleton.encode("utf-8")).hexdigest()[:12]
            return f"tpl_{sig_hash}"
        except Exception:
            return "tpl_default"

    @staticmethod
    def compute_template_hash(html: str, url: str = "") -> str:
        return TemplateFingerprinter.compute_template_signature(html, url)

    @staticmethod
    def infer_page_type(url: str, workflow_type: str = "products") -> str:
        url_lower = url.lower()
        if "job" in url_lower or "career" in url_lower or "position" in url_lower or workflow_type == "jobs":
            return "job_posting"
        elif "status" in url_lower or "post" in url_lower or "tweet" in url_lower or workflow_type in ("x", "facebook"):
            return "social_post"
        elif "profile" in url_lower or "in/" in url_lower or workflow_type in ("linkedin", "instagram"):
            return "user_profile"
        elif "maps" in url_lower or "place" in url_lower or workflow_type == "google_maps":
            return "local_place"
        elif "reddit.com" in url_lower or "redd.it" in url_lower or workflow_type == "reddit":
            return "community_discussion"
        return "ecommerce_product"
