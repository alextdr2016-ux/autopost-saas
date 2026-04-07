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

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': 'Not found'}
