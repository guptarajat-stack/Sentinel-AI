"""
Threat Intelligence Enrichment — AbuseIPDB + VirusTotal
Runs before the LLM call to ground the model's confidence in external reputation data.
"""

import os
import ipaddress
import requests
from dotenv import load_dotenv

load_dotenv()

ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
VT_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")

_REQUEST_TIMEOUT = 3  # seconds — fast enough to not block the pipeline


def _is_private(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


def _query_abuseipdb(ip: str) -> dict:
    if not ABUSEIPDB_KEY:
        return {}
    try:
        resp = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers={"Key": ABUSEIPDB_KEY, "Accept": "application/json"},
            params={"ipAddress": ip, "maxAgeInDays": 90},
            timeout=_REQUEST_TIMEOUT,
        )
        if resp.status_code != 200:
            return {}
        data = resp.json().get("data", {})
        return {
            "abuse_score": data.get("abuseConfidenceScore", 0),
            "total_reports": data.get("totalReports", 0),
            "last_reported": data.get("lastReportedAt", "never"),
            "country": data.get("countryCode", "??"),
            "isp": data.get("isp", "unknown"),
            "is_tor": data.get("isTor", False),
        }
    except Exception:
        return {}


def _query_virustotal(ip: str) -> dict:
    if not VT_KEY:
        return {}
    try:
        resp = requests.get(
            f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
            headers={"x-apikey": VT_KEY},
            timeout=_REQUEST_TIMEOUT,
        )
        if resp.status_code != 200:
            return {}
        attrs = resp.json().get("data", {}).get("attributes", {})
        stats = attrs.get("last_analysis_stats", {})
        return {
            "vt_malicious": stats.get("malicious", 0),
            "vt_suspicious": stats.get("suspicious", 0),
            "vt_harmless": stats.get("harmless", 0),
            "vt_country": attrs.get("country", "??"),
            "vt_owner": attrs.get("as_owner", "unknown"),
        }
    except Exception:
        return {}


def enrich(ip: str) -> dict:
    """
    Return a combined threat intel dict for the given IP.
    Private IPs are skipped (no external API call) and flagged as internal.
    Returns an empty dict if both APIs are unavailable.
    """
    if not ip or ip in ("unknown", "N/A"):
        return {"note": "no IP available for enrichment"}

    if _is_private(ip):
        return {
            "is_internal": True,
            "note": f"{ip} is a private/RFC1918 address — likely a false positive or lateral movement",
            "abuse_score": 0,
        }

    abuse = _query_abuseipdb(ip)
    vt = _query_virustotal(ip)

    if not abuse and not vt:
        return {"note": "threat intel APIs unavailable or unconfigured"}

    result = {"is_internal": False, "ip": ip}
    result.update(abuse)
    result.update(vt)
    return result


def format_for_prompt(ip: str, intel: dict) -> str:
    """Render the intel dict as a concise string for injection into the LLM prompt."""
    if not intel or "note" in intel and len(intel) == 1:
        return f"Threat Intel for {ip}: unavailable"

    if intel.get("is_internal"):
        return f"Threat Intel: {ip} is a PRIVATE/INTERNAL IP — {intel.get('note', '')}"

    lines = [f"Threat Intel for {ip} (external):"]

    abuse_score = intel.get("abuse_score")
    if abuse_score is not None:
        risk = "HIGH RISK" if abuse_score >= 50 else ("MEDIUM RISK" if abuse_score >= 20 else "LOW RISK")
        lines.append(
            f"  AbuseIPDB: score={abuse_score}/100 [{risk}], "
            f"reports={intel.get('total_reports', 0)}, "
            f"last_seen={intel.get('last_reported', 'never')}, "
            f"country={intel.get('country', '??')}, "
            f"isp={intel.get('isp', 'unknown')}, "
            f"tor={intel.get('is_tor', False)}"
        )

    vt_mal = intel.get("vt_malicious")
    if vt_mal is not None:
        lines.append(
            f"  VirusTotal: malicious={vt_mal}, "
            f"suspicious={intel.get('vt_suspicious', 0)}, "
            f"harmless={intel.get('vt_harmless', 0)}, "
            f"owner={intel.get('vt_owner', 'unknown')}"
        )

    return "\n".join(lines)
