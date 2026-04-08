import json
import boto3
from boto3.dynamodb.conditions import Key
import uuid

dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('autopost')
secrets = boto3.client('secretsmanager', region_name='eu-central-1')
s3 = boto3.client('s3', region_name='eu-central-1',
                  endpoint_url='https://s3.eu-central-1.amazonaws.com')

BUCKET = 'autopost-media'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Content-Type': 'application/json'
}

def get_facebook_secret(tenant_id):
    try:
        response = secrets.get_secret_value(SecretId=f'autopost/{tenant_id}/facebook')
        return json.loads(response['SecretString'])
    except Exception:
        return None

def save_shopify_secret(tenant_id, store, token):
    secret_name = f'autopost/{tenant_id}/shopify'
    secret_value = json.dumps({'shopify_store': store, 'shopify_token': token})
    try:
        secrets.create_secret(Name=secret_name, SecretString=secret_value)
    except secrets.exceptions.ResourceExistsException:
        secrets.put_secret_value(SecretId=secret_name, SecretString=secret_value)

def get_shopify_secret(tenant_id):
    try:
        response = secrets.get_secret_value(SecretId=f'autopost/{tenant_id}/shopify')
        return json.loads(response['SecretString'])
    except Exception:
        return None

def save_facebook_secret(tenant_id, page_id, page_token):
    secret_name = f'autopost/{tenant_id}/facebook'
    secret_value = json.dumps({'page_id': page_id, 'page_access_token': page_token})
    try:
        secrets.create_secret(Name=secret_name, SecretString=secret_value)
    except secrets.exceptions.ResourceExistsException:
        secrets.put_secret_value(SecretId=secret_name, SecretString=secret_value)

def lambda_handler(event, context):
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    path = event.get('path') or event.get('requestContext', {}).get('http', {}).get('path', '')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    try:
        tenant_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
    except Exception:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Unauthorized'})}

    # ── /settings ──────────────────────────────────────────
    if '/settings' in path:
        if method == 'GET':
            response = table.query(
                KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').eq('SETTINGS')
            )
            items = response.get('Items', [])
            settings = items[0] if items else {}
            fb_secret = get_facebook_secret(tenant_id)
            settings['facebook_connected'] = fb_secret is not None
            if fb_secret:
                settings['facebook_page_id'] = fb_secret.get('page_id', '')
            # instagram_account_id vine direct din DynamoDB (deja în settings dict)
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(settings, default=str)}

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'save_settings')

            if action == 'save_facebook':
                save_facebook_secret(tenant_id, body.get('page_id', ''), body.get('page_access_token', ''))
                table.update_item(
                    Key={'PK': f'TENANT#{tenant_id}', 'SK': 'SETTINGS'},
                    UpdateExpression='SET facebook_page_id = :pid',
                    ExpressionAttributeValues={':pid': body.get('page_id', '')}
                )
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

            if action == 'save_shopify':
                store = body.get('shopify_store', '').replace('https://', '').replace('http://', '').replace('/', '')
                token = body.get('shopify_token', '')
                if not store or not token:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Date lipsă'})}
                save_shopify_secret(tenant_id, store, token)
                table.update_item(
                    Key={'PK': f'TENANT#{tenant_id}', 'SK': 'SETTINGS'},
                    UpdateExpression='SET shopify_store = :s, shopify_connected = :c',
                    ExpressionAttributeValues={':s': store, ':c': True}
                )
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

            if action == 'save_instagram':
                table.update_item(
                    Key={'PK': f'TENANT#{tenant_id}', 'SK': 'SETTINGS'},
                    UpdateExpression='SET instagram_account_id = :igid',
                    ExpressionAttributeValues={':igid': body.get('instagram_account_id', '')}
                )
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

            table.put_item(Item={
                'PK': f'TENANT#{tenant_id}', 'SK': 'SETTINGS',
                'site_url': body.get('site_url', ''),
                'site_type': body.get('site_type', 'rss'),
                'post_times': body.get('post_times', ['09:00', '18:00']),
                'timezone': body.get('timezone', 'Europe/Bucharest'),
                'post_products': body.get('post_products', True),
                'post_articles': body.get('post_articles', True),
                'post_videos': body.get('post_videos', True),
            })
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # ── /videos ────────────────────────────────────────────
    elif '/videos' in path:
        if method == 'GET':
            response = table.query(
                KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').begins_with('VIDEO#')
            )
            videos = response.get('Items', [])
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(videos, default=str)}

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            filename = body.get('filename', 'video.mp4')
            video_id = str(uuid.uuid4())[:8]
            s3_key = f'tenants/{tenant_id}/videos/pending/{video_id}_{filename}'

            presigned_url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': BUCKET, 'Key': s3_key, 'ContentType': 'video/mp4'},
                ExpiresIn=900
            )

            table.put_item(Item={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'VIDEO#{video_id}',
                'video_id': video_id,
                's3_key': s3_key,
                'filename': filename,
                'status': 'pending',
            })

            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                'upload_url': presigned_url,
                'video_id': video_id,
                's3_key': s3_key
            })}

        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            video_id = body.get('video_id', '')
            s3_key = body.get('s3_key', '')
            if s3_key:
                s3.delete_object(Bucket=BUCKET, Key=s3_key)
            if video_id:
                table.delete_item(Key={'PK': f'TENANT#{tenant_id}', 'SK': f'VIDEO#{video_id}'})
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    # ── /post-image ────────────────────────────────────────
    elif '/post-image' in path:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            image_base64 = body.get('image_base64', '')
            caption = body.get('caption', '')
            post_type = body.get('post_type', 'feed')  # 'feed' or 'story'

            if not image_base64:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Imagine lipsă'})}

            fb_secret = get_facebook_secret(tenant_id)
            if not fb_secret:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Facebook neconectat'})}

            page_id = fb_secret.get('page_id', '')
            page_token = fb_secret.get('page_access_token', '')

            import urllib.request
            import urllib.parse
            import base64

            image_bytes = base64.b64decode(image_base64)

            if post_type == 'story':
                # ── STORY: upload pe S3 → URL public → photo_stories API ──
                import time
                s3_key = f'stories/{tenant_id}/{int(time.time())}.jpg'
                print(f'[STORY] Uploading to S3: {s3_key}, size={len(image_bytes)} bytes')
                s3.put_object(
                    Bucket=BUCKET,
                    Key=s3_key,
                    Body=image_bytes,
                    ContentType='image/jpeg',
                )
                # Generează URL presemnat (1 oră valabilitate)
                photo_url = s3.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': BUCKET, 'Key': s3_key},
                    ExpiresIn=3600
                )
                print(f'[STORY] S3 presigned URL generated, page_id={page_id}')

                # Apelează Facebook photo_stories API
                story_data = urllib.parse.urlencode({
                    'photo_url': photo_url,
                    'access_token': page_token,
                }).encode()
                fb_url = f'https://graph.facebook.com/v19.0/{page_id}/photo_stories'
                print(f'[STORY] Calling FB API: {fb_url}')
                req = urllib.request.Request(
                    fb_url,
                    data=story_data,
                    method='POST'
                )
                try:
                    with urllib.request.urlopen(req) as resp:
                        result = json.loads(resp.read())
                    print(f'[STORY] Success: {result}')
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'story_id': result.get('id'), 'type': 'story'})}
                except urllib.error.HTTPError as e:
                    error_body = json.loads(e.read())
                    fb_error = error_body.get('error', {})
                    print(f'[STORY] FB Error: {error_body}')
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': fb_error.get('message', 'Eroare Facebook Story')})}
            else:
                # ── FEED: upload direct pe Facebook photos API ──
                boundary = 'AutoPostBoundary'
                body_parts = []
                body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="access_token"\r\n\r\n{page_token}'.encode())
                body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}'.encode())
                body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="source"; filename="post.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + image_bytes)
                body_parts.append(f'--{boundary}--'.encode())
                multipart_body = b'\r\n'.join(body_parts)

                req = urllib.request.Request(
                    f'https://graph.facebook.com/v19.0/{page_id}/photos',
                    data=multipart_body,
                    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
                    method='POST'
                )
                try:
                    with urllib.request.urlopen(req) as resp:
                        result = json.loads(resp.read())
                    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'post_id': result.get('id'), 'type': 'feed'})}
                except urllib.error.HTTPError as e:
                    error_body = json.loads(e.read())
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': error_body.get('error', {}).get('message', 'Eroare Facebook')})}

    # ── /template-queue ───────────────────────────────────
    elif '/template-queue' in path:
        if method == 'GET':
            response = table.query(
                KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').eq('TEMPLATE_QUEUE')
            )
            items = response.get('Items', [])
            if items:
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                    'queue': items[0].get('queue', []),
                    'img_fit': items[0].get('img_fit', 'contain'),
                    'format': items[0].get('format', 'facebook'),
                }, default=str)}
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'queue': [], 'img_fit': 'contain', 'format': 'facebook'})}

        elif method in ('POST', 'PUT'):
            body = json.loads(event.get('body', '{}'))
            queue_items = body.get('queue', [])
            img_fit = body.get('img_fit', 'contain')
            fmt = body.get('format', 'facebook')

            # Validare: fiecare item trebuie să aibă templateId + count
            clean_queue = []
            for item in queue_items:
                if 'templateId' in item and 'count' in item:
                    clean_queue.append({
                        'id': item.get('id', str(uuid.uuid4())[:8]),
                        'templateId': item['templateId'],
                        'count': int(item['count']),
                        'used': int(item.get('used', 0)),
                    })

            table.put_item(Item={
                'PK': f'TENANT#{tenant_id}',
                'SK': 'TEMPLATE_QUEUE',
                'queue': clean_queue,
                'img_fit': img_fit,
                'format': fmt,
            })
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'count': len(clean_queue)})}

    # ── /posts ─────────────────────────────────────────────
    elif '/posts' in path:
        if method == 'GET':
            response = table.query(
                KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').begins_with('POST#'),
                ScanIndexForward=False,
                Limit=100,
            )
            items = response.get('Items', [])
            posts = []
            for item in items:
                sk = item.get('SK', '')
                if 'PRODUCT' in sk:
                    post_type = 'product'
                    title = item.get('product_name', '')
                elif 'ARTICLE' in sk:
                    post_type = 'article'
                    title = item.get('article_title', '')
                else:
                    post_type = 'video'
                    title = item.get('video_id', '')
                posts.append({
                    'sk': sk,
                    'type': post_type,
                    'title': title,
                    'fb_post_id': item.get('fb_post_id', ''),
                    'status': 'error' if item.get('error') else 'success',
                    'error': item.get('error', ''),
                    'created_at': item.get('created_at', ''),
                })
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(posts, default=str)}

    # ── /scheduled ────────────────────────────────────────
    elif '/scheduled' in path:
        if method == 'GET':
            response = table.query(
                KeyConditionExpression=Key('PK').eq(f'TENANT#{tenant_id}') & Key('SK').begins_with('SCHEDULED#'),
                ScanIndexForward=False,
                Limit=100,
            )
            items = response.get('Items', [])
            posts = [{
                'sk': item['SK'],
                'scheduled_at': item.get('scheduled_at', ''),
                'caption': item.get('caption', ''),
                'post_type': item.get('post_type', 'feed'),
                'status': item.get('status', 'pending'),
                'error': item.get('error', ''),
            } for item in items]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(posts, default=str)}

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            scheduled_at = body.get('scheduled_at', '')
            caption = body.get('caption', '')
            post_type = body.get('post_type', 'feed')

            if not scheduled_at or not caption:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'scheduled_at și caption sunt obligatorii'})}

            post_id = str(uuid.uuid4())[:8]
            sk = f'SCHEDULED#{scheduled_at}#{post_id}'
            table.put_item(Item={
                'PK': f'TENANT#{tenant_id}',
                'SK': sk,
                'scheduled_at': scheduled_at,
                'caption': caption,
                'post_type': post_type,
                'status': 'pending',
            })
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True, 'sk': sk})}

        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            sk = body.get('sk', '')
            if not sk or not sk.startswith('SCHEDULED#'):
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'SK invalid'})}
            table.delete_item(Key={'PK': f'TENANT#{tenant_id}', 'SK': sk})
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': 'Not found'}
