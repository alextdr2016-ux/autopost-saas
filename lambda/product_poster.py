"""
Lambda: AutoPost — Product Poster (multi-tenant)
Rulează orar via EventBridge: cron(0 * * * ? *)

Pentru fiecare tenant cu post_products=True:
  1. Verifică dacă e ora de postare (post_times + timezone)
  2. Verifică anti-duplicate: nu postăm de două ori în aceeași zi
  3. Fetch produse din Extended CMS / Shopify / WooCommerce
  4. Descarcă imaginea produsului
  5. Generează banner Minimal Luxe cu Pillow (1080x1620, 2:3)
  6. Postează pe Facebook Feed
  7. Log în DynamoDB (POST#PRODUCT#{date})

Requires Lambda Layer: Pillow + requests
Fonts bundled: fonts/Montserrat.ttf + fonts/CormorantGaramond-Italic.ttf
"""

import json
import logging
import os
import re
import tempfile
import urllib.parse
import urllib.request
from datetime import datetime
from io import BytesIO
from zoneinfo import ZoneInfo

import boto3
import requests
from boto3.dynamodb.conditions import Attr, Key
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ── AWS ────────────────────────────────────────────────────────────
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('autopost')
secrets_client = boto3.client('secretsmanager', region_name='eu-central-1')

GRAPH_API = 'https://graph.facebook.com/v21.0'
BUCKET = 'autopost-media'
RENDERER_LAMBDA = os.environ.get('RENDERER_LAMBDA', 'autopost-template-renderer')
lambda_client = boto3.client('lambda', region_name='eu-central-1')

# ── Banner ─────────────────────────────────────────────────────────
GOLD = '#C9A84C'
WHITE = '#FFFFFF'
CREAM = (245, 240, 235)
FONTS_DIR = os.path.join(os.path.dirname(__file__), 'fonts')

BANNER_W = 1080
BANNER_H = 1620


# ── Helpers ────────────────────────────────────────────────────────

def load_font(name, size):
    path = os.path.join(FONTS_DIR, name)
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        logger.warning(f'Font {name} not found, using default')
        return ImageFont.load_default()


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


def already_posted_product_today(tenant_id):
    today = datetime.utcnow().strftime('%Y-%m-%d')
    resp = table.query(
        KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}')
            & Key('SK').begins_with(f'POST#PRODUCT#{today}'),
        Limit=1,
    )
    return len(resp.get('Items', [])) > 0


def get_posted_product_ids(tenant_id, days=90):
    """Produse deja postate în ultimele N zile — evităm repetiția."""
    from datetime import timedelta
    start_ts = (datetime.utcnow() - timedelta(days=days)).strftime('%Y-%m-%d')
    resp = table.query(
        KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}')
            & Key('SK').begins_with('POST#PRODUCT#'),
    )
    posted = set()
    for item in resp.get('Items', []):
        date_part = item.get('SK', '').replace('POST#PRODUCT#', '')[:10]
        if date_part >= start_ts:
            pid = item.get('product_id', '')
            if pid:
                posted.add(str(pid))
    return posted


def log_product_post(tenant_id, product_id, product_name, fb_post_id, site_type, error=None):
    now = datetime.utcnow()
    table.put_item(Item={
        'PK': f'TENANT#{tenant_id}',
        'SK': f'POST#PRODUCT#{now.strftime("%Y-%m-%d")}#{int(now.timestamp())}',
        'product_id': str(product_id),
        'product_name': product_name,
        'fb_post_id': fb_post_id or '',
        'site_type': site_type,
        'template': 'minimal_luxe',
        'error': error or '',
        'created_at': now.isoformat(),
    })


# ── Fetch produse ──────────────────────────────────────────────────

def fetch_products_extended(site_url, api_key=None):
    """Extended CMS: GET {site_url}?produse&apikey={key}"""
    url = site_url.rstrip('/')
    if api_key:
        url += f'?produse&apikey={api_key}'
    else:
        url += '?produse'
    resp = requests.get(url, headers={'User-Agent': 'AutoPostBot'}, timeout=300)
    resp.raise_for_status()
    data = resp.json()
    items = data.values() if isinstance(data, dict) else data
    products = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        pid = str(item.get('id_produs', ''))
        if pid and pid not in seen:
            seen.add(pid)
            products.append({
                'id': pid,
                'name': item.get('nume', ''),
                'image_url': item.get('imagine', ''),
                'link': item.get('link', ''),
                'stock': _extended_stock(item),
                '_raw': item,
            })
    return products


def _extended_stock(product):
    opts = product.get('optiuni', {})
    if isinstance(opts, dict):
        total = 0
        for opt in opts.values():
            if isinstance(opt, dict):
                try:
                    total += int(opt.get('stoc_fizic', 0))
                except (TypeError, ValueError):
                    pass
        return total
    return 1


def fetch_products_shopify(shopify_store, shopify_token):
    """Shopify Admin API: GET /admin/api/2026-01/products.json"""
    url = f'https://{shopify_store}/admin/api/2026-01/products.json?limit=100&status=active&fields=id,title,handle,images'
    resp = requests.get(url, headers={
        'X-Shopify-Access-Token': shopify_token,
        'Content-Type': 'application/json',
    }, timeout=60)
    resp.raise_for_status()
    products = []
    for p in resp.json().get('products', []):
        images = p.get('images', [])
        image_url = images[0].get('src', '') if images else ''
        products.append({
            'id': str(p.get('id', '')),
            'name': p.get('title', ''),
            'image_url': image_url,
            'link': f'https://{shopify_store}/products/{p.get("handle", "")}',
            'stock': 99,
            '_raw': p,
        })
    return products


def fetch_products_woo(site_url, consumer_key=None, consumer_secret=None):
    """WooCommerce REST API: GET /wp-json/wc/v3/products"""
    base = site_url.rstrip('/')
    # Încearcă să detecteze dacă site_url conține deja calea API
    if '/wp-json' not in base:
        url = f'{base}/wp-json/wc/v3/products?per_page=50&status=publish'
    else:
        url = f'{base}/products?per_page=50&status=publish'
    auth = None
    if consumer_key and consumer_secret:
        auth = (consumer_key, consumer_secret)
    resp = requests.get(url, auth=auth, headers={'User-Agent': 'AutoPostBot'}, timeout=60)
    resp.raise_for_status()
    products = []
    for p in resp.json():
        images = p.get('images', [])
        image_url = images[0].get('src', '') if images else ''
        products.append({
            'id': str(p.get('id', '')),
            'name': p.get('name', ''),
            'image_url': image_url,
            'link': p.get('permalink', site_url),
            'stock': p.get('stock_quantity') or 1,
            '_raw': p,
        })
    return products


def select_product(products, posted_ids):
    """Alege produsul: nepostat, stoc > 0, randomizare în top 10."""
    import random
    with_stock = [p for p in products if (p.get('stock') or 0) > 0]
    if not with_stock:
        with_stock = products  # fallback

    unposted = [p for p in with_stock if p['id'] not in posted_ids]
    candidates = unposted if unposted else with_stock

    # Sortează după id descrescător (produse noi primele)
    try:
        candidates.sort(key=lambda p: int(p['id']), reverse=True)
    except (ValueError, TypeError):
        pass

    top = candidates[:10]
    return random.choice(top) if top else candidates[0]


def extract_brand(site_url):
    """Extrage domeniul scurt: https://ejolie.ro/... → ejolie.ro"""
    try:
        parsed = urllib.parse.urlparse(site_url)
        host = parsed.netloc or parsed.path.split('/')[0]
        return host.replace('www.', '')
    except Exception:
        return site_url


# ── Image Download ─────────────────────────────────────────────────

def scrape_extended_image(product_raw, site_url):
    """
    Încearcă să scrape galeria Extended CMS pentru poza full-model.
    Fallback pe câmpul 'imagine'.
    """
    link = product_raw.get('link', '')
    product_id = str(product_raw.get('id_produs', ''))
    if not link or not product_id:
        return product_raw.get('imagine', '')

    base = urllib.parse.urlparse(site_url)
    domain = f'{base.scheme}://{base.netloc}'
    product_url = link if link.startswith('http') else f'{domain}/{link.lstrip("/")}'

    try:
        resp = requests.get(product_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
        resp.raise_for_status()
        # Caută imagini 1000px din galerie (pattern ejolie-style Extended CMS)
        pattern = rf'https?://[^"\'>\s]*/{product_id}/1000/[^"\'>\s]+'
        matches = re.findall(pattern, resp.text)
        if matches:
            return matches[0]
    except Exception as e:
        logger.warning(f'Gallery scrape failed: {e}')

    return product_raw.get('imagine', '')


def download_image(url):
    """Descarcă imaginea, returnează path temp JPEG."""
    resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)
    resp.raise_for_status()
    img = Image.open(BytesIO(resp.content))
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    img.convert('RGB').save(tmp.name, 'JPEG', quality=95)
    tmp.close()
    return tmp.name


# ── Template Queue ─────────────────────────────────────────────────

def get_template_queue(tenant_id):
    """Citește coada de template-uri din DynamoDB."""
    resp = table.query(
        KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').eq('TEMPLATE_QUEUE')
    )
    items = resp.get('Items', [])
    if not items:
        return None
    return items[0]


def get_next_template(queue_data):
    """Returnează template-ul următor din coadă (primul care nu e complet)."""
    queue_items = queue_data.get('queue', [])
    if isinstance(queue_items, str):
        queue_items = json.loads(queue_items)
    for item in queue_items:
        used = int(item.get('used', 0))
        count = int(item.get('count', 0))
        if used < count:
            return item
    return None


def advance_queue(tenant_id, queue_data, template_item_id):
    """Avansează contorul 'used' al template-ului curent din coadă."""
    queue_items = queue_data.get('queue', [])
    if isinstance(queue_items, str):
        queue_items = json.loads(queue_items)
    for item in queue_items:
        if item.get('id') == template_item_id:
            item['used'] = int(item.get('used', 0)) + 1
            break
    table.put_item(Item={
        'PK': f'TENANT#{tenant_id}',
        'SK': 'TEMPLATE_QUEUE',
        'queue': queue_items,
        'img_fit': queue_data.get('img_fit', 'contain'),
        'format': queue_data.get('format', 'facebook'),
    })


def render_template_via_lambda(template_id, image_url, product_name, product_price='',
                                promo_text='', img_fit='contain', fmt='facebook', bg_color='#e5e7eb'):
    """Invocă Lambda-ul template-renderer (Puppeteer) și returnează JPEG bytes."""
    payload = {
        'templateId': template_id,
        'format': fmt,
        'productName': product_name,
        'productPrice': product_price,
        'promoText': promo_text,
        'imgFit': img_fit,
        'bgColor': bg_color,
        'imageUrl': image_url,
    }
    resp = lambda_client.invoke(
        FunctionName=RENDERER_LAMBDA,
        InvocationType='RequestResponse',
        Payload=json.dumps(payload),
    )
    result = json.loads(resp['Payload'].read())
    if result.get('statusCode') != 200:
        raise RuntimeError(f'Renderer error: {result.get("body", "unknown")}')

    import base64
    return base64.b64decode(result['body'])


# ── Banner Generation (fallback Pillow) ───────────────────────────

def fit_image(img, target_w, target_h):
    """Imagine completă vizibilă (fit), centrat pe fundal crem."""
    w, h = img.size
    scale = min(target_w / w, target_h / h)
    new_w, new_h = int(w * scale), int(h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new('RGB', (target_w, target_h), CREAM)
    canvas.paste(img, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    return canvas.convert('RGBA')


def draw_gradient(img, y_start, y_end, color_rgb, alpha_start, alpha_end):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(y_start, y_end):
        ratio = (y - y_start) / max(1, y_end - y_start)
        alpha = int(alpha_start + (alpha_end - alpha_start) * ratio)
        draw.line([(0, y), (img.width, y)], fill=(*color_rgb, alpha))
    return Image.alpha_composite(img, overlay)


def get_short_name(name, max_words=5):
    words = name.split()
    return ' '.join(words[:max_words]) if len(words) > max_words else name


def generate_banner(image_path, output_path, product_name, brand):
    """Generează banner Minimal Luxe — 1080×1620 (2:3)."""
    img = Image.open(image_path).convert('RGBA')
    img = fit_image(img, BANNER_W, BANNER_H)

    # Gradient întunecat jos
    img = draw_gradient(img, 1250, BANNER_H, (0, 0, 0), 0, 220)

    draw = ImageDraw.Draw(img)

    # Linie aurie centrată
    line_w = 140
    line_x = (BANNER_W - line_w) // 2
    draw.line([(line_x, 1400), (line_x + line_w, 1400)], fill=GOLD, width=2)

    # Brand name (ex: ejolie.ro)
    font_brand = load_font('Montserrat.ttf', 28)
    bbox = draw.textbbox((0, 0), brand, font=font_brand)
    tw = bbox[2] - bbox[0]
    draw.text(((BANNER_W - tw) // 2, 1420), brand, fill=GOLD, font=font_brand)

    # Numele produsului
    font_name = load_font('CormorantGaramond-Italic.ttf', 52)
    short = get_short_name(product_name)
    bbox = draw.textbbox((0, 0), short, font=font_name)
    tw = bbox[2] - bbox[0]
    # Dacă e prea lung, micșorăm fontul
    if tw > BANNER_W - 80:
        font_name = load_font('CormorantGaramond-Italic.ttf', 40)
        bbox = draw.textbbox((0, 0), short, font=font_name)
        tw = bbox[2] - bbox[0]
    draw.text(((BANNER_W - tw) // 2, 1480), short, fill=WHITE, font=font_name)

    img.convert('RGB').save(output_path, 'JPEG', quality=95)
    logger.info(f'Banner salvat: {output_path}')


# ── Facebook Post ──────────────────────────────────────────────────

def post_photo_to_facebook(page_id, page_token, image_path, caption):
    """Upload imagine pe Facebook Feed via multipart."""
    boundary = 'AutoPostBoundary'
    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    parts = []
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="access_token"\r\n\r\n{page_token}'.encode()
    )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\n{caption}'.encode()
    )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="published"\r\n\r\ntrue'.encode()
    )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="source"; filename="banner.jpg"\r\n'
        f'Content-Type: image/jpeg\r\n\r\n'.encode() + image_bytes
    )
    parts.append(f'--{boundary}--'.encode())
    body = b'\r\n'.join(parts)

    req = urllib.request.Request(
        f'{GRAPH_API}/{page_id}/photos',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
    return result.get('post_id') or result.get('id') or ''


# ── Main Handler ───────────────────────────────────────────────────

def process_tenant(tenant_settings, force=False):
    tenant_id = tenant_settings['PK'].replace('TENANT#', '')
    site_type = tenant_settings.get('site_type', 'extended')
    site_url = tenant_settings.get('site_url', '')
    post_times = tenant_settings.get('post_times', [])
    timezone_name = tenant_settings.get('timezone', 'Europe/Bucharest')
    post_products = tenant_settings.get('post_products', True)
    ig_account_id = tenant_settings.get('instagram_account_id', '')

    logger.info(f'Tenant {tenant_id}: site_type={site_type}, force={force}')

    if not post_products:
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'post_products=False'}

    if not force and not should_post_now(post_times, timezone_name):
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'nu e ora de postare'}

    if not force and already_posted_product_today(tenant_id):
        return {'tenant': tenant_id, 'status': 'skip', 'reason': 'deja postat azi'}

    fb_secret = get_secret(f'autopost/{tenant_id}/facebook')
    if not fb_secret:
        return {'tenant': tenant_id, 'status': 'error', 'reason': 'token Facebook lipsă'}

    page_id = fb_secret.get('page_id', '')
    page_token = fb_secret.get('page_access_token', '')
    if not page_id or not page_token:
        return {'tenant': tenant_id, 'status': 'error', 'reason': 'page_id/token invalid'}

    # Fetch produse
    try:
        if site_type == 'shopify':
            shopify_secret = get_secret(f'autopost/{tenant_id}/shopify')
            if not shopify_secret:
                return {'tenant': tenant_id, 'status': 'error', 'reason': 'Shopify neconectat'}
            products = fetch_products_shopify(
                shopify_secret.get('shopify_store', ''),
                shopify_secret.get('shopify_token', ''),
            )
        elif site_type == 'woo':
            products = fetch_products_woo(site_url)
        elif site_type == 'extended':
            apis_secret = get_secret(f'autopost/{tenant_id}/apis')
            api_key = apis_secret.get('extended_api_key', '') if apis_secret else ''
            products = fetch_products_extended(site_url, api_key=api_key if api_key else None)
        else:
            return {'tenant': tenant_id, 'status': 'skip', 'reason': f'site_type {site_type} nu suportă produse'}

        if not products:
            return {'tenant': tenant_id, 'status': 'skip', 'reason': 'catalog gol'}

    except Exception as e:
        logger.error(f'Fetch produse eroare ({tenant_id}): {e}')
        return {'tenant': tenant_id, 'status': 'error', 'reason': f'fetch produse: {str(e)}'}

    # Selectare produs
    posted_ids = get_posted_product_ids(tenant_id)
    product = select_product(products, posted_ids)
    logger.info(f'Produs selectat: {product["name"]} (id={product["id"]})')

    image_path = None
    banner_path = None

    try:
        # Imaginea produsului
        image_url = product['image_url']
        if site_type == 'extended' and not image_url:
            image_url = scrape_extended_image(product.get('_raw', {}), site_url)
        if not image_url:
            return {'tenant': tenant_id, 'status': 'error', 'reason': 'produs fără imagine'}

        # ── Verifică coada de template-uri ──
        queue_data = get_template_queue(tenant_id)
        next_tpl = get_next_template(queue_data) if queue_data else None
        template_used = 'minimal_luxe'

        if next_tpl:
            # Rendează cu Puppeteer via template-renderer Lambda
            tpl_id = next_tpl.get('templateId', 'frame_gold')
            img_fit = queue_data.get('img_fit', 'contain')
            fmt = queue_data.get('format', 'facebook')
            logger.info(f'Folosim template din coadă: {tpl_id} (fit={img_fit}, format={fmt})')

            try:
                jpeg_bytes = render_template_via_lambda(
                    template_id=tpl_id,
                    image_url=image_url,
                    product_name=get_short_name(product['name']),
                    img_fit=img_fit,
                    fmt=fmt,
                )
                banner_path = tempfile.mktemp(suffix='.jpg')
                with open(banner_path, 'wb') as f:
                    f.write(jpeg_bytes)
                template_used = tpl_id

                # Avansează contorul cozii
                advance_queue(tenant_id, queue_data, next_tpl.get('id', ''))
                logger.info(f'Template {tpl_id} randat cu succes, contor avansat')

            except Exception as e:
                logger.warning(f'Renderer Lambda eșuat ({e}), fallback pe Pillow')
                next_tpl = None  # fallback

        if not next_tpl:
            # Fallback: banner Pillow (Minimal Luxe)
            image_path = download_image(image_url)
            banner_path = tempfile.mktemp(suffix='.jpg')
            brand = extract_brand(site_url if site_type != 'shopify' else product.get('link', site_url))
            generate_banner(image_path, banner_path, product['name'], brand)

        # Caption
        caption = f'✨ {get_short_name(product["name"])}\n\nDescopera acum 👇\n{product["link"]}'

        # Postare Facebook
        fb_post_id = post_photo_to_facebook(page_id, page_token, banner_path, caption)
        logger.info(f'Postat pe Facebook: {fb_post_id} (template={template_used})')

        # Log
        log_product_post(tenant_id, product['id'], product['name'], fb_post_id, site_type)

        return {
            'tenant': tenant_id,
            'status': 'success',
            'product': product['name'],
            'fb_post_id': fb_post_id,
            'template': template_used,
        }

    except Exception as e:
        logger.error(f'Eroare postare ({tenant_id}): {e}', exc_info=True)
        log_product_post(tenant_id, product.get('id', ''), product.get('name', ''), '', site_type, error=str(e))
        return {'tenant': tenant_id, 'status': 'error', 'reason': str(e)}

    finally:
        if image_path and os.path.exists(image_path):
            os.unlink(image_path)
        if banner_path and os.path.exists(banner_path):
            os.unlink(banner_path)


def lambda_handler(event, context):
    logger.info('AutoPost Product Poster pornit')

    # Scanează toți tenant-ii cu SETTINGS
    scan_result = table.scan(
        FilterExpression=Attr('SK').eq('SETTINGS')
    )
    tenants = scan_result.get('Items', [])
    logger.info(f'Tenants găsiți: {len(tenants)}')

    force = event.get('force', False)
    results = []
    for tenant_settings in tenants:
        try:
            result = process_tenant(tenant_settings, force=force)
            results.append(result)
            logger.info(json.dumps(result))
        except Exception as e:
            tenant_id = tenant_settings.get('PK', '?').replace('TENANT#', '')
            logger.error(f'Eroare critică tenant {tenant_id}: {e}', exc_info=True)
            results.append({'tenant': tenant_id, 'status': 'error', 'reason': str(e)})

    logger.info(f'Rezultate finale: {json.dumps(results)}')
    return {'statusCode': 200, 'body': json.dumps(results)}
