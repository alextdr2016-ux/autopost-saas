import json
import boto3
import requests
from datetime import datetime, timezone
import pytz

dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('autopost')
secrets = boto3.client('secretsmanager', region_name='eu-central-1')
s3 = boto3.client('s3', region_name='eu-central-1',
                  endpoint_url='https://s3.eu-central-1.amazonaws.com')

BUCKET = 'autopost-media'
GRAPH_API = 'https://graph.facebook.com/v19.0'


# ── Helpers ────────────────────────────────────────────────

def get_facebook_secret(tenant_id):
    try:
        response = secrets.get_secret_value(SecretId=f'autopost/{tenant_id}/facebook')
        return json.loads(response['SecretString'])
    except Exception:
        return None


def get_video_url(s3_key, expires=3600):
    """Generează presigned URL public temporar pentru Meta să descarce videoul."""
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET, 'Key': s3_key},
        ExpiresIn=expires
    )


def get_pending_video(tenant_id):
    """Returnează primul video cu status pending al tenantului."""
    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('PK').eq(f'TENANT#{tenant_id}')
            & boto3.dynamodb.conditions.Key('SK').begins_with('VIDEO#'),
        FilterExpression=boto3.dynamodb.conditions.Attr('status').eq('pending'),
        Limit=1
    )
    items = response.get('Items', [])
    return items[0] if items else None


def mark_video_used(tenant_id, video_id):
    table.update_item(
        Key={'PK': f'TENANT#{tenant_id}', 'SK': f'VIDEO#{video_id}'},
        UpdateExpression='SET #s = :used',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':used': 'used'}
    )


def log_post(tenant_id, video_id, post_type, result, error=None):
    """Salvează istoricul postării în DynamoDB."""
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    table.put_item(Item={
        'PK': f'TENANT#{tenant_id}',
        'SK': f'POST#{now}#{post_type}',
        'video_id': video_id,
        'post_type': post_type,
        'result': result,
        'error': error or '',
        'created_at': now,
    })


# ── Instagram Graph API ────────────────────────────────────

def post_instagram_reel(ig_account_id, page_token, video_url, caption=''):
    """
    Postează video ca Reel pe Instagram.
    Flow: creare container → așteptare procesare → publicare
    """
    # 1. Creare container media
    r = requests.post(f'{GRAPH_API}/{ig_account_id}/media', params={
        'media_type': 'REELS',
        'video_url': video_url,
        'caption': caption,
        'share_to_feed': 'true',
        'access_token': page_token,
    })
    data = r.json()
    if 'error' in data:
        raise Exception(f"Reel container error: {data['error']['message']}")

    creation_id = data['id']

    # 2. Așteptăm să fie gata (polling status)
    import time
    for _ in range(10):
        time.sleep(5)
        status_r = requests.get(f'{GRAPH_API}/{creation_id}', params={
            'fields': 'status_code',
            'access_token': page_token,
        })
        status = status_r.json().get('status_code', '')
        if status == 'FINISHED':
            break
        if status == 'ERROR':
            raise Exception('Reel processing error pe Instagram')

    # 3. Publicare
    pub_r = requests.post(f'{GRAPH_API}/{ig_account_id}/media_publish', params={
        'creation_id': creation_id,
        'access_token': page_token,
    })
    pub_data = pub_r.json()
    if 'error' in pub_data:
        raise Exception(f"Reel publish error: {pub_data['error']['message']}")

    return pub_data.get('id')


def post_instagram_story(ig_account_id, page_token, video_url):
    """
    Postează video ca Story pe Instagram.
    """
    # 1. Creare container
    r = requests.post(f'{GRAPH_API}/{ig_account_id}/media', params={
        'media_type': 'STORIES',
        'video_url': video_url,
        'access_token': page_token,
    })
    data = r.json()
    if 'error' in data:
        raise Exception(f"Story container error: {data['error']['message']}")

    creation_id = data['id']

    # 2. Așteptăm procesare
    import time
    for _ in range(10):
        time.sleep(5)
        status_r = requests.get(f'{GRAPH_API}/{creation_id}', params={
            'fields': 'status_code',
            'access_token': page_token,
        })
        status = status_r.json().get('status_code', '')
        if status == 'FINISHED':
            break
        if status == 'ERROR':
            raise Exception('Story processing error pe Instagram')

    # 3. Publicare
    pub_r = requests.post(f'{GRAPH_API}/{ig_account_id}/media_publish', params={
        'creation_id': creation_id,
        'access_token': page_token,
    })
    pub_data = pub_r.json()
    if 'error' in pub_data:
        raise Exception(f"Story publish error: {pub_data['error']['message']}")

    return pub_data.get('id')


# ── Verificare oră ─────────────────────────────────────────

def should_post_now(post_times, tz_name):
    """Returnează True dacă ora curentă (în fusul orar al tenantului) e în post_times."""
    try:
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)
        current_time = now.strftime('%H:00')
        return current_time in post_times
    except Exception:
        return False


# ── Handler principal ──────────────────────────────────────

def lambda_handler(event, context):
    print('AutoPost poster pornit')

    # Scanează toți tenants (SK = SETTINGS)
    scan_result = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('SK').eq('SETTINGS')
    )
    tenants = scan_result.get('Items', [])
    print(f'Tenants găsiți: {len(tenants)}')

    results = []

    for tenant_settings in tenants:
        tenant_id = tenant_settings['PK'].replace('TENANT#', '')
        post_times = tenant_settings.get('post_times', [])
        timezone_name = tenant_settings.get('timezone', 'Europe/Bucharest')
        post_videos = tenant_settings.get('post_videos', True)
        ig_account_id = tenant_settings.get('instagram_account_id', '')

        print(f'Procesez tenant: {tenant_id}, ore: {post_times}, tz: {timezone_name}')

        # Verifică dacă trebuie să posteze acum
        if not should_post_now(post_times, timezone_name):
            print(f'  → Nu e ora de postare pentru {tenant_id}')
            continue

        if not post_videos:
            print(f'  → Videouri dezactivate pentru {tenant_id}')
            continue

        if not ig_account_id:
            print(f'  → Instagram Account ID lipsă pentru {tenant_id} — skip')
            results.append({'tenant': tenant_id, 'status': 'skip', 'reason': 'instagram_account_id lipsă'})
            continue

        # Ia token Facebook
        fb_secret = get_facebook_secret(tenant_id)
        if not fb_secret:
            print(f'  → Token Facebook lipsă pentru {tenant_id}')
            results.append({'tenant': tenant_id, 'status': 'error', 'reason': 'token Facebook lipsă'})
            continue

        page_token = fb_secret.get('page_access_token', '')

        # Ia video pending
        video = get_pending_video(tenant_id)
        if not video:
            print(f'  → Nu există videouri pending pentru {tenant_id}')
            results.append({'tenant': tenant_id, 'status': 'skip', 'reason': 'fără videouri pending'})
            continue

        video_id = video['video_id']
        s3_key = video['s3_key']
        print(f'  → Video selectat: {video["filename"]} ({video_id})')

        # Generează URL public temporar (valabil 1 oră)
        video_url = get_video_url(s3_key, expires=3600)

        caption = f'🎬 {video.get("filename", "").replace(".mp4", "").replace("_", " ")}'

        tenant_result = {'tenant': tenant_id, 'video_id': video_id}

        # Postează Reel
        try:
            reel_id = post_instagram_reel(ig_account_id, page_token, video_url, caption)
            print(f'  ✓ Reel postat: {reel_id}')
            log_post(tenant_id, video_id, 'reel', 'success')
            tenant_result['reel'] = reel_id
        except Exception as e:
            print(f'  ✗ Eroare Reel: {e}')
            log_post(tenant_id, video_id, 'reel', 'error', str(e))
            tenant_result['reel_error'] = str(e)

        # Postează Story
        try:
            story_id = post_instagram_story(ig_account_id, page_token, video_url)
            print(f'  ✓ Story postat: {story_id}')
            log_post(tenant_id, video_id, 'story', 'success')
            tenant_result['story'] = story_id
        except Exception as e:
            print(f'  ✗ Eroare Story: {e}')
            log_post(tenant_id, video_id, 'story', 'error', str(e))
            tenant_result['story_error'] = str(e)

        # Marchează video ca folosit doar dacă cel puțin una a reușit
        if 'reel' in tenant_result or 'story' in tenant_result:
            mark_video_used(tenant_id, video_id)
            print(f'  ✓ Video {video_id} marcat ca used')

        results.append(tenant_result)

    print(f'Rezultate finale: {json.dumps(results, indent=2)}')
    return {'statusCode': 200, 'body': json.dumps(results)}
