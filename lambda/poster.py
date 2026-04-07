import json
import boto3
import urllib.request
import urllib.parse
from datetime import datetime
from zoneinfo import ZoneInfo
import time

dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('autopost')
secrets = boto3.client('secretsmanager', region_name='eu-central-1')
s3 = boto3.client('s3', region_name='eu-central-1',
                  endpoint_url='https://s3.eu-central-1.amazonaws.com')

BUCKET = 'autopost-media'
GRAPH_API = 'https://graph.facebook.com/v19.0'

def http_post(url, params):
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def http_get(url, params):
    full_url = url + '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(full_url) as resp:
        return json.loads(resp.read())

def get_facebook_secret(tenant_id):
    try:
        response = secrets.get_secret_value(SecretId=f'autopost/{tenant_id}/facebook')
        return json.loads(response['SecretString'])
    except Exception:
        return None

def get_video_url(s3_key, expires=3600):
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET, 'Key': s3_key},
        ExpiresIn=expires
    )

def get_pending_video(tenant_id):
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

def wait_for_media(creation_id, page_token):
    for _ in range(10):
        time.sleep(5)
        data = http_get(f'{GRAPH_API}/{creation_id}', {
            'fields': 'status_code',
            'access_token': page_token,
        })
        status = data.get('status_code', '')
        if status == 'FINISHED':
            return True
        if status == 'ERROR':
            return False
    return False

def post_instagram_reel(ig_account_id, page_token, video_url, caption=''):
    data = http_post(f'{GRAPH_API}/{ig_account_id}/media', {
        'media_type': 'REELS',
        'video_url': video_url,
        'caption': caption,
        'share_to_feed': 'true',
        'access_token': page_token,
    })
    if 'error' in data:
        raise Exception(f"Reel container error: {data['error']['message']}")
    creation_id = data['id']
    if not wait_for_media(creation_id, page_token):
        raise Exception('Reel processing error pe Instagram')
    pub = http_post(f'{GRAPH_API}/{ig_account_id}/media_publish', {
        'creation_id': creation_id,
        'access_token': page_token,
    })
    if 'error' in pub:
        raise Exception(f"Reel publish error: {pub['error']['message']}")
    return pub.get('id')

def post_instagram_story(ig_account_id, page_token, video_url):
    data = http_post(f'{GRAPH_API}/{ig_account_id}/media', {
        'media_type': 'STORIES',
        'video_url': video_url,
        'access_token': page_token,
    })
    if 'error' in data:
        raise Exception(f"Story container error: {data['error']['message']}")
    creation_id = data['id']
    if not wait_for_media(creation_id, page_token):
        raise Exception('Story processing error pe Instagram')
    pub = http_post(f'{GRAPH_API}/{ig_account_id}/media_publish', {
        'creation_id': creation_id,
        'access_token': page_token,
    })
    if 'error' in pub:
        raise Exception(f"Story publish error: {pub['error']['message']}")
    return pub.get('id')

def should_post_now(post_times, tz_name):
    try:
        tz = ZoneInfo(tz_name)
        now = datetime.now(tz)
        current_time = now.strftime('%H:00')
        return current_time in post_times
    except Exception:
        return False

def lambda_handler(event, context):
    print('AutoPost poster pornit')
    scan_result = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('SK').eq('SETTINGS')
    )
    tenants = scan_result.get('Items', [])
    print(f'Tenants gasiti: {len(tenants)}')
    results = []
    for tenant_settings in tenants:
        tenant_id = tenant_settings['PK'].replace('TENANT#', '')
        post_times = tenant_settings.get('post_times', [])
        timezone_name = tenant_settings.get('timezone', 'Europe/Bucharest')
        post_videos = tenant_settings.get('post_videos', True)
        ig_account_id = tenant_settings.get('instagram_account_id', '')
        if not should_post_now(post_times, timezone_name):
            continue
        if not post_videos:
            continue
        if not ig_account_id:
            results.append({'tenant': tenant_id, 'status': 'skip', 'reason': 'instagram_account_id lipsa'})
            continue
        fb_secret = get_facebook_secret(tenant_id)
        if not fb_secret:
            results.append({'tenant': tenant_id, 'status': 'error', 'reason': 'token Facebook lipsa'})
            continue
        page_token = fb_secret.get('page_access_token', '')
        video = get_pending_video(tenant_id)
        if not video:
            results.append({'tenant': tenant_id, 'status': 'skip', 'reason': 'fara videouri pending'})
            continue
        video_id = video['video_id']
        s3_key = video['s3_key']
        video_url = get_video_url(s3_key, expires=3600)
        caption = f'🎬 {video.get("filename", "").replace(".mp4", "").replace("_", " ")}'
        tenant_result = {'tenant': tenant_id, 'video_id': video_id}
        try:
            reel_id = post_instagram_reel(ig_account_id, page_token, video_url, caption)
            log_post(tenant_id, video_id, 'reel', 'success')
            tenant_result['reel'] = reel_id
        except Exception as e:
            log_post(tenant_id, video_id, 'reel', 'error', str(e))
            tenant_result['reel_error'] = str(e)
        try:
            story_id = post_instagram_story(ig_account_id, page_token, video_url)
            log_post(tenant_id, video_id, 'story', 'success')
            tenant_result['story'] = story_id
        except Exception as e:
            log_post(tenant_id, video_id, 'story', 'error', str(e))
            tenant_result['story_error'] = str(e)
        if 'reel' in tenant_result or 'story' in tenant_result:
            mark_video_used(tenant_id, video_id)
        results.append(tenant_result)
    print(json.dumps(results, indent=2))
    return {'statusCode': 200, 'body': json.dumps(results)}
