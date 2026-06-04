#!/usr/bin/env python3
"""
Unit tests for leads.csv schema, deduplication, and format integrity.
For gridpass.app Milestone 1.
"""

import os
import csv
import unittest
import urllib.parse
from unittest.mock import patch, MagicMock
from find_leads import LeadFinder

class TestLeadsDatabase(unittest.TestCase):
    def setUp(self):
        self.csv_path = os.path.join(os.path.dirname(__file__), "leads.csv")
        self.required_headers = ["Name", "Category", "Location", "Website", "Email", "Phone", "Instagram", "Facebook"]

    def test_file_exists(self):
        """Assert that leads.csv exists and is not empty."""
        self.assertTrue(os.path.exists(self.csv_path), "leads.csv does not exist.")
        self.assertTrue(os.path.getsize(self.csv_path) > 0, "leads.csv is empty.")

    def test_schema_and_headers(self):
        """Assert that the headers exactly match and columns are correct."""
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            self.assertEqual(headers, self.required_headers, f"CSV headers do not match. Found: {headers}")

    def test_required_fields_not_empty(self):
        """Assert that Name, Category, Location, and Website are not empty for any record."""
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                name = row.get("Name", "").strip()
                category = row.get("Category", "").strip()
                location = row.get("Location", "").strip()
                website = row.get("Website", "").strip()

                self.assertTrue(name, f"Row {idx}: Name is empty.")
                self.assertTrue(category, f"Row {idx}: Category is empty.")
                self.assertTrue(location, f"Row {idx}: Location is empty.")
                self.assertTrue(website, f"Row {idx}: Website is empty.")

    def test_valid_categories(self):
        """Assert that the Category is one of the three approved enums."""
        approved_categories = {
            "Track & Racing Circuit",
            "Offroad & Adventure Park",
            "Enthusiast Car Club & Organizer"
        }
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                category = row.get("Category", "").strip()
                self.assertIn(
                    category, 
                    approved_categories, 
                    f"Row {idx}: Invalid category '{category}'. Must be one of: {approved_categories}"
                )

    def test_deduplication(self):
        """Assert that no duplicate website domains or name|location combinations exist in leads.csv."""
        def norm_domain(url):
            """Normalize a website URL for deduplication.
            
            For standard domains, collapses to the bare base domain.
            For shared portals (e.g. government directories, parks lists), 
            preserves the path and query signature to keep venues distinct.
            """
            if not url:
                return ""
            
            url_lower = url.lower().strip()
            
            # Standardize protocol prefixes
            if url_lower.startswith("https://"):
                url_clean = url_lower[8:]
            elif url_lower.startswith("http://"):
                url_clean = url_lower[7:]
            else:
                url_clean = url_lower
                
            # Standardize www. subdomains
            if url_clean.startswith("www."):
                url_clean = url_clean[4:]
                
            # Split into domain host and remaining URI portion
            parts = url_clean.split('/', 1)
            domain = parts[0].strip()
            rest = parts[1] if len(parts) > 1 else ""
            
            # Strip any trailing fragment identifier
            rest = rest.split('#')[0].strip()
            
            # Check if the domain is a known shared registry or a government site
            known_shared = {
                "parks.ca.gov",
                "ohv.parks.ca.gov",
                "nps.gov",
                "blm.gov",
                "stateparks.utah.gov",
                "dnr.state.mn.us",
                "in.gov",
                "cityofbridgeport.net",
                "fs.usda.gov",
                "recreation.gov",
                "linktr.ee",
                "github.io",
                "sites.google.com"
            }
            
            is_shared = (
                domain in known_shared or 
                domain.endswith(".gov") or 
                domain.endswith(".fed.us") or 
                domain.endswith(".state.us")
            )
            
            if not is_shared:
                # Standard Domain: collapse completely to the bare base domain
                return domain
            else:
                # Shared Portal: preserve the domain, path, and normalized query parameters
                path_query = rest.split('?', 1)
                path = path_query[0].rstrip('/')
                query_str = path_query[1] if len(path_query) > 1 else ""
                
                # Parse query parameters and strip marketing/tracking junk parameters
                query_params = urllib.parse.parse_qsl(query_str)
                filtered_params = sorted([
                    (k, v) for k, v in query_params 
                    if k not in {'utm_source', 'utm_medium', 'utm_campaign', 'ref', 'gclid', 'fbclid'}
                ])
                
                normalized = domain
                if path:
                    normalized += "/" + path
                if filtered_params:
                    normalized += "?" + urllib.parse.urlencode(filtered_params)
                    
                return normalized

        def norm_name(name):
            if not name: return ""
            return "".join(c for c in name.lower() if c.isalnum())

        names = set()
        domains = set()
        name_locs = set()

        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                name = row.get("Name") or ""
                location = row.get("Location") or ""
                website = row.get("Website") or ""

                n_name = norm_name(name)
                n_dom = norm_domain(website)
                n_nameloc = f"{n_name}|{norm_name(location)}"

                # Check website domain duplication
                if n_dom:
                    self.assertNotIn(
                        n_dom, 
                        domains, 
                        f"Row {idx}: Duplicate website domain detected: {website} (normalized: {n_dom})"
                    )
                    domains.add(n_dom)

                # Check name|location combination duplication
                self.assertNotIn(
                    n_nameloc, 
                    name_locs, 
                    f"Row {idx}: Duplicate Name|Location detected: {name} in {location}"
                )
                name_locs.add(n_nameloc)

    def test_urls_format(self):
        """Assert that Website, Instagram, and Facebook columns contain properly formatted URLs if present."""
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                website = row.get("Website", "").strip()
                instagram = row.get("Instagram", "").strip()
                facebook = row.get("Facebook", "").strip()

                # Website must be a valid http(s) link
                self.assertTrue(
                    website.startswith("http://") or website.startswith("https://"),
                    f"Row {idx}: Website must start with http:// or https://. Found: {website}"
                )

                if instagram:
                    self.assertTrue(
                        instagram.startswith("http://") or instagram.startswith("https://"),
                        f"Row {idx}: Instagram link must start with http:// or https:// if provided. Found: {instagram}"
                    )
                    self.assertIn(
                        "instagram.com", 
                        instagram, 
                        f"Row {idx}: Instagram link must contain 'instagram.com'. Found: {instagram}"
                    )

                if facebook:
                    self.assertTrue(
                        facebook.startswith("http://") or facebook.startswith("https://"),
                        f"Row {idx}: Facebook link must start with http:// or https:// if provided. Found: {facebook}"
                    )
                    self.assertIn(
                        "facebook.com", 
                        facebook, 
                        f"Row {idx}: Facebook link must contain 'facebook.com'. Found: {facebook}"
                    )

class TestLeadFinderLogic(unittest.TestCase):
    def setUp(self):
        # Create a LeadFinder with a dummy path to avoid modifying the real leads.csv
        self.finder = LeadFinder(output_path="dummy_leads.csv")
        self.finder.existing_domains = {"example.com"}
        self.finder.existing_names = {"racer track"}
        self.finder.existing_name_locs = {"racertrack|austintx"}

    def test_is_duplicate_logic(self):
        """Verify that name duplication does not trigger duplication alone,
        but composite name|location or domain duplication does.
        """
        # Same name, different location, different domain -> Not a duplicate
        self.assertFalse(self.finder.is_duplicate("Racer Track", "Dallas, TX", "https://dallasracers.com"))
        
        # Same name, same location -> Duplicate!
        self.assertTrue(self.finder.is_duplicate("Racer Track", "Austin, TX", "https://dallasracers.com"))
        
        # Different name, same domain -> Duplicate!
        self.assertTrue(self.finder.is_duplicate("Other Name", "Dallas, TX", "https://www.example.com"))

    @patch("time.sleep")
    @patch("requests.Session")
    def test_crawl_website_subpage_host_matching(self, mock_session_cls, mock_sleep):
        """Verify that crawler compares hosts instead of norm_domain to discover subpages."""
        mock_session = MagicMock()
        mock_session_cls.return_value = mock_session
        
        # Mock homepage response containing a link to a subpage
        mock_response_home = MagicMock()
        mock_response_home.status_code = 200
        mock_response_home.text = """
        <html>
            <body>
                <a href="/contact">Contact Us</a>
                <a href="https://other.com/about">Other Site</a>
            </body>
        </html>
        """
        
        # Mock contact page response
        mock_response_sub = MagicMock()
        mock_response_sub.status_code = 200
        mock_response_sub.text = """
        <html>
            <body>
                <p>Email: contact@mocktrack.com</p>
                <p>Phone: (123) 456-7890</p>
            </body>
        </html>
        """
        
        # Side effect to return home response then subpage response
        mock_session.get.side_effect = [mock_response_home, mock_response_sub]
        
        # Crawl website
        result = self.finder.crawl_website("https://mocktrack.com")
        
        # Verify that subpage was successfully traversed (host matched and crawl succeeded)
        self.assertEqual(result["Email"], "contact@mocktrack.com")
        self.assertEqual(result["Phone"], "(123) 456-7890")

if __name__ == "__main__":
    unittest.main()
