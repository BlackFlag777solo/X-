# ============================================================================
# SECRET SCANNER MODULE - X=pi by Carbi
# Based on: streaak/keyhacks + h33tlit/secret-regex-list
# Defensive tool for detecting exposed API keys and secrets in text
# ============================================================================

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import re
import uuid

secret_router = APIRouter(prefix="/api/secrets", tags=["Secret Scanner"])

# ============================================================================
# MODELS
# ============================================================================

class ScanTextRequest(BaseModel):
    text: str
    scan_mode: Optional[str] = "all"  # all, cloud, social, payment, dev

class SecretMatch(BaseModel):
    service: str
    category: str
    pattern_name: str
    matched_value: str
    risk_level: str
    verification_method: str
    verification_url: Optional[str] = None

class ScanResult(BaseModel):
    scan_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    total_secrets_found: int
    risk_summary: Dict[str, int]
    matches: List[SecretMatch]
    scan_mode: str
    timestamp: str

# ============================================================================
# COMPREHENSIVE SECRET PATTERNS DATABASE
# From keyhacks + secret-regex-list
# ============================================================================

SECRET_PATTERNS = [
    # === CLOUD PROVIDERS ===
    {
        "service": "Amazon AWS Access Key", "category": "cloud",
        "regex": r"AKIA[0-9A-Z]{16}",
        "risk": "CRITICAL",
        "verify": "aws sts get-caller-identity",
        "verify_url": "https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html"
    },
    {
        "service": "Amazon MWS Auth Token", "category": "cloud",
        "regex": r"amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        "risk": "CRITICAL",
        "verify": "Check AWS MWS API access",
        "verify_url": None
    },
    {
        "service": "Google API Key", "category": "cloud",
        "regex": r"AIza[0-9A-Za-z\-_]{35}",
        "risk": "HIGH",
        "verify": "curl https://maps.googleapis.com/maps/api/staticmap?center=45,10&zoom=7&size=400x400&key=KEY",
        "verify_url": "https://developers.google.com/maps/documentation/javascript/get-api-key"
    },
    {
        "service": "Google OAuth Token", "category": "cloud",
        "regex": r"ya29\.[0-9A-Za-z\-_]+",
        "risk": "CRITICAL",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://www.googleapis.com/oauth2/v1/tokeninfo",
        "verify_url": None
    },
    {
        "service": "Google Cloud Platform OAuth", "category": "cloud",
        "regex": r"[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com",
        "risk": "HIGH",
        "verify": "Check OAuth client configuration",
        "verify_url": None
    },
    {
        "service": "Google Service Account", "category": "cloud",
        "regex": r'"type"\s*:\s*"service_account"',
        "risk": "CRITICAL",
        "verify": "gcloud auth activate-service-account --key-file=FILE",
        "verify_url": None
    },
    {
        "service": "Microsoft Azure Tenant", "category": "cloud",
        "regex": r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        "risk": "MEDIUM",
        "verify": "curl -X POST https://login.microsoftonline.com/TENANT/oauth2/v2.0/token",
        "verify_url": None
    },
    {
        "service": "Heroku API Key", "category": "cloud",
        "regex": r"[hH][eE][rR][oO][kK][uU].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}",
        "risk": "HIGH",
        "verify": "curl -X POST https://api.heroku.com/apps -H 'Authorization: Bearer KEY'",
        "verify_url": "https://devcenter.heroku.com/articles/platform-api-quickstart"
    },
    {
        "service": "Firebase URL", "category": "cloud",
        "regex": r"[a-z0-9-]+\.firebaseio\.com",
        "risk": "MEDIUM",
        "verify": "curl https://FIREBASE_URL/.json",
        "verify_url": None
    },
    {
        "service": "Firebase Cloud Messaging", "category": "cloud",
        "regex": r"AAAA[a-zA-Z0-9_-]{7}:[a-zA-Z0-9_-]{140}",
        "risk": "HIGH",
        "verify": "curl -X POST --header 'Authorization: key=KEY' https://fcm.googleapis.com/fcm/send",
        "verify_url": None
    },
    {
        "service": "Infura API Key", "category": "cloud",
        "regex": r"https://mainnet\.infura\.io/v3/[0-9a-f]{32}",
        "risk": "HIGH",
        "verify": "curl -X POST INFURA_URL -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_accounts\"}'",
        "verify_url": None
    },
    # === PAYMENT SERVICES ===
    {
        "service": "Stripe Live Key", "category": "payment",
        "regex": r"sk_live_[0-9a-zA-Z]{24,}",
        "risk": "CRITICAL",
        "verify": "curl https://api.stripe.com/v1/charges -u KEY:",
        "verify_url": "https://stripe.com/docs/api/authentication"
    },
    {
        "service": "Stripe Restricted Key", "category": "payment",
        "regex": r"rk_live_[0-9a-zA-Z]{24,}",
        "risk": "HIGH",
        "verify": "curl https://api.stripe.com/v1/charges -u KEY:",
        "verify_url": None
    },
    {
        "service": "PayPal Braintree Token", "category": "payment",
        "regex": r"access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}",
        "risk": "CRITICAL",
        "verify": "curl -v https://api.sandbox.paypal.com/v1/oauth2/token",
        "verify_url": None
    },
    {
        "service": "Square Access Token", "category": "payment",
        "regex": r"sq0atp-[0-9A-Za-z\-_]{22}",
        "risk": "CRITICAL",
        "verify": "curl https://connect.squareup.com/v2/locations -H 'Authorization: Bearer TOKEN'",
        "verify_url": None
    },
    {
        "service": "Square OAuth Secret", "category": "payment",
        "regex": r"sq0csp-[0-9A-Za-z\-_]{43}",
        "risk": "CRITICAL",
        "verify": "Check Square OAuth configuration",
        "verify_url": None
    },
    {
        "service": "Razorpay API Key", "category": "payment",
        "regex": r"rzp_live_[0-9a-zA-Z]{14,}",
        "risk": "CRITICAL",
        "verify": "curl -u KEY:SECRET https://api.razorpay.com/v1/payments",
        "verify_url": None
    },
    {
        "service": "Picatic API Key", "category": "payment",
        "regex": r"sk_live_[0-9a-z]{32}",
        "risk": "HIGH",
        "verify": "Check Picatic API access",
        "verify_url": None
    },
    # === SOCIAL / COMMUNICATION ===
    {
        "service": "Slack Token", "category": "social",
        "regex": r"xox[bpoa]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}",
        "risk": "CRITICAL",
        "verify": "curl -X POST https://slack.com/api/auth.test -H 'Authorization: Bearer TOKEN'",
        "verify_url": "https://api.slack.com/web"
    },
    {
        "service": "Slack Webhook", "category": "social",
        "regex": r"https://hooks\.slack\.com/services/T[a-zA-Z0-9_]{8,}/B[a-zA-Z0-9_]{8,}/[a-zA-Z0-9_]{24}",
        "risk": "HIGH",
        "verify": "curl -X POST -d '{\"text\":\"\"}' WEBHOOK_URL",
        "verify_url": None
    },
    {
        "service": "Facebook Access Token", "category": "social",
        "regex": r"EAACEdEose0cBA[0-9A-Za-z]+",
        "risk": "HIGH",
        "verify": "https://developers.facebook.com/tools/debug/accesstoken/",
        "verify_url": "https://developers.facebook.com/tools/debug/accesstoken/"
    },
    {
        "service": "Facebook OAuth", "category": "social",
        "regex": r"[fF][aA][cC][eE][bB][oO][oO][kK].*['\"][0-9a-f]{32}['\"]",
        "risk": "HIGH",
        "verify": "Check Facebook Graph API",
        "verify_url": None
    },
    {
        "service": "Twitter Access Token", "category": "social",
        "regex": r"[tT][wW][iI][tT][tT][eE][rR].*[1-9][0-9]+-[0-9a-zA-Z]{40}",
        "risk": "HIGH",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://api.twitter.com/1.1/account_activity/all/subscriptions/count.json",
        "verify_url": None
    },
    {
        "service": "Twitter OAuth", "category": "social",
        "regex": r"[tT][wW][iI][tT][tT][eE][rR].*['\"][0-9a-zA-Z]{35,44}['\"]",
        "risk": "HIGH",
        "verify": "curl -u 'API_KEY:SECRET' --data 'grant_type=client_credentials' https://api.twitter.com/oauth2/token",
        "verify_url": None
    },
    {
        "service": "Instagram Access Token", "category": "social",
        "regex": r"IGQVJ[0-9A-Za-z]+",
        "risk": "HIGH",
        "verify": "curl https://graph.instagram.com/me?fields=id,username&access_token=TOKEN",
        "verify_url": None
    },
    {
        "service": "LinkedIn OAUTH", "category": "social",
        "regex": r"linkedin.*['\"][0-9a-zA-Z]{12,}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -X POST https://www.linkedin.com/oauth/v2/accessToken",
        "verify_url": None
    },
    {
        "service": "Telegram Bot Token", "category": "social",
        "regex": r"[0-9]{8,10}:[a-zA-Z0-9_-]{35}",
        "risk": "HIGH",
        "verify": "curl https://api.telegram.org/bot<TOKEN>/getMe",
        "verify_url": "https://core.telegram.org/bots/api"
    },
    {
        "service": "Microsoft Teams Webhook", "category": "social",
        "regex": r"https://[a-z0-9]+\.webhook\.office\.com/webhookb2/[a-z0-9-]+",
        "risk": "MEDIUM",
        "verify": "curl -H 'Content-Type:application/json' -d '{\"text\":\"\"}' WEBHOOK_URL",
        "verify_url": None
    },
    # === DEVELOPMENT TOOLS ===
    {
        "service": "GitHub Token", "category": "dev",
        "regex": r"gh[pousr]_[0-9a-zA-Z]{36,}",
        "risk": "CRITICAL",
        "verify": "curl -H 'Authorization: token TOKEN' https://api.github.com/user",
        "verify_url": "https://developer.github.com/v3/"
    },
    {
        "service": "GitHub (Generic)", "category": "dev",
        "regex": r"[gG][iI][tT][hH][uU][bB].*['\"][0-9a-zA-Z]{35,40}['\"]",
        "risk": "HIGH",
        "verify": "curl -s -u 'user:KEY' https://api.github.com/user",
        "verify_url": None
    },
    {
        "service": "GitLab Personal Token", "category": "dev",
        "regex": r"glpat-[0-9a-zA-Z\-_]{20,}",
        "risk": "CRITICAL",
        "verify": "curl https://gitlab.com/api/v4/projects?private_token=TOKEN",
        "verify_url": None
    },
    {
        "service": "NPM Token", "category": "dev",
        "regex": r"npm_[0-9a-zA-Z]{36}",
        "risk": "HIGH",
        "verify": "curl -H 'authorization: Bearer TOKEN' https://registry.npmjs.org/-/whoami",
        "verify_url": None
    },
    {
        "service": "Travis CI Token", "category": "dev",
        "regex": r"travis.*['\"][0-9a-zA-Z]{20,}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -H 'Travis-API-Version: 3' -H 'Authorization: token TOKEN' https://api.travis-ci.org/repos",
        "verify_url": None
    },
    {
        "service": "CircleCI Token", "category": "dev",
        "regex": r"circle.*['\"][0-9a-f]{40}['\"]",
        "risk": "MEDIUM",
        "verify": "curl https://circleci.com/api/v1.1/me?circle-token=TOKEN",
        "verify_url": None
    },
    {
        "service": "Buildkite Token", "category": "dev",
        "regex": r"buildkite.*['\"][0-9a-f]{40}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://api.buildkite.com/v2/access-token",
        "verify_url": None
    },
    {
        "service": "Cypress Record Key", "category": "dev",
        "regex": r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        "risk": "LOW",
        "verify": "Check Cypress dashboard",
        "verify_url": None
    },
    {
        "service": "Sonarcloud Token", "category": "dev",
        "regex": r"sonar.*['\"][0-9a-f]{40}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -u TOKEN: https://sonarcloud.io/api/authentication/validate",
        "verify_url": None
    },
    # === EMAIL / MARKETING ===
    {
        "service": "SendGrid API Token", "category": "email",
        "regex": r"SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}",
        "risk": "CRITICAL",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://api.sendgrid.com/v3/scopes",
        "verify_url": "https://docs.sendgrid.com/api-reference"
    },
    {
        "service": "MailChimp API Key", "category": "email",
        "regex": r"[0-9a-f]{32}-us[0-9]{1,2}",
        "risk": "HIGH",
        "verify": "curl --url 'https://DC.api.mailchimp.com/3.0/' --user 'any:KEY'",
        "verify_url": None
    },
    {
        "service": "Mailgun Private Key", "category": "email",
        "regex": r"key-[0-9a-zA-Z]{32}",
        "risk": "HIGH",
        "verify": "curl --user 'api:KEY' https://api.mailgun.net/v3/domains",
        "verify_url": None
    },
    # === MONITORING / ANALYTICS ===
    {
        "service": "DataDog API Key", "category": "monitoring",
        "regex": r"datadog.*['\"][0-9a-f]{32}['\"]",
        "risk": "HIGH",
        "verify": "curl https://api.datadoghq.com/api/v1/dashboard?api_key=KEY",
        "verify_url": None
    },
    {
        "service": "New Relic API Key", "category": "monitoring",
        "regex": r"NRAK-[A-Z0-9]{27}",
        "risk": "HIGH",
        "verify": "curl -H 'API-Key: KEY' -X POST https://api.newrelic.com/graphql",
        "verify_url": None
    },
    {
        "service": "PagerDuty API Token", "category": "monitoring",
        "regex": r"pagerduty.*['\"][0-9a-zA-Z+/=]{20,}['\"]",
        "risk": "HIGH",
        "verify": "curl -H 'Authorization: Token token=TOKEN' https://api.pagerduty.com/schedules",
        "verify_url": None
    },
    {
        "service": "Grafana Token", "category": "monitoring",
        "regex": r"eyJrIjoi[0-9A-Za-z+/=]{30,}",
        "risk": "HIGH",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://grafana.example.com/api/user",
        "verify_url": None
    },
    # === SERVICES / SAAS ===
    {
        "service": "Twilio API Key", "category": "saas",
        "regex": r"SK[0-9a-fA-F]{32}",
        "risk": "HIGH",
        "verify": "curl -u SID:TOKEN https://api.twilio.com/2010-04-01/Accounts.json",
        "verify_url": "https://www.twilio.com/docs/iam/api/account"
    },
    {
        "service": "Shopify Access Token", "category": "saas",
        "regex": r"shpat_[0-9a-fA-F]{32}",
        "risk": "CRITICAL",
        "verify": "Check Shopify Admin API access",
        "verify_url": None
    },
    {
        "service": "Cloudflare API Key", "category": "saas",
        "regex": r"cloudflare.*['\"][0-9a-f]{37}['\"]",
        "risk": "HIGH",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://api.cloudflare.com/client/v4/user/tokens/verify",
        "verify_url": None
    },
    {
        "service": "HubSpot API Key", "category": "saas",
        "regex": r"hubspot.*['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]",
        "risk": "HIGH",
        "verify": "curl https://api.hubapi.com/owners/v2/owners?hapikey=KEY",
        "verify_url": None
    },
    {
        "service": "Zendesk API Key", "category": "saas",
        "regex": r"zendesk.*['\"][0-9a-zA-Z]{40}['\"]",
        "risk": "MEDIUM",
        "verify": "curl https://SUBDOMAIN.zendesk.com/api/v2/tickets.json -H 'Authorization: Bearer TOKEN'",
        "verify_url": None
    },
    {
        "service": "Asana Token", "category": "saas",
        "regex": r"asana.*['\"][0-9]/[0-9]{13,}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://app.asana.com/api/1.0/users/me",
        "verify_url": None
    },
    {
        "service": "Algolia API Key", "category": "saas",
        "regex": r"algolia.*['\"][0-9a-f]{32}['\"]",
        "risk": "MEDIUM",
        "verify": "curl https://APP.algolianet.com/1/indexes/ -H 'x-algolia-api-key: KEY'",
        "verify_url": None
    },
    {
        "service": "Mapbox API Key", "category": "saas",
        "regex": r"(sk|pk|tk)\.[0-9a-zA-Z]{22,}\.[0-9a-zA-Z]{22,}",
        "risk": "HIGH",
        "verify": "curl https://api.mapbox.com/tokens/v2?access_token=TOKEN",
        "verify_url": None
    },
    {
        "service": "Shodan API Key", "category": "saas",
        "regex": r"shodan.*['\"][0-9a-zA-Z]{32}['\"]",
        "risk": "MEDIUM",
        "verify": "curl https://api.shodan.io/shodan/host/8.8.8.8?key=TOKEN",
        "verify_url": None
    },
    {
        "service": "Spotify Token", "category": "saas",
        "regex": r"BQ[A-Za-z0-9_-]{80,}",
        "risk": "LOW",
        "verify": "curl -H 'Authorization: Bearer TOKEN' https://api.spotify.com/v1/me",
        "verify_url": None
    },
    # === CRYPTO / SENSITIVE ===
    {
        "service": "RSA Private Key", "category": "crypto",
        "regex": r"-----BEGIN RSA PRIVATE KEY-----",
        "risk": "CRITICAL",
        "verify": "Private key detected - immediate rotation required",
        "verify_url": None
    },
    {
        "service": "SSH (DSA) Private Key", "category": "crypto",
        "regex": r"-----BEGIN DSA PRIVATE KEY-----",
        "risk": "CRITICAL",
        "verify": "Private key detected - immediate rotation required",
        "verify_url": None
    },
    {
        "service": "SSH (EC) Private Key", "category": "crypto",
        "regex": r"-----BEGIN EC PRIVATE KEY-----",
        "risk": "CRITICAL",
        "verify": "Private key detected - immediate rotation required",
        "verify_url": None
    },
    {
        "service": "PGP Private Key", "category": "crypto",
        "regex": r"-----BEGIN PGP PRIVATE KEY BLOCK-----",
        "risk": "CRITICAL",
        "verify": "Private key detected - immediate rotation required",
        "verify_url": None
    },
    {
        "service": "Generic API Key", "category": "generic",
        "regex": r"[aA][pP][iI][_]?[kK][eE][yY].*['\"][0-9a-zA-Z]{32,45}['\"]",
        "risk": "MEDIUM",
        "verify": "Investigate context to determine service",
        "verify_url": None
    },
    {
        "service": "Generic Secret", "category": "generic",
        "regex": r"[sS][eE][cC][rR][eE][tT].*['\"][0-9a-zA-Z]{32,45}['\"]",
        "risk": "MEDIUM",
        "verify": "Investigate context to determine service",
        "verify_url": None
    },
    {
        "service": "Password in URL", "category": "generic",
        "regex": r"[a-zA-Z]{3,10}://[^/\s:@]{3,20}:[^/\s:@]{3,20}@.{1,100}",
        "risk": "CRITICAL",
        "verify": "Credentials embedded in URL - immediate action required",
        "verify_url": None
    },
    {
        "service": "Cloudinary URL", "category": "cloud",
        "regex": r"cloudinary://[0-9]+:[0-9A-Za-z_-]+@[a-z]+",
        "risk": "HIGH",
        "verify": "Check Cloudinary dashboard",
        "verify_url": None
    },
    {
        "service": "JumpCloud API Key", "category": "saas",
        "regex": r"jumpcloud.*['\"][0-9a-f]{40}['\"]",
        "risk": "HIGH",
        "verify": "curl -H 'x-api-key: KEY' https://console.jumpcloud.com/api/systems",
        "verify_url": None
    },
    {
        "service": "Salesforce API Key", "category": "saas",
        "regex": r"salesforce.*['\"][0-9a-zA-Z]{15,}['\"]",
        "risk": "HIGH",
        "verify": "curl https://instance.salesforce.com/services/data/v20.0/ -H 'Authorization: Bearer TOKEN'",
        "verify_url": None
    },
    {
        "service": "Dropbox API Token", "category": "cloud",
        "regex": r"sl\.[A-Za-z0-9_-]{100,}",
        "risk": "HIGH",
        "verify": "curl -X POST https://api.dropboxapi.com/2/users/get_current_account -H 'Authorization: Bearer TOKEN'",
        "verify_url": None
    },
    {
        "service": "BrowserStack Key", "category": "dev",
        "regex": r"browserstack.*['\"][0-9a-zA-Z]{20}['\"]",
        "risk": "MEDIUM",
        "verify": "curl -u USER:KEY https://api.browserstack.com/automate/plan.json",
        "verify_url": None
    },
    {
        "service": "WPEngine API Key", "category": "saas",
        "regex": r"wpengine.*['\"][0-9a-f]{64}['\"]",
        "risk": "HIGH",
        "verify": "curl https://api.wpengine.com/1.2/?method=site&wpe_apikey=KEY",
        "verify_url": None
    },
    {
        "service": "Zapier Webhook", "category": "saas",
        "regex": r"https://hooks\.zapier\.com/hooks/catch/[0-9]+/[a-z0-9]+",
        "risk": "MEDIUM",
        "verify": "curl -X POST -d '{\"test\":true}' WEBHOOK_URL",
        "verify_url": None
    },
]

CATEGORY_MAP = {
    "cloud": "Cloud Providers",
    "payment": "Payment Services",
    "social": "Social / Communication",
    "dev": "Development Tools",
    "email": "Email / Marketing",
    "monitoring": "Monitoring / Analytics",
    "saas": "SaaS Services",
    "crypto": "Cryptographic Keys",
    "generic": "Generic Patterns",
}

# ============================================================================
# ENDPOINTS
# ============================================================================

@secret_router.post("/scan", response_model=ScanResult)
async def scan_for_secrets(req: ScanTextRequest):
    """Scan text for exposed API keys and secrets (DEFENSIVE TOOL)"""
    text = req.text
    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Text too short to scan")

    matches = []
    risk_summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    patterns_to_check = SECRET_PATTERNS
    if req.scan_mode != "all":
        patterns_to_check = [p for p in SECRET_PATTERNS if p["category"] == req.scan_mode]

    for pattern in patterns_to_check:
        try:
            found = re.findall(pattern["regex"], text)
            for match in found:
                # Mask the found secret for safety
                if len(match) > 12:
                    masked = match[:6] + "..." + match[-4:]
                else:
                    masked = match[:3] + "***"

                matches.append(SecretMatch(
                    service=pattern["service"],
                    category=CATEGORY_MAP.get(pattern["category"], pattern["category"]),
                    pattern_name=pattern["regex"][:60],
                    matched_value=masked,
                    risk_level=pattern["risk"],
                    verification_method=pattern["verify"],
                    verification_url=pattern.get("verify_url")
                ))
                risk_summary[pattern["risk"]] = risk_summary.get(pattern["risk"], 0) + 1
        except re.error:
            continue

    return ScanResult(
        total_secrets_found=len(matches),
        risk_summary=risk_summary,
        matches=matches,
        scan_mode=req.scan_mode,
        timestamp=datetime.utcnow().isoformat()
    )


@secret_router.get("/patterns")
async def get_all_patterns():
    """Get all supported secret detection patterns"""
    by_category = {}
    for p in SECRET_PATTERNS:
        cat = CATEGORY_MAP.get(p["category"], p["category"])
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append({
            "service": p["service"],
            "risk": p["risk"],
            "verify": p["verify"],
            "verify_url": p.get("verify_url"),
        })

    return {
        "module": "Secret Scanner - X=pi by Carbi",
        "source": "keyhacks + secret-regex-list",
        "total_patterns": len(SECRET_PATTERNS),
        "categories": by_category,
        "scan_modes": list(CATEGORY_MAP.keys()),
        "timestamp": datetime.utcnow().isoformat()
    }


@secret_router.get("/keyhacks")
async def get_keyhacks_database():
    """Complete KeyHacks verification database - how to verify leaked API keys"""
    keyhacks = [
        {"service": "Slack Webhook", "verify_cmd": 'curl -s -X POST -H "Content-type: application/json" -d \'{"text":""}\' "WEBHOOK_URL"', "success_indicator": "missing_text_or_fallback_or_attachments"},
        {"service": "Slack API Token", "verify_cmd": 'curl -sX POST "https://slack.com/api/auth.test" -H "Authorization: Bearer TOKEN"', "success_indicator": "200 OK with user info"},
        {"service": "GitHub Token", "verify_cmd": 'curl -s -H "Authorization: token TOKEN" https://api.github.com/user', "success_indicator": "200 OK with user JSON"},
        {"service": "GitHub SSH Key", "verify_cmd": "ssh -i KEY_FILE -T git@github.com", "success_indicator": "Hi username! You've successfully authenticated"},
        {"service": "AWS Keys", "verify_cmd": "AWS_ACCESS_KEY_ID=x AWS_SECRET_ACCESS_KEY=y aws sts get-caller-identity", "success_indicator": "Account and ARN returned"},
        {"service": "Google Maps", "verify_cmd": "curl 'https://maps.googleapis.com/maps/api/staticmap?center=45,10&zoom=7&size=400x400&key=KEY'", "success_indicator": "Image returned (not error)"},
        {"service": "Twilio", "verify_cmd": "curl -X GET 'https://api.twilio.com/2010-04-01/Accounts.json' -u SID:TOKEN", "success_indicator": "200 OK with account info"},
        {"service": "Stripe Live", "verify_cmd": "curl https://api.stripe.com/v1/charges -u sk_live_KEY:", "success_indicator": "Charges list returned"},
        {"service": "SendGrid", "verify_cmd": 'curl -H "Authorization: Bearer TOKEN" https://api.sendgrid.com/v3/scopes', "success_indicator": "200 OK with scopes"},
        {"service": "MailChimp", "verify_cmd": "curl --url 'https://DC.api.mailchimp.com/3.0/' --user 'any:KEY'", "success_indicator": "200 OK with account info"},
        {"service": "Mailgun", "verify_cmd": "curl --user 'api:KEY' https://api.mailgun.net/v3/domains", "success_indicator": "200 OK with domains"},
        {"service": "Facebook Token", "verify_cmd": "https://developers.facebook.com/tools/debug/accesstoken/?access_token=TOKEN", "success_indicator": "Token metadata returned"},
        {"service": "Twitter Bearer", "verify_cmd": 'curl --request GET --url https://api.twitter.com/1.1/account_activity/all/subscriptions/count.json --header "authorization: Bearer TOKEN"', "success_indicator": "200 OK"},
        {"service": "Heroku", "verify_cmd": 'curl -X POST https://api.heroku.com/apps -H "Authorization: Bearer KEY"', "success_indicator": "App list or creation response"},
        {"service": "Telegram Bot", "verify_cmd": "curl https://api.telegram.org/bot<TOKEN>/getMe", "success_indicator": "200 OK with bot info"},
        {"service": "PayPal", "verify_cmd": "curl -v https://api.sandbox.paypal.com/v1/oauth2/token -u 'ID:SECRET' -d 'grant_type=client_credentials'", "success_indicator": "Access token returned"},
        {"service": "Square", "verify_cmd": 'curl https://connect.squareup.com/v2/locations -H "Authorization: Bearer TOKEN"', "success_indicator": "Locations list returned"},
        {"service": "Cloudflare", "verify_cmd": 'curl -H "Authorization: Bearer TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify', "success_indicator": "200 OK active status"},
        {"service": "Shopify", "verify_cmd": "curl -H 'X-Shopify-Access-Token: TOKEN' https://STORE.myshopify.com/admin/api/2024-01/shop.json", "success_indicator": "200 OK with shop info"},
        {"service": "Spotify", "verify_cmd": 'curl -H "Authorization: Bearer TOKEN" https://api.spotify.com/v1/me', "success_indicator": "200 OK with user profile"},
        {"service": "Razorpay", "verify_cmd": "curl -u KEY:SECRET https://api.razorpay.com/v1/payments", "success_indicator": "200 OK with payments"},
        {"service": "DataDog", "verify_cmd": 'curl "https://api.datadoghq.com/api/v1/dashboard?api_key=KEY&application_key=APP_KEY"', "success_indicator": "200 OK with dashboards"},
        {"service": "PagerDuty", "verify_cmd": 'curl -H "Authorization: Token token=TOKEN" https://api.pagerduty.com/schedules', "success_indicator": "200 OK with schedules"},
        {"service": "NPM Token", "verify_cmd": "curl -H 'authorization: Bearer TOKEN' https://registry.npmjs.org/-/whoami", "success_indicator": "Username returned"},
        {"service": "YouTube API", "verify_cmd": "curl 'https://www.googleapis.com/youtube/v3/activities?part=contentDetails&maxResults=25&channelId=UC-lHJZR3Gqxm24_Vd_AJ5Yw&key=KEY'", "success_indicator": "200 OK with activities"},
    ]

    return {
        "module": "KeyHacks Database - X=pi by Carbi",
        "source": "streaak/keyhacks",
        "description": "Methods to verify if leaked API keys are valid (DEFENSIVE/BUG BOUNTY use)",
        "total_services": len(keyhacks),
        "keyhacks": keyhacks,
        "disclaimer": "For authorized security testing only. Always get permission before testing API keys.",
        "timestamp": datetime.utcnow().isoformat()
    }
