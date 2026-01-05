#!/bin/bash

echo "Queuing all videos for compression..."

aws s3 ls s3://mayi/ --recursive | grep -iE "\.(mp4|mov)$" | grep -v "\-compressed\." | awk '{print $4}' > /tmp/videos-to-compress.txt

while read video; do
  echo "Compressing: $video"
  aws lambda invoke \
    --function-name mayi-video-compressor \
    --payload "{\"Records\":[{\"s3\":{\"bucket\":{\"name\":\"mayi\"},\"object\":{\"key\":\"$video\"}}}]}" \
    --cli-binary-format raw-in-base64-out \
    --invocation-type Event \
    /tmp/lambda-out.json > /dev/null 2>&1
  echo "  Queued"
done < /tmp/videos-to-compress.txt

echo ""
echo "All videos queued for compression!"
echo "Each takes ~1-2 minutes. Check CloudWatch logs for progress."
