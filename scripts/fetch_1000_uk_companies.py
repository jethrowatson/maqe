#!/usr/bin/env python3
"""
Genuine UK Companies House Search Runner
Queries https://find-and-update.company-information.service.gov.uk/advanced-search/get-results
across official SIC codes from MAQE_SIC_master.xlsx until 1,000 unique active UK businesses are found,
then stops.
"""
import json
import re
import time
import urllib.request
import urllib.parse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

with open("src/lib/fixtures/sic_master.json", "r") as f:
    SIC_MASTER = json.load(f)

SIC_MAP = {s["sic_code"]: s for s in SIC_MASTER}

# Priority engineering & supply chain SIC codes from MAQE_SIC_master.xlsx across key manufacturing & supply chain categories
PRIORITY_SICS = [
    "25620", # Machining
    "25110", # Manufacture of metal structures and parts of structures
    "25610", # Treatment and coating of metals
    "25500", # Forging, pressing, stamping and roll-forming of metal
    "25730", # Manufacture of tools
    "25990", # Manufacture of other fabricated metal products n.e.c.
    "24100", # Manufacture of basic iron and steel and of ferro-alloys
    "24420", # Aluminium production
    "24510", # Casting of iron
    "24520", # Casting of steel
    "28410", # Manufacture of metal forming machinery
    "28990", # Manufacture of other special-purpose machinery n.e.c.
    "28120", # Manufacture of fluid power equipment
    "28150", # Manufacture of bearings, gears, gearing and driving elements
    "28220", # Manufacture of lifting and handling equipment
    "26110", # Manufacture of electronic components
    "26120", # Manufacture of loaded electronic boards
    "26511", # Manufacture of electronic measuring, testing etc. equipment
    "27110", # Manufacture of electric motors, generators and transformers
    "27120", # Manufacture of electricity distribution and control apparatus
    "29320", # Manufacture of other parts and accessories for motor vehicles
    "30300", # Manufacture of air and spacecraft and related machinery
    "30110", # Building of ships and floating structures
    "22290", # Manufacture of other plastic products
    "22190", # Manufacture of other rubber products
    "32500", # Manufacture of medical and dental instruments and supplies
    "33120", # Repair of machinery
    "33110", # Repair of fabricated metal products
    "33200", # Installation of industrial machinery and equipment
    "71200", # Technical testing and analysis
    "72190", # Other research and experimental development on natural sciences and engineering
    "46720", # Wholesale of metals and metal ores
    "46620", # Wholesale of machine tools
    "46690", # Wholesale of other machinery and equipment
    "49410", # Freight transport by road
]

# Ensure any remaining Tier 1/2 SICs are available if needed
for s in SIC_MASTER:
    if s["default_intake"] and s["sic_code"] not in PRIORITY_SICS:
        PRIORITY_SICS.append(s["sic_code"])

MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12"
}

def parse_date(date_str):
    # e.g. "14 May 2018"
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", date_str)
    if not m:
        return None
    day, month_name, year = m.group(1), m.group(2), m.group(3)
    month = MONTHS.get(month_name, "01")
    return f"{year}-{month}-{int(day):02d}"

def parse_address(addr_str):
    # Extract UK postcode at end if present
    pc_match = re.search(r"([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$", addr_str.strip(), re.I)
    postal_code = pc_match.group(1).upper() if pc_match else None
    parts = [p.strip() for p in addr_str.split(",") if p.strip()]
    country = "GB"
    locality = None
    region = None
    # Heuristic for locality from parts
    clean_parts = [p for p in parts if not re.match(r"^(United Kingdom|England|Scotland|Wales|Northern Ireland|UK|Great Britain)$", p, re.I)]
    if pc_match and clean_parts:
        # Remove postcode from last part if embedded
        last = re.sub(r"\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$", "", clean_parts[-1], flags=re.I).strip()
        if last:
            clean_parts[-1] = last
        else:
            clean_parts = clean_parts[:-1]
    if len(clean_parts) >= 2:
        locality = clean_parts[-1]
        if len(clean_parts) >= 3:
            region = clean_parts[-2]
    elif len(clean_parts) == 1:
        locality = clean_parts[0]
    return {
        "raw_address": addr_str.strip(),
        "address_lines": parts[:-1] if len(parts) > 1 else parts,
        "locality": locality or "United Kingdom",
        "region": region,
        "postal_code": postal_code,
        "country_code": country
    }

def fetch_ch_page(sic_code, page):
    url = f"https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?sicCodes={sic_code}&status=active&page={page}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    
    results = []
    rows = re.findall(r'<tr class="govuk-table__row">(.*?)</tr>', html, re.S)
    for row in rows:
        link_m = re.search(r'<a class="govuk-link" href=/company/([A-Z0-9]+)[^>]*>(.*?)<span', row, re.S)
        if not link_m:
            continue
        reg_no = link_m.group(1).strip()
        legal_name = re.sub(r"\s+", " ", link_m.group(2)).strip()
        # Unescape HTML entities
        legal_name = legal_name.replace("&amp;", "&").replace("&#39;", "'").replace("&quot;", '"')
        
        lis = re.findall(r"<li>(.*?)</li>", row, re.S)
        lis = [re.sub(r"\s+", " ", li).strip() for li in lis if li.strip()]
        
        legal_form = lis[0] if len(lis) > 0 else "Private limited company"
        inc_date = None
        addr_raw = ""
        sics = [sic_code]
        
        for li in lis[1:]:
            if "Incorporated on" in li or "Registered on" in li:
                inc_date = parse_date(li)
            elif li.startswith("SIC codes -"):
                extracted_sics = re.findall(r"\b\d{5}\b", li)
                if extracted_sics:
                    sics = list(dict.fromkeys(extracted_sics))
            else:
                addr_raw = li.replace("&amp;", "&")
        
        results.append({
            "registration_number": reg_no,
            "legal_name": legal_name,
            "legal_form": legal_form,
            "incorporation_date": inc_date,
            "address": parse_address(addr_raw),
            "sic_codes": sics,
            "primary_search_sic": sic_code,
            "registry_url": f"https://find-and-update.company-information.service.gov.uk/company/{reg_no}"
        })
    return results

def main():
    print("========================================================================")
    print("🔍 MAQE PHASE ONE: GENUINE UK COMPANIES HOUSE SEARCH (TARGET: 1,000)")
    print("========================================================================")
    companies_by_reg = {}
    target_count = 1000
    
    # Build tasks: pages 1 and 2 of our priority SIC codes (35 SICs * 2 pages * 20 = 1,400 rows -> ~1,000 unique)
    tasks = []
    for sic in PRIORITY_SICS[:35]:
        tasks.append((sic, 1))
        tasks.append((sic, 2))
    
    for sic, page in tasks:
        if len(companies_by_reg) >= target_count:
            break
        try:
            rows = fetch_ch_page(sic, page)
            added = 0
            for r in rows:
                if len(companies_by_reg) >= target_count:
                    break
                reg = r["registration_number"]
                if reg not in companies_by_reg:
                    companies_by_reg[reg] = r
                    added += 1
            sic_desc = SIC_MAP.get(sic, {}).get("description", "Engineering")
            print(f"  [CH LIVE] SIC {sic} (p.{page}) | +{added:2d} new | Total unique: {len(companies_by_reg):4d}/1000 | {sic_desc[:48]}")
            time.sleep(0.12)
        except Exception as e:
            print(f"  [WARN] SIC {sic} p.{page}: {e}")
    
    # If still under 1000, continue through remaining SICs
    idx = 35
    while len(companies_by_reg) < target_count and idx < len(PRIORITY_SICS):
        sic = PRIORITY_SICS[idx]
        idx += 1
        try:
            rows = fetch_ch_page(sic, 1)
            added = 0
            for r in rows:
                if len(companies_by_reg) >= target_count:
                    break
                reg = r["registration_number"]
                if reg not in companies_by_reg:
                    companies_by_reg[reg] = r
                    added += 1
            print(f"  [CH LIVE] SIC {sic} (p.1) | +{added:2d} new | Total unique: {len(companies_by_reg):4d}/1000")
            time.sleep(0.12)
        except Exception as e:
            print(f"  [WARN] SIC {sic}: {e}")

    final_list = list(companies_by_reg.values())[:1000]
    with open("src/lib/fixtures/raw_1000_uk_companies.json", "w") as out_f:
        json.dump(final_list, out_f, indent=2)
    
    print("========================================================================")
    print(f"✅ STOPPED AT EXACTLY {len(final_list)} REAL UK COMPANIES FROM COMPANIES HOUSE!")
    print("   Saved to src/lib/fixtures/raw_1000_uk_companies.json")
    print("========================================================================")

if __name__ == "__main__":
    main()
