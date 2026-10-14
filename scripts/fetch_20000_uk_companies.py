#!/usr/bin/env python3
"""
Genuine UK Companies House 20,000-Company Multi-SIC Harvester
Queries https://find-and-update.company-information.service.gov.uk/advanced-search/get-results
in round-robin waves across ALL 443 official SIC codes from MAQE_SIC_master.xlsx
until 20,000 unique active UK businesses are collected with a balanced mix across all SICs.
"""
import json
import os
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

with open("src/lib/fixtures/sic_master.json", "r") as f:
    SIC_MASTER = json.load(f)

SIC_MAP = {s["sic_code"]: s for s in SIC_MASTER}
ALL_SICS = [s["sic_code"] for s in SIC_MASTER]

MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04",
    "May": "05", "June": "06", "July": "07", "August": "08",
    "September": "09", "October": "10", "November": "11", "December": "12"
}

def parse_date(date_str):
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", date_str)
    if not m:
        return "2015-01-01"
    day, month_name, year = m.group(1), m.group(2), m.group(3)
    month = MONTHS.get(month_name, "01")
    return f"{year}-{month}-{int(day):02d}"

def parse_address(addr_str):
    pc_match = re.search(r"([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$", addr_str.strip(), re.I)
    postal_code = pc_match.group(1).upper() if pc_match else None
    parts = [p.strip() for p in addr_str.split(",") if p.strip()]
    locality = None
    region = None
    clean_parts = [p for p in parts if not re.match(r"^(United Kingdom|England|Scotland|Wales|Northern Ireland|UK|Great Britain)$", p, re.I)]
    if pc_match and clean_parts:
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
        "locality": locality or "United Kingdom",
        "region": region,
        "postal_code": postal_code,
        "country_code": "GB"
    }

def fetch_ch_page(sic_code, page):
    url = f"https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?sicCodes={sic_code}&status=active&page={page}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
    })
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            break
        except Exception:
            if attempt == 1:
                return sic_code, page, []
            time.sleep(0.3)

    results = []
    rows = re.findall(r'<tr class="govuk-table__row">(.*?)</tr>', html, re.S)
    for row in rows:
        link_m = re.search(r'<a class="govuk-link" href=/company/([A-Z0-9]+)[^>]*>(.*?)<span', row, re.S)
        if not link_m:
            continue
        reg_no = link_m.group(1).strip()
        legal_name = re.sub(r"\s+", " ", link_m.group(2)).strip()
        legal_name = (
            legal_name.replace("&amp;", "&")
            .replace("&#39;", "'")
            .replace("&quot;", '"')
            .replace("&lt;", "<")
            .replace("&gt;", ">")
        )

        lis = re.findall(r"<li>(.*?)</li>", row, re.S)
        lis = [re.sub(r"\s+", " ", li).strip() for li in lis if li.strip()]

        inc_date = "2015-01-01"
        addr_raw = ""
        sics = [sic_code]

        for li in lis[1:]:
            if "Incorporated on" in li or "Registered on" in li:
                inc_date = parse_date(li)
            elif li.startswith("SIC codes -"):
                extracted_sics = re.findall(r"\b\d{5}\b", li)
                if extracted_sics:
                    # Keep primary searched SIC if present, plus any additional SICs
                    sics = list(dict.fromkeys([sic_code] + extracted_sics))
            else:
                addr_raw = li.replace("&amp;", "&")

        addr = parse_address(addr_raw)
        results.append({
            "registration_number": reg_no,
            "legal_name": legal_name,
            "incorporation_date": inc_date,
            "address": addr,
            "sic_codes": sics,
            "primary_search_sic": sic_code
        })
    return sic_code, page, results

def main():
    target_count = 20000
    print("========================================================================")
    print(f"🔍 MAQE MULTI-SIC UK COMPANIES HOUSE HARVESTER (TARGET: {target_count:,})")
    print(f"   Across all {len(ALL_SICS)} SIC codes in sic_master.json")
    print("========================================================================")

    companies_by_reg = {}

    # Seed with existing 1,000 real UK Companies House records so indices 0..999 remain deterministic
    if os.path.exists("src/lib/fixtures/raw_1000_uk_companies.json"):
        with open("src/lib/fixtures/raw_1000_uk_companies.json", "r") as f:
            existing_1000 = json.load(f)
        for c in existing_1000:
            companies_by_reg[c["registration_number"]] = c
        print(f"Loaded {len(companies_by_reg):,} existing canonical UK Companies House records.")

    active_sics = list(ALL_SICS)
    page = 1
    max_pages = 15

    while len(companies_by_reg) < target_count and active_sics and page <= max_pages:
        print(f"\n--- Wave Page {page}: Querying {len(active_sics)} SIC codes (Current unique: {len(companies_by_reg):,}/{target_count:,}) ---")
        next_wave_sics = []
        tasks = [(sic, page) for sic in active_sics]

        # Process in chunks of 80 tasks with 16 concurrent workers
        chunk_size = 80
        for i in range(0, len(tasks), chunk_size):
            if len(companies_by_reg) >= target_count:
                break
            chunk = tasks[i:i + chunk_size]
            with ThreadPoolExecutor(max_workers=16) as executor:
                futures = [executor.submit(fetch_ch_page, s, p) for s, p in chunk]
                for fut in as_completed(futures):
                    sic_code, pg, rows = fut.result()
                    if len(rows) >= 15:
                        next_wave_sics.append(sic_code)
                    for r in rows:
                        if len(companies_by_reg) >= target_count:
                            break
                        reg = r["registration_number"]
                        if reg not in companies_by_reg:
                            companies_by_reg[reg] = r
                        else:
                            # Merge overlapping SIC codes onto existing record
                            existing_sics = companies_by_reg[reg].get("sic_codes", [])
                            if sic_code not in existing_sics:
                                companies_by_reg[reg]["sic_codes"] = existing_sics + [sic_code]
            print(f"  Progress: {len(companies_by_reg):,}/{target_count:,} unique UK companies collected...")
            time.sleep(0.15)

        # Keep next wave ordered deterministically
        next_set = set(next_wave_sics)
        active_sics = [s for s in active_sics if s in next_set]
        page += 1

    final_list = list(companies_by_reg.values())[:target_count]
    sic_counts = {}
    for c in final_list:
        psic = c.get("primary_search_sic") or (c.get("sic_codes") or ["25620"])[0]
        sic_counts[psic] = sic_counts.get(psic, 0) + 1

    print("========================================================================")
    print(f"✅ COLLECTED {len(final_list):,} UNIQUE REAL UK COMPANIES ACROSS {len(sic_counts)} SIC CODES!")
    print("========================================================================")

    with open("src/lib/fixtures/raw_20000_uk_companies.json", "w") as out_f:
        json.dump(final_list, out_f)

    # Also build compact tuple representation for fast TypeScript bundle loading
    # Format: [reg_no, legal_name, inc_date, primary_sic, extra_sics_csv, raw_addr, locality, region, postcode]
    compact_extra = []
    for c in final_list[1000:]:
        addr = c.get("address", {})
        psic = c.get("primary_search_sic") or (c.get("sic_codes") or ["25620"])[0]
        extra_sics = ",".join([s for s in c.get("sic_codes", []) if s != psic][:3])
        compact_extra.append([
            c["registration_number"],
            c["legal_name"],
            (c.get("incorporation_date") or "2015-01-01")[:10],
            psic,
            extra_sics,
            addr.get("raw_address") or addr.get("locality") or "United Kingdom",
            addr.get("locality") or "United Kingdom",
            addr.get("region") or "",
            addr.get("postal_code") or ""
        ])

    with open("src/lib/fixtures/real_19000_extra_compact.json", "w") as comp_f:
        json.dump(compact_extra, comp_f, separators=(",", ":"))

    print(f"Saved compact 19,000 extra records to src/lib/fixtures/real_19000_extra_compact.json ({os.path.getsize('src/lib/fixtures/real_19000_extra_compact.json') / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    main()
