import re
import json
from datetime import datetime

def extract_date(text):
    # try ISO YYYY-MM-DD first
    m = re.search(r'(\d{4}-\d{2}-\d{2})', text)
    if m:
        return m.group(1)
    # try DD-MM-YYYY or DD/MM/YYYY
    m = re.search(r'(\d{2}[-/]\d{2}[-/]\d{4})', text)
    if m:
        try:
            d = datetime.strptime(m.group(1).replace('/', '-'), '%d-%m-%Y')
            return d.strftime('%Y-%m-%d')
        except Exception:
            return m.group(1)
    # fallback: today (UTC)
    return datetime.utcnow().strftime('%Y-%m-%d')

def extract_hcp_name(text):
    # common pattern: "Met Dr. Smith" or "Met Dr Smith" or "Met Dr. Smith, ..."
    m = re.search(r'\bDr\.?\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)', text)
    if m:
        return f"Dr. {m.group(1)}"
    # fallback: look for "Met <Name>"
    m2 = re.search(r'\bMet\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)', text)
    if m2:
        return m2.group(1)
    return ""

def extract_sentiment(text):
    # simple keyword match, returns 'positive' | 'neutral' | 'negative'
    t = text.lower()
    if any(k in t for k in ['positive', 'liked', 'good', 'interested', 'interested in', 'keen']):
        return "positive"
    if any(k in t for k in ['negative', 'not interested', 'concern', 'concerns', 'disliked', 'issue', 'hesitant']):
        return "negative"
    if any(k in t for k in ['neutral', 'no opinion', 'ok', 'okay']):
        return "neutral"
    return "neutral"

def extract_topics(text):
    # try to capture the part after the first comma following the HCP mention
    t = text.strip()
    # remove leading "Met Dr. Smith," or "Met Dr Smith," etc.
    t = re.sub(r'^[Mm]et\s+Dr\.?\s+[A-Z][a-zA-Z]+,?\s*', '', t)
    t = re.sub(r'^[Mm]et\s+[A-Z][a-zA-Z]+,?\s*', '', t)
    # remove date forms
    t = re.sub(r'\d{4}-\d{2}-\d{2}', '', t)
    t = re.sub(r'\d{2}[-/]\d{2}[-/]\d{4}', '', t)
    # remove sentiment words to keep topics cleaner
    t = re.sub(r'\b(positive|negative|neutral|shared|brochure|sample|samples)\b', '', t, flags=re.I)
    # collapse whitespace and trim punctuation
    t = re.sub(r'[,]+', ',', t).strip(' ,')
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip()

def parse_to_ui_json(text):
    """
    Return dict matching { ui_action: 'FILL_FORM', data: {...} }
    """
    name = extract_hcp_name(text)
    date = extract_date(text)
    sentiment = extract_sentiment(text)
    topics = extract_topics(text)
    interaction_type = 'meeting'
    if re.search(r'\bcall\b|\bphone\b|\btele\b', text, re.I):
        interaction_type = 'call'
    if re.search(r'\bemail\b', text, re.I):
        interaction_type = 'email'

    payload = {
        "ui_action": "FILL_FORM",
        "data": {
            "hcpName": name,
            "sentiment": sentiment,
            "topicsDiscussed": topics,
            "date": date,
            "interactionType": interaction_type
        }
    }
    return payload

# quick manual test (run python backend/local_parser.py to see)
if __name__ == '__main__':
    samples = [
        "Met Dr. Smith, positive sentiment, shared brochure, 2025-12-02",
        "Call with Dr. Patel 30-11-2025, neutral",
        "Met Dr Kumar today, had concerns about pricing"
    ]
    for s in samples:
        print(json.dumps(parse_to_ui_json(s), indent=2))
