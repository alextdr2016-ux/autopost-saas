"""
Lambda: AutoPost — Article Poster (multi-tenant)
Rulează Marți & Joi orar via EventBridge: cron(0 * * * ? *)

Pentru fiecare tenant cu post_articles=True (Marți & Joi):
  1. Verifică dacă e ora de postare + dacă e Marți sau Joi
  2. Verifică anti-duplicate: nu postăm articole de două ori pe zi
  3. Fetch articole din RSS feed / Extended CMS (WordPress) / Shopify Blog
  4. Alege articol nepostat
  5. Generează text cu Gemini (opțional) sau caption simplu
  6. Postează pe Facebook Feed cu link
  7. Log în DynamoDB

Requires: requests în Lambda Layer (pentru fetch articole)
Gemini opțional: dacă tenant are secret autopost/{id}/apis cu gemini_api_key
"""

import json
import logging
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from zoneinfo import ZoneInfo

import boto3
import requests
from boto3.dynamodb.conditions import Attr, Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ── AWS ────────────────────────────────────────────────────────────
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('autopost')
secrets_client = boto3.client('secretsmanager', region_name='eu-central-1')

GRAPH_API = 'https://graph.facebook.com/v21.0'

ARTICLE_DAYS = {1, 3}  # Marți=1, Joi=3 (weekday() — 0=Luni)


# ── Helpers ────────────────────────────────────────────────────────

def get_secret(secret_id):
    try:
        resp = secrets_client.get_secret_value(SecretId=secret_id)
        return json.loads(resp['SecretString'])
    except Exception:
        return None


def should_post_now(post_times, tz_name):
    try:
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)
        current_time = now.strftime('%H:00')
        return current_time in post_times
    except Exception:
        return False


def is_article_day(tz_name):
    """Postăm articole doar Marți și Joi."""
    try:
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)
        return now.weekday() in ARTICLE_DAYS
    except Exception:
        return False


def already_posted_article_today(tenant_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    resp = table.query(
        KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}')
            & Key('SK').begins_with(f'POST#ARTICLE#{today}'),
        Limit=1,
    )
    return len(resp.get('Items', [])) > 0


def get_posted_article_urls(tenant_id):
    """Returnează URL-urile articolelor deja postate."""
    resp = table.query(
        KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}')
            & Key('SK').begins_with('POST#ARTICLE#'),
    )
    return {item.get('article_url', '') for item in resp.get('Items', []) if item.get('article_url')}


def log_article_post(tenant_id, title, url, fb_post_id, post_text, error=None):
    now = datetime.utcnow()
    table.put_item(Item={
        'PK': f'TENANT#{tenant_id}',
        'SK': f'POST#ARTICLE#{now.strftime("%Y-%m-%d")}#{int(now.timestamp())}',
        'article_title': title,
        'article_url': url,
        'fb_post_id': fb_post_id or '',
        'text_posted': post_text,
        'error': error or '',
        'created_at': now.isoformat(),
    })


# ── Fetch Articole ─────────────────────────────────────────────────

def fetch_articles_rss(feed_url):
    """Parse RSS feed — returnează lista de articole."""
    resp = requests.get(feed_url, headers={'User-Agent': 'AutoPostBot'}, timeout=30)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    ns = {'media': 'http://search.yahoo.com/mrss/'}
    articles = []

    for item in root.findall('.//item'):
        title = (item.findtext('title') or '').strip()
        url = (item.findtext('link') or '').strip()
        desc = (item.findtext('description') or '').strip()
        pub_date = (item.findtext('pubDate') or '').strip()

        if title and url:
            articles.append({
                'title': title,
                'url': url,
                'description': desc[:300] if desc else '',
                'date': pub_date,
            })

    return articles


def fetch_articles_wordpress(site_url):
    """WordPress REST API: GET /wp-json/wp/v2/posts"""
    base = site_url.rstrip('/')
    if '/wp-json' in base:
        api_base = base.split('/wp-json')[0]
    else:
        api_base = base

    url = f'{api_base}/wp-json/wp/v2/posts?per_page=20&status=publish&_fields=id,title,link,excerpt,date'
    resp = requests.get(url, headers={'User-Agent': 'AutoPostBot'}, timeout=30)
    resp.raise_for_status()
    articles = []
    for p in resp.json():
        title = p.get('title', {}).get('rendered', '') or p.get('title', '')
        desc = p.get('excerpt', {}).get('rendered', '') or ''
        # Curăță HTML din excerpt
        desc = ET.fromstring(f'<root>{desc}</root>').text or '' if desc else ''
        articles.append({
            'title': title,
            'url': p.get('link', ''),
            'description': desc[:300],
            'date': p.get('date', ''),
        })
    return articles


def fetch_articles_shopify(shopify_store, shopify_token):
    """Shopify Blog API: GET /admin/api/2026-01/articles.json"""
    url = f'https://{shopify_store}/admin/api/2026-01/articles.json?limit=20&status=published&fields=id,title,handle,body_html,published_at'
    resp = requests.get(url, headers={
        'X-Shopify-Access-Token': shopify_token,
        'Content-Type': 'application/json',
    }, timeout=30)
    resp.raise_for_status()
    articles = []
    for a in resp.json().get('articles', []):
        articles.append({
            'title': a.get('title', ''),
            'url': f'https://{shopify_store}/blogs/news/{a.get("handle", "")}',
            'description': '',
            'date': a.get('published_at', ''),
        })
    return articles


def select_article(articles, posted_urls):
    """Alege articolul cel mai recent nepostat."""
    unposted = [a for a in articles if a.get('url', '') not in posted_urls]
    candidates = unposted if unposted else articles
    if not candidates:
        raise ValueError('Nu sunt articole disponibile')
    # Sortează după dată descrescător
    try:
        candidates.sort(key=lambda a: a.get('date', ''), reverse=True)
    except Exception:
        pass
    return candidates[0]


# ── Text Generator ─────────────────────────────────────────────────

def generate_text_gemini(article, gemini_key):
    """Generează text cu Gemini 2.5 Flash."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        title = article.get('title', '')
        desc = article.get('description', '')
        url = article.get('url', '')

        prompt = f"""Scrie un text scurt pentru o postare pe Facebook care promovează un articol de blog.

Titlu: {title}
Rezumat: {desc}
Link: {url}

Reguli:
- Maxim 3 propoziții, ton prietenos și invitant
- Include 2-3 emoji-uri (📖, ✨, 💡, 👉)
- Creează curiozitate pentru a citi articolul
- Termină cu CTA scurt + link
- Scrie în limba română
- NU folosi hashtag-uri

Returnează DOAR textul postării."""

        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.warning(f'Gemini eroare: {e}, folosesc caption simplu')
        return None


def build_caption(article):
    """Caption simplu fără Gemini."""
    title = article.get('title', '')
    url = article.get('url', '')
    return f'📖 {title}\n\nCitește articolul complet 👇\n{url}'


# ── Facebook Post ──────────────────────────────────────────────────

def post_link_to_facebook(page_id, page_token, link, message):
    """Postează link pe Facebook Feed."""
    data = urllib.parse.urlencode({
        'message': message,
        'link': link,
        'access_token': page_token,
    }).encode()
    req = urllib.request.Request(
        f'{GRAPH_API}/{page_id}/feed',
        data=data,
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read())
    return result.get('id') or ''


# ── Main Handler ───────────────────────────────────────────────────

def process_tenant(tenant_settings):
    tenant_id = tenant_settings['PK'].replace('TENANT#', '')
    site_type = tenant_settings.get('site_type', 'extended')
    site_url = tenant_settings.get('site_url', '')
    post_times = tenant_settings.get('post_times', [])
    timezone_name = tenant_settings.get('timezone', 'Europe/Bucharest')
    post_articles = tenant_settings.get('post_articles', True)

    logger.info(f'Tenant {tenant_id}: site_type={site_type}')

    if not post_articles:
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'post_articles=False'}

    if not is_article_day(timezone_name):
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'nu e zi de articole (Marți/Joi)'}

    if not should_post_now(post_times, timezone_name):
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'nu e ora de postare'}

    if already_posted_article_today(tenant_id):
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'articol deja postat azi'}

    fb_secret = get_secret(f'autopost/{tenant_id}/facebook')
    if not fb_secret:
        return {'tenant': tenant_id, 'status': 'error', 'reason': 'token Facebook lipsă'}

    page_id = fb_secret.get('page_id', '')
    page_token = fb_secret.get('page_access_token', '')
    if not page_id or not page_token:
        return {'tenant': tenant_id, 'status': 'error', 'reason': 'page_id/token invalid'}

    # Fetch articole
    try:
        if site_type == 'rss':
            if not site_url:
                return {'tenant': tenant_id, 'status': 'error', 'reason': 'RSS URL lipsă'}
            articles = fetch_articles_rss(site_url)
        elif site_type == 'shopify':
            shopify_secret = get_secret(f'autopost/{tenant_id}/shopify')
            if not shopify_secret:
                return {'tenant': tenant_id, 'status': 'error', 'reason': 'Shopify neconectat'}
            articles = fetch_articles_shopify(
                shopify_secret.get('shopify_store', ''),
                shopify_secret.get('shopify_token', ''),
            )
        elif site_type in ('extended', 'woo'):
            # Ambele sunt WordPress-based
            articles = fetch_articles_wordpress(site_url)
        else:
            return {'tenant': tenant_id, 'status': 'skip', 'reason': f'site_type {site_type} necunoscut'}

        if not articles:
            return {'tenant': tenant_id, 'status': 'skip', 'reason': 'nu sunt articole'}

    except Exception as e:
        logger.error(f'Fetch articole eroare ({tenant_id}): {e}')
        return {'tenant': tenant_id, 'status': 'error', 'reason': f'fetch articole: {str(e)}'}

    # Selectare articol
    posted_urls = get_posted_article_urls(tenant_id)
    try:
        article = select_article(articles, posted_urls)
    except ValueError as e:
        return {'tenant': tenant_id, 'status': 'skip', 'reason': str(e)}

    logger.info(f'Articol selectat: {article["title"]}')

    # Generare text
    api_secret = get_secret(f'autopost/{tenant_id}/apis')
    gemini_key = api_secret.get('gemini_api_key', '') if api_secret else ''
    post_text = None
    if gemini_key:
        post_text = generate_text_gemini(article, gemini_key)
    if not post_text:
        post_text = build_caption(article)

    # Postare Facebook
    try:
        fb_post_id = post_link_to_facebook(page_id, page_token, article['url'], post_text)
        logger.info(f'Postat pe Facebook: {fb_post_id}')
        log_article_post(tenant_id, article['title'], article['url'], fb_post_id, post_text)
        return {
            'tenant': tenant_id,
            'status': 'success',
            'article': article['title'],
            'fb_post_id': fb_post_id,
        }
    except Exception as e:
        logger.error(f'Eroare postare articol ({tenant_id}): {e}', exc_info=True)
        log_article_post(tenant_id, article['title'], article['url'], '', post_text, error=str(e))
        return {'tenant': tenant_id, 'status': 'error', 'reason': str(e)}


def lambda_handler(event, context):
    logger.info('AutoPost Article Poster pornit')

    scan_result = table.scan(
        FilterExpression=Attr('SK').eq('SETTINGS')
    )
    tenants = scan_result.get('Items', [])
    logger.info(f'Tenants găsiți: {len(tenants)}')

    results = []
    for tenant_settings in tenants:
        try:
            result = process_tenant(tenant_settings)
            results.append(result)
            logger.info(json.dumps(result))
        except Exception as e:
            tenant_id = tenant_settings.get('PK', '?').replace('TENANT#', '')
            logger.error(f'Eroare critică tenant {tenant_id}: {e}', exc_info=True)
            results.append({'tenant': tenant_id, 'status': 'error', 'reason': str(e)})

    logger.info(f'Rezultate finale: {json.dumps(results)}')
    return {'statusCode': 200, 'body': json.dumps(results)}
