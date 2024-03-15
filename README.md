# Emoji maker
This is a simple NodeJS API where the user can upload an image, and it will be transformed into a 100x100 thumbnail.
The user can then call another API to receive said thumbnail.

# Run locally
Build the docker image.
```
docker build -t emoji_maker .
```
Run the docker container.
```
docker run --publish 3000:8090 emoji_maker
```
Then you can upload an image with
```
curl -X POST -F "image=@/PATH_TO_IMAGE/image.png" https://localhost:3000/upload
```
The API response should be something like
```
{
  "message": "File upload in progress",
  "jobId": "ab5d20fb-8004-4991-b9c4-962500f1d51d"
}
```
The job ID can then be used to get the image using the endpoint `/images/JOB_ID`.
A list of all jobs can be found using the endpoint `/jobs` with sample response
```
[
    {
        "job_id": "ab5d20fb-8004-4991-b9c4-962500f1d51d",
        "status": "uploading"
    },
    {
        "job_id": "d0311f23-028c-4e83-8c5b-705a74198409",
        "status": "done"
    }
]
```

# Deploying
We can use helm to deploy the application.
First, package it with
```
helm package deploy
```
Then deploy it with
```
helm upgrade deploy ./assignment-0.1.0.tgz
```
The deployment port should be 8080, and targetPort should redirect it to 3000 which is the node port.
